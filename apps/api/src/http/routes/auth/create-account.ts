import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { users } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'

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

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existingUser.length > 0) {
        throw new BadRequestError('Usuário com este email já existe.')
      }

      // Hash da senha
      const passwordHash = await hash(password, 6)

      // Criar usuário
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
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

