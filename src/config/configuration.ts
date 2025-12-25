export default () => {
  // Validate required environment variables
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.\n' +
        'Refer to env.example for the complete list of required variables.',
    );
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security reasons.\n' +
        'Generate a strong secret using: openssl rand -base64 64',
    );
  }

  return {
    // Application configuration
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',

    // Database configuration
    database: {
      uri: process.env.MONGODB_URI,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      serverSelectionTimeoutMS: parseInt(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000',
        10,
      ),
      socketTimeoutMS: parseInt(
        process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000',
        10,
      ),
      maxBackups: parseInt(process.env.MAX_BACKUPS || '10', 10),
      backupEnabled: process.env.BACKUP_ENABLED !== 'false',
      backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    },

    // JWT configuration
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // CORS configuration
    cors: {
      origins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
        : [
            'http://localhost:3000',
            'http://localhost:8081',
            'http://localhost:19006',
            'http://192.168.100.33:3000',
            'http://172.20.10.3:3000',
            '*', // Allow all origins in development (remove in production)
          ],
    },

    // Payment providers
    payment: {
      paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
      },
      momo: {
        apiKey: process.env.MOMO_API_KEY,
        webhookSecret: process.env.MOMO_WEBHOOK_SECRET,
      },
    },

    // Google OAuth
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/users/auth/google/callback',
    },

    // Email service
    email: {
      resend: {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.RESEND_FROM || 'noreply@fortisel.com',
      },
    },

    // SMS service
    sms: {
      provider: process.env.SMS_PROVIDER || 'mnotify',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      },
      mnotify: {
        apiKey: process.env.MNOTIFY_API_KEY,
        providerUrl: process.env.MNOTIFY_PROVIDER_URL,
        smsSenderId: process.env.SMS_SENDER_ID,
        otpSenderId: process.env.OTP_SENDER_ID,
      },
    },

    // Redis configuration
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },

    // Logging configuration
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
    },

    // Security configuration
    security: {
      rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
      },
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      sessionSecret: process.env.SESSION_SECRET,
    },

    // Monitoring
    monitoring: {
      healthCheckTimeout: parseInt(
        process.env.HEALTH_CHECK_TIMEOUT || '5000',
        10,
      ),
      metricsEnabled: process.env.METRICS_ENABLED === 'true',
    },

    // File upload
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
      uploadPath: process.env.UPLOAD_PATH || './uploads',
    },

    // External services
    external: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      weatherApiKey: process.env.WEATHER_API_KEY,
      fcmServerKey: process.env.FCM_SERVER_KEY,
    },
  };
};
