import { FastifyRequest, FastifyReply } from 'fastify';

export async function organizationMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Pular middleware para rotas que não precisam de organização
  const skipRoutes = [
    '/',
    '/health',
    '/documentation',
    '/api/auth',
    '/checkout',
  ];

  const shouldSkip = skipRoutes.some(route => request.url.startsWith(route));
  if (shouldSkip || !request.user) {
    return;
  }

  // Obter ID da organização do header ou do usuário
  const organizationId = request.headers['x-organization-id'] as string || request.user.organizationId;

  if (!organizationId) {
    reply.status(400).send({
      error: 'Bad Request',
      message: 'ID da organização é obrigatório',
    });
    return;
  }

  try {
    // TODO: Buscar organização no banco de dados
    // const organization = await getOrganizationById(organizationId);
    
    // Mock para desenvolvimento
    request.organization = {
      id: organizationId,
      name: 'Test Organization',
      plan: 'pro',
      settings: {
        allowMemberInvites: true,
        requireKyc: false,
      },
    };

    // TODO: Verificar permissões com CASL
    // const ability = createAbilityForUser(request.user, request.organization);
    // request.ability = ability;
  } catch (error) {
    reply.status(404).send({
      error: 'Not Found',
      message: 'Organização não encontrada',
    });
    return;
  }
}

