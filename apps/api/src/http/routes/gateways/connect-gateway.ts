import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { gatewayConfigurations } from '@shortcart-v3/database/schema'
import { eq, and } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

export async function connectGateway(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/gateways/connect',
    {
      schema: {
        tags: ['Gateways'],
        summary: 'Connect a payment gateway',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        body: z.object({
          provider: z.enum(['MANGOFY', 'STRIPE', 'MERCADO_PAGO', 'PAGAR_ME', 'ASAAS'], {
            errorMap: () => ({ message: 'Provider inválido' }),
          }),
          name: z.string().min(2, 'Nome da configuração deve ter pelo menos 2 caracteres'),
          credentials: z.object({
            apiKey: z.string().min(1, 'API Key é obrigatória'),
            secretKey: z.string().optional(),
            storeCode: z.string().optional(), // Para Mangofy
            publicKey: z.string().optional(), // Para Stripe
            accessToken: z.string().optional(), // Para Mercado Pago
          }),
          supportedMethods: z.array(
            z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO'])
          ).min(1, 'Pelo menos um método de pagamento deve ser suportado'),
          isActive: z.boolean().default(true),
          priority: z.number().min(1).max(10).default(1),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { provider, name, credentials, supportedMethods, isActive, priority } = request.body

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Verificar se já existe configuração para este provider
      const [existingConfig] = await db
        .select()
        .from(gatewayConfigurations)
        .where(
          and(
            eq(gatewayConfigurations.organizationId, organizationId),
            eq(gatewayConfigurations.provider, provider)
          )
        )
        .limit(1)

      if (existingConfig) {
        throw new BadRequestError(`Gateway ${provider} já está configurado para esta organização.`)
      }

      // Validações específicas por provider
      if (provider === 'MANGOFY' && !credentials.storeCode) {
        throw new BadRequestError('Store Code é obrigatório para Mangofy.')
      }

      if (provider === 'STRIPE' && !credentials.publicKey) {
        throw new BadRequestError('Public Key é obrigatória para Stripe.')
      }

      // Criar configuração do gateway
      const [newGatewayConfig] = await db
        .insert(gatewayConfigurations)
        .values({
          organizationId,
          provider,
          name,
          credentials: JSON.stringify(credentials),
          supportedMethods: JSON.stringify(supportedMethods),
          isActive,
          priority,
        })
        .returning({
          id: gatewayConfigurations.id,
          provider: gatewayConfigurations.provider,
          name: gatewayConfigurations.name,
          supportedMethods: gatewayConfigurations.supportedMethods,
          isActive: gatewayConfigurations.isActive,
          priority: gatewayConfigurations.priority,
          createdAt: gatewayConfigurations.createdAt,
        })

      return reply.status(201).send({
        message: 'Gateway conectado com sucesso',
        gateway: newGatewayConfig,
      })
    },
  )
}

