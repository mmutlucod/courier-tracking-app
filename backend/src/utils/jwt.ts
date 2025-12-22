import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JWTPayload {
  userId: string;
  email: string;
  role: 'courier' | 'customer';
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export const generateToken = (userId: Types.ObjectId, email: string, role: 'courier' | 'customer'): string => {
  const payload: JWTPayload = {
    userId: userId.toString(),
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET as Secret, {
    expiresIn: JWT_EXPIRE,
  } as SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET as Secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};