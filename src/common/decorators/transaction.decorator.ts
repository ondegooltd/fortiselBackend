import { SetMetadata } from '@nestjs/common';

export const TRANSACTION_KEY = 'transaction';

/**
 * Decorator to mark methods that require database transactions
 * @param options Transaction configuration options
 */
export const Transaction = (options?: {
  isolationLevel?:
    | 'read-uncommitted'
    | 'read-committed'
    | 'repeatable-read'
    | 'serializable';
  timeout?: number;
  retries?: number;
}) => SetMetadata(TRANSACTION_KEY, options || {});

/**
 * Decorator to mark methods that should be executed within a transaction
 * but don't require transaction isolation
 */
export const Transactional = () =>
  SetMetadata(TRANSACTION_KEY, { transactional: true });
