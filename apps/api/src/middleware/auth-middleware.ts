import { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/health',
    '/documentation',
    '/api/auth/sign-in',
    '/api/auth/sign-up',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/checkout',
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    request.url.startsWith(route) || request.url.includes('/documentation')
  );

  if (isPublicRoute) {
    return;
  }

  // Verificar autenticação via API Key
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) {
    // TODO: Implementar validação de API Key
    // const validApiKey = await validateApiKey(apiKey);
    // if (validApiKey) {
    //   request.user = { id: validApiKey.organizationId, type: 'api' };
    //   return;
    // }
    return;
  }

  // Verificar autenticação via Bearer Token
  const authorization = request.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de acesso é obrigatório',
    });
    return;
  }

  const token = authorization.substring(7);
  
  try {
    // TODO: Implementar validação de JWT com BetterAuth
    // const user = await validateJWT(token);
    // request.user = user;
    
    // Mock para desenvolvimento
    request.user = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'User Test',
      organizationId: 'org-123',
    };
  } catch (error) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado',
    });
    return;
  }
}

// Estender tipos do Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      name?: string;
      organizationId?: string;
      type?: 'user' | 'api';
    };
    organization?: {
      id: string;
      name: string;
      plan: string;
      settings: Record<string, unknown>;
    };
  }
}

