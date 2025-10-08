#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Environment Setup Script for Fortisel Backend
 * This script helps set up the environment configuration for the application
 */

console.log('🚀 Setting up Fortisel Backend Environment Configuration...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Backing up to .env.backup');
  fs.copyFileSync(envPath, path.join(process.cwd(), '.env.backup'));
}

// Copy env.example to .env if it doesn't exist
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📋 Creating .env file from env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created successfully!');
} else if (!fs.existsSync(envExamplePath)) {
  console.log('❌ env.example file not found. Please ensure it exists in the project root.');
  process.exit(1);
}

// Generate secure secrets
console.log('🔐 Generating secure secrets...');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log(`✅ Generated JWT secret (${jwtSecret.length} characters)`);

// Generate session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log(`✅ Generated session secret (${sessionSecret.length} characters)`);

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace placeholder values with generated secrets
envContent = envContent.replace(
  'your-super-secret-jwt-key-change-this-in-production-minimum-32-characters',
  jwtSecret
);

envContent = envContent.replace(
  'your-session-secret-key',
  sessionSecret
);

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log('\n📝 Environment Configuration Summary:');
console.log('=====================================');
console.log('✅ .env file created/updated');
console.log('✅ Secure JWT secret generated');
console.log('✅ Session secret generated');
console.log('✅ Database configuration ready');
console.log('✅ CORS configuration ready');

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Update MONGODB_URI with your actual database connection string');
console.log('2. Configure payment provider keys (Paystack, MoMo)');
console.log('3. Set up email service credentials (SMTP)');
console.log('4. Configure SMS service (Twilio) if needed');
console.log('5. Set up Google OAuth credentials');
console.log('6. Configure external service API keys');

console.log('\n⚠️  Security Reminders:');
console.log('======================');
console.log('• Never commit .env file to version control');
console.log('• Use strong, unique passwords for all services');
console.log('• Regularly rotate secrets in production');
console.log('• Use different secrets for different environments');

console.log('\n🚀 Ready to start development!');
console.log('Run: npm run start:dev');
