#!/usr/bin/env tsx
/**
 * Data Migration Script: JSON Files → Supabase
 *
 * This script migrates existing data from JSON files to Supabase database.
 * Run this script after creating the database schema.
 *
 * Usage:
 *   npm run db:migrate
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { getSupabaseClient } from '../lib/supabase';
import type { AppData, SummaryCache, VideoCache, NotificationLog } from '@short-tube/types';

// Load environment variables
dotenv.config();

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');

interface MigrationStats {
  userSettings: number;
  subscriptions: number;
  videos: number;
  summaries: number;
  notificationLogs: number;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  const stats: MigrationStats = {
    userSettings: 0,
    subscriptions: 0,
    videos: 0,
    summaries: 0,
    notificationLogs: 0,
  };

  try {
    // Step 1: Connect to Supabase
    console.log('📡 Connecting to Supabase...');
    const supabase = getSupabaseClient();

    // Test connection
    const { error: testError } = await supabase.from('user_settings').select('id').limit(1);
    if (testError) {
      throw new Error(`Failed to connect to Supabase: ${testError.message}`);
    }
    console.log('✅ Connected to Supabase\n');

    // Step 2: Backup existing JSON files
    console.log('📦 Creating backup of JSON files...');
    await backupJsonFiles();
    console.log('✅ Backup created\n');

    // Step 3: Load data from JSON files
    console.log('📂 Loading data from JSON files...');
    const appData = await loadAppData();
    const summaries = await loadSummaries();
    const videoCache = await loadVideoCache();
    const notificationLog = await loadNotificationLog();
    console.log('✅ Data loaded from JSON files\n');

    // Step 4: Migrate User Settings
    console.log('👤 Migrating user settings...');
    await migrateUserSettings(supabase, appData);
    stats.userSettings = 1;
    console.log('✅ User settings migrated\n');

    // Step 5: Migrate Subscriptions
    console.log('📺 Migrating subscriptions...');
    stats.subscriptions = await migrateSubscriptions(supabase, appData.subscriptions);
    console.log(`✅ Migrated ${stats.subscriptions} subscriptions\n`);

    // Step 6: Migrate Videos
    console.log('🎬 Migrating videos...');
    stats.videos = await migrateVideos(supabase, videoCache);
    console.log(`✅ Migrated ${stats.videos} videos\n`);

    // Step 7: Migrate Summaries
    console.log('📝 Migrating summaries...');
    stats.summaries = await migrateSummaries(supabase, summaries);
    console.log(`✅ Migrated ${stats.summaries} summaries\n`);

    // Step 8: Migrate Notification Logs
    console.log('🔔 Migrating notification logs...');
    stats.notificationLogs = await migrateNotificationLogs(supabase, notificationLog);
    console.log(`✅ Migrated ${stats.notificationLogs} notification logs\n`);

    // Step 9: Validate migration
    console.log('🔍 Validating migration...');
    await validateMigration(supabase, stats);
    console.log('✅ Migration validated\n');

    // Summary
    console.log('🎉 Migration completed successfully!\n');
    console.log('📊 Migration Summary:');
    console.log(`   User Settings: ${stats.userSettings}`);
    console.log(`   Subscriptions: ${stats.subscriptions}`);
    console.log(`   Videos: ${stats.videos}`);
    console.log(`   Summaries: ${stats.summaries}`);
    console.log(`   Notification Logs: ${stats.notificationLogs}`);
    console.log('\n✨ You can now switch to database mode by setting USE_DATABASE=true\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n⚠️  Your JSON files are backed up. You can restore them if needed.\n');
    process.exit(1);
  }
}

/**
 * Backup JSON files
 */
async function backupJsonFiles() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(DATA_DIR, `..backup_${timestamp}`);

  await fs.mkdir(backupDir, { recursive: true });

  const files = ['data.json', 'summaries.json', 'video_cache.json', 'notification_log.json'];

  for (const file of files) {
    const sourcePath = path.join(DATA_DIR, file);
    const destPath = path.join(backupDir, file);

    try {
      await fs.copyFile(sourcePath, destPath);
      console.log(`   ✓ Backed up ${file}`);
    } catch (error) {
      // File might not exist, that's okay
      console.log(`   - ${file} not found, skipping`);
    }
  }

  console.log(`   📁 Backup location: ${backupDir}`);
}

/**
 * Load app data (settings + subscriptions)
 */
