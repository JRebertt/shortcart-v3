import axios, { AxiosInstance } from 'axios';
import { PaymentGateway, PaymentRequest, PaymentResponse, GatewayCredentials, WebhookData } from '../interfaces';
import { PaymentMethod, PaymentStatus, GatewayProvider } from '@shortcart-v3/utils';
import { createHmac } from 'crypto';

export class MangofyGateway implements PaymentGateway {
  public readonly provider = GatewayProvider.MANGOFY;
  public readonly name = 'Mangofy';
  
  private apiClient: AxiosInstance;
  private credentials?: GatewayCredentials;
  private isConfiguredFlag = false;

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://checkout.mangofy.com.br/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  configure(credentials: GatewayCredentials): void {
    this.credentials = credentials;
    this.isConfiguredFlag = true;
    
    // Configurar headers de autenticação
    this.apiClient.defaults.headers['Authorization'] = credentials.apiKey;
    this.apiClient.defaults.headers['Store-Code'] = credentials.secretKey; // Store code no Mangofy
  }

  isConfigured(): boolean {
    return this.isConfiguredFlag && !!this.credentials;
  }

  validateConfig(): boolean {
    if (!this.credentials) return false;
    return !!(this.credentials.apiKey && this.credentials.secretKey);
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    
    try {
      // Fazer uma requisição simples para testar conectividade
      await this.apiClient.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      PaymentMethod.PIX,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.BOLETO,
    ];
  }

  supportsMethod(method: PaymentMethod): boolean {
    return this.getSupportedMethods().includes(method);
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    if (!this.supportsMethod(request.method)) {
      throw new Error(`Método de pagamento ${request.method} não suportado`);
    }

    try {
      const payload = this.buildPaymentPayload(request);
      const response = await this.apiClient.post('/payment', payload);
      
      return this.mapPaymentResponse(response.data, request);
    } catch (error: any) {
      throw new Error(`Erro ao criar pagamento: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    try {
      const response = await this.apiClient.get(`/payment/${paymentId}`);
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`Erro ao consultar pagamento: ${error.response?.data?.message || error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    try {
      await this.apiClient.post(`/payment/${paymentId}/cancel`);
      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar pagamento:', error);
      return false;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Gateway não configurado');
    }

    try {
      const payload = amount ? { amount } : {};
      await this.apiClient.post(`/payment/${paymentId}/refund`, payload);
      return true;
    } catch (error: any) {
      console.error('Erro ao estornar pagamento:', error);
      return false;
    }
  }

  validateWebhook(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  parseWebhook(payload: string): WebhookData {
    try {
      const data = JSON.parse(payload);
      
      return {
        event: data.event || 'payment.updated',
        paymentId: data.payment_code || data.id,
        status: this.mapStatus(data.payment_status || data.status),
        amount: data.payment_amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        gatewayData: data,
      };
    } catch (error) {
      throw new Error('Erro ao processar webhook');
    }
  }

  async calculateFees(amount: number, method: PaymentMethod): Promise<number> {
    // Taxas aproximadas do Mangofy (podem variar)
    const feeRates = {
      [PaymentMethod.PIX]: 0.0099, // 0.99%
      [PaymentMethod.CREDIT_CARD]: 0.0349, // 3.49%
      [PaymentMethod.DEBIT_CARD]: 0.0199, // 1.99%
      [PaymentMethod.BOLETO]: 3.49, // R$ 3,49 fixo
      [PaymentMethod.BANK_TRANSFER]: 0.0099, // 0.99%
    };

    const rate = feeRates[method] || 0;
    
    if (method === PaymentMethod.BOLETO) {
      return rate * 100; // Converter para centavos
    }
    
    return Math.round(amount * rate);
  }

  async getPaymentLimits(method: PaymentMethod): Promise<{ min: number; max: number }> {
    // Limites aproximados do Mangofy
    const limits = {
      [PaymentMethod.PIX]: { min: 100, max: 10000000 }, // R$ 1,00 a R$ 100.000,00
      [PaymentMethod.CREDIT_CARD]: { min: 100, max: 10000000 },
      [PaymentMethod.DEBIT_CARD]: { min: 100, max: 10000000 },
      [PaymentMethod.BOLETO]: { min: 100, max: 10000000 },
      [PaymentMethod.BANK_TRANSFER]: { min: 100, max: 10000000 },
    };

    return limits[method] || { min: 100, max: 10000000 };
  }

  private buildPaymentPayload(request: PaymentRequest): any {
    const payload: any = {
      external_code: request.externalId,
      payment_method: this.mapPaymentMethod(request.method),
      payment_format: 'regular',
      payment_amount: request.amount,
      installments: 1,
      postback_url: request.webhookUrl,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document,
        phone: request.customer.phone,
        ip: '127.0.0.1', // TODO: Obter IP real
      },
      items: [
        {
          id: request.product.id,
          name: request.product.name,
          quantity: 1,
          price: request.amount,
        },
      ],
      metadata: {
        platform: 'shortcart-v3',
        ...request.metadata,
      },
    };

    // Configurações específicas por método
    if (request.method === PaymentMethod.PIX) {
      payload.pix = {
        expires_in_days: 1,
      };
    }

    return payload;
  }

  private mapPaymentResponse(data: any, request?: PaymentRequest): PaymentResponse {
    return {
      id: data.payment_code || data.id,
      externalId: data.external_code || request?.externalId || '',
      status: this.mapStatus(data.payment_status || data.status),
      amount: data.payment_amount || data.amount,
      currency: 'BRL',
      method: request?.method || PaymentMethod.PIX,
      gatewayPaymentId: data.payment_code || data.id,
      paymentUrl: data.payment_url,
      qrCode: data.pix?.pix_qrcode_text,
      barcode: data.boleto?.barcode,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      gatewayResponse: data,
      fees: {
        gateway: data.gateway_fee || 0,
        platform: data.platform_fee || 0,
        total: (data.gateway_fee || 0) + (data.platform_fee || 0),
      },
    };
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    const methodMap = {
      [PaymentMethod.PIX]: 'pix',
      [PaymentMethod.CREDIT_CARD]: 'credit_card',
      [PaymentMethod.DEBIT_CARD]: 'debit_card',
      [PaymentMethod.BOLETO]: 'boleto',
      [PaymentMethod.BANK_TRANSFER]: 'bank_transfer',
    };

    return methodMap[method] || 'pix';
  }

  private mapStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      approved: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }
}

