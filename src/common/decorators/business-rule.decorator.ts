import { SetMetadata } from '@nestjs/common';

export const BUSINESS_RULE_KEY = 'business_rule';

/**
 * Decorator to mark methods that require business rule validation
 * @param rules Array of business rules to validate
 */
export const BusinessRule = (rules: string[]) =>
  SetMetadata(BUSINESS_RULE_KEY, rules);

/**
 * Decorator to mark methods that require order validation
 */
export const ValidateOrder = () => SetMetadata(BUSINESS_RULE_KEY, ['order']);

/**
 * Decorator to mark methods that require payment validation
 */
export const ValidatePayment = () =>
  SetMetadata(BUSINESS_RULE_KEY, ['payment']);

/**
 * Decorator to mark methods that require user validation
 */
export const ValidateUser = () => SetMetadata(BUSINESS_RULE_KEY, ['user']);
