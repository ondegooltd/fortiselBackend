export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://adelwinelisha:vqpy8TZCbwst5MhU@ondegoo-trial.gmnmugn.mongodb.net/?retryWrites=true&w=majority&appName=Ondegoo-trial',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'b37afd8513d9fef7bbd68abff07334717c1d94772539592509aafb30c47db8fef9e3e1c15cf15c7499df71c0419b25ebe5982eb86792ee1ffecdf41fbd8dab82',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
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
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
}); 