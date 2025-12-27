export const AVAILABLE_TAGS = [
  'AI',
  'ChatGPT',
  '신기술',
  '부동산',
  '주식',
  '코딩',
  '뉴스',
  '비즈니스',
  '동기부여',
] as const;

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-flash',
] as const;

export const DEFAULT_NOTIFICATION_TIME = '21:30';
export const DEFAULT_PLATFORM = 'Telegram';

export const MAX_TRANSCRIPT_LENGTH = 10000;
export const AUDIO_PROCESSING_TIMEOUT = 30000;

export const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
