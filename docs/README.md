# Fortisel Backend API

A robust, scalable backend API built with NestJS for the Fortisel LPG (Liquefied Petroleum Gas) delivery platform. This API provides comprehensive services for managing cylinders, orders, deliveries, payments, user management, and support tickets.

## 🚀 Features

- **User Management**: Authentication, authorization, and user profile management
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Cylinder Management**: Track cylinder inventory and status
- **Delivery System**: Manage delivery schedules and tracking
- **Payment Processing**: Secure payment handling and transaction management
- **Support Tickets**: Customer support and issue tracking system
- **Notification System**: Real-time notifications and alerts
- **Admin Panel**: Administrative controls and system management

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Authentication**: JWT tokens with Passport.js
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest testing framework
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ondegooltd/fortiselBackend.git
cd fortiselBackend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fortisel
# or your MongoDB Atlas connection string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000

# Google OAuth (if using Google authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 4. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## 📚 Documentation

### API Documentation
Once the application is running, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **API Base URL**: `http://localhost:3000/api`

### Project Documentation
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Complete environment configuration guide
- **[Security Implementation](./SECURITY_IMPROVEMENTS.md)** - Security features and improvements
- **[Validation Improvements](./VALIDATION_IMPROVEMENTS.md)** - Input validation and security enhancements
- **[Production Readiness](./PRODUCTION_READINESS_IMPLEMENTATION.md)** - Production-ready features implementation
- **[Comprehensive Security](./COMPREHENSIVE_SECURITY_IMPLEMENTATION.md)** - Complete security implementation guide

## 🏗️ Project Structure

```
src/
├── admin/           # Admin management module
├── app/            # Main application module
├── config/         # Configuration files
├── cylinder/       # Cylinder management
├── delivery/       # Delivery system
├── notification/   # Notification service
├── order/          # Order management
├── payment/        # Payment processing
├── support-ticket/ # Support ticket system
├── user/           # User management & authentication
└── main.ts         # Application entry point
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Available Authentication Strategies:
- **JWT Strategy**: Standard JWT token authentication
- **Google OAuth**: Google account integration

## 📊 Database Models

### Core Entities:
- **User**: Customer and staff accounts
- **Order**: LPG cylinder orders
- **Cylinder**: Gas cylinder inventory
- **Delivery**: Delivery scheduling and tracking
- **Payment**: Transaction records
- **SupportTicket**: Customer support requests
- **Notification**: System notifications

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Test in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

Ensure all production environment variables are properly configured:
- Database connection strings
- JWT secrets
- API keys
- CORS origins

### Docker (Optional)

You can containerize the application using Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🔧 Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🌐 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:8081` (Expo/React Native frontend)
- `http://localhost:19006` (Expo web)
- `http://localhost:3000` (Web frontend)
- Local network IPs for mobile development

## 📝 API Endpoints

### Core Endpoints:
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

- `POST /api/users` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

- `GET /api/cylinders` - Get cylinder inventory
- `POST /api/deliveries` - Create delivery
- `POST /api/payments` - Process payment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team at ondegooltd

## 🔄 Version History

- **v0.0.1** - Initial release with core functionality

---

**Built with ❤️ by the Fortisel Development Team**