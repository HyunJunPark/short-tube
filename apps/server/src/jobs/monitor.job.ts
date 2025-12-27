import { Subscription, Video } from '@short-tube/types';
import { dataService } from '../services/data.service';
import { youtubeService } from '../services/youtube.service';
import { geminiService } from '../services/gemini.service';
import { notifierService } from '../services/notifier.service';
import { RATE_LIMIT_DELAY } from '../utils/constants';

export class MonitorJob {
  private isRunning: boolean = false;
  private lastRunDate: string = '';

  /**
   * Run monitoring job
   * @param sendBriefing Whether to generate and send daily briefing
   */
  async run(sendBriefing: boolean = false): Promise<void> {
    if (this.isRunning) {
      console.log('Monitor job already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      console.log(`\n🔄 Starting monitor job (briefing: ${sendBriefing})...`);

      const data = await dataService.loadData();

      // Process each active subscription
      for (const subscription of data.subscriptions) {
        if (!subscription.is_active) {
          console.log(`⏭️  Skipping inactive subscription: ${subscription.channel_name}`);
          continue;
        }

        console.log(`\n📺 Processing ${subscription.channel_name}...`);

        try {
          await this.processSubscription(subscription);
        } catch (error) {
          console.error(`❌ Error processing ${subscription.channel_name}:`, error);
          // Continue with next subscription
        }

        // Rate limiting: wait between subscriptions
        await this.sleep(RATE_LIMIT_DELAY);
      }

      // Save updated data (with new last_processed_video values)
      await dataService.saveData(data);

      // Generate and send briefing if requested
      if (sendBriefing) {
        console.log('\n📅 Generating daily briefing...');
        const briefingJob = new BriefingJob();
        await briefingJob.run();
      }

      console.log('\n✅ Monitor job completed successfully');
    } catch (error) {
      console.error('❌ Monitor job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single subscription
   */
  private async processSubscription(subscription: Subscription): Promise<void> {
    // Get recent videos (last 2 days)
    const videos = await youtubeService.getRecentVideos(subscription.channel_id, 2);

    if (videos.length === 0) {
      console.log('  No recent videos found');
      return;
    }

    // Filter new videos (after last_processed_video)
    const newVideos = this.filterNewVideos(videos, subscription.last_processed_video);

    if (newVideos.length === 0) {
      console.log('  No new videos since last check');
      return;
    }

    console.log(`  Found ${newVideos.length} new video(s)`);

    // Process each new video
    for (const video of newVideos) {
      console.log(`  📹 Processing: ${video.title}`);

      try {
        await this.processVideo(video, subscription);

        // Update last_processed_video
        subscription.last_processed_video = video.id;

        // Rate limiting: wait between videos
        await this.sleep(RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`    ❌ Error processing video ${video.id}:`, error);
        // Continue with next video
      }
    }
  }

  /**
   * Process a single video
   */
  private async processVideo(video: Video, subscription: Subscription): Promise<void> {
    // Check if summary already exists
    const cached = await dataService.getCachedSummary(video.id, subscription.tags);

    let summary: string;

    if (cached) {
      console.log('    ✓ Using cached summary');
      summary = cached;
    } else {
      console.log('    ⚙️  Generating new summary...');

      try {
        summary = await geminiService.getSummaryWithFallback(video.id, subscription.tags);

        // Save summary
        await dataService.saveSummary(
          video.id,
          subscription.tags,
          summary,
          video.title,
          subscription.channel_name
        );

        console.log('    ✓ Summary generated and saved');
      } catch (error) {
        console.error('    ❌ Summary generation failed:', error);
        return; // Skip notification if summary failed
      }
    }

    // Send Telegram notification
    if (notifierService.isConfigured()) {
      console.log('    📤 Sending Telegram notification...');

      const sent = await notifierService.sendVideoSummary(video, summary, subscription);

      if (sent) {
        console.log('    ✓ Notification sent');
      } else {
        console.log('    ⚠️  Notification failed');
      }
    } else {
      console.log('    ⏭️  Telegram not configured, skipping notification');
    }
  }

  /**
   * Filter videos that are newer than last_processed_video
   */
  private filterNewVideos(videos: Video[], lastProcessedId: string): Video[] {
    if (!lastProcessedId) {
      // No last processed video, return all
      return videos;
    }

    // Find index of last processed video
    const lastIndex = videos.findIndex(v => v.id === lastProcessedId);

    if (lastIndex === -1) {
      // Last processed video not found, return all
      return videos;
    }

    // Return videos before the last processed one (newer videos)
    return videos.slice(0, lastIndex);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Briefing Job
 */
class BriefingJob {
  async run(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Get all summaries for today
      const summaries = await dataService.getSummariesForDate(today);

      if (summaries.length === 0) {
        console.log('  No summaries found for today');
        return;
      }

      console.log(`  Found ${summaries.length} summaries for today`);

      // Get all unique tags
      const allTags = Array.from(new Set(summaries.flatMap(s => s.tags)));

      // Generate briefing
      console.log('  ⚙️  Generating briefing...');
      const briefingContent = await geminiService.generateBriefing(summaries, allTags);

      // Save briefing
      await dataService.saveSummary(
        `BRIEFING_${today}`,
        ['briefing'],
        briefingContent,
        `${today} 데일리 브리핑`,
        'System'
      );

      console.log('  ✓ Briefing generated and saved');

      // Send Telegram notification
      if (notifierService.isConfigured()) {
        console.log('  📤 Sending briefing notification...');

        const sent = await notifierService.sendBriefing(briefingContent, today);

        if (sent) {
          console.log('  ✓ Briefing sent');
        } else {
          console.log('  ⚠️  Briefing notification failed');
        }
      } else {
        console.log('  ⏭️  Telegram not configured, skipping notification');
      }
    } catch (error) {
      console.error('❌ Briefing generation failed:', error);
    }
  }
}

// Export singleton instance
export const monitorJob = new MonitorJob();
