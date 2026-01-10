import { UserSettings } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISettingsRepository } from '../../interfaces';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../../../../../utils/constants';

/**
 * Supabase-based implementation of ISettingsRepository
 * Uses Supabase to persist settings to user_settings table (singleton pattern)
 */
export class SupabaseSettingsRepository implements ISettingsRepository {
  private readonly TABLE_NAME = 'user_settings';

  constructor(private supabase: SupabaseClient) {}

  async get(): Promise<UserSettings> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return default settings
        return {
          notification_time: DEFAULT_NOTIFICATION_TIME,
          target_platform: DEFAULT_PLATFORM,
          notification_enabled: true,
        };
      }
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return this.mapToUserSettings(data);
  }

  async update(settings: Partial<UserSettings>): Promise<void> {
    // Check if a row exists
    const { data: existing } = await this.supabase
      .from(this.TABLE_NAME)
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      // Update existing row
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .update(settings)
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update settings: ${error.message}`);
      }
    } else {
      // Insert new row with defaults
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          notification_time: DEFAULT_NOTIFICATION_TIME,
          target_platform: DEFAULT_PLATFORM,
          notification_enabled: true,
          ...settings,
        });

      if (error) {
        throw new Error(`Failed to create settings: ${error.message}`);
      }
    }
  }

  private mapToUserSettings(row: any): UserSettings {
    return {
      notification_time: row.notification_time,
      target_platform: row.target_platform,
      telegram_token: row.telegram_token || undefined,
      telegram_chat_id: row.telegram_chat_id || undefined,
      notification_enabled: row.notification_enabled,
    };
  }
}
