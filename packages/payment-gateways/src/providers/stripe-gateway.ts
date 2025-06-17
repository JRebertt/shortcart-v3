import axios, { AxiosInstance } from 'axios';
import { PaymentGateway, PaymentRequest, PaymentResponse, GatewayCredentials, WebhookData } from '../interfaces';
import { PaymentMethod, PaymentStatus, GatewayProvider } from '@shortcart-v3/utils';

export class StripeGateway implements PaymentGateway {
  public readonly provider = GatewayProvider.STRIPE;
  public readonly name = 'Stripe';
  
  private apiClient: AxiosInstance;
  private credentials?: GatewayCredentials;
  private isConfiguredFlag = false;

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.stripe.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  configure(credentials: GatewayCredentials): void {
    this.credentials = credentials;
    this.isConfiguredFlag = true;
    
    this.apiClient.defaults.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
  }

  isConfigured(): boolean {
    return this.isConfiguredFlag && !!this.credentials;
  }

  validateConfig(): boolean {
    if (!this.credentials) return false;
    return !!this.credentials.apiKey;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    
    try {
      await this.apiClient.get('/account', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.PIX, // Via Stripe Brasil
    ];
  }

  supportsMethod(method: PaymentMethod): boolean {
    return this.getSupportedMethods().includes(method);
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    try {
      // Criar Payment Intent
      const paymentIntent = await this.createPaymentIntent(request);
      
      return this.mapPaymentResponse(paymentIntent, request);
    } catch (error: any) {
      throw new Error(`Erro ao criar pagamento: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    try {
      const response = await this.apiClient.get(`/payment_intents/${paymentId}`);
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`Erro ao consultar pagamento: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      await this.apiClient.post(`/payment_intents/${paymentId}/cancel`);
      return true;
    } catch {
      return false;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      const payload = new URLSearchParams();
      payload.append('payment_intent', paymentId);
      if (amount) payload.append('amount', amount.toString());
      
      await this.apiClient.post('/refunds', payload);
      return true;
    } catch {
      return false;
    }
  }

  validateWebhook(payload: string, signature: string, secret: string): boolean {
    // Implementar validação de webhook do Stripe
    return true; // Simplificado para exemplo
  }

  parseWebhook(payload: string): WebhookData {
    const data = JSON.parse(payload);
    
    return {
      event: data.type,
      paymentId: data.data.object.id,
      status: this.mapStatus(data.data.object.status),
      gatewayData: data,
    };
  }

  async calculateFees(amount: number, method: PaymentMethod): Promise<number> {
    // Taxas do Stripe Brasil
    const feeRates = {
      [PaymentMethod.CREDIT_CARD]: 0.0399, // 3.99%
      [PaymentMethod.DEBIT_CARD]: 0.0199, // 1.99%
      [PaymentMethod.PIX]: 0.0099, // 0.99%
    };

    const rate = feeRates[method] || 0.0399;
    return Math.round(amount * rate);
  }

  async getPaymentLimits(method: PaymentMethod): Promise<{ min: number; max: number }> {
    return { min: 50, max: 99999999 }; // R$ 0,50 a R$ 999.999,99
  }

  private async createPaymentIntent(request: PaymentRequest): Promise<any> {
    const payload = new URLSearchParams();
    payload.append('amount', request.amount.toString());
    payload.append('currency', request.currency.toLowerCase());
    payload.append('payment_method_types[]', this.mapPaymentMethod(request.method));
    
    if (request.customer.email) {
      payload.append('receipt_email', request.customer.email);
    }
    
    payload.append('metadata[external_id]', request.externalId);
    payload.append('metadata[customer_name]', request.customer.name);
    
    const response = await this.apiClient.post('/payment_intents', payload);
    return response.data;
  }

  private mapPaymentResponse(data: any, request?: PaymentRequest): PaymentResponse {
    return {
      id: data.id,
      externalId: data.metadata?.external_id || request?.externalId || '',
      status: this.mapStatus(data.status),
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      method: request?.method || PaymentMethod.CREDIT_CARD,
      gatewayPaymentId: data.id,
      paymentUrl: data.next_action?.redirect_to_url?.url,
      gatewayResponse: data,
    };
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    const methodMap = {
      [PaymentMethod.CREDIT_CARD]: 'card',
      [PaymentMethod.DEBIT_CARD]: 'card',
      [PaymentMethod.PIX]: 'pix',
    };

    return methodMap[method] || 'card';
  }

  private mapStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.APPROVED,
      canceled: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }
}

