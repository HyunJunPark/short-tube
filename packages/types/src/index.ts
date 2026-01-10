// ========================================
// User Settings
// ========================================

export interface UserSettings {
  notification_time: string; // "HH:MM" format
  target_platform: 'Telegram' | 'Slack' | 'Discord';
  telegram_token?: string;
  telegram_chat_id?: string;
  notification_enabled?: boolean; // Enable/disable daily notifications
}

// ========================================
// Subscription
// ========================================

export interface Subscription {
  channel_id: string;
  channel_name: string;
  tags: string[]; // 요약 키워드
  categories: string[]; // 채널 분류 (새로 추가)
  last_processed_video: string;
  is_active: boolean;
}

// ========================================
// Video
// ========================================

export type VideoSource = 'api' | 'rss';

export interface Video {
  id: string;
  title: string;
  published_at: string; // ISO 8601 format
  has_caption: boolean;
  duration: string; // "HH:MM:SS" format or "N/A" for RSS
  cached_at?: string; // ISO 8601 format - when this video was cached
  source?: VideoSource; // 'api' or 'rss' - indicates data source
  is_short?: boolean; // true if the video is a YouTube Short
}

// ========================================
// Summary
// ========================================

export interface Summary {
  content: string;
  title: string;
  channel_name: string;
  video_id: string;
  tags: string[];
  date: string; // "YYYY-MM-DD HH:MM:SS" format
}

export interface SummaryCache {
  [key: string]: Summary | string; // key: "videoId_tag1,tag2" | value: Summary object or legacy string
}

// ========================================
// Briefing
// ========================================

export interface Briefing extends Summary {
  // Briefing is a special type of summary
  // video_id format: "BRIEFING_YYYY-MM-DD"
  // tags: ["briefing"]
}

// ========================================
// Application Data
// ========================================

export interface AppData {
  user_settings: UserSettings;
  subscriptions: Subscription[];
}

// ========================================
// Video Cache
// ========================================

export interface VideoCache {
  [channelId: string]: Video[];
}

// ========================================
// Notification Log
// ========================================

export interface NotificationLog {
  [channelId: string]: {
    last_checked_at: string; // ISO 8601 format - when user last checked notifications
    checked_video_ids: string[]; // Video IDs that have been notified
  };
}

// ========================================
// Channel Info (from YouTube API)
// ========================================

export interface ChannelInfo {
  channel_id: string;
  channel_name: string;
  latest_video_id: string;
  description?: string;
  topicCategories?: string[];
}

// ========================================
// API Request/Response Types
// ========================================

// Subscription endpoints
export interface AddSubscriptionRequest {
  channelInput: string; // URL or handle (@username)
}

export interface UpdateSubscriptionRequest {
  tags?: string[];
  is_active?: boolean;
}

// Summary endpoints
export interface GenerateSummaryRequest {
  videoId: string;
  tags: string[];
}

export interface GetSummariesQuery {
  search?: string;
  channelName?: string;
  date?: string;
  year?: number;
  month?: number;
  day?: number;
  limit?: number;
  offset?: number;
}

// Briefing endpoints
export interface GenerateBriefingRequest {
  date: string; // "YYYY-MM-DD"
}

// Settings endpoints
export interface UpdateSettingsRequest {
  notification_time?: string;
  target_platform?: 'Telegram' | 'Slack' | 'Discord';
  telegram_token?: string;
  telegram_chat_id?: string;
}

// Video endpoints
export interface GetVideosQuery {
  days?: number;
}

export interface VideoStatsResponse {
  total_videos: number;
  today_video_count: number;
}

// ========================================
// Error Types
// ========================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ========================================
// Service Response Types
// ========================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========================================
// Available Tags (요약 키워드)
// ========================================

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

export type AvailableTag = typeof AVAILABLE_TAGS[number];

// ========================================
// Available Categories (채널 분류)
// ========================================

export const AVAILABLE_CATEGORIES = [
  'AI 기술',
  '프로그래밍',
  '경제/재테크',
  '뉴스/시사',
  '과학',
  '정치',
  '비즈니스',
  '자기계발',
  '엔터테인먼트',
] as const;

export type AvailableCategory = typeof AVAILABLE_CATEGORIES[number];

// ========================================
// Gemini Models
// ========================================

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-flash',
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];
