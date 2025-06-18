import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { createAccountController } from '../../controllers/auth/create-account'

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
    (request, reply) => createAccountController(request, reply),
  )
}

