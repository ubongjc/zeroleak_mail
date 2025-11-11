/**
 * Receipt Export API
 * Export receipts in various formats (CSV, JSON, PDF summary)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  format: z.enum(['csv', 'json', 'summary']).default('csv'),
  taxYear: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  category: z.string().optional(),
});

/**
 * GET /api/export/receipts
 * Export receipts for tax purposes or record keeping
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
      alias: {
        userId: user.id,
      },
    };

    if (params.taxYear) {
      where.taxYear = params.taxYear;
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    // Get receipts
    const receipts = await prisma.receiptTag.findMany({
      where,
      include: {
        alias: {
          select: {
            localPart: true,
            domain: true,
            merchant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log export action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RECEIPTS_EXPORTED',
        metadata: {
          format: params.format,
          count: receipts.length,
          taxYear: params.taxYear,
          category: params.category,
        },
      },
    });

    // Format based on requested format
    if (params.format === 'json') {
      return NextResponse.json({
        receipts: receipts.map(r => ({
          id: r.id,
          merchant: r.merchant || r.alias.merchant,
          amount: r.amount?.toString(),
          currency: r.currency,
          category: r.category,
          taxYear: r.taxYear,
          date: r.createdAt,
          aliasEmail: `${r.alias.localPart}@${r.alias.domain}`,
          docUrl: r.docUrl,
        })),
        summary: {
          total: receipts.length,
          totalAmount: receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
          currency: receipts[0]?.currency || 'USD',
        },
      });
    }

    if (params.format === 'csv') {
      const csv = generateCSV(receipts);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="receipts-${params.taxYear || 'all'}.csv"`,
        },
      });
    }

    if (params.format === 'summary') {
      const summary = generateSummary(receipts);
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error exporting receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from receipts
 */
function generateCSV(receipts: any[]): string {
  const headers = [
    'Date',
    'Merchant',
    'Amount',
    'Currency',
    'Category',
    'Tax Year',
    'Alias Email',
    'Document URL',
  ];

  const rows = receipts.map(r => [
    new Date(r.createdAt).toISOString().split('T')[0],
    r.merchant || r.alias.merchant || '',
    r.amount?.toString() || '0',
    r.currency || 'USD',
    r.category || '',
    r.taxYear?.toString() || '',
    `${r.alias.localPart}@${r.alias.domain}`,
    r.docUrl || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate summary report
 */
function generateSummary(receipts: any[]) {
  const totalAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Group by category
  const byCategory = receipts.reduce((acc, r) => {
    const cat = r.category || 'Uncategorized';
    if (!acc[cat]) {
      acc[cat] = { count: 0, total: 0 };
    }
    acc[cat].count++;
    acc[cat].total += Number(r.amount) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by merchant
  const byMerchant = receipts.reduce((acc, r) => {
    const merchant = r.merchant || r.alias.merchant || 'Unknown';
    if (!acc[merchant]) {
      acc[merchant] = { count: 0, total: 0 };
    }
    acc[merchant].count++;
    acc[merchant].total += Number(r.amount) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by tax year
  const byTaxYear = receipts.reduce((acc, r) => {
    const year = r.taxYear?.toString() || 'Unassigned';
    if (!acc[year]) {
      acc[year] = { count: 0, total: 0 };
    }
    acc[year].count++;
    acc[year].total += Number(r.amount) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by month
  const byMonth = receipts.reduce((acc, r) => {
    const date = new Date(r.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[month]) {
      acc[month] = { count: 0, total: 0 };
    }
    acc[month].count++;
    acc[month].total += Number(r.amount) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return {
    overview: {
      totalReceipts: receipts.length,
      totalAmount,
      currency: receipts[0]?.currency || 'USD',
      dateRange: {
        earliest: receipts.length > 0 ? receipts[receipts.length - 1].createdAt : null,
        latest: receipts.length > 0 ? receipts[0].createdAt : null,
      },
    },
    byCategory: Object.entries(byCategory)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total),
    byMerchant: Object.entries(byMerchant)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10), // Top 10 merchants
    byTaxYear: Object.entries(byTaxYear).map(([year, data]) => ({ year, ...data })),
    byMonth: Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}
