import { GatewayProvider } from '@shortcart-v3/utils';
import { PaymentGateway } from './gateway';
import { GatewayConfig } from './config';

export interface GatewayFactory {
  createGateway(provider: GatewayProvider, config: GatewayConfig): PaymentGateway;
  getSupportedProviders(): GatewayProvider[];
}
