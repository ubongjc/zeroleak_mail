/**
 * Audit Log API
 * Get audit logs for transparency and security monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || '100')),
  offset: z.string().optional().transform(val => parseInt(val || '0')),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

/**
 * GET /api/audit
 * Get audit logs for the authenticated user
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
    const where: any = {
      userId: user.id,
    };

    if (params.action) {
      where.action = params.action;
    }

    if (params.resource) {
      where.resource = {
        contains: params.resource,
      };
    }

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.timestamp,
      })),
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

    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/stats
 * Get audit statistics for the user
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get statistics
    const [
      totalActions,
      leakDetections,
      autoKills,
      recentActions,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: { userId: user.id },
      }),
      prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'LEAK_DETECTED',
        },
      }),
      prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'ALIAS_AUTO_KILLED',
        },
      }),
      prisma.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    // Get action breakdown
    const actionBreakdown = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { userId: user.id },
      _count: true,
    });

    return NextResponse.json({
      totalActions,
      leakDetections,
      autoKills,
      actionBreakdown: actionBreakdown.map(item => ({
        action: item.action,
        count: item._count,
      })),
      recentActions: recentActions.map(log => ({
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
