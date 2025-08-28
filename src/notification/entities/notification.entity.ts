export class Notification {
  id: string;
  notificationId: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  sent: boolean;
  meta?: any;
} 