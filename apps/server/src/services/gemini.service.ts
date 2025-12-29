import { Summary } from '@short-tube/types';
import { GeminiClient } from '../lib/gemini-client';
import { transcriptService } from './transcript.service';
import { audioService } from './audio.service';
import { MAX_TRANSCRIPT_LENGTH, AUDIO_PROCESSING_TIMEOUT } from '../utils/constants';
import { InternalServerError } from '../utils/errors';

export class GeminiService {
  private client: GeminiClient;

  constructor(client?: GeminiClient) {
    this.client = client || new GeminiClient();
  }

  /**
   * Summarize text (from transcript)
   */
  async summarize(text: string, keywords: string[]): Promise<string> {
    // Truncate if too long
    const truncatedText = text.substring(0, MAX_TRANSCRIPT_LENGTH);

    const prompt = this.buildSummaryPrompt(truncatedText, keywords);

    return await this.client.generateWithFallback(prompt);
  }

  /**
   * Summarize audio file using Gemini API
   */
  async summarizeAudio(filePath: string, keywords: string[]): Promise<string> {
    console.log(`[GeminiService] 🎵 Starting audio summarization for: ${filePath}`);
    console.log(`[GeminiService] 🔑 Keywords: ${keywords.join(', ') || '없음'}`);

    const prompt = this.buildAudioPrompt(keywords);

    try {
      const startTime = Date.now();
      console.log(`[GeminiService] 📤 Sending audio to Gemini API...`);

      const summary = await this.client.generateWithAudio(
        filePath,
        prompt,
        'audio/mpeg'
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GeminiService] ✅ Audio summarization completed in ${duration}s`);

      // Check for error keywords indicating audio processing failure
      if (this.isErrorSummary(summary)) {
        console.warn(`[GeminiService] ⚠️ Error keywords detected in summary`);
        throw new Error('Invalid audio summary');
      }

      console.log(`[GeminiService] 📝 Summary length: ${summary.length} characters`);
      return summary;
    } catch (error) {
      console.error(`[GeminiService] ❌ Audio summarization failed for ${filePath}:`, error);
      throw new InternalServerError(
        'Failed to summarize audio. Please try again or ensure the video has valid audio content.'
      );
    }
  }

  /**
   * Get summary with fallback (transcript → audio)
   */
  async getSummaryWithFallback(
    videoId: string,
    tags: string[]
  ): Promise<string> {
    console.log(`[GeminiService] 🔄 Starting summary with fallback for video: ${videoId}`);
    console.log(`[GeminiService] 🏷️ Tags: ${tags.join(', ') || '없음'}`);

    try {
      // Try transcript first
      console.log(`[GeminiService] 📄 Attempting to fetch transcript...`);
      const startTime = Date.now();

      const transcript = await transcriptService.getTranscript(videoId);
      const transcriptLength = transcript.length;
      console.log(`[GeminiService] ✅ Transcript fetched: ${transcriptLength} characters`);

      const summary = await this.summarize(transcript, tags);

      // Check for error keywords indicating transcript failure
      if (this.isErrorSummary(summary)) {
        console.warn(`[GeminiService] ⚠️ Error keywords detected in transcript summary`);
        throw new Error('Invalid transcript summary');
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GeminiService] ✅ Transcript-based summary completed in ${duration}s`);
      return summary;
    } catch (error) {
      // Transcript failed, try audio
      console.warn(`[GeminiService] ⚠️ Transcript method failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`[GeminiService] 🔄 Falling back to audio analysis...`);

      let audioPath: string | null = null;

      try {
        audioPath = await audioService.downloadAudio(videoId);
        const summary = await this.summarizeAudio(audioPath, tags);
        console.log(`[GeminiService] ✅ Audio-based summary completed successfully`);
        return summary;
      } catch (audioError) {
        console.error(`[GeminiService] ❌ Audio fallback also failed:`, audioError instanceof Error ? audioError.message : 'Unknown error');
        throw audioError;
      } finally {
        // Always cleanup audio file
        if (audioPath) {
          console.log(`[GeminiService] 🧹 Cleaning up audio resources...`);
          await audioService.cleanup(audioPath);
        }
      }
    }
  }

  /**
   * Generate daily briefing from multiple summaries
   */
  async generateBriefing(
    summaries: Summary[],
    keywords: string[]
  ): Promise<string> {
    if (summaries.length === 0) {
      return '오늘은 새로운 영상 요약이 없습니다.';
    }

    const summariesText = summaries
      .map((s, i) => {
        return `[${i + 1}] ${s.title} (${s.channel_name})\n${s.content}`;
      })
      .join('\n\n---\n\n');

    const prompt = this.buildBriefingPrompt(summariesText, keywords);

    return await this.client.generateWithFallback(prompt);
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private buildSummaryPrompt(text: string, keywords: string[]): string {
    const keywordText = keywords.length > 0 ? keywords.join(', ') : '일반';

    return `다음은 YouTube 영상의 자막입니다. "${keywordText}"에 관심이 있는 사람을 위해 핵심 내용을 3-5줄로 요약해주세요.

자막:
${text}

요약 (3-5줄, 핵심만):`;
  }

  private buildAudioPrompt(keywords: string[]): string {
    const keywordText = keywords.length > 0 ? keywords.join(', ') : '일반';

    return `이 오디오는 YouTube 영상의 내용입니다. "${keywordText}"에 관심이 있는 사람을 위해 핵심 내용을 3-5줄로 요약해주세요.

요약 (3-5줄, 핵심만):`;
  }

  private buildBriefingPrompt(summariesText: string, keywords: string[]): string {
    const keywordText = keywords.length > 0 ? keywords.join(', ') : '전체';

    return `다음은 오늘 수집된 YouTube 영상 요약들입니다. "${keywordText}" 주제를 중심으로 오늘의 트렌드와 주요 이슈를 통합 브리핑해주세요.

영상 요약들:
${summariesText}

통합 브리핑 (최대 1000자):
1. 주요 트렌드 (1줄)
2. 이슈별 상세 내용 (각 영상 번호 참조)
3. 시사점 및 인사이트 (1줄)`;
  }

  private isErrorSummary(summary: string): boolean {
    const errorKeywords = [
      '자막을 찾을 수 없거나',
      '자막 추출 오류',
      '자막이 없습니다',
      'transcript not available',
      'no transcript',
    ];

    const lowerSummary = summary.toLowerCase();

    return errorKeywords.some(keyword => lowerSummary.includes(keyword.toLowerCase()));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const geminiService = new GeminiService();
