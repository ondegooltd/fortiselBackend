import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { LoggerService } from './logger.service';

export interface TransactionOptions {
  isolationLevel?:
    | 'read-uncommitted'
    | 'read-committed'
    | 'repeatable-read'
    | 'serializable';
  timeout?: number;
  retries?: number;
}

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  session?: ClientSession;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Execute a function within a database transaction
   * @param operation Function to execute within transaction
   * @param options Transaction options
   * @returns Transaction result
   */
  async executeTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<T>> {
    const { timeout = 30000, retries = 3 } = options;

    let lastError: Error | undefined;
    let session: ClientSession | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      session = await this.connection.startSession();

      try {
        this.loggerService.log(
          `Starting transaction (attempt ${attempt}/${retries})`,
          {
            attempt,
            maxRetries: retries,
            type: 'transaction_start',
          },
        );

        const result = await session.withTransaction(
          async () => {
            return await operation(session!);
          },
          {
            readPreference: 'primary',
            readConcern: { level: 'majority' },
            writeConcern: { w: 'majority' },
            maxTimeMS: timeout,
          },
        );

        this.loggerService.log('Transaction completed successfully', {
          attempt,
          type: 'transaction_success',
        });

        return {
          success: true,
          data: result,
          session,
        };
      } catch (error) {
        lastError = error as Error;

        this.loggerService.logError(lastError, {
          attempt,
          maxRetries: retries,
          type: 'transaction_error',
        });

        if (attempt === retries) {
          this.loggerService.log('Transaction failed after all retries', {
            attempts: retries,
            error: lastError.message,
            type: 'transaction_failure',
          });
        }
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * Execute multiple operations in a single transaction
   * @param operations Array of operations to execute
   * @param options Transaction options
   * @returns Transaction result
   */
  async executeBatchTransaction<T>(
    operations: Array<(session: ClientSession) => Promise<T>>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<T[]>> {
    return this.executeTransaction(async (session) => {
      const results: T[] = [];

      for (const operation of operations) {
        const result = await operation(session);
        results.push(result);
      }

      return results;
    }, options);
  }

  /**
   * Execute a function with retry logic on transaction failure
   * @param operation Function to execute
   * @param options Transaction and retry options
   * @returns Transaction result
   */
  async executeWithRetry<T>(
    operation: (session: ClientSession) => Promise<T>,
    options: TransactionOptions & {
      retryDelay?: number;
      backoffMultiplier?: number;
      maxRetryDelay?: number;
    } = {},
  ): Promise<TransactionResult<T>> {
    const {
      retries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      maxRetryDelay = 10000,
    } = options;

    let lastError: Error | undefined;
    let currentDelay = retryDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const result = await this.executeTransaction(operation, {
        ...options,
        retries: 1, // Don't retry within the transaction itself
      });

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < retries) {
        this.loggerService.log(
          `Transaction failed, retrying in ${currentDelay}ms`,
          {
            attempt,
            maxRetries: retries,
            retryDelay: currentDelay,
            type: 'transaction_retry',
          },
        );

        await this.delay(currentDelay);
        currentDelay = Math.min(
          currentDelay * backoffMultiplier,
          maxRetryDelay,
        );
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * Check if a session is active
   * @param session MongoDB session
   * @returns boolean indicating if session is active
   */
  isSessionActive(session: ClientSession): boolean {
    return session && !session.hasEnded;
  }

  /**
   * Get transaction statistics
   * @returns Transaction statistics
   */
  getTransactionStats(): {
    activeSessions: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
  } {
    // This is a simplified implementation
    // In production, you might want to track these metrics more comprehensively
    return {
      activeSessions: 0, // Would need to track active sessions
      totalTransactions: 0, // Would need to track transaction counts
      successfulTransactions: 0,
      failedTransactions: 0,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