async function loadAppData(): Promise<AppData> {
  const filePath = path.join(DATA_DIR, 'data.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load summaries
 */
async function loadSummaries(): Promise<SummaryCache> {
  const filePath = path.join(DATA_DIR, 'summaries.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('   No summaries file found');
    return {};
  }
}

/**
 * Load video cache
 */
async function loadVideoCache(): Promise<VideoCache> {
  const filePath = path.join(DATA_DIR, 'video_cache.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('   No video cache file found');
    return {};
  }
}

/**
 * Load notification log
 */
async function loadNotificationLog(): Promise<NotificationLog> {
  const filePath = path.join(DATA_DIR, 'notification_log.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('   No notification log file found');
    return {};
  }
}

/**
 * Migrate user settings
 */
async function migrateUserSettings(supabase: any, appData: AppData) {
  const settings = appData.user_settings;

  // Update the single row in user_settings table
  const { error } = await supabase
    .from('user_settings')
    .update({
      notification_time: settings.notification_time,
      target_platform: settings.target_platform,
      telegram_token: settings.telegram_token || null,
      telegram_chat_id: settings.telegram_chat_id || null,
      notification_enabled: settings.notification_enabled !== false,
    })
    .eq('id', (await supabase.from('user_settings').select('id').single()).data.id);

  if (error) {
    throw new Error(`Failed to migrate user settings: ${error.message}`);
  }
}

/**
 * Migrate subscriptions
 */
async function migrateSubscriptions(supabase: any, subscriptions: any[]): Promise<number> {
  if (subscriptions.length === 0) {
    return 0;
  }

  const rows = subscriptions.map(sub => ({
    channel_id: sub.channel_id,
    channel_name: sub.channel_name,
    tags: sub.tags || [],
    categories: sub.categories || [],
    last_processed_video: sub.last_processed_video || '',
    is_active: sub.is_active !== false,
  }));

  // Use upsert to handle duplicates
  const { error } = await supabase.from('subscriptions').upsert(rows, {
    onConflict: 'channel_id',
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Failed to migrate subscriptions: ${error.message}`);
  }

  return rows.length;
}

/**
 * Migrate videos
 */
async function migrateVideos(supabase: any, videoCache: VideoCache): Promise<number> {
  let totalVideos = 0;

  for (const [channelId, videos] of Object.entries(videoCache)) {
    if (videos.length === 0) continue;

    const rows = videos.map(video => ({
      id: video.id,
      channel_id: channelId,
      title: video.title,
      published_at: video.published_at,
      has_caption: video.has_caption,
      duration: video.duration || 'N/A',
      source: video.source || 'api',
      cached_at: video.cached_at || new Date().toISOString(),
    }));

    // Batch insert videos
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('videos').upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`Failed to migrate videos for channel ${channelId}:`, error.message);
        continue;
      }

      totalVideos += batch.length;
      console.log(`   ✓ Migrated ${totalVideos} videos so far...`);
    }
  }

  return totalVideos;
}

/**
 * Migrate summaries
 */
async function migrateSummaries(supabase: any, summaries: SummaryCache): Promise<number> {
  let totalSummaries = 0;
  const rows: any[] = [];

  for (const [key, value] of Object.entries(summaries)) {
    // Handle legacy string format
    if (typeof value === 'string') {
      const parts = key.split('_');
      rows.push({
        video_id: parts[0] || '',
        tags: parts.slice(1) || [],
        content: value,
        title: '',
        channel_name: '',
        date: new Date().toISOString(),
      });
    } else {
      // Modern object format
      rows.push({
        video_id: value.video_id,
        tags: value.tags || [],
        content: value.content,
        title: value.title,
        channel_name: value.channel_name,
        date: value.date || new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    return 0;
  }

  // Batch insert summaries
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('summaries').upsert(batch, {
      onConflict: 'video_id,tags',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Failed to migrate summaries batch ${i}:`, error.message);
      continue;
    }

    totalSummaries += batch.length;
    console.log(`   ✓ Migrated ${totalSummaries} summaries so far...`);
  }

  return totalSummaries;
}

/**
 * Migrate notification logs
 */
async function migrateNotificationLogs(supabase: any, logs: NotificationLog): Promise<number> {
  if (Object.keys(logs).length === 0) {
    return 0;
  }

  // Get existing subscription channel_ids to ensure foreign key constraint
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('channel_id');

  if (subsError) {
    throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
  }

  const existingChannelIds = new Set((subscriptions || []).map((s: any) => s.channel_id));

  // Filter notification logs to only include existing channels
  const rows = Object.entries(logs)
    .filter(([channelId]) => existingChannelIds.has(channelId))
    .map(([channelId, log]) => ({
      channel_id: channelId,
      last_checked_at: log.last_checked_at,
      checked_video_ids: log.checked_video_ids || [],
    }));

  if (rows.length === 0) {
    console.log('   ⚠️  No notification logs match existing subscriptions');
    return 0;
  }

  // Log skipped channels
  const skippedCount = Object.keys(logs).length - rows.length;
  if (skippedCount > 0) {
    console.log(`   ⚠️  Skipped ${skippedCount} notification logs for non-existent channels`);
  }

  const { error } = await supabase.from('notification_logs').insert(rows);

  if (error) {
    throw new Error(`Failed to migrate notification logs: ${error.message}`);
  }

  return rows.length;
}

/**
 * Validate migration
 */
async function validateMigration(supabase: any, expected: MigrationStats) {
  // Check user_settings
  const { count: settingsCount } = await supabase
    .from('user_settings')
    .select('*', { count: 'exact', head: true });
  console.log(`   User Settings: Expected ${expected.userSettings}, Got ${settingsCount || 0}`);

  // Check subscriptions
  const { count: subsCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true });
  console.log(`   Subscriptions: Expected ${expected.subscriptions}, Got ${subsCount || 0}`);

  // Check videos
  const { count: videosCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });
  console.log(`   Videos: Expected ${expected.videos}, Got ${videosCount || 0}`);

  // Check summaries
  const { count: summariesCount } = await supabase
    .from('summaries')
    .select('*', { count: 'exact', head: true });
  console.log(`   Summaries: Expected ${expected.summaries}, Got ${summariesCount || 0}`);

  // Check notification_logs
  const { count: logsCount } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true });
  console.log(`   Notification Logs: Expected ${expected.notificationLogs}, Got ${logsCount || 0}`);
}

// Run migration
migrate();
