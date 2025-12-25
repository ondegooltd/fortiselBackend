# Database Seeding Scripts

## seed-database.ts

This script seeds the database with initial data:
- A regular user (customer role)
- An admin user (admin role)
- All cylinder sizes with delivery fees

### Usage

```bash
npm run seed
```

Or directly with ts-node:

```bash
ts-node -r dotenv/config scripts/seed-database.ts
```

### What it creates:

#### Users:
1. **Regular User**
   - Email: `user@fortisel.com`
   - Phone: `+233241234567`
   - Password: `user123456`
   - Role: `customer`

2. **Admin User**
   - Email: `admin@fortisel.com`
   - Phone: `+233241234568`
   - Password: `admin123456`
   - Role: `admin`

#### Cylinders:
Creates cylinders for all available sizes:
- `smallest` - GHS 5.00 delivery fee
- `small` - GHS 8.00 delivery fee
- `medium` - GHS 12.00 delivery fee
- `big` - GHS 18.00 delivery fee
- `large` - GHS 25.00 delivery fee
- `commercial` - GHS 50.00 delivery fee

### Notes:
- The script checks if users/cylinders already exist and skips them if they do
- Passwords are hashed using bcrypt (10 salt rounds)
- All users are created with `isEmailVerified: true` and `isActive: true`
- Make sure your `.env` file has the correct `MONGODB_URI` configured

### Environment Variables Required:
- `MONGODB_URI` - MongoDB connection string (defaults to `mongodb://localhost:27017/fortisel` if not set)

