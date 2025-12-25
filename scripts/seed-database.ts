/**
 * Database Seeding Script
 *
 * This script seeds the database with initial data:
 * - A regular user (customer role)
 * - An admin user (admin role)
 * - All cylinder sizes with delivery fees
 *
 * Usage: npm run seed
 * Or: ts-node -r dotenv/config scripts/seed-database.ts
 *
 * Make sure your .env file has MONGODB_URI configured.
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Import existing schemas from the codebase
import { UserSchema, UserRole, AuthProvider } from '../src/user/user.schema';
import { CylinderSchema, CylinderSize } from '../src/cylinder/cylinder.schema';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Create models from existing schemas
const User = mongoose.model('User', UserSchema);
const Cylinder = mongoose.model('Cylinder', CylinderSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fortisel';
    console.log('🔌 Connecting to MongoDB...');
    console.log(
      `   URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`,
    ); // Hide credentials in logs

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');

    // Hash password function
    const hashPassword = async (password: string): Promise<string> => {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    };

    // Generate unique IDs
    const generateUserId = (prefix: string) =>
      `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const generateCylinderId = () =>
      `CYL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // 1. Create Regular User
    console.log('\n👤 Creating regular user...');
    const userPassword = await hashPassword('user123456');
    const userData = {
      userId: generateUserId('USER'),
      name: 'John Doe',
      email: 'user@fortisel.com',
      phone: '+233241234567',
      passwordHash: userPassword,
      role: UserRole.CUSTOMER,
      authProvider: AuthProvider.LOCAL,
      isEmailVerified: true,
      isActive: true,
    };

    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { phone: userData.phone },
        { userId: userData.userId },
      ],
    });

    if (existingUser) {
      console.log('⚠️  User already exists, skipping...');
      console.log(
        `   Found existing user with: ${existingUser.email || existingUser.phone || existingUser.userId}`,
      );
    } else {
      const user = new User(userData);
      await user.save();
      console.log('✅ User created successfully');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Phone: ${userData.phone}`);
      console.log(`   Password: user123456`);
      console.log(`   User ID: ${userData.userId}`);
    }

    // 2. Create Admin User
    console.log('\n👑 Creating admin user...');
    const adminPassword = await hashPassword('admin123456');
    const adminData = {
      userId: generateUserId('ADMIN'),
      name: 'Admin User',
      email: 'admin@fortisel.com',
      phone: '+233241234568',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      authProvider: AuthProvider.LOCAL,
      isEmailVerified: true,
      isActive: true,
    };

    const existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { phone: adminData.phone },
        { userId: adminData.userId },
      ],
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists, skipping...');
      console.log(
        `   Found existing admin with: ${existingAdmin.email || existingAdmin.phone || existingAdmin.userId}`,
      );
    } else {
      const admin = new User(adminData);
      await admin.save();
      console.log('✅ Admin created successfully');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Phone: ${adminData.phone}`);
      console.log(`   Password: admin123456`);
      console.log(`   User ID: ${adminData.userId}`);
    }

    // 3. Create Cylinders
    console.log('\n🔵 Creating cylinders...');
    const cylinders = [
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.SMALLEST,
        deliveryFee: 10,
        description:
          'Smallest size cylinder (3kg – Ghana standard) - Perfect for single users and very small households',
      },
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.SMALL,
        deliveryFee: 10,
        description:
          'Small size cylinder (6kg – Ghana standard) - Ideal for small families and light cooking',
      },
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.MEDIUM,
        deliveryFee: 10,
        description:
          'Medium size cylinder (13kg – Ghana standard) - Suitable for medium households and regular cooking',
      },
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.BIG,
        deliveryFee: 10,
        description:
          'Big size cylinder (18kg – Ghana standard) - Great for large families and heavy cooking',
      },
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.LARGE,
        deliveryFee: 15,
        description:
          'Large size cylinder (25kg – Ghana standard) - Perfect for very large households and shared use',
      },
      {
        cylinderId: generateCylinderId(),
        size: CylinderSize.COMMERCIAL,
        deliveryFee: 15,
        description:
          'Commercial size cylinder (50kg – Ghana standard) - For restaurants, hotels, and other commercial use',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const cylinderData of cylinders) {
      const existingCylinder = await Cylinder.findOne({
        size: cylinderData.size,
      });

      if (existingCylinder) {
        console.log(
          `⚠️  Cylinder with size '${cylinderData.size}' already exists, skipping...`,
        );
        skippedCount++;
      } else {
        const cylinder = new Cylinder(cylinderData);
        await cylinder.save();
        console.log(
          `✅ Created cylinder: ${cylinderData.size} (Delivery Fee: GHS ${cylinderData.deliveryFee})`,
        );
        createdCount++;
      }
    }

    console.log(
      `\n📊 Cylinder Summary: ${createdCount} created, ${skippedCount} skipped`,
    );

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📝 Login Credentials:');
    console.log('   User:');
    console.log('     Email: user@fortisel.com');
    console.log('     Phone: +233241234567');
    console.log('     Password: user123456');
    console.log('\n   Admin:');
    console.log('     Email: admin@fortisel.com');
    console.log('     Phone: +233241234568');
    console.log('     Password: admin123456');
    console.log('\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
      }
    } else {
      console.error('   Unknown error:', error);
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
