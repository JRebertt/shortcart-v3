import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { users, passwordResetTokens } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/reset-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        body: z.object({
          token: z.string().min(1, 'Token é obrigatório'),
          password: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
        }),
      },
    },
    async (request, reply) => {
      const { token, password } = request.body

      // Buscar token válido
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1)

      if (!resetToken) {
        throw new BadRequestError('Token inválido ou expirado.')
      }

      // Verificar se token não expirou
      if (resetToken.expiresAt < new Date()) {
        throw new BadRequestError('Token expirado.')
      }

      // Hash da nova senha
      const passwordHash = await hash(password, 6)

      // Atualizar senha do usuário
      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetToken.userId))

      // Remover token usado
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetToken.id))

      return reply.status(200).send({
        message: 'Senha redefinida com sucesso',
      })
    },
  )
}

