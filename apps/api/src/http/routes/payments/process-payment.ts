import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { payments, products, gatewayConfigurations } from '@repo/database/schema'
import { eq, and } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

// Importar o package de gateways
// import { PaymentGatewayManager } from '@repo/payment-gateways'

export async function processPayment(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/payments/process',
    {
      schema: {
        tags: ['Payments'],
        summary: 'Process a payment',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        body: z.object({
          productId: z.string().uuid('Product ID inválido'),
          paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'], {
            errorMap: () => ({ message: 'Método de pagamento inválido' }),
          }),
          customer: z.object({
            name: z.string().min(2, 'Nome do cliente é obrigatório'),
            email: z.string().email('Email inválido'),
            document: z.string().min(11, 'Documento inválido'),
            phone: z.string().optional(),
            address: z.object({
              street: z.string(),
              number: z.string(),
              complement: z.string().optional(),
              neighborhood: z.string(),
              city: z.string(),
              state: z.string(),
              zipCode: z.string(),
            }).optional(),
          }),
          // Campos específicos para cartão
          cardData: z.object({
            number: z.string().optional(),
            holderName: z.string().optional(),
            expiryMonth: z.number().optional(),
            expiryYear: z.number().optional(),
            cvv: z.string().optional(),
            installments: z.number().min(1).max(12).default(1),
          }).optional(),
          // Campos específicos para PIX
          pixData: z.object({
            expiresInDays: z.number().min(1).max(7).default(1),
          }).optional(),
          // Metadata adicional
          metadata: z.record(z.any()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { productId, paymentMethod, customer, cardData, pixData, metadata } = request.body

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Buscar produto
      const [product] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.organizationId, organizationId),
            eq(products.isActive, true)
          )
        )
        .limit(1)

      if (!product) {
        throw new BadRequestError('Produto não encontrado ou inativo.')
      }

      // Buscar gateways ativos que suportam o método de pagamento
      const availableGateways = await db
        .select()
        .from(gatewayConfigurations)
        .where(
          and(
            eq(gatewayConfigurations.organizationId, organizationId),
            eq(gatewayConfigurations.isActive, true)
          )
        )

      const compatibleGateways = availableGateways.filter(gateway => {
        const supportedMethods = JSON.parse(gateway.supportedMethods as string)
        return supportedMethods.includes(paymentMethod)
      })

      if (compatibleGateways.length === 0) {
        throw new BadRequestError(`Nenhum gateway disponível para o método ${paymentMethod}.`)
      }

      // Ordenar por prioridade
      compatibleGateways.sort((a, b) => a.priority - b.priority)

      // Criar registro de pagamento
      const [payment] = await db
        .insert(payments)
        .values({
          organizationId,
          productId,
          amount: product.price,
          currency: product.currency,
          paymentMethod,
          status: 'PENDING',
          customer: JSON.stringify(customer),
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .returning()

      // TODO: Processar pagamento com o gateway
      // Por enquanto, vamos simular o processamento
      const selectedGateway = compatibleGateways[0]
      
      // Simular resposta do gateway
      const gatewayResponse = {
        paymentId: payment.id,
        externalId: `ext_${Date.now()}`,
        status: 'PENDING',
        paymentUrl: paymentMethod === 'PIX' ? 'https://example.com/pix-qr' : undefined,
        qrCode: paymentMethod === 'PIX' ? '00020101021226...' : undefined,
        boletoUrl: paymentMethod === 'BOLETO' ? 'https://example.com/boleto.pdf' : undefined,
      }

      // Atualizar pagamento com dados do gateway
      await db
        .update(payments)
        .set({
          externalId: gatewayResponse.externalId,
          gatewayProvider: selectedGateway.provider,
          gatewayResponse: JSON.stringify(gatewayResponse),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      return reply.status(201).send({
        message: 'Pagamento processado com sucesso',
        payment: {
          id: payment.id,
          status: gatewayResponse.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod,
          paymentUrl: gatewayResponse.paymentUrl,
          qrCode: gatewayResponse.qrCode,
          boletoUrl: gatewayResponse.boletoUrl,
          expiresAt: paymentMethod === 'PIX' ? new Date(Date.now() + (pixData?.expiresInDays || 1) * 24 * 60 * 60 * 1000) : undefined,
        },
      })
    },
  )
}

