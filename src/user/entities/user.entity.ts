import { UserRole, AuthProvider } from '../user.schema';

export class User {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
} 