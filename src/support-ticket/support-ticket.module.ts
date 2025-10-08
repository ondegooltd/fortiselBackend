import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportTicket, SupportTicketSchema } from './support-ticket.schema';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportTicketModule {}
