/**
 * Inbox API
 * Get emails for a specific alias or all aliases
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  aliasId: z.string().optional(),
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'SPAM', 'QUARANTINED']).optional(),
  unreadOnly: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => parseInt(val || '50')),
  offset: z.string().optional().transform(val => parseInt(val || '0')),
});

/**
 * GET /api/inbox
 * Get emails for the authenticated user
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query filters
    const where: any = {};

    if (params.aliasId) {
      // Verify alias belongs to user
      const alias = await prisma.alias.findFirst({
        where: {
          id: params.aliasId,
          userId: user.id,
        },
      });

      if (!alias) {
        return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
      }

      where.aliasId = params.aliasId;
    } else {
      // Get all user's aliases
      const userAliases = await prisma.alias.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      where.aliasId = {
        in: userAliases.map(a => a.id),
      };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.unreadOnly) {
      where.read = false;
    }

    // Get emails with pagination
    const [emails, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        include: {
          alias: {
            select: {
              id: true,
              localPart: true,
              domain: true,
              merchant: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.emailMessage.count({ where }),
    ]);

    // Format response
    const formattedEmails = emails.map(email => ({
      id: email.id,
      alias: {
        id: email.alias.id,
        email: `${email.alias.localPart}@${email.alias.domain}`,
        merchant: email.alias.merchant,
      },
      from: email.fromAddress,
      subject: email.subject,
      preview: email.textBody?.substring(0, 150) || email.htmlBody?.replace(/<[^>]*>/g, '').substring(0, 150),
      receivedAt: email.receivedAt,
      read: email.read,
      status: email.status,
      isSpam: email.isSpam,
      spamScore: email.spamScore,
      hasAttachments: email.attachments && (email.attachments as any[]).length > 0,
    }));

    return NextResponse.json({
      emails: formattedEmails,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching inbox:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
