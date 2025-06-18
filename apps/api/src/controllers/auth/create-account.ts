import { hash } from 'bcryptjs'
import { FastifyReply, FastifyRequest } from 'fastify'
import { db } from '@shortcart-v3/database'
import { users } from '@shortcart-v3/database/schema'
import { eq } from 'drizzle-orm'

import { BadRequestError } from '../../http/routes/_error/bad-request-error'

export async function createAccountController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = request.body as any

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser.length > 0) {
    throw new BadRequestError('Usuário com este email já existe.')
  }

  const passwordHash = await hash(password, 6)

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })

  return reply.status(201).send({
    message: 'Conta criada com sucesso',
    user: newUser,
  })
}
