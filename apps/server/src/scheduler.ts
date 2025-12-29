import cron from 'node-cron';
import { dataService } from './services/data.service';
import { monitorJob } from './jobs/monitor.job';

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private lastRunDate: string = '';

  /**
   * Initialize and start the scheduler
   */
  start(): void {
    console.log('🕐 Initializing scheduler...');

    // Run every minute
    this.task = cron.schedule('* * * * *', async () => {
      await this.checkAndRun();
    });

    console.log('✅ Scheduler started (checking every minute)');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('⏹️  Scheduler stopped');
    }
  }

  /**
   * Check if it's time to run monitoring
   */
  private async checkAndRun(): Promise<void> {
    try {
      const settings = await dataService.getSettings();
      
      // Check if notifications are enabled
      if (!settings.notification_enabled) {
        return;
      }

      const now = new Date();

      // Format current time as HH:MM
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      // Format current date as YYYY-MM-DD
      const currentDate = now.toISOString().split('T')[0];

      // Check if it's time to run
      if (currentTime === settings.notification_time) {
        // Check if we've already run today
        if (this.lastRunDate === currentDate) {
          console.log(`⏭️  Already ran today at ${settings.notification_time}`);
          return;
        }

        console.log(`\n⏰ Time match! Running monitoring at ${currentTime}...`);

        // Update last run date BEFORE running (prevent duplicate runs)
        this.lastRunDate = currentDate;

        // Run monitoring with briefing
        await monitorJob.run(true);
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  }

  /**
   * Manually trigger monitoring (for testing)
   */
  async runNow(sendBriefing: boolean = false): Promise<void> {
    console.log('\n🔧 Manual trigger activated');
    await monitorJob.run(sendBriefing);
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
