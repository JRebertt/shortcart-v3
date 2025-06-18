"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendEmailProvider = exports.SendGridEmailProvider = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const utils_1 = require("@shortcart-v3/utils");
class SendGridEmailProvider {
    type = utils_1.NotificationType.EMAIL;
    name = 'SendGrid';
    transporter;
    isConfiguredFlag = false;
    config;
    configure(config) {
        this.config = config;
        this.transporter = nodemailer_1.default.createTransport({
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
    isConfigured() {
        return this.isConfiguredFlag && !!this.transporter;
    }
    validateConfig() {
        return !!(this.config?.apiKey && this.config?.fromEmail);
    }
    async send(data) {
        if (!this.isConfigured() || !this.transporter) {
            throw new Error('Provider não configurado');
        }
        try {
            const mailOptions = {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: this.name,
                timestamp: new Date(),
            };
        }
    }
    async sendBatch(data) {
        const promises = data.map(email => this.send(email));
        return Promise.all(promises);
    }
}
exports.SendGridEmailProvider = SendGridEmailProvider;
class ResendEmailProvider {
    type = utils_1.NotificationType.EMAIL;
    name = 'Resend';
    isConfiguredFlag = false;
    config;
    configure(config) {
        this.config = config;
        this.isConfiguredFlag = true;
    }
    isConfigured() {
        return this.isConfiguredFlag;
    }
    validateConfig() {
        return !!(this.config?.apiKey && this.config?.fromEmail);
    }
    async send(data) {
        if (!this.isConfigured()) {
            throw new Error('Provider não configurado');
        }
        try {
            // Implementar integração com Resend API
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: data.from || `${this.config?.fromName || 'CheckoutSaaS'} <${this.config.fromEmail}>`,
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: this.name,
                timestamp: new Date(),
            };
        }
    }
    async sendBatch(data) {
        const promises = data.map(email => this.send(email));
        return Promise.all(promises);
    }
}
exports.ResendEmailProvider = ResendEmailProvider;
