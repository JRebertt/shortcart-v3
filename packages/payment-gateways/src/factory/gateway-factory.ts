import { PaymentGateway, GatewayFactory, GatewayConfig } from '../interfaces';
import { GatewayProvider } from '@shortcart-v3/utils';
import { MangofyGateway } from '../providers/mangofy-gateway';
import { StripeGateway } from '../providers/stripe-gateway';

export class PaymentGatewayFactory implements GatewayFactory {
  createGateway(provider: GatewayProvider, config: GatewayConfig): PaymentGateway {
    let gateway: PaymentGateway;

    switch (provider) {
      case GatewayProvider.MANGOFY:
        gateway = new MangofyGateway();
        break;
      
      case GatewayProvider.STRIPE:
        gateway = new StripeGateway();
        break;
      
      case GatewayProvider.MERCADO_PAGO:
        // gateway = new MercadoPagoGateway();
        throw new Error('MercadoPago gateway não implementado ainda');
      
      case GatewayProvider.PAGARME:
        // gateway = new PagarmeGateway();
        throw new Error('Pagar.me gateway não implementado ainda');
      
      case GatewayProvider.ASAAS:
        // gateway = new AsaasGateway();
        throw new Error('Asaas gateway não implementado ainda');
      
      default:
        throw new Error(`Gateway provider ${provider} não suportado`);
    }

    // Configurar o gateway
    if (config.config) {
      gateway.configure(config.config as any);
    }

    return gateway;
  }

  getSupportedProviders(): GatewayProvider[] {
    return [
      GatewayProvider.MANGOFY,
      GatewayProvider.STRIPE,
      // GatewayProvider.MERCADO_PAGO,
      // GatewayProvider.PAGARME,
      // GatewayProvider.ASAAS,
    ];
  }
}

