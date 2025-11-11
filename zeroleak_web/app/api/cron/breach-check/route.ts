/**
 * Breach Check Cron Job
 * Periodically checks all active aliases for data breaches
 * This endpoint should be called by a cron service (Vercel Cron, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BreachMonitor } from '@/lib/services/breach-monitor';

/**
 * GET /api/cron/breach-check
 * Run breach checks on all active aliases
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting breach check cron job...');

    // Get all active aliases that haven't been checked recently
    const HOURS_BETWEEN_CHECKS = 24;
    const checkThreshold = new Date(Date.now() - HOURS_BETWEEN_CHECKS * 60 * 60 * 1000);

    const aliases = await prisma.alias.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { lastBreachCheck: null },
          { lastBreachCheck: { lt: checkThreshold } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 50, // Limit to avoid rate limiting
    });

    console.log(`Found ${aliases.length} aliases to check`);

    const results = {
      checked: 0,
      breachesFound: 0,
      aliasesKilled: 0,
      errors: 0,
    };

    // Check each alias
    for (const alias of aliases) {
      try {
        const aliasEmail = `${alias.localPart}@${alias.domain}`;
        console.log(`Checking ${aliasEmail}...`);

        // Check for breaches
        const breachResult = await BreachMonitor.checkEmail(aliasEmail);

        // Update last check time
        await prisma.alias.update({
          where: { id: alias.id },
          data: { lastBreachCheck: new Date() },
        });

        results.checked++;

        if (breachResult.isBreached) {
          console.log(`Breach found for ${aliasEmail}: ${breachResult.breaches.length} breaches`);
          results.breachesFound++;

          // Update alias status
          await prisma.alias.update({
            where: { id: alias.id },
            data: {
              breachDetected: true,
            },
          });

          // Store breach data
          for (const breach of breachResult.breaches) {
            await prisma.breachCheck.create({
              data: {
                email: aliasEmail,
                breachName: breach.name,
                breachDate: breach.breachDate,
                dataClasses: breach.dataClasses,
                verified: breach.isVerified,
              },
            });
          }

          // Determine if alias should be killed
          const shouldKill = BreachMonitor.shouldKillAlias(breachResult.breaches);
          const severity = BreachMonitor.calculateSeverity(breachResult.breaches);

          if (shouldKill && severity >= 5) {
            console.log(`Auto-killing ${aliasEmail} due to severe breach (severity: ${severity})`);

            await prisma.alias.update({
              where: { id: alias.id },
              data: {
                status: 'LEAKED',
                leakedAt: new Date(),
              },
            });

            results.aliasesKilled++;

            // Create audit log
            await prisma.auditLog.create({
              data: {
                userId: alias.userId,
                action: 'ALIAS_AUTO_KILLED',
                resource: `alias:${alias.id}`,
                metadata: {
                  reason: 'Data breach detected',
                  aliasEmail,
                  breaches: breachResult.breaches.map(b => b.name),
                  severity,
                },
              },
            });

            // Create relay event
            await prisma.relayEvent.create({
              data: {
                aliasId: alias.id,
                type: 'LEAK_DETECTED',
                metadata: {
                  source: 'breach_monitor',
                  breaches: breachResult.breaches.map(b => ({
                    name: b.name,
                    breachDate: b.breachDate,
                    dataClasses: b.dataClasses,
                  })),
                  severity,
                },
              },
            });
          } else if (breachResult.breaches.length > 0) {
            // Just log for user awareness, don't auto-kill for minor breaches
            await prisma.relayEvent.create({
              data: {
                aliasId: alias.id,
                type: 'LEAK_DETECTED',
                metadata: {
                  source: 'breach_monitor',
                  breaches: breachResult.breaches.map(b => b.name),
                  severity,
                  note: 'Minor breach detected, not auto-killing',
                },
              },
            });
          }
        }

        // Check decoy token if enabled
        if (alias.decoySeeded && alias.decoyToken) {
          const decoyLeaked = await BreachMonitor.checkDecoyToken(alias.decoyToken);

          if (decoyLeaked) {
            console.log(`Decoy token leaked for ${aliasEmail}`);

            await prisma.alias.update({
              where: { id: alias.id },
              data: {
                status: 'LEAKED',
                leakedAt: new Date(),
                breachDetected: true,
              },
            });

            results.aliasesKilled++;

            await prisma.auditLog.create({
              data: {
                userId: alias.userId,
                action: 'ALIAS_AUTO_KILLED',
                resource: `alias:${alias.id}`,
                metadata: {
                  reason: 'Decoy token leaked',
                  aliasEmail,
                },
              },
            });

            await prisma.relayEvent.create({
              data: {
                aliasId: alias.id,
                type: 'LEAK_DETECTED',
                metadata: {
                  source: 'decoy_token',
                  decoyToken: alias.decoyToken,
                },
              },
            });
          }
        }

        // Wait 1.6s between checks to respect HIBP rate limits
        await new Promise(resolve => setTimeout(resolve, 1600));
      } catch (error) {
        console.error(`Error checking alias ${alias.id}:`, error);
        results.errors++;
      }
    }

    console.log('Breach check cron job completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Breach check cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
