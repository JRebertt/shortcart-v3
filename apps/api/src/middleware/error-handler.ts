import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500
  reply.status(statusCode).send({ message: error.message })
}
