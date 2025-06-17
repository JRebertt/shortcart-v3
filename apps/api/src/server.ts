import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { config } from 'dotenv';

// Importar rotas
import { authRoutes } from './routes/auth-routes';
import { organizationRoutes } from './routes/organization-routes';
import { productRoutes } from './routes/product-routes';
import { customerRoutes } from './routes/customer-routes';
import { paymentRoutes } from './routes/payment-routes';
import { subscriptionRoutes } from './routes/subscription-routes';
import { webhookRoutes } from './routes/webhook-routes';
import { apiKeyRoutes } from './routes/api-key-routes';
import { analyticsRoutes } from './routes/analytics-routes';
import { checkoutRoutes } from './routes/checkout-routes';

// Importar middleware
import { authMiddleware } from './middleware/auth-middleware';
import { organizationMiddleware } from './middleware/organization-middleware';
import { errorHandler } from './middleware/error-handler';

config();

async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Configurar validação e serialização com Zod
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Registrar plugins de segurança
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Registrar CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(',') || false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
  });

  // Registrar cookies
  await fastify.register(cookie, {
    secret: process.env.AUTH_SECRET || 'your-secret-key',
    parseOptions: {},
  });

  // Registrar Swagger
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Checkout SaaS API',
        description: 'API completa para SaaS de checkout com múltiplos gateways de pagamento',
        version: '1.0.0',
      },
      host: `localhost:${process.env.PORT || 3000}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Bearer token para autenticação',
        },
        apiKey: {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'Chave de API para acesso programático',
        },
      },
      tags: [
        { name: 'auth', description: 'Autenticação e registro' },
        { name: 'organizations', description: 'Gestão de organizações' },
        { name: 'products', description: 'Gestão de produtos' },
        { name: 'customers', description: 'Gestão de clientes' },
        { name: 'payments', description: 'Processamento de pagamentos' },
        { name: 'subscriptions', description: 'Gestão de assinaturas' },
        { name: 'webhooks', description: 'Configuração de webhooks' },
        { name: 'api-keys', description: 'Gestão de chaves de API' },
        { name: 'analytics', description: 'Analytics e relatórios' },
        { name: 'checkout', description: 'Checkout público' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  // Registrar middleware global
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('onRequest', organizationMiddleware);
  fastify.setErrorHandler(errorHandler);

  // Registrar rotas
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(organizationRoutes, { prefix: '/api/organizations' });
  await fastify.register(productRoutes, { prefix: '/api/products' });
  await fastify.register(customerRoutes, { prefix: '/api/customers' });
  await fastify.register(paymentRoutes, { prefix: '/api/payments' });
  await fastify.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
  await fastify.register(apiKeyRoutes, { prefix: '/api/api-keys' });
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
  await fastify.register(checkoutRoutes, { prefix: '/checkout' });

  // Rota raiz
  fastify.get('/', async () => {
    return {
      name: 'Checkout SaaS API',
      version: '1.0.0',
      description: 'API completa para SaaS de checkout',
      features: [
        'Autenticação com BetterAuth',
        'Multitenancy com CASL',
        'Múltiplos gateways de pagamento',
        'Sistema de assinaturas',
        'Webhooks configuráveis',
        'Analytics integrado',
        'KYC automatizado',
        'API Keys com escopos',
      ],
      environment: process.env.NODE_ENV || 'development',
      documentation: '/documentation',
    };
  });

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await createServer();
    
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3000');

    await fastify.listen({ host, port });

    console.log(`🚀 Checkout SaaS API rodando em http://${host}:${port}`);
    console.log(`📚 Documentação em http://${host}:${port}/documentation`);
    console.log(`🔐 Autenticação: BetterAuth + CASL`);
    console.log(`🗄️  Banco: PostgreSQL + Drizzle ORM`);
    console.log(`🏗️  Arquitetura: Monorepo + Turborepo`);
    console.log(`💳 Gateways: Modulares e extensíveis`);
    console.log(`📊 Analytics: UTMify integrado`);
    console.log(`🔔 Notificações: Email + Webhook + SMS`);
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratar sinais de encerramento
process.on('SIGINT', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor...');
  process.exit(0);
});

start();

