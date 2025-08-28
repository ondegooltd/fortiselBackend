import { SupportTicketStatus } from '../support-ticket.schema';

export class SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  orderId?: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: Date;
} 