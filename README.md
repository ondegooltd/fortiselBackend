# Fortisel Backend API

A robust, scalable backend API built with NestJS for the Fortisel LPG (Liquefied Petroleum Gas) delivery platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Start development server
npm run start:dev
```

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- **[Main Documentation](./docs/README.md)** - Complete project overview and setup guide
- **[Environment Setup](./docs/ENVIRONMENT_SETUP.md)** - Environment configuration guide
- **[Security Implementation](./docs/SECURITY_IMPROVEMENTS.md)** - Security features and improvements
- **[Validation Improvements](./docs/VALIDATION_IMPROVEMENTS.md)** - Input validation and security enhancements
- **[Production Readiness](./docs/PRODUCTION_READINESS_IMPLEMENTATION.md)** - Production-ready features implementation
- **[Comprehensive Security](./docs/COMPREHENSIVE_SECURITY_IMPLEMENTATION.md)** - Complete security implementation guide

## 🛠️ Available Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linting

## 🔗 API Endpoints

- **API Base**: `http://localhost:3000/api`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 📁 Project Structure

```
src/
├── common/          # Shared utilities, decorators, and services
├── order/          # Order management
├── user/           # User management & authentication
├── payment/        # Payment processing
├── delivery/       # Delivery system
├── cylinder/       # Cylinder management
├── notification/   # Notification service
├── support-ticket/ # Support ticket system
├── admin/          # Admin management
└── health/         # Health checks
```

## 🔐 Key Features

- **Transaction Management** - Database transaction support with retry logic
- **Business Rule Validation** - Comprehensive business logic validation
- **API Versioning** - Backward-compatible API versioning
- **Request/Response Transformation** - Standardized API responses
- **Request Tracking** - Unique request IDs for debugging
- **Security Middleware** - Comprehensive security headers and validation
- **Error Handling** - Structured error responses and recovery
- **Logging & Monitoring** - Structured logging with Winston
- **Health Checks** - Application health monitoring

## 🚀 Production Ready

This application includes production-ready features:

- ✅ Environment-based configuration
- ✅ Database transaction management
- ✅ Business rule validation
- ✅ API versioning
- ✅ Security middleware
- ✅ Error handling and recovery
- ✅ Structured logging
- ✅ Health monitoring
- ✅ Rate limiting
- ✅ Input validation

---

**Built with ❤️ by the Fortisel Development Team**
