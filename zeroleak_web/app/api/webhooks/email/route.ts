/**
 * Email Webhook Handler
 * Receives incoming emails from email providers (Mailgun, SendGrid, Postmark)
 * Processes spam detection, breach checking, and forwarding
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SpamDetector } from '@/lib/services/spam-detector';
import { EmailForwarder } from '@/lib/services/email-forwarder';
import { BreachMonitor } from '@/lib/services/breach-monitor';

interface ParsedEmail {
  messageId: string;
  from: string;
  to: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, any>;
  attachments?: any[];
}

/**
 * POST /api/webhooks/email
 * Receives incoming emails from email provider webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let parsedEmail: ParsedEmail;

    // Detect provider and parse accordingly
    if (contentType.includes('application/json')) {
      // SendGrid or Postmark format
      parsedEmail = await parseJsonWebhook(req);
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Mailgun format
      parsedEmail = await parseMailgunWebhook(req);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    // Process the email
    const result = await processIncomingEmail(parsedEmail);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Parse SendGrid/Postmark JSON webhook
 */
async function parseJsonWebhook(req: NextRequest): Promise<ParsedEmail> {
  const body = await req.json();

  // Handle SendGrid format
  if (Array.isArray(body)) {
    const email = body[0];
    return {
      messageId: email.headers?.['message-id'] || email.email_id || crypto.randomUUID(),
      from: email.from,
      to: email.to,
      subject: email.subject,
      textBody: email.text,
      htmlBody: email.html,
      headers: email.headers,
      attachments: email.attachments,
    };
  }

  // Handle Postmark format
  if (body.FromFull || body.From) {
    return {
      messageId: body.MessageID || crypto.randomUUID(),
      from: body.From,
      to: body.To,
      subject: body.Subject,
      textBody: body.TextBody,
      htmlBody: body.HtmlBody,
      headers: body.Headers?.reduce((acc: any, h: any) => {
        acc[h.Name.toLowerCase()] = h.Value;
        return acc;
      }, {}),
      attachments: body.Attachments,
    };
  }

  throw new Error('Unsupported JSON webhook format');
}

/**
 * Parse Mailgun multipart webhook
 */
async function parseMailgunWebhook(req: NextRequest): Promise<ParsedEmail> {
  const formData = await req.formData();

  return {
    messageId: formData.get('Message-Id') as string || crypto.randomUUID(),
    from: formData.get('sender') as string || formData.get('from') as string,
    to: formData.get('recipient') as string || formData.get('to') as string,
    subject: formData.get('subject') as string,
    textBody: formData.get('body-plain') as string,
    htmlBody: formData.get('body-html') as string,
    headers: JSON.parse(formData.get('message-headers') as string || '{}'),
    attachments: [], // Handle attachments separately if needed
  };
}

/**
 * Main email processing logic
 */
