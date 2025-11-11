import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

/**
 * @openapi
 * /api/alias/kill:
 *   post:
 *     summary: Kill an email alias
 *     description: Permanently deactivates an alias (cannot be reactivated)
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
 *               - aliasId
 *             properties:
 *               aliasId:
 *                 type: string
 *                 description: ID of the alias to kill
 *     responses:
 *       200:
 *         description: Alias killed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to kill this alias
 *       404:
 *         description: Alias not found
 */

const killAliasSchema = z.object({
  aliasId: z.string().cuid(),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { aliasId } = killAliasSchema.parse(body)

    // Find the alias and verify ownership
    const alias = await prisma.alias.findUnique({
      where: { id: aliasId },
    })

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias not found' },
        { status: 404 }
      )
    }

    if (alias.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to kill this alias' },
        { status: 403 }
      )
    }

    // Kill the alias
    const killedAlias = await prisma.alias.update({
      where: { id: aliasId },
      data: {
        status: 'KILLED',
        killedAt: new Date(),
      },
    })

    // Create relay event
    await prisma.relayEvent.create({
      data: {
        aliasId: killedAlias.id,
        type: 'BLOCKED',
        metadata: {
          action: 'alias_killed',
          reason: 'user_requested',
        },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'alias.killed',
        resource: aliasId,
        metadata: {
          email: `${alias.localPart}@${alias.domain}`,
        },
      },
    })

    return NextResponse.json({
      id: killedAlias.id,
      email: `${killedAlias.localPart}@${killedAlias.domain}`,
      status: killedAlias.status,
      killedAt: killedAlias.killedAt,
    })
  } catch (error) {
    console.error('Error killing alias:', error)

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
