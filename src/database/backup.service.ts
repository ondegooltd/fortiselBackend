import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/services/logger.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly backupDir: string;
  private readonly maxBackups: number;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = parseInt(
      this.configService.get('database.maxBackups') || '10',
      10,
    );

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `fortisel-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.gz`);

    try {
      this.logger.log('Starting database backup', {
        backupName,
        type: 'backup_start',
      });

      const mongoUri = this.configService.get('database.uri');
      const dbName = this.extractDatabaseName(mongoUri);

      // Create backup using mongodump
      const command = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;

      await execAsync(command);

      // Verify backup file exists and has content
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      this.logger.log('Database backup completed successfully', {
        backupName,
        backupPath,
        size: stats.size,
        type: 'backup_success',
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      this.logger.logError(error as Error, {
        backupName,
        type: 'backup_error',
      });
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      this.logger.log('Starting database restore', {
        backupPath,
        type: 'restore_start',
      });

      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      const mongoUri = this.configService.get('database.uri');

      // Restore using mongorestore
      const command = `mongorestore --uri="${mongoUri}" --archive="${backupPath}" --gzip`;

      await execAsync(command);

      this.logger.log('Database restore completed successfully', {
        backupPath,
        type: 'restore_success',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        backupPath,
        type: 'restore_error',
      });
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<
    Array<{ name: string; path: string; size: number; created: Date }>
  > {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(
          (file) => file.endsWith('.gz') && file.startsWith('fortisel-backup-'),
        )
        .map((file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return backups;
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'list_backups_error',
      });
      throw error;
    }
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(backupName: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupName}`);
      }

      fs.unlinkSync(backupPath);

      this.logger.log('Backup deleted successfully', {
        backupName,
        type: 'backup_delete',
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        backupName,
        type: 'backup_delete_error',
      });
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   */
  async scheduleBackups(): Promise<void> {
    // This would typically be implemented with a cron job or scheduler
    // For now, we'll just log the intention
    this.logger.log('Backup scheduling not implemented yet', {
      type: 'backup_schedule',
    });
  }

  private extractDatabaseName(uri: string): string {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'fortisel';
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);

        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.name);
        }

        this.logger.log('Old backups cleaned up', {
          deletedCount: backupsToDelete.length,
          type: 'backup_cleanup',
        });
      }
    } catch (error) {
      this.logger.logError(error as Error, {
        type: 'backup_cleanup_error',
      });
    }
  }
}
