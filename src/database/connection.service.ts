import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { LoggerService } from '../common/services/logger.service';
import { DatabaseIndexes } from './indexes';

@Injectable()
export class DatabaseConnectionService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      // Set up connection event listeners
      this.setupConnectionListeners();

      // Create database indexes
      await DatabaseIndexes.createIndexes(this.connection);

      this.logger.log('Database connection initialized successfully', {
        type: 'database_init',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'database_init_error',
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.connection.close();
      this.logger.log('Database connection closed', {
        type: 'database_close',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'database_close_error',
      });
    }
  }

  private setupConnectionListeners() {
    this.connection.on('connected', () => {
      this.logger.log('Database connected', {
        type: 'database_connected',
      });
    });

    this.connection.on('disconnected', () => {
      this.logger.log('Database disconnected', {
        type: 'database_disconnected',
      });
    });

    this.connection.on('error', (error) => {
      this.logger.logError(error, {
        type: 'database_error',
      });
    });

    this.connection.on('reconnected', () => {
      this.logger.log('Database reconnected', {
        type: 'database_reconnected',
      });
    });
  }

  /**
   * Get database connection status
   */
  getConnectionStatus(): {
    readyState: number;
    host: string;
    port: number;
    name: string;
  } {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      readyState: this.connection.readyState,
      host: this.connection.host,
      port: this.connection.port,
      name: this.connection.name,
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }
      const stats = await this.connection.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'database_stats_error',
      });
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    try {
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }
      const collection = this.connection.db.collection(collectionName);
      const stats = await collection
        .aggregate([{ $collStats: { storageStats: {} } }])
        .toArray();
      return stats[0] || {};
    } catch (error) {
      this.logger.logError(error as Error, {
        collectionName,
        type: 'collection_stats_error',
      });
      throw error;
    }
  }

  /**
   * Get slow queries (if profiling is enabled)
   */
  async getSlowQueries(): Promise<any[]> {
    try {
      if (!this.connection.db) {
        return [];
      }
      const slowQueries = await this.connection.db
        .collection('system.profile')
        .find({})
        .sort({ ts: -1 })
        .limit(10)
        .toArray();

      return slowQueries;
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'slow_queries_error',
      });
      return [];
    }
  }

  /**
   * Enable database profiling
   */
  async enableProfiling(level: number = 1): Promise<void> {
    try {
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }
      await this.connection.db.command({ profile: level });
      this.logger.log('Database profiling enabled', {
        level,
        type: 'database_profiling',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'enable_profiling_error',
      });
      throw error;
    }
  }

  /**
   * Disable database profiling
   */
  async disableProfiling(): Promise<void> {
    try {
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }
      await this.connection.db.command({ profile: 0 });
      this.logger.log('Database profiling disabled', {
        type: 'database_profiling',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'disable_profiling_error',
      });
      throw error;
    }
  }
}
