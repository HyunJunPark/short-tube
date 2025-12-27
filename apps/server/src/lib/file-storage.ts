import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables early
dotenv.config();

export class FileStorage {
  private dataDir: string;

  constructor(dataDir?: string) {
    const rawDir = dataDir || process.env.DATA_DIR || path.join(__dirname, '../../../data');
    // Resolve relative paths based on current working directory
    this.dataDir = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);
    console.log('[FileStorage] Using data directory:', this.dataDir);
  }

  async ensureDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async readJSON<T>(filename: string): Promise<T | null> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async writeJSON<T>(filename: string, data: T): Promise<void> {
    await this.ensureDir();
    const filePath = path.join(this.dataDir, filename);
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf-8');
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
