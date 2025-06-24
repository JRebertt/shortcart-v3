import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { kycVerifications } from '@shortcart-v3/database/src/schema'
import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getKycStatus(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/kyc/status',
    {
      schema: {
        tags: ['KYC'],
        summary: 'Get KYC verification status',
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

      // Buscar KYC da organização
      const [kyc] = await db
        .select({
          id: kycVerifications.id,
          status: kycVerifications.status,
          documentType: kycVerifications.documentType,
          submittedAt: kycVerifications.submittedAt,
          reviewedAt: kycVerifications.reviewedAt,
          rejectionReason: kycVerifications.rejectionReason,
          createdAt: kycVerifications.createdAt,
          updatedAt: kycVerifications.updatedAt,
        })
        .from(kycVerifications)
        .where(eq(kycVerifications.organizationId, organizationId))
        .limit(1)

      if (!kyc) {
        return reply.status(200).send({
          status: 'NOT_SUBMITTED',
          message: 'Nenhum documento KYC foi enviado ainda.',
        })
      }

      return reply.status(200).send({
        kyc,
      })
    },
  )
}

