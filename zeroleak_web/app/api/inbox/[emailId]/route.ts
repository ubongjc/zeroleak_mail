/**
 * Individual Email API
 * Get, update, or delete a specific email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ emailId: string }>;
}

/**
 * GET /api/inbox/[emailId]
 * Get full email details
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emailId } = await context.params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get email with alias check
    const email = await prisma.emailMessage.findFirst({
      where: {
        id: emailId,
        alias: {
          userId: user.id,
        },
      },
      include: {
        alias: {
          select: {
            id: true,
            localPart: true,
            domain: true,
            merchant: true,
            status: true,
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Mark as read if not already
    if (!email.read) {
      await prisma.emailMessage.update({
        where: { id: emailId },
        data: { read: true },
      });
    }

    return NextResponse.json({
      id: email.id,
      messageId: email.messageId,
      alias: {
        id: email.alias.id,
        email: `${email.alias.localPart}@${email.alias.domain}`,
        merchant: email.alias.merchant,
        status: email.alias.status,
      },
      from: email.fromAddress,
      to: email.toAddress,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      headers: email.headers,
      attachments: email.attachments,
      status: email.status,
      isSpam: email.isSpam,
      spamScore: email.spamScore,
      receivedAt: email.receivedAt,
      forwardedTo: email.forwardedTo,
      forwardedAt: email.forwardedAt,
      read: true, // Always true after GET
      errorMessage: email.errorMessage,
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/inbox/[emailId]
 * Update email properties (e.g., mark as read/unread)
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emailId } = await context.params;
    const body = await req.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify email belongs to user
    const email = await prisma.emailMessage.findFirst({
      where: {
        id: emailId,
        alias: {
          userId: user.id,
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Update email
    const updated = await prisma.emailMessage.update({
      where: { id: emailId },
      data: {
        read: body.read !== undefined ? body.read : email.read,
      },
    });

    return NextResponse.json({
      id: updated.id,
      read: updated.read,
    });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inbox/[emailId]
 * Delete an email
 */
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emailId } = await context.params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify email belongs to user and delete
    const email = await prisma.emailMessage.findFirst({
      where: {
        id: emailId,
        alias: {
          userId: user.id,
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    await prisma.emailMessage.delete({
      where: { id: emailId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
