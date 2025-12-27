import { Video, Subscription } from '@short-tube/types';
import { TelegramClient } from '../lib/telegram-client';

export class NotifierService {
  private client: TelegramClient;

  constructor(client?: TelegramClient) {
    this.client = client || new TelegramClient();
  }

  /**
   * Send video summary notification
   */
  async sendVideoSummary(
    video: Video,
    summary: string,
    subscription: Subscription
  ): Promise<boolean> {
    const message = this.formatVideoMessage(video, summary, subscription);
    return await this.client.sendMessage(message, 'Markdown');
  }

  /**
   * Send daily briefing
   */
  async sendBriefing(briefing: string, date?: string): Promise<boolean> {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const message = this.formatBriefingMessage(briefing, dateStr);
    return await this.client.sendMessage(message, 'Markdown');
  }

  /**
   * Send test message
   */
  async sendTest(): Promise<boolean> {
    return await this.client.sendTestMessage();
  }

  /**
   * Check if Telegram is configured
   */
  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private formatVideoMessage(
    video: Video,
    summary: string,
    subscription: Subscription
  ): string {
    return `🔔 *새 영상 요약: ${subscription.channel_name}*

📌 *제목:* ${video.title}
⏱ *길이:* ${video.duration}

${summary}

🔗 [영상 보기](https://www.youtube.com/watch?v=${video.id})`;
  }

  private formatBriefingMessage(briefing: string, date: string): string {
    return `📅 *오늘의 AI 커스텀 브리핑 (${date})*

${briefing}`;
  }
}

// Singleton instance
export const notifierService = new NotifierService();
