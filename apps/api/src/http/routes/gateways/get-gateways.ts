import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { gatewayConfigurations } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getGateways(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/gateways',
    {
      schema: {
        tags: ['Gateways'],
        summary: 'Get organization payment gateways',
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

      // Buscar gateways da organização
      const organizationGateways = await db
        .select({
          id: gatewayConfigurations.id,
          provider: gatewayConfigurations.provider,
          name: gatewayConfigurations.name,
          supportedMethods: gatewayConfigurations.supportedMethods,
          isActive: gatewayConfigurations.isActive,
          priority: gatewayConfigurations.priority,
          createdAt: gatewayConfigurations.createdAt,
          updatedAt: gatewayConfigurations.updatedAt,
        })
        .from(gatewayConfigurations)
        .where(eq(gatewayConfigurations.organizationId, organizationId))

      return reply.status(200).send({
        gateways: organizationGateways,
      })
    },
  )
}

