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
   * Summarize audio file
   * Note: File upload API may vary based on SDK version
   */
  async summarizeAudio(filePath: string, keywords: string[]): Promise<string> {
    // For now, return a placeholder message
    // Audio file upload requires specific SDK setup that may vary
    // This would need to be implemented based on the actual Google AI SDK version
    throw new InternalServerError(
      'Audio summarization not yet implemented. Please ensure video has captions.'
    );
  }

  /**
   * Get summary with fallback (transcript → audio)
   */
  async getSummaryWithFallback(
    videoId: string,
    tags: string[]
  ): Promise<string> {
    try {
      // Try transcript first
      const transcript = await transcriptService.getTranscript(videoId);
      const summary = await this.summarize(transcript, tags);

      // Check for error keywords indicating transcript failure
      if (this.isErrorSummary(summary)) {
        throw new Error('Invalid transcript summary');
      }

      return summary;
    } catch (error) {
      // Transcript failed, try audio
      console.log(`Transcript failed for ${videoId}, trying audio analysis...`);

      let audioPath: string | null = null;

      try {
        audioPath = await audioService.downloadAudio(videoId);
        const summary = await this.summarizeAudio(audioPath, tags);
        return summary;
      } finally {
        // Always cleanup audio file
        if (audioPath) {
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
