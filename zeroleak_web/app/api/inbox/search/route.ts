/**
 * Email Search API
 * Advanced search with multiple criteria
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  merchant: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  hasAttachments: z.string().optional().transform(val => val === 'true'),
  isSpam: z.string().optional().transform(val => val === 'true'),
  isRead: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => parseInt(val || '50')),
  offset: z.string().optional().transform(val => parseInt(val || '0')),
});

/**
 * GET /api/inbox/search
 * Search emails with advanced filters
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build search filters
    const where: any = {
      alias: {
        userId: user.id,
      },
    };

    // Full-text search across subject and body
    if (params.query) {
      where.OR = [
        { subject: { contains: params.query, mode: 'insensitive' } },
        { textBody: { contains: params.query, mode: 'insensitive' } },
        { htmlBody: { contains: params.query, mode: 'insensitive' } },
        { fromAddress: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    // Specific field searches
    if (params.from) {
      where.fromAddress = { contains: params.from, mode: 'insensitive' };
    }

    if (params.to) {
      where.toAddress = { contains: params.to, mode: 'insensitive' };
    }

    if (params.subject) {
      where.subject = { contains: params.subject, mode: 'insensitive' };
    }

    // Date range
    if (params.startDate || params.endDate) {
      where.receivedAt = {};
      if (params.startDate) {
        where.receivedAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.receivedAt.lte = params.endDate;
      }
    }

    // Boolean filters
    if (params.hasAttachments !== undefined) {
      if (params.hasAttachments) {
        where.attachments = { not: null };
      }
    }

    if (params.isSpam !== undefined) {
      where.isSpam = params.isSpam;
    }

    if (params.isRead !== undefined) {
      where.read = params.isRead;
    }

    // Merchant filter (search in alias)
    if (params.merchant) {
      where.alias.merchant = { contains: params.merchant, mode: 'insensitive' };
    }

    // Execute search
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
      isSpam: email.isSpam,
      status: email.status,
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
      searchParams: {
        query: params.query,
        from: params.from,
        subject: params.subject,
        merchant: params.merchant,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error searching emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
