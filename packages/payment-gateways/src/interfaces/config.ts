import { PaymentStatus, GatewayProvider } from '@shortcart-v3/utils';

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
