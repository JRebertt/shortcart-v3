import { randomBytes } from 'crypto'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { users, passwordResetTokens } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/forgot-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request password recovery',
        body: z.object({
          email: z.string().email('Email inválido'),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body

      // Buscar usuário por email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user) {
        // Por segurança, sempre retornamos sucesso mesmo se o email não existir
        return reply.status(200).send({
          message: 'Se o email existir, você receberá instruções para redefinir sua senha',
        })
      }

      // Gerar token de recuperação
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

      // Remover tokens antigos do usuário
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id))

      // Criar novo token
      await db
        .insert(passwordResetTokens)
        .values({
          userId: user.id,
          token,
          expiresAt,
        })

      // TODO: Enviar email com o token
      // Por enquanto, vamos apenas logar o token (REMOVER EM PRODUÇÃO)
      console.log(`Token de recuperação para ${email}: ${token}`)

      return reply.status(200).send({
        message: 'Se o email existir, você receberá instruções para redefinir sua senha',
        // REMOVER EM PRODUÇÃO:
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      })
    },
  )
}

