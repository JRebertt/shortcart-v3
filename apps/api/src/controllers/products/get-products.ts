import { FastifyRequest, FastifyReply } from 'fastify'
import { db } from '@shortcart-v3/database'
import { products } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../../http/routes/_error/unauthorized-error'

export async function getProductsController(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.headers['x-user-id']
  const organizationId = request.headers['x-organization-id']
  const { type, billingType, isActive } = request.query as any

  if (!userId || !organizationId) {
    throw new UnauthorizedError('Token de acesso e organização necessários.')
  }

  let query = db
    .select()
    .from(products)
    .where(eq(products.organizationId, organizationId as string))

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
}
