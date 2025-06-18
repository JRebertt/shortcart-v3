
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { users } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with email and password',
        body: z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(1, 'Senha é obrigatória'),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      // Buscar usuário por email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user) {
        throw new BadRequestError('Credenciais inválidas.')
      }

      // Verificar senha
      const isPasswordValid = await compare(password, user.passwordHash)

      if (!isPasswordValid) {
        throw new BadRequestError('Credenciais inválidas.')
      }

      // Criar sessão (usando Better Auth seria aqui)
      // Por enquanto, retornamos os dados do usuário
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }

      return reply.status(200).send({
        message: 'Login realizado com sucesso',
        user: userResponse,
      })
    },
  )
}

