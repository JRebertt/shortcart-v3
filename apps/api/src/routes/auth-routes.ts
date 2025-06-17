import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { signUpSchema, signInSchema, forgotPasswordSchema, resetPasswordSchema } from '@shortcart-v3/validation';

export async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Registro de usuário
  server.post('/sign-up', {
    schema: {
      description: 'Registrar novo usuário e organização',
      tags: ['auth'],
      body: signUpSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
              },
            },
            organization: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                plan: { type: 'string' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password, name, organizationName } = request.body;

    try {
      // TODO: Implementar registro com BetterAuth
      // const { user, organization } = await authService.signUp({
      //   email,
      //   password,
      //   name,
      //   organizationName,
      // });

      // Mock para desenvolvimento
      const user = {
        id: 'user-123',
        email,
        name,
        emailVerified: false,
      };

      const organization = {
        id: 'org-123',
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
        plan: 'free',
      };

      const token = 'mock-jwt-token';

      reply.status(201).send({
        user,
        organization,
        token,
      });
    } catch (error: any) {
      reply.status(400).send({
        error: 'Registration Failed',
        message: error.message,
      });
    }
  });

  // Login
  server.post('/sign-in', {
    schema: {
      description: 'Fazer login',
      tags: ['auth'],
      body: signInSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    try {
      // TODO: Implementar login com BetterAuth
      // const { user, token } = await authService.signIn({ email, password });

      // Mock para desenvolvimento
      const user = {
        id: 'user-123',
        email,
        name: 'User Test',
        emailVerified: true,
      };

      const token = 'mock-jwt-token';

      reply.send({
        user,
        token,
      });
    } catch (error: any) {
      reply.status(401).send({
        error: 'Authentication Failed',
        message: 'Email ou senha inválidos',
      });
    }
  });

  // Esqueci a senha
  server.post('/forgot-password', {
    schema: {
      description: 'Solicitar redefinição de senha',
      tags: ['auth'],
      body: forgotPasswordSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body;

    try {
      // TODO: Implementar envio de email de redefinição
      // await authService.forgotPassword(email);

      reply.send({
        message: 'Email de redefinição enviado com sucesso',
      });
    } catch (error: any) {
      reply.status(400).send({
        error: 'Reset Failed',
        message: error.message,
      });
    }
  });

  // Redefinir senha
  server.post('/reset-password', {
    schema: {
      description: 'Redefinir senha',
      tags: ['auth'],
      body: resetPasswordSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { token, password } = request.body;

    try {
      // TODO: Implementar redefinição de senha
      // await authService.resetPassword(token, password);

      reply.send({
        message: 'Senha redefinida com sucesso',
      });
    } catch (error: any) {
      reply.status(400).send({
        error: 'Reset Failed',
        message: error.message,
      });
    }
  });

  // Logout
  server.post('/sign-out', {
    schema: {
      description: 'Fazer logout',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // TODO: Implementar logout (invalidar token)
      // await authService.signOut(request.user.id);

      reply.send({
        message: 'Logout realizado com sucesso',
      });
    } catch (error: any) {
      reply.status(400).send({
        error: 'Logout Failed',
        message: error.message,
      });
    }
  });

  // Perfil do usuário
  server.get('/me', {
    schema: {
      description: 'Obter perfil do usuário autenticado',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatar: { type: 'string' },
                emailVerified: { type: 'boolean' },
                kycStatus: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // TODO: Buscar dados completos do usuário
      // const user = await userService.getById(request.user.id);

      // Mock para desenvolvimento
      const user = {
        id: request.user!.id,
        email: request.user!.email,
        name: request.user!.name,
        avatar: null,
        emailVerified: true,
        kycStatus: 'pending',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      reply.send({ user });
    } catch (error: any) {
      reply.status(404).send({
        error: 'User Not Found',
        message: 'Usuário não encontrado',
      });
    }
  });
}

