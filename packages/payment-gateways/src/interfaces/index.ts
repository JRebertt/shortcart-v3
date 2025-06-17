import { PaymentMethod, PaymentStatus, GatewayProvider } from '@shortcart-v3/utils';

// Interfaces base para gateways
export interface PaymentRequest {
  externalId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customer: CustomerData;
  product: ProductData;
  metadata?: Record<string, unknown>;
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface CustomerData {
  email: string;
  name: string;
  phone?: string;
  document?: string;
  address?: AddressData;
}

export interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  type: 'digital' | 'physical';
}

export interface PaymentResponse {
  id: string;
  externalId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  gatewayPaymentId?: string;
  paymentUrl?: string;
  qrCode?: string;
  barcode?: string;
  expiresAt?: Date;
  paidAt?: Date;
  gatewayResponse?: Record<string, unknown>;
  fees?: {
    gateway: number;
    platform: number;
    total: number;
  };
}

export interface GatewayConfig {
  provider: GatewayProvider;
  name: string;
  isActive: boolean;
  priority: number;
  config: Record<string, unknown>;
}

export interface GatewayCredentials {
  apiKey: string;
  secretKey?: string;
  publicKey?: string;
  environment: 'sandbox' | 'production';
  [key: string]: unknown;
}

export interface WebhookData {
  event: string;
  paymentId: string;
  status: PaymentStatus;
  amount?: number;
  paidAt?: Date;
  gatewayData: Record<string, unknown>;
}

// Interface principal do gateway
export interface PaymentGateway {
  readonly provider: GatewayProvider;
  readonly name: string;
  
  // Configuração
  configure(credentials: GatewayCredentials): void;
  isConfigured(): boolean;
  validateConfig(): boolean;
  
  // Health check
  isHealthy(): Promise<boolean>;
  
  // Métodos de pagamento suportados
  getSupportedMethods(): PaymentMethod[];
  supportsMethod(method: PaymentMethod): boolean;
  
  // Processamento de pagamentos
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentResponse>;
  cancelPayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;
  
  // Webhooks
  validateWebhook(payload: string, signature: string, secret: string): boolean;
  parseWebhook(payload: string): WebhookData;
  
  // Taxas e limites
  calculateFees(amount: number, method: PaymentMethod): Promise<number>;
  getPaymentLimits(method: PaymentMethod): Promise<{ min: number; max: number }>;
}

// Interface para factory de gateways
export interface GatewayFactory {
  createGateway(provider: GatewayProvider, config: GatewayConfig): PaymentGateway;
  getSupportedProviders(): GatewayProvider[];
}

// Interface para gerenciador de gateways
export interface GatewayManager {
  addGateway(gateway: PaymentGateway, config: GatewayConfig): void;
  removeGateway(provider: GatewayProvider): void;
  getGateway(provider: GatewayProvider): PaymentGateway | undefined;
  getActiveGateways(): PaymentGateway[];
  getGatewaysByPriority(): PaymentGateway[];
  
  // Processamento com fallback
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  processPaymentWithFallback(request: PaymentRequest, excludeProviders?: GatewayProvider[]): Promise<PaymentResponse>;
  
  // Health checks
  checkGatewaysHealth(): Promise<Record<GatewayProvider, boolean>>;
}

