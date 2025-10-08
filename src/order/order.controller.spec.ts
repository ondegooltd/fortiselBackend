import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TransactionService } from '../common/services/transaction.service';
import { BusinessRuleValidator } from '../common/validators/business-rule.validator';
import { LoggerService } from '../common/services/logger.service';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        {
          provide: getModelToken('Order'),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            countDocuments: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            executeTransaction: jest.fn(),
            executeBatchTransaction: jest.fn(),
            executeWithRetry: jest.fn(),
          },
        },
        {
          provide: BusinessRuleValidator,
          useValue: {
            validateOrderCreation: jest.fn(),
            validatePayment: jest.fn(),
            validateUserRegistration: jest.fn(),
            validateOrderCancellation: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
