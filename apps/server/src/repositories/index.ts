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
 * - true: Use Database-based repositories (when implemented)
 */

import { FileStorage } from '../lib/file-storage';
import { FileSubscriptionRepository } from '../domains/subscription/repositories/implementations';
import { FileSettingsRepository } from '../domains/settings/repositories/implementations';
import { FileSummaryRepository } from '../domains/summary/repositories/implementations';
import { FileVideoCacheRepository } from '../domains/video-cache/repositories/implementations';
import { DataService } from '../services/data.service';

// Initialize FileStorage singleton
const fileStorage = new FileStorage();

// Initialize File-based repositories
const subscriptionRepository = new FileSubscriptionRepository(fileStorage);
const settingsRepository = new FileSettingsRepository(fileStorage);
const summaryRepository = new FileSummaryRepository(fileStorage);
const videoCacheRepository = new FileVideoCacheRepository(fileStorage);

// Initialize DataService with repositories
const dataService = new DataService(
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository
);

// Export singletons
export {
  fileStorage,
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository,
  dataService,
};

// Export types for use in other modules
export type { ISubscriptionRepository } from '../domains/subscription/repositories';
export type { ISettingsRepository } from '../domains/settings/repositories';
export type { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../domains/summary/repositories';
export type { IVideoCacheRepository } from '../domains/video-cache/repositories';
