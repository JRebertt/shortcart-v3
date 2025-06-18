import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { paymentMethods } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../_error/unauthorized-error'

export async function getPaymentMethods(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/payment-methods',
    {
      schema: {
        tags: ['Payment Methods'],
        summary: 'Get organization payment methods',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Buscar métodos de pagamento da organização
      const organizationPaymentMethods = await db
        .select({
          id: paymentMethods.id,
          type: paymentMethods.type,
          cardNumber: paymentMethods.cardNumber,
          cardHolderName: paymentMethods.cardHolderName,
          expiryMonth: paymentMethods.expiryMonth,
          expiryYear: paymentMethods.expiryYear,
          isDefault: paymentMethods.isDefault,
          createdAt: paymentMethods.createdAt,
        })
        .from(paymentMethods)
        .where(eq(paymentMethods.organizationId, organizationId))

      return reply.status(200).send({
        paymentMethods: organizationPaymentMethods,
      })
    },
  )
}

