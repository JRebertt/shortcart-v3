import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { EmailProvider, EmailData, NotificationResult } from '../interfaces';
import { NotificationType } from '@shortcart-v3/utils';

export class SendGridEmailProvider implements EmailProvider {
  public readonly type = NotificationType.EMAIL;
  public readonly name = 'SendGrid';
  
  private transporter?: Transporter;
  private isConfiguredFlag = false;
  private config?: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  };

  configure(config: Record<string, unknown>): void {
    this.config = config as any;
    
    this.transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: this.config.apiKey,
      },
    });
    
    this.isConfiguredFlag = true;
  }

  isConfigured(): boolean {
    return this.isConfiguredFlag && !!this.transporter;
  }

  validateConfig(): boolean {
    return !!(this.config?.apiKey && this.config?.fromEmail);
  }

  async send(data: EmailData): Promise<NotificationResult> {
    if (!this.isConfigured() || !this.transporter) {
      throw new Error('Provider não configurado');
    }

    try {
      const mailOptions: SendMailOptions = {
        from: data.from || `${this.config?.fromName || 'CheckoutSaaS'} <${this.config?.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        text: data.content,
        html: data.html || data.content,
        replyTo: data.replyTo,
        attachments: data.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        provider: this.name,
        timestamp: new Date(),
        metadata: {
          response: result.response,
          envelope: result.envelope,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(data: EmailData[]): Promise<NotificationResult[]> {
    const promises = data.map(email => this.send(email));
    return Promise.all(promises);
  }
}

export class ResendEmailProvider implements EmailProvider {
  public readonly type = NotificationType.EMAIL;
  public readonly name = 'Resend';
  
  private isConfiguredFlag = false;
  private config?: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  };

  configure(config: Record<string, unknown>): void {
    this.config = config as any;
    this.isConfiguredFlag = true;
  }

  isConfigured(): boolean {
    return this.isConfiguredFlag;
  }

  validateConfig(): boolean {
    return !!(this.config?.apiKey && this.config?.fromEmail);
  }

  async send(data: EmailData): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      throw new Error('Provider não configurado');
    }

    try {
      // Implementar integração com Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config?.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: data.from || `${this.config?.fromName || 'CheckoutSaaS'} <${this.config?.fromEmail}>`,
          to: [data.to],
          subject: data.subject,
          html: data.html || data.content,
          text: data.content,
          reply_to: data.replyTo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao enviar email');
      }

      return {
        success: true,
        messageId: result.id,
        provider: this.name,
        timestamp: new Date(),
        metadata: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(data: EmailData[]): Promise<NotificationResult[]> {
    const promises = data.map(email => this.send(email));
    return Promise.all(promises);
  }
}

