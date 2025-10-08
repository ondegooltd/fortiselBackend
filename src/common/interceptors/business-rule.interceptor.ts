import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { BusinessRuleValidator } from '../validators/business-rule.validator';
import { BUSINESS_RULE_KEY } from '../decorators/business-rule.decorator';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class BusinessRuleInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BusinessRuleInterceptor.name);

  constructor(
    private readonly businessRuleValidator: BusinessRuleValidator,
    private readonly reflector: Reflector,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const businessRules = this.reflector.getAllAndOverride(BUSINESS_RULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!businessRules || businessRules.length === 0) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    this.loggerService.log(
      `Validating business rules for ${className}.${methodName}`,
      {
        method: methodName,
        class: className,
        rules: businessRules,
        type: 'business_rule_interceptor_start',
      },
    );

    return next.handle().pipe(
      switchMap(async (result) => {
        // Validate business rules based on the method and data
        const validationResult = await this.validateBusinessRules(
          businessRules,
          request,
          result,
        );

        if (!validationResult.isValid) {
          this.loggerService.log(
            `Business rule validation failed for ${className}.${methodName}`,
            {
              method: methodName,
              class: className,
              violations: validationResult.violations,
              type: 'business_rule_validation_failure',
            },
          );

          throw new BadRequestException({
            message: 'Business rule validation failed',
            violations: validationResult.violations,
            warnings: validationResult.warnings,
          });
        }

        if (validationResult.warnings && validationResult.warnings.length > 0) {
          this.loggerService.log(
            `Business rule warnings for ${className}.${methodName}`,
            {
              method: methodName,
              class: className,
              warnings: validationResult.warnings,
              type: 'business_rule_validation_warning',
            },
          );
        }

        return result;
      }),
      catchError((error) => {
        this.loggerService.logError(error, {
          method: methodName,
          class: className,
          type: 'business_rule_interceptor_error',
        });
        throw error;
      }),
    );
  }

  private async validateBusinessRules(
    rules: string[],
    request: any,
    result: any,
  ): Promise<{ isValid: boolean; violations: string[]; warnings?: string[] }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      for (const rule of rules) {
        switch (rule) {
          case 'order':
            if (request.body && request.body.cylinderSize) {
              const orderValidation =
                await this.businessRuleValidator.validateOrderCreation({
                  userId: request.body.userId || request.user?.userId,
                  orderId: request.body.orderId,
                  cylinderSize: request.body.cylinderSize,
                  quantity: request.body.quantity || 1,
                  scheduledDate: new Date(request.body.scheduledDate),
                  deliveryAddress: request.body.deliveryAddress,
                });

              violations.push(...orderValidation.violations);
              if (orderValidation.warnings) {
                warnings.push(...orderValidation.warnings);
              }
            }
            break;

          case 'payment':
            if (request.body && request.body.orderId) {
              const paymentValidation =
                await this.businessRuleValidator.validatePayment({
                  orderId: request.body.orderId,
                  amount: request.body.amount,
                  paymentMethod: request.body.paymentMethod,
                  userId: request.body.userId || request.user?.userId,
                });

              violations.push(...paymentValidation.violations);
              if (paymentValidation.warnings) {
                warnings.push(...paymentValidation.warnings);
              }
            }
            break;

          case 'user':
            if (request.body && request.body.email) {
              const userValidation =
                await this.businessRuleValidator.validateUserRegistration({
                  email: request.body.email,
                  phone: request.body.phone,
                  name: request.body.name,
                });

              violations.push(...userValidation.violations);
              if (userValidation.warnings) {
                warnings.push(...userValidation.warnings);
              }
            }
            break;

          default:
            this.loggerService.log(`Unknown business rule: ${rule}`, {
              rule,
              type: 'business_rule_unknown',
            });
            break;
        }
      }

      return {
        isValid: violations.length === 0,
        violations,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.loggerService.logError(error as Error, {
        rules,
        type: 'business_rule_validation_error',
      });

      return {
        isValid: false,
        violations: ['Business rule validation error occurred'],
      };
    }
  }
}
