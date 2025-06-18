import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@shortcart-v3/database'
import { organizations, organizationMembers } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../_error/bad-request-error'
import { UnauthorizedError } from '../_error/unauthorized-error'

export async function createOrganization(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/organizations',
    {
      schema: {
        tags: ['Organizations'],
        summary: 'Create a new organization',
        headers: z.object({
          'x-user-id': z.string().uuid('User ID inválido'),
        }),
        body: z.object({
          name: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres'),
          slug: z.string()
            .min(3, 'Slug deve ter pelo menos 3 caracteres')
            .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
          domain: z.string().optional(),
          description: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const userId = request.headers['x-user-id']
      const { name, slug, domain, description } = request.body

      if (!userId) {
        throw new UnauthorizedError('Token de acesso necessário.')
      }

      // Verificar se slug já existe
      const [existingOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1)

      if (existingOrg) {
        throw new BadRequestError('Slug já está em uso.')
      }

      // Criar organização
      const [newOrganization] = await db
        .insert(organizations)
        .values({
          name,
          slug,
          domain,
          description,
          ownerId: userId,
        })
        .returning()

      // Adicionar criador como membro admin
      await db
        .insert(organizationMembers)
        .values({
          organizationId: newOrganization.id,
          userId,
          role: 'ADMIN',
        })

      return reply.status(201).send({
        message: 'Organização criada com sucesso',
        organization: newOrganization,
      })
    },
  )
}

