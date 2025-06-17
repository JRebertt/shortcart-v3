import { pgEnum } from 'drizzle-orm/pg-core';

// Enums relacionados a pagamentos e gateways
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'approved', 'rejected', 'cancelled', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['pix', 'credit_card', 'debit_card', 'boleto', 'bank_transfer']);
export const gatewayProviderEnum = pgEnum('gateway_provider', ['stripe', 'mercado_pago', 'pagarme', 'asaas', 'mangofy']);