async function processIncomingEmail(email: ParsedEmail) {
  // Extract alias from recipient
  const recipientEmail = email.to.toLowerCase();
  const [localPart, domain] = recipientEmail.split('@');

  // Find the alias
  const alias = await prisma.alias.findUnique({
    where: {
      localPart_domain: {
        localPart,
        domain,
      },
    },
    include: {
      user: true,
    },
  });

  if (!alias) {
    console.warn(`Alias not found: ${recipientEmail}`);
    return { status: 'rejected', reason: 'Alias not found' };
  }

  // Check if alias is active
  if (alias.status !== 'ACTIVE') {
    console.warn(`Alias is ${alias.status}: ${recipientEmail}`);

    // Log the event
    await prisma.relayEvent.create({
      data: {
        aliasId: alias.id,
        type: 'BLOCKED',
        fromAddress: email.from,
        toAddress: email.to,
        subject: email.subject,
        bodySnippet: email.textBody?.substring(0, 200),
        metadata: { reason: `Alias status: ${alias.status}` },
      },
    });

    return { status: 'blocked', reason: `Alias is ${alias.status}` };
  }

  // Perform spam detection
  const spamAnalysis = SpamDetector.analyze({
    fromAddress: email.from,
    subject: email.subject,
    textBody: email.textBody,
    htmlBody: email.htmlBody,
    headers: email.headers,
  });

  // Check if decoy token appears in email (indicates leak)
  let decoyDetected = false;
  if (alias.decoySeeded && alias.decoyToken) {
    const emailContent = `${email.textBody || ''} ${email.htmlBody || ''}`;
    decoyDetected = emailContent.includes(alias.decoyToken);

    if (decoyDetected) {
      console.warn(`Decoy token detected in email to ${recipientEmail}`);

      // Update alias status
      await prisma.alias.update({
        where: { id: alias.id },
        data: {
          status: 'LEAKED',
          leakedAt: new Date(),
          breachDetected: true,
        },
      });

      // Log leak detection event
      await prisma.relayEvent.create({
        data: {
          aliasId: alias.id,
          type: 'LEAK_DETECTED',
          fromAddress: email.from,
          toAddress: email.to,
          subject: email.subject,
          metadata: { decoyToken: alias.decoyToken, spamScore: spamAnalysis.score },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: alias.userId,
          action: 'LEAK_DETECTED',
          resource: `alias:${alias.id}`,
          metadata: {
            aliasEmail: `${alias.localPart}@${alias.domain}`,
            merchant: alias.merchant,
            fromAddress: email.from,
          },
        },
      });
    }
  }

  // Determine email status based on spam score
  let emailStatus: 'PENDING' | 'DELIVERED' | 'SPAM' | 'QUARANTINED' = 'PENDING';
  let shouldForward = true;

  if (SpamDetector.shouldBlock(spamAnalysis.score)) {
    emailStatus = 'SPAM';
    shouldForward = false;

    // Increment spam counter
    await prisma.alias.update({
      where: { id: alias.id },
      data: { spamCount: { increment: 1 } },
    });

    // Auto-kill if spam count exceeds threshold
    if (alias.spamCount + 1 >= 10) {
      await prisma.alias.update({
        where: { id: alias.id },
        data: {
          status: 'KILLED',
          killedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: alias.userId,
          action: 'ALIAS_AUTO_KILLED',
          resource: `alias:${alias.id}`,
          metadata: {
            reason: 'Excessive spam',
            spamCount: alias.spamCount + 1,
          },
        },
      });
    }
  } else if (SpamDetector.shouldQuarantine(spamAnalysis.score)) {
    emailStatus = 'QUARANTINED';
    shouldForward = false;
  } else if (spamAnalysis.isSpam) {
    emailStatus = 'SPAM';
    shouldForward = false;
  }

  // Store the email message
  const emailMessage = await prisma.emailMessage.create({
    data: {
      aliasId: alias.id,
      messageId: email.messageId,
      fromAddress: email.from,
      toAddress: email.to,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      headers: email.headers,
      attachments: email.attachments,
      spamScore: spamAnalysis.score,
      isSpam: spamAnalysis.isSpam,
      status: emailStatus,
    },
  });

  // Log received event
  await prisma.relayEvent.create({
    data: {
      aliasId: alias.id,
      type: spamAnalysis.isSpam ? 'SPAM_DETECTED' : 'RECEIVED',
      fromAddress: email.from,
      toAddress: email.to,
      subject: email.subject,
      bodySnippet: email.textBody?.substring(0, 200),
      metadata: {
        spamScore: spamAnalysis.score,
        spamReasons: spamAnalysis.reasons,
        decoyDetected,
      },
    },
  });

  // Forward email if not spam/quarantined
  let forwardResult;
  if (shouldForward && alias.forwardTo) {
    try {
      // Sanitize and add banner
      let htmlBody = email.htmlBody;
      let textBody = email.textBody;

      if (htmlBody) {
        htmlBody = EmailForwarder.sanitizeHtml(htmlBody);
        htmlBody = EmailForwarder.addForwardingBanner(
          htmlBody,
          `${alias.localPart}@${alias.domain}`
        );
      }

      if (textBody) {
        textBody = EmailForwarder.addTextBanner(
          textBody,
          `${alias.localPart}@${alias.domain}`
        );
      }

      forwardResult = await EmailForwarder.forward({
        from: `noreply@${domain}`,
        to: alias.forwardTo,
        subject: email.subject || '(No subject)',
        textBody,
        htmlBody,
        replyTo: email.from,
        headers: {
          'X-ZeroLeak-Alias': `${alias.localPart}@${alias.domain}`,
          'X-ZeroLeak-Merchant': alias.merchant || 'unknown',
        },
      });

      if (forwardResult.success) {
        await prisma.emailMessage.update({
          where: { id: emailMessage.id },
          data: {
            status: 'DELIVERED',
            forwardedTo: alias.forwardTo,
            forwardedAt: new Date(),
          },
        });

        await prisma.relayEvent.create({
          data: {
            aliasId: alias.id,
            type: 'FORWARDED',
            fromAddress: email.from,
            toAddress: alias.forwardTo,
            subject: email.subject,
            metadata: {
              messageId: forwardResult.messageId,
              provider: forwardResult.provider,
            },
          },
        });

        emailStatus = 'DELIVERED';
      } else {
        await prisma.emailMessage.update({
          where: { id: emailMessage.id },
          data: {
            status: 'FAILED',
            errorMessage: forwardResult.error,
          },
        });

        emailStatus = 'FAILED';
      }
    } catch (error) {
      console.error('Error forwarding email:', error);
      await prisma.emailMessage.update({
        where: { id: emailMessage.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  return {
    status: emailStatus.toLowerCase(),
    emailId: emailMessage.id,
    spamScore: spamAnalysis.score,
    forwarded: shouldForward && forwardResult?.success,
    decoyDetected,
  };
}
