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
  private activeSessions: Set<ClientSession> = new Set();
  private transactionStats = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalRetries: 0,
    averageDuration: 0,
    durations: [] as number[],
  };

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
    const startTime = Date.now();

    // Update statistics
    this.transactionStats.totalTransactions++;

    let lastError: Error | undefined;
    let session: ClientSession | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (attempt > 1) {
        this.transactionStats.totalRetries++;
      }

      session = await this.connection.startSession();
      this.activeSessions.add(session);

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

        const duration = Date.now() - startTime;
        this.recordSuccessfulTransaction(duration);

        this.loggerService.log('Transaction completed successfully', {
          attempt,
          duration,
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
          const duration = Date.now() - startTime;
          this.recordFailedTransaction(duration);

          this.loggerService.log('Transaction failed after all retries', {
            attempts: retries,
            error: lastError.message,
            duration,
            type: 'transaction_failure',
          });
        }
      } finally {
        if (session) {
          this.activeSessions.delete(session);
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
    totalRetries: number;
    averageDuration: number;
    successRate: number;
    failureRate: number;
  } {
    const successRate =
      this.transactionStats.totalTransactions > 0
        ? (this.transactionStats.successfulTransactions /
            this.transactionStats.totalTransactions) *
          100
        : 0;

    const failureRate =
      this.transactionStats.totalTransactions > 0
        ? (this.transactionStats.failedTransactions /
            this.transactionStats.totalTransactions) *
          100
        : 0;

    return {
      activeSessions: this.activeSessions.size,
      totalTransactions: this.transactionStats.totalTransactions,
      successfulTransactions: this.transactionStats.successfulTransactions,
      failedTransactions: this.transactionStats.failedTransactions,
      totalRetries: this.transactionStats.totalRetries,
      averageDuration: Math.round(this.transactionStats.averageDuration),
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
    };
  }

  /**
   * Record a successful transaction
   */
  private recordSuccessfulTransaction(duration: number): void {
    this.transactionStats.successfulTransactions++;
    this.updateAverageDuration(duration);
  }

  /**
   * Record a failed transaction
   */
  private recordFailedTransaction(duration: number): void {
    this.transactionStats.failedTransactions++;
    this.updateAverageDuration(duration);
  }

  /**
   * Update average duration (keeping last 1000 durations for calculation)
   */
  private updateAverageDuration(duration: number): void {
    this.transactionStats.durations.push(duration);

    // Keep only last 1000 durations to prevent memory issues
    if (this.transactionStats.durations.length > 1000) {
      this.transactionStats.durations.shift();
    }

    // Calculate average
    const sum = this.transactionStats.durations.reduce((acc, d) => acc + d, 0);
    this.transactionStats.averageDuration =
      sum / this.transactionStats.durations.length;
  }

  /**
   * Reset transaction statistics
   */
  resetStats(): void {
    this.transactionStats = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalRetries: 0,
      averageDuration: 0,
      durations: [],
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
