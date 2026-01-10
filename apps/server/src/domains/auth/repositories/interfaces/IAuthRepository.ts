import { User, UserWithoutPassword } from '@short-tube/types';

/**
 * Repository interface for Auth data access
 * Abstracts the underlying storage mechanism (FileStorage or Database)
 */
export interface IAuthRepository {
  /**
   * Retrieve all users
   */
  findAll(): Promise<User[]>;

  /**
   * Retrieve a user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Retrieve a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Retrieve a user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Create a new user
   */
  create(user: User): Promise<void>;

  /**
   * Update an existing user
   */
  update(id: string, updates: Partial<User>): Promise<void>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Check if a user exists by username
   */
  existsByUsername(username: string): Promise<boolean>;
}
