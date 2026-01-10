import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserWithoutPassword, RegisterRequest, LoginRequest, AuthResponse } from '@short-tube/types';
import { IAuthRepository } from '../repositories';
import { AppError } from '../../../utils/errors';
import { randomUUID } from 'crypto';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingEmail = await this.authRepository.existsByEmail(data.email);
    if (existingEmail) {
      throw new AppError(400, 'Email already in use');
    }

    // Check if username already exists
    const existingUsername = await this.authRepository.existsByUsername(data.username);
    if (existingUsername) {
      throw new AppError(400, 'Username already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username: data.username,
      email: data.email,
      password: hashedPassword,
      created_at: now,
      updated_at: now,
    };

    await this.authRepository.create(user);

    // Generate token
    const token = this.generateToken(user.id);

    // Return user without password
    const userWithoutPassword = this.excludePassword(user);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.authRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Return user without password
    const userWithoutPassword = this.excludePassword(user);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Get user by ID (for authentication middleware)
   */
  async getUserById(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      return null;
    }
    return this.excludePassword(user);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as any);
  }

  /**
   * Exclude password from user object
   */
  private excludePassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
