/**
 * Subscription Management API
 * Handle premium subscriptions via Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID_PREMIUM = process.env.STRIPE_PRICE_ID_PREMIUM; // $9.99/month
const STRIPE_PRICE_ID_BUSINESS = process.env.STRIPE_PRICE_ID_BUSINESS; // $29.99/month

interface SubscriptionTier {
  name: string;
  price: number;
  features: string[];
  limits: {
    maxAliases: number;
    emailStorage: number; // GB
    historyDays: number;
    customDomains: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '10 active aliases',
      'Basic breach detection',
      '1 GB email storage',
      '7-day email history',
      'Community support',
    ],
    limits: {
      maxAliases: 10,
      emailStorage: 1,
      historyDays: 7,
      customDomains: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 9.99,
    features: [
      'Unlimited aliases',
      'Real-time breach detection',
      '50 GB email storage',
      'Unlimited email history',
      'Priority support',
      'Custom domains',
      'Advanced analytics',
      'API access',
    ],
    limits: {
      maxAliases: -1, // unlimited
      emailStorage: 50,
      historyDays: -1, // unlimited
      customDomains: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
  BUSINESS: {
    name: 'Business',
    price: 29.99,
    features: [
      'Everything in Premium',
      'Team management (10 users)',
      '500 GB email storage',
      'Custom branding',
      'SSO integration',
      'Compliance reporting',
      'Dedicated support',
      'SLA guarantee',
    ],
    limits: {
      maxAliases: -1,
      emailStorage: 500,
      historyDays: -1,
      customDomains: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

/**
 * GET /api/subscriptions
 * Get current subscription status
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get alias count
    const aliasCount = await prisma.alias.count({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    // Get email storage usage
    const emailStorage = await prisma.emailMessage.aggregate({
      where: {
        alias: {
          userId: user.id,
        },
      },
      _count: true,
    });

    // Determine current tier
    const currentTier = user.role === 'ADMIN' ? 'BUSINESS' : user.role === 'PREMIUM' ? 'PREMIUM' : 'FREE';
    const tierInfo = SUBSCRIPTION_TIERS[currentTier];

    // Check if user is at limits
    const atLimits = {
      aliases: tierInfo.limits.maxAliases !== -1 && aliasCount >= tierInfo.limits.maxAliases,
      storage: false, // TODO: Calculate actual storage
    };

    return NextResponse.json({
      currentTier: {
        name: currentTier,
        ...tierInfo,
      },
      usage: {
        aliases: aliasCount,
        maxAliases: tierInfo.limits.maxAliases,
        storage: 0, // TODO: Calculate
        maxStorage: tierInfo.limits.emailStorage,
      },
      atLimits,
      availableTiers: Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
        id: key,
        ...tier,
        isCurrent: key === currentTier,
      })),
      stripeCustomerId: user.stripeCustomerId,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Create or update subscription
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tier, action } = body; // tier: 'PREMIUM' | 'BUSINESS', action: 'subscribe' | 'cancel'

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'subscribe') {
      // Create Stripe checkout session
      if (!STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: 'Stripe not configured' },
          { status: 500 }
        );
      }

      const priceId = tier === 'BUSINESS' ? STRIPE_PRICE_ID_BUSINESS : STRIPE_PRICE_ID_PREMIUM;

      if (!priceId) {
        return NextResponse.json(
          { error: 'Stripe price ID not configured' },
          { status: 500 }
        );
      }

      // In production, create Stripe checkout session
      // For now, return placeholder
      const checkoutUrl = `https://stripe.com/checkout?price=${priceId}`;

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBSCRIPTION_INITIATED',
          metadata: {
            tier,
            priceId,
          },
        },
      });

      return NextResponse.json({
        checkoutUrl,
        message: 'Redirect to Stripe checkout',
      });
    } else if (action === 'cancel') {
      // Cancel subscription
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'USER',
          subscriptionStatus: 'canceled',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBSCRIPTION_CANCELED',
          metadata: {
            previousRole: user.role,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has feature access
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof SubscriptionTier['limits']
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  const tier = user.role === 'ADMIN' ? 'BUSINESS' : user.role === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  const limits = SUBSCRIPTION_TIERS[tier].limits;

  return limits[feature] === true || limits[feature] === -1;
}

/**
 * Check if user can create more aliases
 */
export async function canCreateAlias(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  const tier = user.role === 'ADMIN' ? 'BUSINESS' : user.role === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  const maxAliases = SUBSCRIPTION_TIERS[tier].limits.maxAliases;

  if (maxAliases === -1) return true; // unlimited

  const currentCount = await prisma.alias.count({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  return currentCount < maxAliases;
}
