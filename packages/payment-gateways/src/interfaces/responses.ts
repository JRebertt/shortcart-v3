import { PaymentMethod, PaymentStatus } from '@shortcart-v3/utils';

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
