/**
 * Dependency Injection Setup
 *
 * This file initializes all repositories and services.
 * It acts as the composition root, where dependencies are wired together.
 *
 * The repositories are instantiated as singletons here and exported for use
 * throughout the application.
 *
 * Environment variable: USE_DATABASE
 * - false (default): Use FileStorage-based repositories
 * - true: Use Supabase database repositories
 */

import { FileStorage } from '../lib/file-storage';
import { getSupabaseClient } from '../lib/supabase';

// File-based repositories
import { FileSubscriptionRepository } from '../domains/subscription/repositories/implementations';
import { FileSettingsRepository } from '../domains/settings/repositories/implementations';
import { FileSummaryRepository } from '../domains/summary/repositories/implementations';
import { FileVideoCacheRepository } from '../domains/video-cache/repositories/implementations';
import { NotificationLogFileStorage } from '../domains/notification-log/file-storage';

// Supabase repositories
import { SupabaseSubscriptionRepository } from '../domains/subscription/repositories/implementations';
import { SupabaseSettingsRepository } from '../domains/settings/repositories/implementations';
import { SupabaseSummaryRepository } from '../domains/summary/repositories/implementations';
import { SupabaseVideoCacheRepository } from '../domains/video-cache/repositories/implementations';
import { SupabaseNotificationLogRepository } from '../domains/notification-log/repositories/supabase';

import { DataService } from '../services/data.service';
import type { ISubscriptionRepository } from '../domains/subscription/repositories';
import type { ISettingsRepository } from '../domains/settings/repositories';
import type { ISummaryRepository } from '../domains/summary/repositories';
import type { IVideoCacheRepository } from '../domains/video-cache/repositories';
import type { INotificationLogRepository } from '../domains/notification-log/repositories';

const USE_DATABASE = process.env.USE_DATABASE === 'true';

console.log(`[DI] Storage mode: ${USE_DATABASE ? 'Supabase Database' : 'File System'}`);

let subscriptionRepository: ISubscriptionRepository;
let settingsRepository: ISettingsRepository;
let summaryRepository: ISummaryRepository;
let videoCacheRepository: IVideoCacheRepository;
let notificationLogRepository: INotificationLogRepository;

if (USE_DATABASE) {
  // Initialize Supabase repositories
  const supabase = getSupabaseClient();

  subscriptionRepository = new SupabaseSubscriptionRepository(supabase);
  settingsRepository = new SupabaseSettingsRepository(supabase);
  summaryRepository = new SupabaseSummaryRepository(supabase);
  videoCacheRepository = new SupabaseVideoCacheRepository(supabase);
  notificationLogRepository = new SupabaseNotificationLogRepository(supabase);

  console.log('[DI] Supabase repositories initialized');
} else {
  // Initialize File-based repositories
  const fileStorage = new FileStorage();

  subscriptionRepository = new FileSubscriptionRepository(fileStorage);
  settingsRepository = new FileSettingsRepository(fileStorage);
  summaryRepository = new FileSummaryRepository(fileStorage);
  videoCacheRepository = new FileVideoCacheRepository(fileStorage);
  notificationLogRepository = new NotificationLogFileStorage();

  console.log('[DI] File-based repositories initialized');
}

// Initialize DataService with repositories
const dataService = new DataService(
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository
);

// Export singletons
export {
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository,
  notificationLogRepository,
  dataService,
};

// Export types for use in other modules
export type { ISubscriptionRepository } from '../domains/subscription/repositories';
export type { ISettingsRepository } from '../domains/settings/repositories';
export type { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../domains/summary/repositories';
export type { IVideoCacheRepository } from '../domains/video-cache/repositories';
export type { INotificationLogRepository } from '../domains/notification-log/repositories';
