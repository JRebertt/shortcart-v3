import { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '@shortcart-v3/database'
import { products } from '@shortcart-v3/database/schema'

import { BadRequestError } from '../../http/routes/_error/bad-request-error'
import { UnauthorizedError } from '../../http/routes/_error/unauthorized-error'
import { eq } from 'drizzle-orm'

export async function createProductController(request: FastifyRequest, reply: FastifyReply) {
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
    trialPeriodDays: bodyTrial,
    features,
  } = request.body as any

  let trialPeriodDays = bodyTrial

  if (!userId || !organizationId) {
    throw new UnauthorizedError('Token de acesso e organização necessários.')
  }

  if (type === 'DIGITAL' && billingType !== 'ONE_TIME' && !downloadUrl) {
    throw new BadRequestError('URL de download é obrigatória para produtos digitais recorrentes.')
  }

  if (type === 'PHYSICAL' && !weight) {
    throw new BadRequestError('Peso é obrigatório para produtos físicos.')
  }

  if (billingType !== 'ONE_TIME' && !trialPeriodDays) {
    trialPeriodDays = 7
  }

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
}
