import { UserSettings } from '@short-tube/types';

/**
 * Repository interface for UserSettings data access
 * Abstracts the underlying storage mechanism (FileStorage or Database)
 */
export interface ISettingsRepository {
  /**
   * Retrieve the current user settings
   */
  get(): Promise<UserSettings>;

  /**
   * Update the user settings (partial update)
   */
  update(settings: Partial<UserSettings>): Promise<void>;
}
