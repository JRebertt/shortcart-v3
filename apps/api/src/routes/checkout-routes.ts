import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { checkoutSchema } from '@shortcart-v3/validation';

export async function checkoutRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Criar checkout (rota pública)
  server.post('/', {
    schema: {
      description: 'Criar checkout público para um produto',
      tags: ['checkout'],
      headers: {
        type: 'object',
        properties: {
          'X-API-Key': { type: 'string', description: 'Chave de API da organização' },
        },
        required: ['X-API-Key'],
      },
      body: checkoutSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            paymentUrl: { type: 'string' },
            qrCode: { type: 'string' },
            barcode: { type: 'string' },
            expiresAt: { type: 'string' },
            status: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            customer: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            product: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                billingType: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const apiKey = request.headers['x-api-key'] as string;
    const checkoutData = request.body;

    try {
      // TODO: Validar API Key e obter organização
      // const organization = await validateApiKey(apiKey);
      
      // TODO: Buscar produto
      // const product = await productService.getById(checkoutData.productId, organization.id);
      
      // TODO: Criar ou buscar cliente
      // const customer = await customerService.createOrUpdate(checkoutData.customer, organization.id);
      
      // TODO: Processar pagamento com gateway configurado
      // const payment = await paymentService.createPayment({
      //   organizationId: organization.id,
      //   customerId: customer.id,
      //   productId: product.id,
      //   method: checkoutData.paymentMethod,
      //   metadata: checkoutData.metadata,
      // });

      // Mock para desenvolvimento
      const payment = {
        id: 'payment-123',
        paymentUrl: 'https://checkout.example.com/pay/123',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        barcode: '12345678901234567890123456789012345678901234',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        amount: 5990,
        currency: 'BRL',
        customer: {
          id: 'customer-123',
          email: checkoutData.customer.email,
          name: checkoutData.customer.name,
        },
        product: {
          id: checkoutData.productId,
          name: 'Produto Teste',
          type: 'digital',
          billingType: 'one_time',
        },
      };

      reply.status(201).send(payment);
    } catch (error: any) {
      reply.status(400).send({
        error: 'Checkout Failed',
        message: error.message,
      });
    }
  });

  // Consultar status do checkout
  server.get('/:id', {
    schema: {
      description: 'Consultar status de um checkout',
      tags: ['checkout'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            paidAt: { type: 'string' },
            expiresAt: { type: 'string' },
            customer: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            product: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      // TODO: Buscar pagamento no banco
      // const payment = await paymentService.getById(id);

      // Mock para desenvolvimento
      const payment = {
        id,
        status: 'approved',
        amount: 5990,
        currency: 'BRL',
        paidAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customer: {
          email: 'customer@example.com',
          name: 'Cliente Teste',
        },
        product: {
          name: 'Produto Teste',
          type: 'digital',
        },
      };

      reply.send(payment);
    } catch (error: any) {
      reply.status(404).send({
        error: 'Payment Not Found',
        message: 'Pagamento não encontrado',
      });
    }
  });

  // Webhook para receber notificações dos gateways
  server.post('/webhook/:provider', {
    schema: {
      description: 'Webhook para receber notificações dos gateways de pagamento',
      tags: ['checkout'],
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['stripe', 'mercado_pago', 'pagarme', 'asaas', 'mangofy'] },
        },
        required: ['provider'],
      },
      body: {
        type: 'object',
        additionalProperties: true,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            received: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { provider } = request.params;
    const webhookData = request.body;

    try {
      // TODO: Processar webhook do gateway
      // await webhookService.processGatewayWebhook(provider, webhookData, request.headers);

      console.log(`Webhook recebido do ${provider}:`, webhookData);

      reply.send({ received: true });
    } catch (error: any) {
      reply.status(400).send({
        error: 'Webhook Processing Failed',
        message: error.message,
      });
    }
  });
}

