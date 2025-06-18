import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { getProductsController } from '../../controllers/products/get-products'

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
    (request, reply) => getProductsController(request, reply),
  )
}

