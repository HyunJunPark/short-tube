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
  'gemini-3-flash-preview', // 1순위: Gemini 3 Flash (프리뷰), 최신 & 가장 강력  
  'gemini-2.0-flash',       // 2순위: Gemini 2.0 Flash (안정적)
  'gemini-2.0-flash-lite',  // 3순위: Gemini 2.0 Flash Lite (경량)
  'gemini-1.5-flash',       // 4순위: Gemini 1.5 Flash (이전 버전)
] as const;

export const DEFAULT_NOTIFICATION_TIME = '21:30';
export const DEFAULT_PLATFORM = 'Telegram';

export const MAX_TRANSCRIPT_LENGTH = 10000;
export const AUDIO_PROCESSING_TIMEOUT = 30000;

export const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
