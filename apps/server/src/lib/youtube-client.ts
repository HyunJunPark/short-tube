import { google, youtube_v3 } from 'googleapis';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || '';

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    });
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getClient(): youtube_v3.Youtube {
    return this.youtube;
  }

  async searchChannels(query: string) {
    return this.youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults: 5,
    });
  }

  async getChannelById(channelId: string) {
    return this.youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      id: [channelId],
    });
  }

  async getPlaylistItems(playlistId: string, maxResults: number = 10) {
    return this.youtube.playlistItems.list({
      part: ['snippet'],
      playlistId,
      maxResults,
    });
  }

  async getVideoDetails(videoIds: string[]) {
    return this.youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: videoIds,
    });
  }
}

export const youtubeClient = new YouTubeClient();
