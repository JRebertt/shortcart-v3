import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { paymentMethods } from '@repo/database/schema'
import { eq, and } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

export async function addPaymentMethod(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/payment-methods',
    {
      schema: {
        tags: ['Payment Methods'],
        summary: 'Add a new payment method (card)',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        body: z.object({
          type: z.enum(['CREDIT_CARD', 'DEBIT_CARD'], {
            errorMap: () => ({ message: 'Tipo deve ser CREDIT_CARD ou DEBIT_CARD' }),
          }),
          cardNumber: z.string()
            .regex(/^\d{16}$/, 'Número do cartão deve ter 16 dígitos'),
          cardHolderName: z.string()
            .min(2, 'Nome do portador deve ter pelo menos 2 caracteres'),
          expiryMonth: z.number()
            .min(1, 'Mês deve ser entre 1 e 12')
            .max(12, 'Mês deve ser entre 1 e 12'),
          expiryYear: z.number()
            .min(new Date().getFullYear(), 'Ano não pode ser no passado'),
          cvv: z.string()
            .regex(/^\d{3,4}$/, 'CVV deve ter 3 ou 4 dígitos'),
          isDefault: z.boolean().default(false),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { type, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, isDefault } = request.body

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Validar data de expiração
      const currentDate = new Date()
      const expiryDate = new Date(expiryYear, expiryMonth - 1)
      
      if (expiryDate <= currentDate) {
        throw new BadRequestError('Cartão expirado.')
      }

      // Mascarar número do cartão (manter apenas os últimos 4 dígitos)
      const maskedCardNumber = `****-****-****-${cardNumber.slice(-4)}`

      // Se este cartão for padrão, remover padrão dos outros
      if (isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(
            and(
              eq(paymentMethods.organizationId, organizationId),
              eq(paymentMethods.isDefault, true)
            )
          )
      }

      // Criar método de pagamento
      const [newPaymentMethod] = await db
        .insert(paymentMethods)
        .values({
          organizationId,
          type,
          cardNumber: maskedCardNumber,
          cardHolderName,
          expiryMonth,
          expiryYear,
          isDefault,
          // CVV não é salvo por segurança
        })
        .returning({
          id: paymentMethods.id,
          type: paymentMethods.type,
          cardNumber: paymentMethods.cardNumber,
          cardHolderName: paymentMethods.cardHolderName,
          expiryMonth: paymentMethods.expiryMonth,
          expiryYear: paymentMethods.expiryYear,
          isDefault: paymentMethods.isDefault,
          createdAt: paymentMethods.createdAt,
        })

      return reply.status(201).send({
        message: 'Método de pagamento adicionado com sucesso',
        paymentMethod: newPaymentMethod,
      })
    },
  )
}

