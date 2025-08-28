export class CreateOrderDto {
  orderId?: string;
  cylinderSize: string;
  quantity: number;
  refillAmount: number;
  deliveryFee: number;
  totalAmount: number;
  pickupAddress?: string;
  dropOffAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  paymentMethod?: string;
  notes?: string;
  status?: string; // e.g. pending, confirmed, delivered, cancelled
  scheduledDate?: Date;
  scheduledTime?: string;
  updatedAt?: Date;
}
