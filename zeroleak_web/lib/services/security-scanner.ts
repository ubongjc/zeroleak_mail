/**
 * Security Scanner Service
 * Scans emails for phishing, malware, and suspicious content
 */

interface SecurityScanResult {
  isSecure: boolean;
  threats: SecurityThreat[];
  score: number; // 0-100, higher = more secure
  recommendations: string[];
}

interface SecurityThreat {
  type: 'phishing' | 'malware' | 'suspicious_link' | 'spoofed_sender' | 'data_theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
}

interface EmailData {
  fromAddress: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, any>;
  links?: string[];
}

export class SecurityScanner {
  private static readonly PHISHING_PATTERNS = [
    { pattern: /verify\s+your\s+(account|identity|information)/gi, weight: 3 },
    { pattern: /suspend(ed)?\s+account/gi, weight: 4 },
    { pattern: /click\s+here\s+(immediately|now|urgent)/gi, weight: 3 },
    { pattern: /confirm\s+your\s+(password|identity|account)/gi, weight: 3 },
    { pattern: /unusual\s+activity/gi, weight: 2 },
    { pattern: /re-?activate\s+your/gi, weight: 3 },
    { pattern: /secure\s+your\s+account/gi, weight: 2 },
    { pattern: /tax\s+refund/gi, weight: 3 },
    { pattern: /bank\s+account\s+(verification|security)/gi, weight: 4 },
  ];

  private static readonly SUSPICIOUS_DOMAINS = [
    /paypal-?(secure|verify|account)/i,
    /amazon-?(security|verify)/i,
    /apple-?(verify|account|secure)/i,
    /microsoft-?(security|account)/i,
    /netflix-?(billing|account)/i,
    /\.tk$/i,
    /\.ml$/i,
    /\.ga$/i,
    /\.cf$/i,
    /\.gq$/i,
  ];

  private static readonly MALWARE_INDICATORS = [
    /\.exe$/i,
    /\.scr$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.apk$/i,
  ];

  /**
   * Scan email for security threats
   */
  static async scan(email: EmailData): Promise<SecurityScanResult> {
    const threats: SecurityThreat[] = [];
    let score = 100; // Start with perfect score, deduct for issues

    // Check for phishing indicators
    const phishingThreats = this.detectPhishing(email);
    threats.push(...phishingThreats);
    score -= phishingThreats.length * 15;

    // Check for suspicious links
    const linkThreats = this.scanLinks(email);
    threats.push(...linkThreats);
    score -= linkThreats.length * 20;

    // Check for sender spoofing
    const spoofingThreats = this.detectSpoofing(email);
    threats.push(...spoofingThreats);
    score -= spoofingThreats.length * 25;

    // Check for malware indicators
    const malwareThreats = this.detectMalware(email);
    threats.push(...malwareThreats);
    score -= malwareThreats.length * 30;

    // Check for data theft attempts
    const dataTheftThreats = this.detectDataTheft(email);
    threats.push(...dataTheftThreats);
    score -= dataTheftThreats.length * 20;

    score = Math.max(0, score);

    const recommendations = this.generateRecommendations(threats);

    return {
      isSecure: score >= 70 && threats.filter(t => t.severity === 'critical').length === 0,
      threats,
      score,
      recommendations,
    };
  }

  /**
   * Detect phishing indicators
   */
  private static detectPhishing(email: EmailData): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const content = `${email.subject || ''} ${email.textBody || ''} ${email.htmlBody || ''}`;

    for (const { pattern, weight } of this.PHISHING_PATTERNS) {
      if (pattern.test(content)) {
        threats.push({
          type: 'phishing',
          severity: weight >= 4 ? 'critical' : weight >= 3 ? 'high' : 'medium',
          description: 'Phishing language detected',
          evidence: content.match(pattern)?.[0] || '',
        });
      }
    }

    // Check for urgency tactics
    if (/urgent|immediate|within\s+24\s+hours|expire/gi.test(content)) {
      threats.push({
        type: 'phishing',
        severity: 'medium',
        description: 'Urgency tactics used (common phishing technique)',
        evidence: 'Urgent language detected',
      });
    }

