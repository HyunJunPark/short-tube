import { UserSettings } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISettingsRepository } from '../../interfaces';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../../../../../utils/constants';

/**
 * Supabase implementation of ISettingsRepository
 * Uses Supabase client to persist settings to user_settings table
 * Note: user_settings table has only one row (singleton pattern)
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
      // If no settings exist, return default
      if (error.code === 'PGRST116') {
        return this.getDefaultSettings();
      }
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }

    return this.mapToUserSettings(data);
  }

  async update(settings: Partial<UserSettings>): Promise<void> {
    // Get current settings to find the ID
    const currentSettings = await this.get();

    // Since we're using a single-row pattern, we need to find the existing row
    const { data: existingRow } = await this.supabase
      .from(this.TABLE_NAME)
      .select('id')
      .limit(1)
      .single();

    if (!existingRow) {
      // If no row exists, insert a new one
      const { error: insertError } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          notification_time: settings.notification_time || DEFAULT_NOTIFICATION_TIME,
          target_platform: settings.target_platform || DEFAULT_PLATFORM,
          telegram_token: settings.telegram_token || '',
          telegram_chat_id: settings.telegram_chat_id || '',
          notification_enabled: settings.notification_enabled ?? true,
        });

      if (insertError) {
        throw new Error(`Failed to insert user settings: ${insertError.message}`);
      }
      return;
    }

    // Update the existing row
    const { error: updateError } = await this.supabase
      .from(this.TABLE_NAME)
      .update({
        ...(settings.notification_time !== undefined && { notification_time: settings.notification_time }),
        ...(settings.target_platform !== undefined && { target_platform: settings.target_platform }),
        ...(settings.telegram_token !== undefined && { telegram_token: settings.telegram_token }),
        ...(settings.telegram_chat_id !== undefined && { telegram_chat_id: settings.telegram_chat_id }),
        ...(settings.notification_enabled !== undefined && { notification_enabled: settings.notification_enabled }),
      })
      .eq('id', existingRow.id);

    if (updateError) {
      throw new Error(`Failed to update user settings: ${updateError.message}`);
    }
  }

  /**
   * Map database row to UserSettings domain type
   */
  private mapToUserSettings(row: any): UserSettings {
    return {
      notification_time: row.notification_time,
      target_platform: row.target_platform,
      telegram_token: row.telegram_token || undefined,
      telegram_chat_id: row.telegram_chat_id || undefined,
      notification_enabled: row.notification_enabled,
    };
  }

  /**
   * Get default settings when no settings exist
   */
  private getDefaultSettings(): UserSettings {
    return {
      notification_time: DEFAULT_NOTIFICATION_TIME,
      target_platform: DEFAULT_PLATFORM,
      telegram_token: '',
      telegram_chat_id: '',
      notification_enabled: true,
    };
  }
}
