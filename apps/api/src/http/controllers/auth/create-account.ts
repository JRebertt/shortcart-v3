import { FastifyReply, FastifyRequest } from 'fastify'


export async function createAccountController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = request.body as any

  
}
