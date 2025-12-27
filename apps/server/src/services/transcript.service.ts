import { YoutubeTranscript } from 'youtube-transcript';
import { NotFoundError } from '../utils/errors';

export class TranscriptService {
  /**
   * Get transcript for a YouTube video
   * Tries multiple languages in order: ko, en, then any available
   */
  async getTranscript(videoId: string): Promise<string> {
    try {
      // Try Korean first
      const transcript = await this.fetchWithLanguage(videoId, 'ko');
      if (transcript) return transcript;
    } catch (error) {
      // Korean not available, try English
      try {
        const transcript = await this.fetchWithLanguage(videoId, 'en');
        if (transcript) return transcript;
      } catch (error) {
        // English not available, try any available language
        try {
          const transcript = await this.fetchAnyLanguage(videoId);
          if (transcript) return transcript;
        } catch (error) {
          throw new NotFoundError('No transcript available for this video');
        }
      }
    }

    throw new NotFoundError('No transcript available for this video');
  }

  private async fetchWithLanguage(
    videoId: string,
    lang: string
  ): Promise<string | null> {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
        lang,
      });

      if (!transcriptItems || transcriptItems.length === 0) {
        return null;
      }

      return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
      return null;
    }
  }

  private async fetchAnyLanguage(videoId: string): Promise<string | null> {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptItems || transcriptItems.length === 0) {
        return null;
      }

      return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if transcript is available for a video
   */
  async hasTranscript(videoId: string): Promise<boolean> {
    try {
      await this.getTranscript(videoId);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const transcriptService = new TranscriptService();
