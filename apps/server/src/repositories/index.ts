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
import { NotificationLogFileStorage } from '../domains/notification-log/file-storage';
import { FileAuthRepository } from '../domains/auth/repositories/implementations';
import { DataService } from '../services/data.service';
import { AuthService } from '../domains/auth/services/auth.service';

// Initialize FileStorage singleton
const fileStorage = new FileStorage();

// Initialize File-based repositories
const subscriptionRepository = new FileSubscriptionRepository(fileStorage);
const settingsRepository = new FileSettingsRepository(fileStorage);
const summaryRepository = new FileSummaryRepository(fileStorage);
const videoCacheRepository = new FileVideoCacheRepository(fileStorage);
const notificationLogRepository = new NotificationLogFileStorage();
const authRepository = new FileAuthRepository(fileStorage);

// Initialize DataService with repositories
const dataService = new DataService(
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository
);

// Initialize AuthService
const authService = new AuthService(authRepository);

// Export singletons
export {
  fileStorage,
  subscriptionRepository,
  settingsRepository,
  summaryRepository,
  videoCacheRepository,
  notificationLogRepository,
  authRepository,
  dataService,
  authService,
};

// Export types for use in other modules
export type { ISubscriptionRepository } from '../domains/subscription/repositories';
export type { ISettingsRepository } from '../domains/settings/repositories';
export type { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../domains/summary/repositories';
export type { IVideoCacheRepository } from '../domains/video-cache/repositories';
export type { INotificationLogRepository } from '../domains/notification-log/repositories';
export type { IAuthRepository } from '../domains/auth/repositories';
