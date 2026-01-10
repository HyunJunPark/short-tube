import { Summary } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../../interfaces';

/**
 * Supabase-based implementation of ISummaryRepository
 * Uses Supabase to persist summaries to summaries table
 */
export class SupabaseSummaryRepository implements ISummaryRepository {
  private readonly TABLE_NAME = 'summaries';

  constructor(private supabase: SupabaseClient) {}

  async findByVideoId(videoId: string, tags: string[]): Promise<string | null> {
    const sortedTags = [...tags].sort();

    // PostgreSQL array equality via PostgREST
    // Format: {tag1,tag2,tag3} for PostgreSQL TEXT[] type
    const pgArrayLiteral = `{${sortedTags.join(',')}}`;

    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('content')
      .eq('video_id', videoId)
      .eq('tags', pgArrayLiteral)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }

    return data.content;
  }

  async findByDate(date: string): Promise<Summary[]> {
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;

    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
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

    // Apply search filter
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    // Apply channel name filter
    if (options?.channelName) {
      query = query.eq('channel_name', options.channelName);
    }

    // Date filtering (year/month/day)
    if (options?.year || options?.month || options?.day) {
      // Fetch all matching summaries first
      const { data: allData, error: allError } = await query;

      if (allError) {
        throw new Error(`Failed to fetch summaries: ${allError.message}`);
      }

      // Extract video IDs
      const videoIds = (allData || []).map(s => s.video_id);

      if (videoIds.length === 0) {
        return [];
      }

      // Fetch video metadata for published_at
      const { data: videos, error: videoError } = await this.supabase
        .from('videos')
        .select('id, published_at')
        .in('id', videoIds);

      if (videoError) {
        throw new Error(`Failed to fetch videos: ${videoError.message}`);
      }

      // Create video date lookup map
      const videoDateMap = new Map((videos || []).map(v => [v.id, v.published_at]));

      // Filter by date components
      const filtered = (allData || []).filter(summary => {
        const publishedAt = videoDateMap.get(summary.video_id);
        if (!publishedAt) return false;

        const date = new Date(publishedAt);
        if (options.year && date.getFullYear() !== options.year) return false;
        if (options.month && date.getMonth() + 1 !== options.month) return false;
        if (options.day && date.getDate() !== options.day) return false;

        return true;
      });

      // Sort by date descending
      filtered.sort((a, b) => b.date.localeCompare(a.date));

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || filtered.length;

      return filtered.slice(offset, offset + limit).map(row => this.mapToSummary(row));
    }

    // No date filter - use database sorting
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
    const sortedTags = [...entity.tags].sort();

    const summaryData = {
      video_id: entity.video_id,
      tags: sortedTags,
      content: entity.content,
      title: entity.title,
      channel_name: entity.channel_name,
      date: entity.date,
    };

    // Try INSERT first
    const { error: insertError } = await this.supabase
      .from(this.TABLE_NAME)
      .insert(summaryData);

    if (insertError) {
      // If unique violation, UPDATE instead
      if (insertError.code === '23505') {
        // PostgreSQL array equality via PostgREST
        // Format: {tag1,tag2,tag3} for PostgreSQL TEXT[] type
        const pgArrayLiteral = `{${sortedTags.join(',')}}`;

        const { error: updateError } = await this.supabase
          .from(this.TABLE_NAME)
          .update({
            content: summaryData.content,
            title: summaryData.title,
            channel_name: summaryData.channel_name,
            date: summaryData.date,
          })
          .eq('video_id', entity.video_id)
          .eq('tags', pgArrayLiteral);

        if (updateError) {
          throw new Error(`Failed to update summary: ${updateError.message}`);
        }
      } else {
        throw new Error(`Failed to save summary: ${insertError.message}`);
      }
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
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch briefing: ${error.message}`);
    }

    return this.mapToSummary(data);
  }

  async deleteByVideoId(videoId: string, tags: string[]): Promise<void> {
    const sortedTags = [...tags].sort();

    // PostgreSQL array equality via PostgREST
    // Format: {tag1,tag2,tag3} for PostgreSQL TEXT[] type
    // Empty array should be {} not ""
    const pgArrayLiteral = `{${sortedTags.join(',')}}`;

    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('video_id', videoId)
      .eq('tags', pgArrayLiteral);

    if (error) {
      throw new Error(`Failed to delete summary: ${error.message}`);
    }
  }

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
