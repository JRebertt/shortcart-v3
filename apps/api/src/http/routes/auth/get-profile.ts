import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { users } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/auth/profile',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        headers: z.object({
          authorization: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      // TODO: Implementar middleware de autenticação
      // Por enquanto, vamos simular com um userId fixo ou do header
      const userId = request.headers['x-user-id'] as string

      if (!userId) {
        throw new UnauthorizedError('Token de acesso necessário.')
      }

      // Buscar usuário
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        throw new BadRequestError('Usuário não encontrado.')
      }

      return reply.status(200).send({
        user,
      })
    },
  )
}

