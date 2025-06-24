import { PaymentMethod, GatewayProvider } from '@shortcart-v3/utils';
import { GatewayCredentials, WebhookData } from './config';
import { PaymentRequest } from './requests';
import { PaymentResponse } from './responses';

export interface PaymentGateway {
  readonly provider: GatewayProvider;
  readonly name: string;

  configure(credentials: GatewayCredentials): void;
  isConfigured(): boolean;
  validateConfig(): boolean;

  isHealthy(): Promise<boolean>;

  getSupportedMethods(): PaymentMethod[];
  supportsMethod(method: PaymentMethod): boolean;

  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentResponse>;
  cancelPayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;

  validateWebhook(payload: string, signature: string, secret: string): boolean;
  parseWebhook(payload: string): WebhookData;

  calculateFees(amount: number, method: PaymentMethod): Promise<number>;
  getPaymentLimits(method: PaymentMethod): Promise<{ min: number; max: number }>;
}
