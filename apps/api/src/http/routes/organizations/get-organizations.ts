import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { organizations, organizationMembers } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getOrganizations(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/organizations',
    {
      schema: {
        tags: ['Organizations'],
        summary: 'Get user organizations',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']

      if (!userId) {
        throw new UnauthorizedError('Token de acesso necessário.')
      }

      // Buscar organizações do usuário
      const userOrganizations = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          domain: organizations.domain,
          description: organizations.description,
          ownerId: organizations.ownerId,
          createdAt: organizations.createdAt,
          role: organizationMembers.role,
        })
        .from(organizations)
        .innerJoin(
          organizationMembers,
          eq(organizations.id, organizationMembers.organizationId)
        )
        .where(eq(organizationMembers.userId, userId))

      return reply.status(200).send({
        organizations: userOrganizations,
      })
    },
  )
}

