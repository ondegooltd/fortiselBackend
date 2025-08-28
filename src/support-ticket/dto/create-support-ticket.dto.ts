import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SupportTicketStatus } from '../support-ticket.schema';

export class CreateSupportTicketDto {
  @IsString()
  @IsOptional()
  ticketId?: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  message: string;

  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;

  @IsOptional()
  createdAt?: Date;
} 