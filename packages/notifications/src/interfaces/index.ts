import { NotificationType, WebhookEvent } from '@shortcart-v3/utils';

// Interfaces para notificações
export interface NotificationData {
  to: string;
  subject?: string;
  content: string;
  templateId?: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EmailData extends NotificationData {
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  html?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SMSData extends NotificationData {
  from?: string;
}

export interface WebhookData {
  url: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  secret?: string;
  retries?: number;
}

export interface PushNotificationData extends NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

// Interfaces dos providers
export interface NotificationProvider {
  readonly type: NotificationType;
  readonly name: string;
  
  configure(config: Record<string, unknown>): void;
  isConfigured(): boolean;
  validateConfig(): boolean;
  
  send(data: NotificationData): Promise<NotificationResult>;
  sendBatch(data: NotificationData[]): Promise<NotificationResult[]>;
}

export interface EmailProvider extends NotificationProvider {
  readonly type: NotificationType.EMAIL;
  send(data: EmailData): Promise<NotificationResult>;
  sendBatch(data: EmailData[]): Promise<NotificationResult[]>;
}

export interface SMSProvider extends NotificationProvider {
  readonly type: NotificationType.SMS;
  send(data: SMSData): Promise<NotificationResult>;
  sendBatch(data: SMSData[]): Promise<NotificationResult[]>;
}

export interface WebhookProvider {
  send(data: WebhookData): Promise<WebhookResult>;
  sendBatch(data: WebhookData[]): Promise<WebhookResult[]>;
  validateSignature(payload: string, signature: string, secret: string): boolean;
}

export interface PushProvider extends NotificationProvider {
  readonly type: NotificationType.PUSH;
  send(data: PushNotificationData): Promise<NotificationResult>;
  sendBatch(data: PushNotificationData[]): Promise<NotificationResult[]>;
}

// Resultados
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  timestamp: Date;
  retryCount?: number;
}

// Templates
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  event: WebhookEvent;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  organizationId: string;
}

export interface TemplateEngine {
  render(template: string, variables: Record<string, unknown>): string;
  validate(template: string): boolean;
  extractVariables(template: string): string[];
}

// Serviços
export interface NotificationService {
  sendEmail(data: EmailData): Promise<NotificationResult>;
  sendSMS(data: SMSData): Promise<NotificationResult>;
  sendWebhook(data: WebhookData): Promise<WebhookResult>;
  sendPush(data: PushNotificationData): Promise<NotificationResult>;
  
  sendFromTemplate(
    templateId: string, 
    to: string, 
    variables: Record<string, unknown>
  ): Promise<NotificationResult>;
  
  sendEventNotification(
    organizationId: string,
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<NotificationResult[]>;
}

export interface WebhookService {
  sendWebhook(data: WebhookData): Promise<WebhookResult>;
  sendWebhookWithRetry(data: WebhookData, maxRetries?: number): Promise<WebhookResult>;
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean;
  
  triggerOrganizationWebhooks(
    organizationId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<WebhookResult[]>;
}

