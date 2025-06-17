import { PaymentGateway, GatewayManager, GatewayConfig, PaymentRequest, PaymentResponse } from '../interfaces';
import { GatewayProvider } from '@shortcart-v3/utils';

export class PaymentGatewayManager implements GatewayManager {
  private gateways = new Map<GatewayProvider, { gateway: PaymentGateway; config: GatewayConfig }>();

  addGateway(gateway: PaymentGateway, config: GatewayConfig): void {
    this.gateways.set(gateway.provider, { gateway, config });
  }

  removeGateway(provider: GatewayProvider): void {
    this.gateways.delete(provider);
  }

  getGateway(provider: GatewayProvider): PaymentGateway | undefined {
    return this.gateways.get(provider)?.gateway;
  }

  getActiveGateways(): PaymentGateway[] {
    return Array.from(this.gateways.values())
      .filter(({ config }) => config.isActive)
      .map(({ gateway }) => gateway);
  }

  getGatewaysByPriority(): PaymentGateway[] {
    return Array.from(this.gateways.values())
      .filter(({ config }) => config.isActive)
      .sort((a, b) => a.config.priority - b.config.priority)
      .map(({ gateway }) => gateway);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const gateways = this.getGatewaysByPriority();
    
    if (gateways.length === 0) {
      throw new Error('Nenhum gateway de pagamento configurado');
    }

    // Tentar com o gateway de maior prioridade
    const primaryGateway = gateways[0];
    
    if (!primaryGateway.supportsMethod(request.method)) {
      throw new Error(`Método de pagamento ${request.method} não suportado`);
    }

    try {
      return await primaryGateway.createPayment(request);
    } catch (error) {
      console.error(`Erro no gateway ${primaryGateway.provider}:`, error);
      
      // Se houver outros gateways, tentar fallback
      if (gateways.length > 1) {
        return this.processPaymentWithFallback(request, [primaryGateway.provider]);
      }
      
      throw error;
    }
  }

  async processPaymentWithFallback(
    request: PaymentRequest, 
    excludeProviders: GatewayProvider[] = []
  ): Promise<PaymentResponse> {
    const availableGateways = this.getGatewaysByPriority()
      .filter(gateway => !excludeProviders.includes(gateway.provider))
      .filter(gateway => gateway.supportsMethod(request.method));

    if (availableGateways.length === 0) {
      throw new Error('Nenhum gateway disponível para processar o pagamento');
    }

    let lastError: Error | null = null;

    for (const gateway of availableGateways) {
      try {
        console.log(`Tentando processar pagamento com ${gateway.provider}...`);
        
        // Verificar se o gateway está saudável
        const isHealthy = await gateway.isHealthy();
        if (!isHealthy) {
          console.warn(`Gateway ${gateway.provider} não está saudável, pulando...`);
          continue;
        }

        const response = await gateway.createPayment(request);
        console.log(`Pagamento processado com sucesso via ${gateway.provider}`);
        
        return response;
      } catch (error: any) {
        console.error(`Erro no gateway ${gateway.provider}:`, error.message);
        lastError = error;
        
        // Continuar para o próximo gateway
        continue;
      }
    }

    // Se chegou aqui, todos os gateways falharam
    throw new Error(
      `Todos os gateways falharam. Último erro: ${lastError?.message || 'Erro desconhecido'}`
    );
  }

  async checkGatewaysHealth(): Promise<Record<GatewayProvider, boolean>> {
    const healthStatus: Record<GatewayProvider, boolean> = {} as any;
    
    const healthChecks = Array.from(this.gateways.entries()).map(async ([provider, { gateway }]) => {
      try {
        const isHealthy = await gateway.isHealthy();
        healthStatus[provider] = isHealthy;
      } catch {
        healthStatus[provider] = false;
      }
    });

    await Promise.allSettled(healthChecks);
    
    return healthStatus;
  }

  // Métodos utilitários
  getGatewayConfig(provider: GatewayProvider): GatewayConfig | undefined {
    return this.gateways.get(provider)?.config;
  }

  updateGatewayConfig(provider: GatewayProvider, config: Partial<GatewayConfig>): void {
    const existing = this.gateways.get(provider);
    if (existing) {
      existing.config = { ...existing.config, ...config };
    }
  }

  getGatewayStats(): Record<GatewayProvider, { isActive: boolean; priority: number; isHealthy?: boolean }> {
    const stats: Record<GatewayProvider, any> = {} as any;
    
    for (const [provider, { config }] of this.gateways) {
      stats[provider] = {
        isActive: config.isActive,
        priority: config.priority,
      };
    }
    
    return stats;
  }
}

