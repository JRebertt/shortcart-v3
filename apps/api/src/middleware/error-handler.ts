import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  // Erro de validação Zod
  if (error instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    });
    return;
  }

  // Erro de validação do Fastify
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: error.validation,
    });
    return;
  }

  // Erro de rate limit
  if (error.statusCode === 429) {
    reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
    });
    return;
  }

  // Erro de autorização
  if (error.statusCode === 401) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Acesso não autorizado',
    });
    return;
  }

  // Erro de permissão
  if (error.statusCode === 403) {
    reply.status(403).send({
      error: 'Forbidden',
      message: 'Acesso negado',
    });
    return;
  }

  // Erro não encontrado
  if (error.statusCode === 404) {
    reply.status(404).send({
      error: 'Not Found',
      message: 'Recurso não encontrado',
    });
    return;
  }

  // Erro interno do servidor
  reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

