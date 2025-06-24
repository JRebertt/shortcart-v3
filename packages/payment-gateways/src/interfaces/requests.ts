import { PaymentMethod } from '@shortcart-v3/utils';

export interface PaymentRequest {
  externalId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customer: CustomerData;
  product: ProductData;
  metadata?: Record<string, unknown>;
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface CustomerData {
  email: string;
  name: string;
  phone?: string;
  document?: string;
  address?: AddressData;
}

export interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  type: 'digital' | 'physical';
}
