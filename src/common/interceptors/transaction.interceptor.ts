import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TransactionService } from '../services/transaction.service';
import { TRANSACTION_KEY } from '../decorators/transaction.decorator';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly reflector: Reflector,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const transactionOptions = this.reflector.getAllAndOverride(
      TRANSACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!transactionOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    this.loggerService.log(
      `Starting transaction for ${className}.${methodName}`,
      {
        method: methodName,
        class: className,
        type: 'transaction_interceptor_start',
      },
    );

    return next.handle().pipe(
      tap((result) => {
        this.loggerService.log(
          `Transaction completed successfully for ${className}.${methodName}`,
          {
            method: methodName,
            class: className,
            type: 'transaction_interceptor_success',
          },
        );
      }),
      catchError((error) => {
        this.loggerService.logError(error, {
          method: methodName,
          class: className,
          type: 'transaction_interceptor_error',
        });
        throw error;
      }),
    );
  }
}
