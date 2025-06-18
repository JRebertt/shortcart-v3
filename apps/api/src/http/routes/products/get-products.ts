import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { products } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../_error/unauthorized-error'

export async function getProducts(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'Get organization products',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        querystring: z.object({
          type: z.enum(['DIGITAL', 'PHYSICAL']).optional(),
          billingType: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY', 'LIFETIME']).optional(),
          isActive: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { type, billingType, isActive } = request.query

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Construir query base
      let query = db
        .select()
        .from(products)
        .where(eq(products.organizationId, organizationId))

      // Aplicar filtros se fornecidos
      if (type) {
        query = query.where(eq(products.type, type))
      }

      if (billingType) {
        query = query.where(eq(products.billingType, billingType))
      }

      if (isActive !== undefined) {
        query = query.where(eq(products.isActive, isActive))
      }

      const organizationProducts = await query

      return reply.status(200).send({
        products: organizationProducts,
      })
    },
  )
}

