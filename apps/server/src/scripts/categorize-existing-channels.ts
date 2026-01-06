import 'dotenv/config';
import { dataService } from '../repositories';
import { youtubeService } from '../services/youtube.service';
import { geminiService } from '../services/gemini.service';

async function categorizeExistingChannels() {
  console.log('Starting to categorize existing channels...\n');

  try {
    const subscriptions = await dataService.getSubscriptions();
    const uncategorized = subscriptions.filter(s => !s.categories || s.categories.length === 0);

    console.log(`Found ${uncategorized.length} uncategorized channels out of ${subscriptions.length} total\n`);

    if (uncategorized.length === 0) {
      console.log('All channels are already categorized!');
      return;
    }

    for (const subscription of uncategorized) {
      try {
        console.log(`Processing: ${subscription.channel_name} (${subscription.channel_id})`);

        // Get channel details
        const channelInfo = await youtubeService.getChannelInfo(subscription.channel_id);

        // Get AI recommendations
        const categories = await geminiService.recommendCategories(
          channelInfo.channel_name,
          channelInfo.description || '',
          channelInfo.topicCategories || []
        );

        // Update subscription
        await dataService.updateSubscription(subscription.channel_id, { categories });

        console.log(`✅ ${subscription.channel_name}: ${categories.length > 0 ? categories.join(', ') : '(no categories)'}\n`);

        // Rate limiting (1초 대기)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to categorize ${subscription.channel_name}:`, error instanceof Error ? error.message : error);
        console.log('');
      }
    }

    console.log('Categorization complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

categorizeExistingChannels().catch(console.error);
