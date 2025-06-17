import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { WebhookProvider, WebhookData, WebhookResult } from '../interfaces';

export class HttpWebhookProvider implements WebhookProvider {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CheckoutSaaS-Webhook/1.0',
      },
    });
  }

  async send(data: WebhookData): Promise<WebhookResult> {
    const startTime = Date.now();
    
    try {
      const payload = JSON.stringify(data.payload);
      const headers = { ...data.headers };
      
      // Adicionar assinatura se secret fornecido
      if (data.secret) {
        const signature = this.generateSignature(payload, data.secret);
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Timestamp'] = Math.floor(Date.now() / 1000).toString();
      }

      const response = await this.httpClient.post(data.url, data.payload, {
        headers,
        timeout: 30000,
      });

      return {
        success: true,
        statusCode: response.status,
        response: JSON.stringify(response.data),
        timestamp: new Date(startTime),
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message,
        response: error.response?.data ? JSON.stringify(error.response.data) : undefined,
        timestamp: new Date(startTime),
      };
    }
  }

  async sendBatch(data: WebhookData[]): Promise<WebhookResult[]> {
    const promises = data.map(webhook => this.send(webhook));
    return Promise.all(promises);
  }

  validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload, secret);
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}

export class WebhookRetryProvider {
  private webhookProvider: WebhookProvider;
  private maxRetries: number;
  private retryDelays: number[];

  constructor(
    webhookProvider: WebhookProvider,
    maxRetries = 3,
    retryDelays = [1000, 5000, 15000] // 1s, 5s, 15s
  ) {
    this.webhookProvider = webhookProvider;
    this.maxRetries = maxRetries;
    this.retryDelays = retryDelays;
  }

  async sendWithRetry(data: WebhookData): Promise<WebhookResult> {
    let lastResult: WebhookResult;
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.webhookProvider.send(data);
        
        // Sucesso ou erro não recuperável
        if (result.success || !this.shouldRetry(result.statusCode)) {
          return {
            ...result,
            retryCount,
          };
        }

        lastResult = result;
        retryCount++;

        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
          await this.sleep(delay);
        }
      } catch (error: any) {
        lastResult = {
          success: false,
          error: error.message,
          timestamp: new Date(),
          retryCount,
        };
      }
    }

    return {
      ...lastResult!,
      retryCount,
    };
  }

  private shouldRetry(statusCode?: number): boolean {
    if (!statusCode) return true;
    
    // Retry em erros 5xx e alguns 4xx específicos
    return statusCode >= 500 || statusCode === 408 || statusCode === 429;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

