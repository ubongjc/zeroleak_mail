/**
 * Alias Replacement API
 * Replace a leaked/compromised alias with a new one for the same merchant
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const requestSchema = z.object({
  oldAliasId: z.string(),
  customLocalPart: z.string().optional(),
  enableDecoy: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

/**
 * POST /api/alias/replace
 * Replace a leaked alias with a new one, maintaining merchant association
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { oldAliasId, customLocalPart, enableDecoy, notes } = requestSchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the old alias
    const oldAlias = await prisma.alias.findFirst({
      where: {
        id: oldAliasId,
        userId: user.id,
      },
    });

    if (!oldAlias) {
      return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
    }

    // Prevent replacing an active alias that's not leaked
    if (oldAlias.status === 'ACTIVE' && !oldAlias.breachDetected) {
      return NextResponse.json(
        { error: 'Can only replace leaked or killed aliases' },
        { status: 400 }
      );
    }

    // Generate new alias details
    const merchantGroup = oldAlias.merchantGroup || oldAlias.merchant?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const localPart = customLocalPart || `${merchantGroup}-${crypto.randomBytes(4).toString('hex')}`;
    const domain = oldAlias.domain;

    // Generate decoy token if enabled
    const decoyToken = enableDecoy ? crypto.randomBytes(16).toString('hex') : null;

    // Create new alias
    const newAlias = await prisma.alias.create({
      data: {
        userId: user.id,
        localPart,
        domain,
        merchant: oldAlias.merchant,
        merchantGroup,
        forwardTo: oldAlias.forwardTo || user.email,
        decoySeeded: enableDecoy,
        decoyToken,
        replacesId: oldAlias.id,
        notes,
      },
    });

    // Update old alias to mark it as replaced
    await prisma.alias.update({
      where: { id: oldAliasId },
      data: {
        replacedById: newAlias.id,
        status: oldAlias.status === 'ACTIVE' ? 'KILLED' : oldAlias.status,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ALIAS_REPLACED',
        resource: `alias:${oldAliasId}`,
        metadata: {
          oldEmail: `${oldAlias.localPart}@${oldAlias.domain}`,
          newEmail: `${localPart}@${domain}`,
          merchant: oldAlias.merchant,
          reason: oldAlias.breachDetected ? 'breach_detected' : 'user_requested',
        },
      },
    });

    return NextResponse.json({
      success: true,
      oldAlias: {
        id: oldAlias.id,
        email: `${oldAlias.localPart}@${oldAlias.domain}`,
        status: oldAlias.status,
      },
      newAlias: {
        id: newAlias.id,
        email: `${localPart}@${domain}`,
        merchant: newAlias.merchant,
        status: newAlias.status,
        decoyEnabled: enableDecoy,
        createdAt: newAlias.createdAt,
      },
      instructions: {
        nextStep: `Update your email with ${oldAlias.merchant || 'the merchant'} to: ${localPart}@${domain}`,
        oldEmailStatus: 'All previous emails are still accessible in your inbox',
        copyNewEmail: `${localPart}@${domain}`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error replacing alias:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alias/replace?merchantGroup=amazon
 * Get replacement suggestions and history for a merchant
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const merchantGroup = searchParams.get('merchantGroup');
    const aliasId = searchParams.get('aliasId');

    if (!merchantGroup && !aliasId) {
      return NextResponse.json(
        { error: 'merchantGroup or aliasId required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all aliases for this merchant (history)
    const where: any = { userId: user.id };

    if (merchantGroup) {
      where.merchantGroup = merchantGroup;
    } else if (aliasId) {
      const alias = await prisma.alias.findFirst({
        where: { id: aliasId, userId: user.id },
      });
      if (!alias) {
        return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
      }
      where.OR = [
        { merchantGroup: alias.merchantGroup },
        { merchant: alias.merchant },
      ];
    }

    const aliasHistory = await prisma.alias.findMany({
      where,
      include: {
        _count: {
          select: {
            emailMessages: true,
            relayEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build replacement chain
    const activeAlias = aliasHistory.find(a => a.status === 'ACTIVE');
    const replacementChain = buildReplacementChain(aliasHistory);

    return NextResponse.json({
      merchantGroup: merchantGroup || aliasHistory[0]?.merchantGroup,
      merchant: aliasHistory[0]?.merchant,
      currentAlias: activeAlias
        ? {
            id: activeAlias.id,
            email: `${activeAlias.localPart}@${activeAlias.domain}`,
            status: activeAlias.status,
            breachDetected: activeAlias.breachDetected,
            createdAt: activeAlias.createdAt,
          }
        : null,
      history: aliasHistory.map(a => ({
        id: a.id,
        email: `${a.localPart}@${a.domain}`,
        status: a.status,
        breachDetected: a.breachDetected,
        emailCount: a._count.emailMessages,
        createdAt: a.createdAt,
        killedAt: a.killedAt,
        leakedAt: a.leakedAt,
        replacesId: a.replacesId,
        replacedById: a.replacedById,
        notes: a.notes,
      })),
      replacementChain,
      stats: {
        totalAliases: aliasHistory.length,
        totalEmails: aliasHistory.reduce((sum, a) => sum + a._count.emailMessages, 0),
        leakedCount: aliasHistory.filter(a => a.status === 'LEAKED').length,
        activeCount: aliasHistory.filter(a => a.status === 'ACTIVE').length,
      },
    });
  } catch (error) {
    console.error('Error fetching alias history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build the replacement chain showing which alias replaced which
 */
function buildReplacementChain(aliases: any[]): any[] {
  const aliasMap = new Map(aliases.map(a => [a.id, a]));
  const chain: any[] = [];

  // Find the earliest alias (no replacesId)
  let current = aliases.find(a => !a.replacesId);

  while (current) {
    chain.push({
      id: current.id,
      email: `${current.localPart}@${current.domain}`,
      status: current.status,
      createdAt: current.createdAt,
      killedAt: current.killedAt,
      reason: current.breachDetected ? 'Leaked' : current.killedAt ? 'Killed' : 'Active',
    });

    // Find the alias that replaced this one
    current = current.replacedById ? aliasMap.get(current.replacedById) : null;
  }

  return chain;
}
