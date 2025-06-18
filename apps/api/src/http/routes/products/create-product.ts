import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { products } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

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
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { 
        name, 
        description, 
        type, 
        billingType, 
        price, 
        currency, 
        isActive, 
        metadata,
        downloadUrl,
        accessDuration,
        weight,
        dimensions,
        trialPeriodDays,
        features
      } = request.body

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Validações específicas por tipo
      if (type === 'DIGITAL' && billingType !== 'ONE_TIME' && !downloadUrl) {
        throw new BadRequestError('URL de download é obrigatória para produtos digitais recorrentes.')
      }

      if (type === 'PHYSICAL' && !weight) {
        throw new BadRequestError('Peso é obrigatório para produtos físicos.')
      }

      if (billingType !== 'ONE_TIME' && !trialPeriodDays) {
        // Definir período de trial padrão para assinaturas
        trialPeriodDays = 7
      }

      // Criar produto
      const [newProduct] = await db
        .insert(products)
        .values({
          organizationId,
          name,
          description,
          type,
          billingType,
          price,
          currency,
          isActive,
          metadata: metadata ? JSON.stringify(metadata) : null,
          downloadUrl,
          accessDuration,
          weight,
          dimensions: dimensions ? JSON.stringify(dimensions) : null,
          trialPeriodDays,
          features: features ? JSON.stringify(features) : null,
        })
        .returning()

      return reply.status(201).send({
        message: 'Produto criado com sucesso',
        product: newProduct,
      })
    },
  )
}

