// Enums e constantes
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum OrganizationPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum ProductType {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
}

export enum BillingType {
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
}

export enum SubscriptionInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BOLETO = 'boleto',
  BANK_TRANSFER = 'bank_transfer',
}

export enum GatewayProvider {
  STRIPE = 'stripe',
  MERCADO_PAGO = 'mercado_pago',
  PAGARME = 'pagarme',
  ASAAS = 'asaas',
  MANGOFY = 'mangofy',
}

export enum KycStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum NotificationType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  PUSH = 'push',
}

export enum WebhookEvent {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_APPROVED = 'payment.approved',
  PAYMENT_REJECTED = 'payment.rejected',
  PAYMENT_CANCELLED = 'payment.cancelled',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
}

export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

// Interfaces base
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  kycStatus: KycStatus;
  isActive: boolean;
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan: OrganizationPlan;
  ownerId: string;
  isActive: boolean;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  requireKyc: boolean;
  webhookUrl?: string;
  customDomain?: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
}

export interface Product extends BaseEntity {
  organizationId: string;
  name: string;
  description?: string;
  type: ProductType;
  billingType: BillingType;
  price: number;
  currency: string;
  subscriptionInterval?: SubscriptionInterval;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Customer extends BaseEntity {
  organizationId: string;
  email: string;
  name: string;
  phone?: string;
  document?: string;
  address?: CustomerAddress;
  metadata?: Record<string, unknown>;
}

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Payment extends BaseEntity {
  organizationId: string;
  customerId: string;
  productId: string;
  externalId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  gatewayProvider: GatewayProvider;
  gatewayPaymentId?: string;
  gatewayResponse?: Record<string, unknown>;
  paymentUrl?: string;
  qrCode?: string;
  barcode?: string;
  expiresAt?: Date;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Subscription extends BaseEntity {
  organizationId: string;
  customerId: string;
  productId: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  trialEnd?: Date;
  metadata?: Record<string, unknown>;
}

export interface ApiKey extends BaseEntity {
  organizationId: string;
  name: string;
  key: string;
  scopes: ApiKeyScope[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface Webhook extends BaseEntity {
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
}

// Tipos de resposta da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Tipos de paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

