# LPG Gas Refill and Delivery Backend Setup

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fortisel

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Payment Providers
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

MOMO_API_KEY=your_momo_api_key
MOMO_WEBHOOK_SECRET=your_momo_webhook_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install additional required packages:
```bash
npm install class-validator class-transformer bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20
npm install --save-dev @types/bcrypt @types/passport-jwt @types/passport-google-oauth20
```

3. Start MongoDB:
```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGODB_URI in your .env file
```

4. Run the application:
```bash
npm run start:dev
```

## API Endpoints

### Users
- `POST /users` - Create a new user
- `POST /users/login` - User login
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Orders
- `POST /order` - Create a new order
- `GET /order` - Get all orders
- `GET /order/:id` - Get order by ID
- `GET /order/by-order-id/:orderId` - Get order by order ID
- `PATCH /order/:id` - Update order
- `DELETE /order/:id` - Delete order

### Payments
- `POST /payments` - Create a new payment
- `POST /payments/webhook/paystack` - Paystack webhook
- `POST /payments/webhook/momo` - MoMo webhook
- `GET /payments` - Get all payments
- `GET /payments/by-order/:orderId` - Get payments by order
- `GET /payments/by-user/:userId` - Get payments by user
- `GET /payments/by-status?status=status` - Get payments by status
- `GET /payments/:id` - Get payment by ID
- `PATCH /payments/:id` - Update payment
- `PATCH /payments/:id/status` - Update payment status
- `DELETE /payments/:id` - Delete payment

### Deliveries
- `POST /deliveries` - Create a new delivery
- `GET /deliveries` - Get all deliveries
- `GET /deliveries/pending` - Get pending deliveries
- `GET /deliveries/by-order/:orderId` - Get deliveries by order
- `GET /deliveries/by-driver/:driverId` - Get deliveries by driver
- `GET /deliveries/by-status?status=status` - Get deliveries by status
- `GET /deliveries/:id` - Get delivery by ID
- `PATCH /deliveries/:id` - Update delivery
- `PATCH /deliveries/:id/status` - Update delivery status
- `PATCH /deliveries/:id/assign-driver` - Assign driver to delivery
- `DELETE /deliveries/:id` - Delete delivery

## Testing with Postman

1. Import the following collection into Postman:

### Create User
```
POST http://localhost:3000/users
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City"
}
```

### Create Order
```
POST http://localhost:3000/order
Content-Type: application/json

{
  "cylinderSize": "12.5kg",
  "quantity": 2,
  "refillAmount": 25.0,
  "deliveryFee": 5.0,
  "totalAmount": 55.0,
  "pickupAddress": "123 Pickup St",
  "dropOffAddress": "456 Delivery St",
  "receiverName": "John Doe",
  "receiverPhone": "+1234567890",
  "paymentMethod": "card",
  "notes": "Please deliver in the morning"
}
```

### Create Payment
```
POST http://localhost:3000/payments
Content-Type: application/json

{
  "orderId": "order_id_here",
  "userId": "user_id_here",
  "amount": 55.0,
  "currency": "NGN",
  "provider": "paystack",
  "paymentMethod": "card",
  "description": "LPG Gas Refill Order"
}
```

### Create Delivery
```
POST http://localhost:3000/deliveries
Content-Type: application/json

{
  "orderId": "order_id_here",
  "pickupAddress": "123 Pickup St",
  "dropOffAddress": "456 Delivery St",
  "deliveryFee": 5.0,
  "estimatedPickupTime": "2024-01-15T10:00:00Z",
  "estimatedDeliveryTime": "2024-01-15T14:00:00Z"
}
```

## Features Implemented

✅ **Order Management** - Complete CRUD operations for orders
✅ **User Authentication** - User registration, login, and management
✅ **Payment Integration** - Support for Paystack and MoMo with webhooks
✅ **Delivery Management** - Delivery tracking and driver assignment
✅ **RESTful API** - All endpoints follow REST conventions
✅ **MongoDB Integration** - All data stored in MongoDB
✅ **Validation** - DTOs with class-validator decorators
✅ **Error Handling** - Proper error responses and exceptions
✅ **Environment Configuration** - Configurable settings via environment variables

## Next Steps

1. Implement JWT authentication middleware
2. Add Google OAuth integration
3. Implement admin panel features
4. Add payment provider integrations
5. Implement real-time delivery tracking
6. Add email notifications
7. Implement rate limiting and security measures 