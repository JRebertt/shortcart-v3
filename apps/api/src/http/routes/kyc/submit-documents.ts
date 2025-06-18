import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@repo/database'
import { kycVerifications } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

export async function submitKycDocuments(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/kyc/submit',
    {
      schema: {
        tags: ['KYC'],
        summary: 'Submit KYC documents for verification',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
          'x-organization-id': z.string().uuid('Organization ID inválido'),
        }),
        body: z.object({
          documentType: z.enum(['CPF', 'CNPJ'], {
            errorMap: () => ({ message: 'Tipo de documento deve ser CPF ou CNPJ' }),
          }),
          documentNumber: z.string().min(11, 'Número do documento inválido'),
          fullName: z.string().min(2, 'Nome completo é obrigatório'),
          birthDate: z.string().optional(), // Para CPF
          companyName: z.string().optional(), // Para CNPJ
          address: z.object({
            street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
            number: z.string().min(1, 'Número é obrigatório'),
            complement: z.string().optional(),
            neighborhood: z.string().min(2, 'Bairro é obrigatório'),
            city: z.string().min(2, 'Cidade é obrigatória'),
            state: z.string().length(2, 'Estado deve ter 2 caracteres'),
            zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
          }),
          documents: z.object({
            frontDocument: z.string().url('URL do documento frontal inválida'),
            backDocument: z.string().url('URL do documento verso inválida').optional(),
            selfie: z.string().url('URL da selfie inválida').optional(),
            proofOfAddress: z.string().url('URL do comprovante de endereço inválida').optional(),
          }),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const organizationId = request.headers['x-organization-id']
      const { documentType, documentNumber, fullName, birthDate, companyName, address, documents } = request.body

      if (!userId || !organizationId) {
        throw new UnauthorizedError('Token de acesso e organização necessários.')
      }

      // Verificar se já existe KYC para esta organização
      const [existingKyc] = await db
        .select()
        .from(kycVerifications)
        .where(eq(kycVerifications.organizationId, organizationId))
        .limit(1)

      if (existingKyc && existingKyc.status === 'APPROVED') {
        throw new BadRequestError('KYC já foi aprovado para esta organização.')
      }

      // Validações específicas por tipo de documento
      if (documentType === 'CPF' && !birthDate) {
        throw new BadRequestError('Data de nascimento é obrigatória para CPF.')
      }

      if (documentType === 'CNPJ' && !companyName) {
        throw new BadRequestError('Nome da empresa é obrigatório para CNPJ.')
      }

      // Criar ou atualizar KYC
      const kycData = {
        organizationId,
        documentType,
        documentNumber,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        companyName,
        address: JSON.stringify(address),
        documents: JSON.stringify(documents),
        status: 'PENDING' as const,
        submittedAt: new Date(),
      }

      let kyc
      if (existingKyc) {
        // Atualizar KYC existente
        [kyc] = await db
          .update(kycVerifications)
          .set({
            ...kycData,
            updatedAt: new Date(),
          })
          .where(eq(kycVerifications.id, existingKyc.id))
          .returning()
      } else {
        // Criar novo KYC
        [kyc] = await db
          .insert(kycVerifications)
          .values(kycData)
          .returning()
      }

      return reply.status(201).send({
        message: 'Documentos KYC enviados com sucesso',
        kyc: {
          id: kyc.id,
          status: kyc.status,
          submittedAt: kyc.submittedAt,
        },
      })
    },
  )
}

