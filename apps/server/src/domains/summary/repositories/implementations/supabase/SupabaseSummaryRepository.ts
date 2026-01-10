import { Summary } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../../interfaces';

/**
 * Supabase implementation of ISummaryRepository
 * Uses Supabase client to persist summaries to summaries table
 */
export class SupabaseSummaryRepository implements ISummaryRepository {
  private readonly TABLE_NAME = 'summaries';
  private readonly VIDEOS_TABLE = 'videos';

  constructor(private supabase: SupabaseClient) {}

  async findByVideoId(videoId: string, tags: string[]): Promise<string | null> {
    // Sort tags to ensure consistent ordering
    const sortedTags = [...tags].sort();

    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('content')
      .eq('video_id', videoId)
      .eq('tags', sortedTags)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch summary for video ${videoId}: ${error.message}`);
    }

    return data.content;
  }

  async findByDate(date: string): Promise<Summary[]> {
    // Find summaries where date starts with the given date (YYYY-MM-DD)
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .gte('date', `${date}T00:00:00Z`)
      .lt('date', `${date}T23:59:59Z`)
      .not('video_id', 'like', 'BRIEFING_%')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch summaries by date: ${error.message}`);
    }

    return (data || []).map(row => this.mapToSummary(row));
  }

  async findAll(options?: SummaryQueryOptions): Promise<Summary[]> {
    let query = this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .not('video_id', 'like', 'BRIEFING_%');

    // Apply search filter (full-text search on title and content)
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      // Use OR filter for searching in title or content
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    }

    // Apply channel name filter
    if (options?.channelName) {
      query = query.eq('channel_name', options.channelName);
    }

    // Apply date filters - need to join with videos table
    if (options?.year || options?.month || options?.day) {
      // Get all summaries first, then filter by video published_at
      const { data: allData, error: allError } = await query;

      if (allError) {
        throw new Error(`Failed to fetch summaries: ${allError.message}`);
      }

      // Get video IDs from summaries
      const videoIds = (allData || []).map(s => s.video_id);

      if (videoIds.length === 0) {
        return [];
      }

      // Fetch videos to get published_at dates
      const { data: videos, error: videosError } = await this.supabase
        .from(this.VIDEOS_TABLE)
        .select('id, published_at')
        .in('id', videoIds);

      if (videosError) {
        throw new Error(`Failed to fetch video dates: ${videosError.message}`);
      }

      // Create a map of video_id -> published_at
      const videoDateMap = new Map(
        (videos || []).map(v => [v.id, v.published_at])
      );

      // Filter summaries by date
      const filtered = (allData || []).filter(summary => {
        const publishedAt = videoDateMap.get(summary.video_id);
        if (!publishedAt) return false;

        const publishedDate = new Date(publishedAt);

        if (options.year && publishedDate.getFullYear() !== options.year) {
          return false;
        }
        if (options.month && publishedDate.getMonth() + 1 !== options.month) {
          return false;
        }
        if (options.day && publishedDate.getDate() !== options.day) {
          return false;
        }

        return true;
      });

      // Sort by date descending
      filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || filtered.length;

      return filtered
        .slice(offset, offset + limit)
        .map(row => this.mapToSummary(row));
    }

    // No date filtering - apply sorting and pagination to query
    query = query.order('date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch summaries: ${error.message}`);
    }

    return (data || []).map(row => this.mapToSummary(row));
  }

  async save(entity: SummaryEntity): Promise<void> {
    // Sort tags to ensure consistent ordering
    const sortedTags = [...entity.tags].sort();

    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .upsert({
        video_id: entity.video_id,
        tags: sortedTags,
        content: entity.content,
        title: entity.title,
        channel_name: entity.channel_name,
        date: entity.date,
      }, {
        onConflict: 'video_id,tags',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save summary: ${error.message}`);
    }
  }

  async findBriefing(date: string): Promise<Summary | null> {
    const briefingId = `BRIEFING_${date}`;

    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('video_id', briefingId)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch briefing for date ${date}: ${error.message}`);
    }

    return this.mapToSummary(data);
  }

  async deleteByVideoId(videoId: string, tags: string[]): Promise<void> {
    // Sort tags to ensure consistent ordering
    const sortedTags = [...tags].sort();

    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('video_id', videoId)
      .eq('tags', sortedTags);

    if (error) {
      throw new Error(`Failed to delete summary for video ${videoId}: ${error.message}`);
    }
  }

  /**
   * Map database row to Summary domain type
   */
  private mapToSummary(row: any): Summary {
    return {
      content: row.content,
      title: row.title,
      channel_name: row.channel_name,
      video_id: row.video_id,
      tags: row.tags || [],
      date: row.date,
    };
  }
}
