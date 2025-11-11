/**
 * Spam Detection Service
 * Analyzes emails for spam indicators and calculates a spam score
 */

interface SpamAnalysisResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

interface EmailData {
  fromAddress: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, any>;
}

const SPAM_THRESHOLD = 5.0;

// Common spam keywords with weights
const SPAM_KEYWORDS = [
  { pattern: /\b(viagra|cialis|pharmacy)\b/gi, weight: 2.0 },
  { pattern: /\b(lottery|winner|claim your prize)\b/gi, weight: 1.5 },
  { pattern: /\b(click here|act now|limited time)\b/gi, weight: 1.0 },
  { pattern: /\b(nigerian prince|inheritance|million dollars)\b/gi, weight: 3.0 },
  { pattern: /\b(weight loss|lose weight|diet pill)\b/gi, weight: 1.5 },
  { pattern: /\b(free money|make money fast|work from home)\b/gi, weight: 1.5 },
  { pattern: /\b(casino|poker|gambling)\b/gi, weight: 1.5 },
  { pattern: /\b(loan approved|credit score|debt relief)\b/gi, weight: 1.0 },
];

// Suspicious sender patterns
const SUSPICIOUS_SENDERS = [
  /noreply@/i,
  /no-reply@/i,
  /notification@/i,
  /@.*\.xyz$/i,
  /@.*\.top$/i,
  /@.*\.info$/i,
];

export class SpamDetector {
  /**
   * Analyze an email for spam indicators
   */
  static analyze(email: EmailData): SpamAnalysisResult {
    let score = 0;
    const reasons: string[] = [];

    // Check content for spam keywords
    const contentScore = this.analyzeContent(email, reasons);
    score += contentScore;

    // Check sender patterns
    const senderScore = this.analyzeSender(email.fromAddress, reasons);
    score += senderScore;

    // Check subject line
    const subjectScore = this.analyzeSubject(email.subject, reasons);
    score += subjectScore;

    // Check for HTML-only emails (common in spam)
    if (email.htmlBody && !email.textBody) {
      score += 0.5;
      reasons.push('HTML-only email');
    }

    // Check for excessive links
    const linkScore = this.analyzeLinks(email.htmlBody, reasons);
    score += linkScore;

    // Check for suspicious headers
    const headerScore = this.analyzeHeaders(email.headers, reasons);
    score += headerScore;

    return {
      isSpam: score >= SPAM_THRESHOLD,
      score,
      reasons,
    };
  }

  private static analyzeContent(email: EmailData, reasons: string[]): number {
    let score = 0;
    const content = `${email.textBody || ''} ${email.htmlBody || ''}`;

    for (const { pattern, weight } of SPAM_KEYWORDS) {
      const matches = content.match(pattern);
      if (matches) {
        score += weight;
        reasons.push(`Spam keyword detected: ${matches[0]}`);
      }
    }

    // Check for excessive capitalization
    const capsRatio = this.calculateCapsRatio(content);
    if (capsRatio > 0.5) {
      score += 1.0;
      reasons.push('Excessive capitalization');
    }

    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 5) {
      score += 0.5;
      reasons.push('Excessive exclamation marks');
    }

    return score;
  }

  private static analyzeSender(fromAddress: string, reasons: string[]): number {
    let score = 0;

    for (const pattern of SUSPICIOUS_SENDERS) {
      if (pattern.test(fromAddress)) {
        score += 1.0;
        reasons.push(`Suspicious sender pattern: ${fromAddress}`);
        break;
      }
    }

    return score;
  }

  private static analyzeSubject(subject: string | undefined, reasons: string[]): number {
    if (!subject) return 0;

    let score = 0;

    // All caps subject
    if (subject === subject.toUpperCase() && subject.length > 5) {
      score += 1.0;
      reasons.push('All caps subject line');
    }

    // Common spam subject patterns
    if (/^(RE:|FW:)\s*$/i.test(subject)) {
      score += 0.5;
      reasons.push('Suspicious RE:/FW: subject');
    }

    return score;
  }

  private static analyzeLinks(htmlBody: string | undefined, reasons: string[]): number {
    if (!htmlBody) return 0;

    const linkMatches = htmlBody.match(/<a\s+href=/gi);
    const linkCount = linkMatches ? linkMatches.length : 0;

    if (linkCount > 10) {
      reasons.push(`Excessive links: ${linkCount}`);
      return 1.5;
    }

    return 0;
  }

  private static analyzeHeaders(headers: Record<string, any> | undefined, reasons: string[]): number {
    if (!headers) return 0;

    let score = 0;

    // Check for missing or suspicious SPF/DKIM
    if (headers['x-spam-status']?.toLowerCase().includes('yes')) {
      score += 2.0;
      reasons.push('Marked as spam by upstream filter');
    }

    // Check for mismatched From and Return-Path
    if (headers['from'] && headers['return-path']) {
      const fromDomain = this.extractDomain(headers['from']);
      const returnDomain = this.extractDomain(headers['return-path']);
      if (fromDomain !== returnDomain) {
        score += 1.0;
        reasons.push('From/Return-Path domain mismatch');
      }
    }

    return score;
  }

  private static calculateCapsRatio(text: string): number {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;

    const capitals = text.replace(/[^A-Z]/g, '');
    return capitals.length / letters.length;
  }

  private static extractDomain(email: string): string {
    const match = email.match(/@([^>\s]+)/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Check if an email should be automatically quarantined
   */
  static shouldQuarantine(score: number): boolean {
    return score >= SPAM_THRESHOLD * 1.5; // 7.5 or higher
  }

  /**
   * Check if an email should be blocked entirely
   */
  static shouldBlock(score: number): boolean {
    return score >= SPAM_THRESHOLD * 2; // 10.0 or higher
  }
}
