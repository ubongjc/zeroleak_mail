import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'

/**
 * @openapi
 * /api/alias:
 *   post:
 *     summary: Create a new email alias
 *     description: Creates a new per-merchant email alias with optional leak detection
 *     tags:
 *       - Aliases
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchant
 *             properties:
 *               merchant:
 *                 type: string
 *                 description: Name of the merchant/service
 *                 example: "Amazon"
 *               localPart:
 *                 type: string
 *                 description: Custom local part (optional, auto-generated if not provided)
 *                 example: "amazon-2024"
 *               domain:
 *                 type: string
 *                 description: Custom domain (defaults to relay domain)
 *                 example: "mail.zeroleak.app"
 *               enableDecoy:
 *                 type: boolean
 *                 description: Enable leak detection via decoy seeding
 *                 default: true
 *     responses:
 *       201:
 *         description: Alias created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                   example: "amazon-abc123@mail.zeroleak.app"
 *                 merchant:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, KILLED, SUSPENDED, LEAKED]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Alias already exists
 */

const createAliasSchema = z.object({
  merchant: z.string().min(1).max(255),
  localPart: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional(),
  enableDecoy: z.boolean().default(true),
})

function generateLocalPart(merchant: string): string {
  const sanitized = merchant
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 20)
  const random = randomBytes(4).toString('hex')
  return `${sanitized}-${random}`
}

function generateDecoyToken(): string {
  return randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await auth()
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.sessionClaims?.email as string || `user-${userId}@temp.local`,
        },
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createAliasSchema.parse(body)

    // Generate local part if not provided
    const localPart = validatedData.localPart || generateLocalPart(validatedData.merchant)
    const domain = validatedData.domain || process.env.RELAY_DOMAIN || 'mail.zeroleak.app'

    // Check if alias already exists
    const existingAlias = await prisma.alias.findUnique({
      where: {
        localPart_domain: {
          localPart,
          domain,
        },
      },
    })

    if (existingAlias) {
      return NextResponse.json(
        { error: 'Alias already exists', email: `${localPart}@${domain}` },
        { status: 409 }
      )
    }

    // Create the alias
    const alias = await prisma.alias.create({
      data: {
        userId: user.id,
        localPart,
        domain,
        merchant: validatedData.merchant,
        status: 'ACTIVE',
        decoySeeded: validatedData.enableDecoy,
        decoyToken: validatedData.enableDecoy ? generateDecoyToken() : null,
        forwardTo: user.email,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'alias.created',
        resource: alias.id,
        metadata: {
          merchant: validatedData.merchant,
          email: `${localPart}@${domain}`,
        },
      },
    })

    return NextResponse.json(
      {
        id: alias.id,
        email: `${alias.localPart}@${alias.domain}`,
        merchant: alias.merchant,
        status: alias.status,
        decoyEnabled: alias.decoySeeded,
        createdAt: alias.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating alias:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @openapi
 * /api/alias:
 *   get:
 *     summary: List user aliases
 *     description: Returns all aliases for the authenticated user
 *     tags:
 *       - Aliases
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, KILLED, SUSPENDED, LEAKED]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of aliases
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const aliases = await prisma.alias.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            relayEvents: true,
            receiptTags: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.alias.count({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
    })

    return NextResponse.json({
      aliases: aliases.map(alias => ({
        id: alias.id,
        email: `${alias.localPart}@${alias.domain}`,
        merchant: alias.merchant,
        status: alias.status,
        eventCount: alias._count.relayEvents,
        receiptCount: alias._count.receiptTags,
        createdAt: alias.createdAt,
        leakedAt: alias.leakedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching aliases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
