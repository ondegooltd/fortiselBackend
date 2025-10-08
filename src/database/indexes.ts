import { Connection } from 'mongoose';

export class DatabaseIndexes {
  static async createIndexes(connection: Connection): Promise<void> {
    try {
      if (!connection.db) {
        throw new Error('Database connection not available');
      }

      // User collection indexes
      await connection.db
        .collection('users')
        .createIndex({ email: 1 }, { unique: true });
      await connection.db
        .collection('users')
        .createIndex({ phone: 1 }, { unique: true });
      await connection.db
        .collection('users')
        .createIndex({ userId: 1 }, { unique: true });
      await connection.db
        .collection('users')
        .createIndex({ googleId: 1 }, { sparse: true });
      await connection.db.collection('users').createIndex({ role: 1 });
      await connection.db.collection('users').createIndex({ isActive: 1 });
      await connection.db.collection('users').createIndex({ createdAt: -1 });
      await connection.db.collection('users').createIndex({ lastLoginAt: -1 });
      await connection.db.collection('users').createIndex({
        email: 'text',
        name: 'text',
        phone: 'text',
      });

      // Order collection indexes
      await connection.db
        .collection('orders')
        .createIndex({ orderId: 1 }, { unique: true });
      await connection.db.collection('orders').createIndex({ userId: 1 });
      await connection.db.collection('orders').createIndex({ status: 1 });
      await connection.db.collection('orders').createIndex({ cylinderSize: 1 });
      await connection.db.collection('orders').createIndex({ createdAt: -1 });
      await connection.db.collection('orders').createIndex({ updatedAt: -1 });
      await connection.db
        .collection('orders')
        .createIndex({ scheduledDate: 1 });
      await connection.db.collection('orders').createIndex({
        userId: 1,
        status: 1,
      });
      await connection.db.collection('orders').createIndex({
        status: 1,
        createdAt: -1,
      });

      // Payment collection indexes
      await connection.db
        .collection('payments')
        .createIndex({ paymentId: 1 }, { unique: true });
      await connection.db.collection('payments').createIndex({ orderId: 1 });
      await connection.db.collection('payments').createIndex({ userId: 1 });
      await connection.db.collection('payments').createIndex({ status: 1 });
      await connection.db.collection('payments').createIndex({ provider: 1 });
      await connection.db.collection('payments').createIndex({ createdAt: -1 });
      await connection.db.collection('payments').createIndex({
        userId: 1,
        status: 1,
      });
      await connection.db.collection('payments').createIndex({
        orderId: 1,
        status: 1,
      });

      // Delivery collection indexes
      await connection.db
        .collection('deliveries')
        .createIndex({ deliveryId: 1 }, { unique: true });
      await connection.db.collection('deliveries').createIndex({ orderId: 1 });
      await connection.db.collection('deliveries').createIndex({ driverId: 1 });
      await connection.db.collection('deliveries').createIndex({ status: 1 });
      await connection.db
        .collection('deliveries')
        .createIndex({ createdAt: -1 });
      await connection.db.collection('deliveries').createIndex({
        driverId: 1,
        status: 1,
      });
      await connection.db.collection('deliveries').createIndex({
        status: 1,
        createdAt: -1,
      });

      // Cylinder collection indexes
      await connection.db
        .collection('cylinders')
        .createIndex({ cylinderId: 1 }, { unique: true });
      await connection.db.collection('cylinders').createIndex({ size: 1 });
      await connection.db.collection('cylinders').createIndex({ status: 1 });
      await connection.db
        .collection('cylinders')
        .createIndex({ location: '2dsphere' });
      await connection.db.collection('cylinders').createIndex({
        size: 1,
        status: 1,
      });

      // Notification collection indexes
      await connection.db
        .collection('notifications')
        .createIndex({ userId: 1 });
      await connection.db.collection('notifications').createIndex({ type: 1 });
      await connection.db
        .collection('notifications')
        .createIndex({ isRead: 1 });
      await connection.db
        .collection('notifications')
        .createIndex({ createdAt: -1 });
      await connection.db.collection('notifications').createIndex({
        userId: 1,
        isRead: 1,
      });
      await connection.db.collection('notifications').createIndex({
        userId: 1,
        createdAt: -1,
      });

      // Support ticket collection indexes
      await connection.db
        .collection('supporttickets')
        .createIndex({ ticketId: 1 }, { unique: true });
      await connection.db
        .collection('supporttickets')
        .createIndex({ userId: 1 });
      await connection.db
        .collection('supporttickets')
        .createIndex({ status: 1 });
      await connection.db
        .collection('supporttickets')
        .createIndex({ priority: 1 });
      await connection.db
        .collection('supporttickets')
        .createIndex({ createdAt: -1 });
      await connection.db.collection('supporttickets').createIndex({
        userId: 1,
        status: 1,
      });
      await connection.db.collection('supporttickets').createIndex({
        status: 1,
        priority: 1,
      });

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  static async dropIndexes(connection: Connection): Promise<void> {
    try {
      if (!connection.db) {
        throw new Error('Database connection not available');
      }

      const collections = [
        'users',
        'orders',
        'payments',
        'deliveries',
        'cylinders',
        'notifications',
        'supporttickets',
      ];

      for (const collectionName of collections) {
        await connection.db.collection(collectionName).dropIndexes();
      }

      console.log('✅ Database indexes dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database indexes:', error);
      throw error;
    }
  }

  static async getIndexStats(connection: Connection): Promise<any> {
    try {
      if (!connection.db) {
        throw new Error('Database connection not available');
      }

      const collections = [
        'users',
        'orders',
        'payments',
        'deliveries',
        'cylinders',
        'notifications',
        'supporttickets',
      ];

      const stats = {};

      for (const collectionName of collections) {
        const indexes = await connection.db
          .collection(collectionName)
          .listIndexes()
          .toArray();
        stats[collectionName] = indexes.map((index) => ({
          name: index.name,
          key: index.key,
          unique: index.unique || false,
          sparse: index.sparse || false,
        }));
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting index stats:', error);
      throw error;
    }
  }
}
