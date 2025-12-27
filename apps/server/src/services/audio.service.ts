import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { InternalServerError } from '../utils/errors';

export class AudioService {
  private tempDir: string;

  constructor() {
    this.tempDir = process.env.TEMP_AUDIO_DIR || path.join(__dirname, '../../../temp_audio');
  }

  /**
   * Download audio from YouTube video and convert to MP3
   */
  async downloadAudio(videoId: string): Promise<string> {
    await this.ensureTempDir();

    const outputPath = path.join(this.tempDir, `${videoId}.mp3`);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '-f', 'bestaudio/best',
        '-x',
        '--audio-format', 'mp3',
        '-o', outputPath,
        videoUrl,
      ]);

      let stderr = '';

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new InternalServerError(
            `yt-dlp failed with code ${code}: ${stderr}`
          ));
        }
      });

      ytdlp.on('error', (error) => {
        reject(new InternalServerError(
          `Failed to spawn yt-dlp: ${error.message}. Make sure yt-dlp is installed.`
        ));
      });
    });
  }

  /**
   * Clean up downloaded audio file
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      console.warn(`Failed to delete audio file: ${filePath}`);
    }
  }

  /**
   * Clean up all audio files in temp directory
   */
  async cleanupAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);

      for (const file of files) {
        if (file.endsWith('.mp3')) {
          await fs.unlink(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp audio directory:', error);
    }
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
