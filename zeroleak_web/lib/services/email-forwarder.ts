/**
 * Email Forwarding Service
 * Handles forwarding received emails to users' real email addresses
 * Supports multiple providers: SendGrid, Mailgun, Postmark, Amazon SES
 */

interface ForwardEmailOptions {
  from: string;
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
  size: number;
}

interface ForwardResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

type EmailProvider = 'sendgrid' | 'mailgun' | 'postmark' | 'ses';

export class EmailForwarder {
  private static provider: EmailProvider;

  static configure(provider: EmailProvider = 'sendgrid') {
    this.provider = provider;
  }

  /**
   * Forward an email to the user's real email address
   */
  static async forward(options: ForwardEmailOptions): Promise<ForwardResult> {
    const provider = this.provider || this.detectProvider();

    switch (provider) {
      case 'sendgrid':
        return this.forwardViaSendGrid(options);
      case 'mailgun':
        return this.forwardViaMailgun(options);
      case 'postmark':
        return this.forwardViaPostmark(options);
      case 'ses':
        return this.forwardViaSES(options);
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  /**
   * Forward email using SendGrid
   */
  private static async forwardViaSendGrid(options: ForwardEmailOptions): Promise<ForwardResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    try {
      const payload = {
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: { email: options.from },
        reply_to: options.replyTo ? { email: options.replyTo } : undefined,
        content: [
          options.textBody && { type: 'text/plain', value: options.textBody },
          options.htmlBody && { type: 'text/html', value: options.htmlBody },
        ].filter(Boolean),
        attachments: options.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.contentType,
          disposition: 'attachment',
        })),
        headers: options.headers,
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `SendGrid error: ${error}`,
          provider: 'sendgrid',
        };
      }

      const messageId = response.headers.get('x-message-id');

      return {
        success: true,
        messageId: messageId || undefined,
        provider: 'sendgrid',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'sendgrid',
      };
    }
  }

  /**
   * Forward email using Mailgun
   */
  private static async forwardViaMailgun(options: ForwardEmailOptions): Promise<ForwardResult> {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN not configured');
    }

    try {
      const formData = new FormData();
      formData.append('from', options.from);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      if (options.textBody) formData.append('text', options.textBody);
      if (options.htmlBody) formData.append('html', options.htmlBody);
      if (options.replyTo) formData.append('h:Reply-To', options.replyTo);

      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          formData.append(`h:${key}`, value);
        }
      }

      const response = await fetch(
        `https://api.mailgun.net/v3/${domain}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Mailgun error: ${error}`,
          provider: 'mailgun',
        };
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'mailgun',
      };
    }
  }

  /**
   * Forward email using Postmark
   */
  private static async forwardViaPostmark(options: ForwardEmailOptions): Promise<ForwardResult> {
    const apiKey = process.env.POSTMARK_SERVER_TOKEN;
    if (!apiKey) {
      throw new Error('POSTMARK_SERVER_TOKEN not configured');
    }

    try {
      const payload = {
        From: options.from,
        To: options.to,
        Subject: options.subject,
        TextBody: options.textBody,
        HtmlBody: options.htmlBody,
        ReplyTo: options.replyTo,
        Headers: options.headers
          ? Object.entries(options.headers).map(([Name, Value]) => ({ Name, Value }))
          : undefined,
        Attachments: options.attachments?.map(att => ({
          Name: att.filename,
          Content: att.content,
          ContentType: att.contentType,
        })),
      };

      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Postmark error: ${error}`,
          provider: 'postmark',
        };
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.MessageID,
        provider: 'postmark',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'postmark',
      };
    }
  }

  /**
   * Forward email using Amazon SES
   */
  private static async forwardViaSES(options: ForwardEmailOptions): Promise<ForwardResult> {
    // This would require AWS SDK integration
    // For now, return a placeholder
    throw new Error('SES forwarding not yet implemented. Please use SendGrid, Mailgun, or Postmark.');
  }

  /**
   * Detect which email provider is configured
   */
  private static detectProvider(): EmailProvider {
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    if (process.env.MAILGUN_API_KEY) return 'mailgun';
    if (process.env.POSTMARK_SERVER_TOKEN) return 'postmark';
    if (process.env.AWS_SES_ACCESS_KEY) return 'ses';

    throw new Error('No email provider configured. Set SENDGRID_API_KEY, MAILGUN_API_KEY, or POSTMARK_SERVER_TOKEN');
  }

  /**
   * Add ZeroLeak Mail banner to email body
   */
  static addForwardingBanner(htmlBody: string, aliasEmail: string): string {
    const banner = `
      <div style="background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; font-family: sans-serif;">
        <p style="margin: 0; font-size: 14px; color: #374151;">
          <strong>📧 ZeroLeak Mail:</strong> This email was forwarded from your alias
          <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${aliasEmail}</code>
        </p>
      </div>
    `;

    // Insert banner at the beginning of body
    if (htmlBody.includes('<body')) {
      return htmlBody.replace(/<body[^>]*>/i, `$&${banner}`);
    }

    return `<html><body>${banner}${htmlBody}</body></html>`;
  }

  /**
   * Add text banner for plain text emails
   */
  static addTextBanner(textBody: string, aliasEmail: string): string {
    const banner = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 ZeroLeak Mail
This email was forwarded from: ${aliasEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    return banner + textBody;
  }

  /**
   * Sanitize email content to remove tracking pixels
   */
  static sanitizeHtml(html: string): string {
    // Remove 1x1 tracking pixels
    let sanitized = html.replace(
      /<img[^>]*width=["']?1["']?[^>]*height=["']?1["']?[^>]*>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<img[^>]*height=["']?1["']?[^>]*width=["']?1["']?[^>]*>/gi,
      ''
    );

    // Remove common tracking domains
    const trackingDomains = [
      'pixel.facebook.com',
      'www.google-analytics.com',
      'stats.g.doubleclick.net',
      'sb.scorecardresearch.com',
    ];

    for (const domain of trackingDomains) {
      const regex = new RegExp(`<img[^>]*${domain}[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    return sanitized;
  }
}
