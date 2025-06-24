import { GatewayProvider } from '@shortcart-v3/utils';
import { PaymentGateway } from './gateway';
import { GatewayConfig } from './config';
import { PaymentRequest } from './requests';
import { PaymentResponse } from './responses';

export interface GatewayManager {
  addGateway(gateway: PaymentGateway, config: GatewayConfig): void;
  removeGateway(provider: GatewayProvider): void;
  getGateway(provider: GatewayProvider): PaymentGateway | undefined;
  getActiveGateways(): PaymentGateway[];
  getGatewaysByPriority(): PaymentGateway[];

  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  processPaymentWithFallback(
    request: PaymentRequest,
    excludeProviders?: GatewayProvider[]
  ): Promise<PaymentResponse>;

  checkGatewaysHealth(): Promise<Record<GatewayProvider, boolean>>;
}
