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

    console.log(`[AudioService] 🎬 Starting audio download for video: ${videoId}`);
    console.log(`[AudioService] 📍 Output path: ${outputPath}`);
    console.log(`[AudioService] 🔗 Video URL: ${videoUrl}`);

    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '-f', 'bestaudio/best',
        '-x',
        '--audio-format', 'mp3',
        '-o', outputPath,
        videoUrl,
      ]);

      let stderr = '';
      let lastLoggedPercentage = 0;

      ytdlp.stderr.on('data', (data) => {
        const message = data.toString();
        stderr += message;
      });

      ytdlp.stdout?.on('data', (data) => {
        const message = data.toString();

        // Log progress information only at 10% intervals
        if (message.includes('%')) {
          // Extract percentage from progress string like "[download]  58.4% of   23.95MiB"
          const percentMatch = message.match(/(\d+(?:\.\d+)?)\%/);
          if (percentMatch) {
            const currentPercentage = Math.floor(parseFloat(percentMatch[1]) / 10) * 10;

            // Only log when we cross a 10% threshold
            if (currentPercentage > lastLoggedPercentage && currentPercentage % 10 === 0) {
              lastLoggedPercentage = currentPercentage;
              console.log(`[AudioService] ⏳ Download progress: ${currentPercentage}%`);
            }
          }
        }
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          try {
            // Check file size after download
            const stats = await fs.stat(outputPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`[AudioService] ✅ Audio download completed successfully`);
            console.log(`[AudioService] 📦 File size: ${fileSizeInMB} MB`);
            console.log(`[AudioService] 📄 File path: ${outputPath}`);
            resolve(outputPath);
          } catch (error) {
            console.error(`[AudioService] ❌ Failed to check file stats:`, error);
            reject(new InternalServerError(`Failed to verify downloaded audio file`));
          }
        } else {
          console.error(`[AudioService] ❌ yt-dlp failed with code ${code}`);
          console.error(`[AudioService] 📋 Error details:`, stderr);
          reject(new InternalServerError(
            `yt-dlp failed with code ${code}: ${stderr}`
          ));
        }
      });

      ytdlp.on('error', (error) => {
        console.error(`[AudioService] ❌ Failed to spawn yt-dlp:`, error.message);
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
      const stats = await fs.stat(filePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      await fs.unlink(filePath);
      console.log(`[AudioService] 🗑️ Cleaned up audio file: ${path.basename(filePath)} (${fileSizeInMB} MB)`);
    } catch (error) {
      // Ignore errors if file doesn't exist
      console.warn(`[AudioService] ⚠️ Failed to delete audio file: ${filePath}`);
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
