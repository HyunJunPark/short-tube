import { User, UserWithoutPassword } from '@short-tube/types';
import { FileStorage } from '../../../../../lib/file-storage';
import { IAuthRepository } from '../../interfaces';

/**
 * File-based implementation of IAuthRepository
 * Uses FileStorage to persist users to users.json
 */
export class FileAuthRepository implements IAuthRepository {
  private readonly USERS_FILE = 'users.json';

  constructor(private storage: FileStorage) {}

  async findAll(): Promise<User[]> {
    const users = await this.loadUsers();
    return users;
  }

  async findById(id: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(user => user.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(user => user.username === username) || null;
  }

  async create(user: User): Promise<void> {
    const users = await this.loadUsers();
    users.push(user);
    await this.saveUsers(users);
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    const users = await this.loadUsers();
    const index = users.findIndex(user => user.id === id);

    if (index === -1) {
      throw new Error('User not found');
    }

    users[index] = {
      ...users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.saveUsers(users);
  }

  async delete(id: string): Promise<void> {
    const users = await this.loadUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    await this.saveUsers(filteredUsers);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  private async loadUsers(): Promise<User[]> {
    const users = await this.storage.readJSON<User[]>(this.USERS_FILE);
    if (!users) {
      return [];
    }
    return users;
  }

  private async saveUsers(users: User[]): Promise<void> {
    await this.storage.writeJSON(this.USERS_FILE, users);
  }
}
