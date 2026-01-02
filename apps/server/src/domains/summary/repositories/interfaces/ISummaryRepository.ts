import { Summary } from '@short-tube/types';

/**
 * Entity representing a Summary with all metadata
 */
export interface SummaryEntity {
  content: string;
  title: string;
  channel_name: string;
  video_id: string;
  tags: string[];
  date: string; // ISO 8601 format or YYYY-MM-DD HH:MM:SS
}

/**
 * Query options for finding summaries
 */
export interface SummaryQueryOptions {
  search?: string;
  channelName?: string;
  year?: number;
  month?: number;
  day?: number;
  limit?: number;
  offset?: number;
}

/**
 * Repository interface for Summary data access
 * Abstracts the underlying storage mechanism (FileStorage or Database)
 */
export interface ISummaryRepository {
  /**
   * Find a summary by video ID and tags
   * Returns the summary content or null if not found
   */
  findByVideoId(videoId: string, tags: string[]): Promise<string | null>;

  /**
   * Find all summaries for a specific date (YYYY-MM-DD format)
   */
  findByDate(date: string): Promise<Summary[]>;

  /**
   * Find all summaries with optional filtering and pagination
   */
  findAll(options?: SummaryQueryOptions): Promise<Summary[]>;

  /**
   * Save a new summary or update an existing one
   */
  save(entity: SummaryEntity): Promise<void>;

  /**
   * Find the daily briefing summary for a specific date
   */
  findBriefing(date: string): Promise<Summary | null>;

  /**
   * Delete a summary by video ID and tags
   */
  deleteByVideoId(videoId: string, tags: string[]): Promise<void>;
}
