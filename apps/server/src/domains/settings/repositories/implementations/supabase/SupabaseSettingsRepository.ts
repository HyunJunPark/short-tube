import { UserSettings } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { ISettingsRepository } from '../../interfaces';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../../../../../utils/constants';

/**
<<<<<<< HEAD
 * Supabase implementation of ISettingsRepository
 * Uses Supabase client to persist settings to user_settings table
 * Note: user_settings table has only one row (singleton pattern)
=======
 * Supabase-based implementation of ISettingsRepository
 * Uses Supabase to persist settings to user_settings table (singleton pattern)
>>>>>>> migration_superbase
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
<<<<<<< HEAD
      // If no settings exist, return default
      if (error.code === 'PGRST116') {
        return this.getDefaultSettings();
      }
      throw new Error(`Failed to fetch user settings: ${error.message}`);
=======
      if (error.code === 'PGRST116') {
        // No rows found - return default settings
        return {
          notification_time: DEFAULT_NOTIFICATION_TIME,
          target_platform: DEFAULT_PLATFORM,
          notification_enabled: true,
        };
      }
      throw new Error(`Failed to fetch settings: ${error.message}`);
>>>>>>> migration_superbase
    }

    return this.mapToUserSettings(data);
  }

  async update(settings: Partial<UserSettings>): Promise<void> {
<<<<<<< HEAD
    // Get current settings to find the ID
    const currentSettings = await this.get();

    // Since we're using a single-row pattern, we need to find the existing row
    const { data: existingRow } = await this.supabase
=======
    // Check if a row exists
    const { data: existing } = await this.supabase
>>>>>>> migration_superbase
      .from(this.TABLE_NAME)
      .select('id')
      .limit(1)
      .single();

<<<<<<< HEAD
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
=======
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

>>>>>>> migration_superbase
  private mapToUserSettings(row: any): UserSettings {
    return {
      notification_time: row.notification_time,
      target_platform: row.target_platform,
      telegram_token: row.telegram_token || undefined,
      telegram_chat_id: row.telegram_chat_id || undefined,
      notification_enabled: row.notification_enabled,
    };
  }
<<<<<<< HEAD

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
=======
>>>>>>> migration_superbase
}
