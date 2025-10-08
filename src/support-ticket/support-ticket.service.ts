import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SupportTicket,
  SupportTicketDocument,
  SupportTicketStatus,
} from './support-ticket.schema';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async create(
    createSupportTicketDto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    const { ticketId, ...rest } = createSupportTicketDto;
    const generatedTicketId =
      ticketId ||
      `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const createdTicket = new this.ticketModel({
      ...rest,
      ticketId: generatedTicketId,
    });
    return createdTicket.save();
  }

  async findAll(): Promise<SupportTicket[]> {
    return this.ticketModel.find().exec();
  }

  async findOne(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return ticket;
  }

  async update(
    id: string,
    updateDto: UpdateSupportTicketDto,
  ): Promise<SupportTicket> {
    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!updatedTicket) {
      throw new NotFoundException('Support ticket not found');
    }
    return updatedTicket;
  }

  async remove(id: string): Promise<void> {
    const result = await this.ticketModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Support ticket not found');
    }
  }
}
