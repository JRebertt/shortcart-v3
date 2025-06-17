import { z } from 'zod';
import {
  UserRole,
  OrganizationPlan,
  ProductType,
  BillingType,
  SubscriptionInterval,
  PaymentMethod,
  GatewayProvider,
  KycStatus,
  NotificationType,
  WebhookEvent,
  ApiKeyScope,
} from '@shortcart-v3/utils';

// Schemas de autenticação
export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  organizationName: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres'),
});

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

// Schemas de usuário
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  avatar: z.string().url('URL do avatar inválida').optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.nativeEnum(UserRole),
});

// Schemas de organização
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().optional(),
  logo: z.string().url('URL do logo inválida').optional(),
  settings: z.object({
    allowMemberInvites: z.boolean().optional(),
    requireKyc: z.boolean().optional(),
    webhookUrl: z.string().url('URL do webhook inválida').optional(),
    customDomain: z.string().optional(),
    brandColors: z.object({
      primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor primária inválida').optional(),
      secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor secundária inválida').optional(),
    }).optional(),
  }).optional(),
});

// Schemas de produto
export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType),
  billingType: z.nativeEnum(BillingType),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  currency: z.string().length(3, 'Moeda deve ter 3 caracteres'),
  subscriptionInterval: z.nativeEnum(SubscriptionInterval).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Schemas de cliente
export const createCustomerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
    zipCode: z.string().min(8, 'CEP deve ter pelo menos 8 caracteres'),
    country: z.string().min(2, 'País deve ter pelo menos 2 caracteres'),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Schemas de pagamento
export const createPaymentSchema = z.object({
  customerId: z.string().uuid('ID do cliente inválido'),
  productId: z.string().uuid('ID do produto inválido'),
  externalId: z.string().min(1, 'ID externo é obrigatório'),
  method: z.nativeEnum(PaymentMethod),
  gatewayProvider: z.nativeEnum(GatewayProvider).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePaymentSchema = z.object({
  gatewayPaymentId: z.string().optional(),
  gatewayResponse: z.record(z.unknown()).optional(),
  paymentUrl: z.string().url('URL de pagamento inválida').optional(),
  qrCode: z.string().optional(),
  barcode: z.string().optional(),
  expiresAt: z.string().datetime('Data de expiração inválida').optional(),
  paidAt: z.string().datetime('Data de pagamento inválida').optional(),
});

// Schemas de assinatura
export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid('ID do cliente inválido'),
  productId: z.string().uuid('ID do produto inválido'),
  trialEnd: z.string().datetime('Data de fim do trial inválida').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'cancelled', 'expired', 'past_due']).optional(),
  currentPeriodStart: z.string().datetime('Data de início do período inválida').optional(),
  currentPeriodEnd: z.string().datetime('Data de fim do período inválida').optional(),
  cancelledAt: z.string().datetime('Data de cancelamento inválida').optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Schemas de API Key
export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1, 'Pelo menos um escopo é obrigatório'),
  expiresAt: z.string().datetime('Data de expiração inválida').optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1, 'Pelo menos um escopo é obrigatório').optional(),
  isActive: z.boolean().optional(),
});

// Schemas de Webhook
export const createWebhookSchema = z.object({
  url: z.string().url('URL inválida'),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1, 'Pelo menos um evento é obrigatório'),
});

export const updateWebhookSchema = z.object({
  url: z.string().url('URL inválida').optional(),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1, 'Pelo menos um evento é obrigatório').optional(),
  isActive: z.boolean().optional(),
});

// Schemas de KYC
export const submitKycSchema = z.object({
  documentType: z.enum(['cpf', 'cnpj', 'passport']),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  documentFront: z.string().url('URL da frente do documento inválida'),
  documentBack: z.string().url('URL do verso do documento inválida').optional(),
  selfie: z.string().url('URL da selfie inválida'),
  additionalInfo: z.record(z.unknown()).optional(),
});

// Schemas de gateway de pagamento
export const createGatewayConfigSchema = z.object({
  provider: z.nativeEnum(GatewayProvider),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  config: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  priority: z.number().min(1, 'Prioridade deve ser maior que 0').default(1),
});

export const updateGatewayConfigSchema = createGatewayConfigSchema.partial();

// Schemas de notificação
export const createNotificationTemplateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.nativeEnum(NotificationType),
  event: z.nativeEnum(WebhookEvent),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  isActive: z.boolean().default(true),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

// Schemas de paginação e filtros
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.coerce.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Data de início inválida').optional(),
  endDate: z.string().datetime('Data de fim inválida').optional(),
});

// Schemas de checkout público
export const checkoutSchema = z.object({
  productId: z.string().uuid('ID do produto inválido'),
  customer: createCustomerSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  successUrl: z.string().url('URL de sucesso inválida').optional(),
  cancelUrl: z.string().url('URL de cancelamento inválida').optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Tipos inferidos dos schemas
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

