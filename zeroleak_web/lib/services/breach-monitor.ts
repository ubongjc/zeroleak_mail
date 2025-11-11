/**
 * Breach Monitoring Service
 * Integrates with HaveIBeenPwned API to detect email addresses in data breaches
 */

interface BreachData {
  name: string;
  title: string;
  domain: string;
  breachDate: Date;
  addedDate: Date;
  modifiedDate: Date;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
}

interface BreachCheckResult {
  email: string;
  isBreached: boolean;
  breaches: BreachData[];
  lastChecked: Date;
}

export class BreachMonitor {
  private static readonly HIBP_API_URL = 'https://haveibeenpwned.com/api/v3';
  private static readonly API_KEY = process.env.HIBP_API_KEY;

  /**
   * Check if an email address has been found in any data breaches
   */
  static async checkEmail(email: string): Promise<BreachCheckResult> {
    if (!this.API_KEY) {
      console.warn('HIBP_API_KEY not configured, skipping breach check');
      return {
        email,
        isBreached: false,
        breaches: [],
        lastChecked: new Date(),
      };
    }

    try {
      const response = await fetch(
        `${this.HIBP_API_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
          headers: {
            'hibp-api-key': this.API_KEY,
            'user-agent': 'ZeroLeakMail-BreachMonitor',
          },
        }
      );

      // 404 means no breaches found
      if (response.status === 404) {
        return {
          email,
          isBreached: false,
          breaches: [],
          lastChecked: new Date(),
        };
      }

      // Rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }

      if (!response.ok) {
        throw new Error(`HIBP API error: ${response.status} ${response.statusText}`);
      }

      const breaches: any[] = await response.json();

      return {
        email,
        isBreached: breaches.length > 0,
        breaches: breaches.map(this.mapBreachData),
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Error checking breach status:', error);
      throw error;
    }
  }

  /**
   * Check multiple email addresses in batch
   * Note: HIBP API doesn't support batch requests, so we implement rate limiting
   */
  static async checkMultiple(
    emails: string[],
    delayMs: number = 1600 // HIBP rate limit: 1 request per 1.5 seconds
  ): Promise<BreachCheckResult[]> {
    const results: BreachCheckResult[] = [];

    for (const email of emails) {
      try {
        const result = await this.checkEmail(email);
        results.push(result);

        // Wait between requests to respect rate limits
        if (emails.indexOf(email) < emails.length - 1) {
          await this.sleep(delayMs);
        }
      } catch (error) {
        console.error(`Failed to check ${email}:`, error);
        results.push({
          email,
          isBreached: false,
          breaches: [],
          lastChecked: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Check if decoy token has been leaked
   * This is a custom implementation that checks if our unique decoy tokens
   * appear in paste sites or dark web databases
   */
  static async checkDecoyToken(token: string): Promise<boolean> {
    // In a production system, you would:
    // 1. Search paste sites (Pastebin, etc.) for the token
    // 2. Check dark web monitoring services
    // 3. Use honeypot email addresses

    // For now, we'll check HIBP pastes API
    if (!this.API_KEY) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.HIBP_API_URL}/pasteaccount/${encodeURIComponent(token)}`,
        {
          headers: {
            'hibp-api-key': this.API_KEY,
            'user-agent': 'ZeroLeakMail-BreachMonitor',
          },
        }
      );

      // 404 means not found in pastes
      if (response.status === 404) {
        return false;
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        console.warn(`Rate limited checking decoy token. Retry after ${retryAfter}s`);
        return false;
      }

      if (!response.ok) {
        console.error(`HIBP paste API error: ${response.status}`);
        return false;
      }

      const pastes = await response.json();
      return Array.isArray(pastes) && pastes.length > 0;
    } catch (error) {
      console.error('Error checking decoy token:', error);
      return false;
    }
  }

  /**
   * Get all breaches from HIBP (useful for analytics)
   */
  static async getAllBreaches(): Promise<BreachData[]> {
    try {
      const response = await fetch(`${this.HIBP_API_URL}/breaches`, {
        headers: {
          'user-agent': 'ZeroLeakMail-BreachMonitor',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch breaches: ${response.status}`);
      }

      const breaches = await response.json();
      return breaches.map(this.mapBreachData);
    } catch (error) {
      console.error('Error fetching all breaches:', error);
      throw error;
    }
  }

  private static mapBreachData(breach: any): BreachData {
    return {
      name: breach.Name,
      title: breach.Title,
      domain: breach.Domain,
      breachDate: new Date(breach.BreachDate),
      addedDate: new Date(breach.AddedDate),
      modifiedDate: new Date(breach.ModifiedDate),
      pwnCount: breach.PwnCount,
      description: breach.Description,
      dataClasses: breach.DataClasses,
      isVerified: breach.IsVerified,
      isFabricated: breach.IsFabricated,
      isSensitive: breach.IsSensitive,
      isRetired: breach.IsRetired,
      isSpamList: breach.IsSpamList,
    };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determine if an alias should be killed based on breach data
   */
  static shouldKillAlias(breaches: BreachData[]): boolean {
    // Kill if found in any verified, non-fabricated breach
    return breaches.some(b => b.isVerified && !b.isFabricated && !b.isRetired);
  }

  /**
   * Calculate breach severity score
   */
  static calculateSeverity(breaches: BreachData[]): number {
    if (breaches.length === 0) return 0;

    let score = 0;

    for (const breach of breaches) {
      // Base score
      score += 1;

      // Add weight for verified breaches
      if (breach.isVerified) score += 2;

      // Add weight for sensitive breaches
      if (breach.isSensitive) score += 3;

      // Add weight based on data classes compromised
      const sensitiveClasses = ['Passwords', 'Credit cards', 'Social security numbers', 'Financial information'];
      const hasSensitiveData = breach.dataClasses.some(dc =>
        sensitiveClasses.some(sc => dc.toLowerCase().includes(sc.toLowerCase()))
      );
      if (hasSensitiveData) score += 2;

      // Reduce score for spam lists or fabricated breaches
      if (breach.isSpamList || breach.isFabricated) score -= 1;
    }

    return Math.max(0, score);
  }
}
