import TelegramBot from 'node-telegram-bot-api';

export class TelegramClient {
  private bot: TelegramBot | null = null;
  private token: string;
  private chatId: string;

  constructor(token?: string, chatId?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = chatId || process.env.TELEGRAM_CHAT_ID || '';

    if (this.token) {
      this.bot = new TelegramBot(this.token, { polling: false });
    }
  }

  isConfigured(): boolean {
    return !!this.token && !!this.chatId;
  }

  async sendMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
    if (!this.bot || !this.isConfigured()) {
      console.warn('Telegram not configured, skipping message');
      return false;
    }

    try {
      await this.bot.sendMessage(this.chatId, text, {
        parse_mode: parseMode,
      });
      return true;
    } catch (error: any) {
      // If markdown parsing fails, retry with plain text
      if (error.message?.includes('parse')) {
        try {
          await this.bot.sendMessage(this.chatId, text);
          return true;
        } catch (retryError) {
          console.error('Failed to send Telegram message:', retryError);
          return false;
        }
      }

      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendTestMessage(): Promise<boolean> {
    return this.sendMessage('✅ Telegram 연결 테스트 성공!');
  }
}

export const telegramClient = new TelegramClient();
