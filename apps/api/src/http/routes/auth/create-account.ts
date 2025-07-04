import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db, users } from '@shortcart-v3/database'
import { BadRequestError } from '../_errors/bad-request-error'
import { hashPassword } from '@shortcart-v3/utils'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Create a new account',
        body: z.object({
          name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
          email: z.string().email('Email inválido'),
          password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
        }),
      },
    },
    async (request, reply) => {

      const { name, email, password } = request.body

      const existingUser = await db
        .select()
        .from(users)
        // .where(eq(users.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        throw new BadRequestError('Usuário com este email já existe.')
      }

      const passwordHash = await hashPassword(password)

      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          // passwordHash
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })

      return reply.status(201).send({
        message: 'Conta criada com sucesso',
        user: newUser,
      })
    },
  )
}

