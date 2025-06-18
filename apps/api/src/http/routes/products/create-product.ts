import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { createProductController } from '../../controllers/products/create-product'

export async function createProduct(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'Create a new product',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        body: z.object({
          name: z.string().min(2, 'Nome do produto deve ter pelo menos 2 caracteres'),
          description: z.string().optional(),
          type: z.enum(['DIGITAL', 'PHYSICAL'], {
            errorMap: () => ({ message: 'Tipo deve ser DIGITAL ou PHYSICAL' }),
          }),
          billingType: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY', 'LIFETIME'], {
            errorMap: () => ({ message: 'Tipo de cobrança inválido' }),
          }),
          price: z.number().min(0.01, 'Preço deve ser maior que zero'),
          currency: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
          isActive: z.boolean().default(true),
          metadata: z.record(z.any()).optional(),
          // Campos específicos para produtos digitais
          downloadUrl: z.string().url().optional(),
          accessDuration: z.number().optional(), // em dias
          // Campos específicos para produtos físicos
          weight: z.number().optional(), // em gramas
          dimensions: z.object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
          }).optional(),
          // Campos para assinaturas
          trialPeriodDays: z.number().optional(),
          features: z.array(z.string()).optional(),
        }),
      },
    },
    (request, reply) => createProductController(request, reply),
  )
}

