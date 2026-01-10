import { Subscription } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISubscriptionRepository } from '../../interfaces';

/**
 * Supabase implementation of ISubscriptionRepository
 * Uses Supabase client to persist subscriptions to subscriptions table
 */
export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  private readonly TABLE_NAME = 'subscriptions';

  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return (data || []).map(row => this.mapToSubscription(row));
  }

  async findById(channelId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return this.mapToSubscription(data);
  }

  async create(subscription: Subscription): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .insert({
        channel_id: subscription.channel_id,
        channel_name: subscription.channel_name,
        tags: subscription.tags || [],
        categories: subscription.categories || [],
        last_processed_video: subscription.last_processed_video || '',
        is_active: subscription.is_active !== false,
      });

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`Subscription with channel_id ${subscription.channel_id} already exists`);
      }
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async update(channelId: string, updates: Partial<Subscription>): Promise<void> {
    // Build update object with only provided fields
    const updateData: any = {};

    if (updates.channel_name !== undefined) {
      updateData.channel_name = updates.channel_name;
    }
    if (updates.tags !== undefined) {
      updateData.tags = updates.tags;
    }
    if (updates.categories !== undefined) {
      updateData.categories = updates.categories;
    }
    if (updates.last_processed_video !== undefined) {
      updateData.last_processed_video = updates.last_processed_video;
    }
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('channel_id', channelId);

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async delete(channelId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('channel_id', channelId);

    if (error) {
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  }

  async exists(channelId: string): Promise<boolean> {
    const subscription = await this.findById(channelId);
    return subscription !== null;
  }

  async findActive(): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`);
    }

    return (data || []).map(row => this.mapToSubscription(row));
  }

  /**
   * Map database row to Subscription domain type
   */
  private mapToSubscription(row: any): Subscription {
    return {
      channel_id: row.channel_id,
      channel_name: row.channel_name,
      tags: row.tags || [],
      categories: row.categories || [],
      last_processed_video: row.last_processed_video || '',
      is_active: row.is_active !== false,
    };
  }
}
