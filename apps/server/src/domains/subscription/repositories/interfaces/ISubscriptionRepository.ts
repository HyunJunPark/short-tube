import { Subscription } from '@short-tube/types';

/**
 * Repository interface for Subscription data access
 * Abstracts the underlying storage mechanism (FileStorage or Database)
 */
export interface ISubscriptionRepository {
  /**
   * Retrieve all subscriptions
   */
  findAll(): Promise<Subscription[]>;

  /**
   * Retrieve a subscription by channel ID
   */
  findById(channelId: string): Promise<Subscription | null>;

  /**
   * Create a new subscription
   */
  create(subscription: Subscription): Promise<void>;

  /**
   * Update an existing subscription
   */
  update(channelId: string, updates: Partial<Subscription>): Promise<void>;

  /**
   * Delete a subscription
   */
  delete(channelId: string): Promise<void>;

  /**
   * Check if a subscription exists
   */
  exists(channelId: string): Promise<boolean>;

  /**
   * Find all active subscriptions (where is_active is true)
   */
  findActive(): Promise<Subscription[]>;
}
