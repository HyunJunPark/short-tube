#!/usr/bin/env tsx
/**
 * Export Data from Supabase to JSON Files
 *
 * This script exports data from Supabase back to JSON files.
 * Useful for rollback scenarios or creating backups.
 *
 * Usage:
 *   npm run db:export
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { getSupabaseClient } from '../lib/supabase';
import type { AppData, SummaryCache, VideoCache, NotificationLog } from '@short-tube/types';

// Load environment variables
dotenv.config();

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');

async function exportData() {
  console.log('📤 Exporting data from Supabase to JSON files...\n');

  try {
    // Connect to Supabase
    console.log('📡 Connecting to Supabase...');
    const supabase = getSupabaseClient();
    console.log('✅ Connected\n');

    // Export user settings
    console.log('👤 Exporting user settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (settingsError) {
      throw new Error(`Failed to export user settings: ${settingsError.message}`);
    }
    console.log('✅ User settings exported\n');

    // Export subscriptions
    console.log('📺 Exporting subscriptions...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: true });

    if (subsError) {
      throw new Error(`Failed to export subscriptions: ${subsError.message}`);
    }
    console.log(`✅ Exported ${subscriptions?.length || 0} subscriptions\n`);

    // Create AppData
    const appData: AppData = {
      user_settings: {
        notification_time: settings.notification_time,
        target_platform: settings.target_platform,
        telegram_token: settings.telegram_token || undefined,
        telegram_chat_id: settings.telegram_chat_id || undefined,
        notification_enabled: settings.notification_enabled,
      },
      subscriptions: (subscriptions || []).map((sub: any) => ({
        channel_id: sub.channel_id,
        channel_name: sub.channel_name,
        tags: sub.tags || [],
        categories: sub.categories || [],
        last_processed_video: sub.last_processed_video || '',
        is_active: sub.is_active !== false,
      })),
    };

    // Export videos
    console.log('🎬 Exporting videos...');
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .order('published_at', { ascending: false });

    if (videosError) {
      throw new Error(`Failed to export videos: ${videosError.message}`);
    }

    // Group videos by channel_id
    const videoCache: VideoCache = {};
    for (const video of videos || []) {
      if (!videoCache[video.channel_id]) {
        videoCache[video.channel_id] = [];
      }
      videoCache[video.channel_id].push({
        id: video.id,
        title: video.title,
        published_at: video.published_at,
        has_caption: video.has_caption,
        duration: video.duration,
        cached_at: video.cached_at,
        source: video.source,
      });
    }
    console.log(`✅ Exported ${videos?.length || 0} videos\n`);

    // Export summaries
    console.log('📝 Exporting summaries...');
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('*')
      .order('date', { ascending: false });

    if (summariesError) {
      throw new Error(`Failed to export summaries: ${summariesError.message}`);
    }

    // Convert summaries to cache format
    const summaryCache: SummaryCache = {};
    for (const summary of summaries || []) {
      // Create cache key: videoId_tag1,tag2 or videoId_none
      const tags = (summary.tags || []).sort();
      const tagKey = tags.length > 0 ? tags.join(',') : 'none';
      const cacheKey = `${summary.video_id}_${tagKey}`;

      summaryCache[cacheKey] = {
        content: summary.content,
        title: summary.title,
        channel_name: summary.channel_name,
        video_id: summary.video_id,
        tags: summary.tags || [],
        date: summary.date,
      };
    }
    console.log(`✅ Exported ${summaries?.length || 0} summaries\n`);

    // Export notification logs
    console.log('🔔 Exporting notification logs...');
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*');

    if (logsError) {
      throw new Error(`Failed to export notification logs: ${logsError.message}`);
    }

    // Convert logs to notification log format
    const notificationLog: NotificationLog = {};
    for (const log of logs || []) {
      notificationLog[log.channel_id] = {
        last_checked_at: log.last_checked_at,
        checked_video_ids: log.checked_video_ids || [],
      };
    }
    console.log(`✅ Exported ${logs?.length || 0} notification logs\n`);

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write JSON files
    console.log('💾 Writing JSON files...');

    await fs.writeFile(
      path.join(DATA_DIR, 'data.json'),
      JSON.stringify(appData, null, 2),
      'utf-8'
    );
    console.log('   ✓ data.json');

    await fs.writeFile(
      path.join(DATA_DIR, 'summaries.json'),
      JSON.stringify(summaryCache, null, 2),
      'utf-8'
    );
    console.log('   ✓ summaries.json');

    await fs.writeFile(
      path.join(DATA_DIR, 'video_cache.json'),
      JSON.stringify(videoCache, null, 2),
      'utf-8'
    );
    console.log('   ✓ video_cache.json');

    await fs.writeFile(
      path.join(DATA_DIR, 'notification_log.json'),
      JSON.stringify(notificationLog, null, 2),
      'utf-8'
    );
    console.log('   ✓ notification_log.json');

    console.log();
    console.log('🎉 Export completed successfully!');
    console.log();
    console.log('📁 Exported files location:', DATA_DIR);
    console.log();
    console.log('You can now switch to file mode by setting USE_DATABASE=false');
    console.log();
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

// Run export
exportData();