    return threats;
  }

  /**
   * Scan links for security issues
   */
  private static scanLinks(email: EmailData): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const links = this.extractLinks(email.htmlBody || email.textBody || '');

    for (const link of links) {
      try {
        const url = new URL(link);

        // Check for suspicious domains
        for (const pattern of this.SUSPICIOUS_DOMAINS) {
          if (pattern.test(url.hostname)) {
            threats.push({
              type: 'suspicious_link',
              severity: 'high',
              description: 'Suspicious domain detected (possible impersonation)',
              evidence: url.hostname,
            });
          }
        }

        // Check for IP addresses (often used in phishing)
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname)) {
          threats.push({
            type: 'suspicious_link',
            severity: 'high',
            description: 'Link uses IP address instead of domain name',
            evidence: url.hostname,
          });
        }

        // Check for homograph attacks
        if (/[а-яА-Я]|[а-щА-ЩЬьЮюЯяЇїІіЄєҐґ]/.test(url.hostname)) {
          threats.push({
            type: 'suspicious_link',
            severity: 'critical',
            description: 'Homograph attack detected (look-alike characters)',
            evidence: url.hostname,
          });
        }

        // Check for URL shorteners (can hide malicious links)
        if (/bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly/i.test(url.hostname)) {
          threats.push({
            type: 'suspicious_link',
            severity: 'medium',
            description: 'URL shortener detected (destination unknown)',
            evidence: link,
          });
        }

      } catch (error) {
        // Invalid URL
        threats.push({
          type: 'suspicious_link',
          severity: 'medium',
          description: 'Malformed URL detected',
          evidence: link,
        });
      }
    }

    return threats;
  }

  /**
   * Detect sender spoofing
   */
  private static detectSpoofing(email: EmailData): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for display name / email mismatch
    const displayName = email.headers?.['from']?.match(/^([^<]+)</)?.[1]?.trim();
    const actualEmail = email.fromAddress.toLowerCase();

    if (displayName) {
      // Check if display name contains known brand but email doesn't match
      const brands = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'bank'];
      for (const brand of brands) {
        if (displayName.toLowerCase().includes(brand) && !actualEmail.includes(brand)) {
          threats.push({
            type: 'spoofed_sender',
            severity: 'critical',
            description: `Display name claims to be from ${brand} but email doesn't match`,
            evidence: `Display: "${displayName}" vs Email: "${actualEmail}"`,
          });
        }
      }
    }

    // Check for lookalike characters in email
    if (/[0Oo1Il]/.test(actualEmail) && /paypal|amazon|apple/i.test(actualEmail)) {
      threats.push({
        type: 'spoofed_sender',
        severity: 'high',
        description: 'Email contains look-alike characters (possible impersonation)',
        evidence: actualEmail,
      });
    }

    return threats;
  }

  /**
   * Detect malware indicators
   */
  private static detectMalware(email: EmailData): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const content = email.htmlBody || email.textBody || '';

    // Check for dangerous file extensions in links/attachments
    for (const pattern of this.MALWARE_INDICATORS) {
      if (pattern.test(content)) {
        threats.push({
          type: 'malware',
          severity: 'critical',
          description: 'Potentially dangerous file type detected',
          evidence: content.match(pattern)?.[0] || '',
        });
      }
    }

    // Check for macros
    if (/enable\s+(macros|content)/gi.test(content)) {
      threats.push({
        type: 'malware',
        severity: 'high',
        description: 'Email asks to enable macros (common malware vector)',
        evidence: 'Macro enablement requested',
      });
    }

    return threats;
  }

  /**
   * Detect data theft attempts
   */
  private static detectDataTheft(email: EmailData): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const content = `${email.subject || ''} ${email.textBody || ''} ${email.htmlBody || ''}`;

    // Check for credential requests
    if (/password|credit\s+card|social\s+security|ssn|bank\s+account/gi.test(content)) {
      threats.push({
        type: 'data_theft',
        severity: 'high',
        description: 'Email requests sensitive information',
        evidence: 'Sensitive data requested',
      });
    }

    // Check for fake login forms
    if (/<form|<input\s+type=["']password/gi.test(email.htmlBody || '')) {
      threats.push({
        type: 'data_theft',
        severity: 'critical',
        description: 'Email contains login form (likely phishing)',
        evidence: 'HTML form detected in email',
      });
    }

    return threats;
  }

  /**
   * Extract links from content
   */
  private static extractLinks(content: string): string[] {
    const links: string[] = [];

    // Extract from HTML hrefs
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    // Extract plain URLs
    const urlRegex = /https?:\/\/[^\s<>"]+/gi;
    while ((match = urlRegex.exec(content)) !== null) {
      links.push(match[0]);
    }

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Generate security recommendations
   */
  private static generateRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];

    if (threats.some(t => t.type === 'phishing')) {
      recommendations.push('Be cautious: This email shows signs of phishing');
      recommendations.push('Do not click any links or enter personal information');
      recommendations.push('Verify sender identity by contacting them directly');
    }

    if (threats.some(t => t.type === 'suspicious_link')) {
      recommendations.push('Do not click links in this email');
      recommendations.push('Manually type the website address instead');
    }

    if (threats.some(t => t.type === 'spoofed_sender')) {
      recommendations.push('Sender may be impersonating a legitimate organization');
      recommendations.push('Check the actual email address, not just the display name');
    }

    if (threats.some(t => t.type === 'malware')) {
      recommendations.push('Do not download or open any attachments');
      recommendations.push('Do not enable macros or run any files');
      recommendations.push('Delete this email immediately');
    }

    if (threats.some(t => t.type === 'data_theft')) {
      recommendations.push('Never provide passwords or financial information via email');
      recommendations.push('Legitimate organizations will never ask for this via email');
    }

    if (recommendations.length === 0) {
      recommendations.push('This email appears to be safe');
      recommendations.push('Always exercise caution with unexpected emails');
    }

    return recommendations;
  }

  /**
   * Get severity color for UI
   */
  static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'gray';
      default:
        return 'gray';
    }
  }

  /**
   * Get security score badge
   */
  static getScoreBadge(score: number): { label: string; color: string } {
    if (score >= 90) {
      return { label: 'Excellent', color: 'green' };
    } else if (score >= 70) {
      return { label: 'Good', color: 'blue' };
    } else if (score >= 50) {
      return { label: 'Moderate', color: 'yellow' };
    } else if (score >= 30) {
      return { label: 'Poor', color: 'orange' };
    } else {
      return { label: 'Dangerous', color: 'red' };
    }
  }
}
