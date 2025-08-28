import { DeliveryStatus } from '../delivery.schema';

export class Delivery {
  id: string;
  deliveryId: string;
  orderId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickupAddress: string;
  dropOffAddress: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  driverNotes?: string;
  customerNotes?: string;
  trackingNumber?: string;
  deliveryFee: number;
  distance?: number;
  coordinates?: {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
  };
  createdAt: Date;
  updatedAt: Date;
} 