import { PaymentStatus, PaymentProvider, PaymentMethod } from '../payment.schema';

export class Payment {
  id: string;
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider; // 'paystack' for electronic, 'cash' for offline
  paymentMethod: PaymentMethod;
  providerReference?: string;
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  processedAt?: Date;
  webhookData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
} 