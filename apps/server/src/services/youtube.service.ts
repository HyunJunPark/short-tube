import { spawn } from 'child_process';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Video, ChannelInfo } from '@short-tube/types';
import { YouTubeClient } from '../lib/youtube-client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class YouTubeService {
  private client: YouTubeClient;
  private parser: XMLParser;

  constructor(client?: YouTubeClient) {
    this.client = client || new YouTubeClient();
    this.parser = new XMLParser();
  }

  /**
   * Get channel information from URL or handle
   * Tries YouTube API first, falls back to yt-dlp
   */
  async getChannelInfo(urlOrHandle: string): Promise<ChannelInfo> {
    // Try YouTube API first
    if (this.client.isConfigured()) {
      try {
        return await this.getChannelInfoViaAPI(urlOrHandle);
        console.log('YouTube API Successed');
      } catch (error) {
        console.warn('YouTube API failed, falling back to yt-dlp:', error);
      }
    }

    // Fallback to yt-dlp
    return await this.getChannelInfoViaYtDlp(urlOrHandle);
  }

  private async getChannelInfoViaAPI(urlOrHandle: string): Promise<ChannelInfo> {
    const youtube = this.client.getClient();

    // Extract channel ID or handle
    let channelId: string | null = null;
    let handle: string | null = null;

    if (urlOrHandle.startsWith('http')) {
      // Extract from URL
      const match = urlOrHandle.match(/(?:channel\/|@)([\w-]+)/);
      if (match) {
        const extracted = match[1];
        if (extracted.startsWith('UC')) {
          channelId = extracted;
        } else {
          handle = extracted;
        }
      }
    } else if (urlOrHandle.startsWith('@')) {
      handle = urlOrHandle.substring(1);
    } else if (urlOrHandle.startsWith('UC')) {
      channelId = urlOrHandle;
    } else {
      handle = urlOrHandle;
    }

    // If we have a handle, search for the channel
    if (handle && !channelId) {
      const searchResponse = await this.client.searchChannels(handle);

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        throw new NotFoundError('Channel not found');
      }

      channelId = searchResponse.data.items[0].id?.channelId || null;
    }

    if (!channelId) {
      throw new BadRequestError('Invalid channel URL or handle');
    }

    // Get channel details
    const channelResponse = await this.client.getChannelById(channelId);

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new NotFoundError('Channel not found');
    }

    const channel = channelResponse.data.items[0];
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new NotFoundError('Cannot find channel uploads');
    }

    // Get latest video
    const playlistResponse = await this.client.getPlaylistItems(uploadsPlaylistId, 1);

    const latestVideoId =
      playlistResponse.data.items?.[0]?.snippet?.resourceId?.videoId || '';

    return {
      channel_id: channelId,
      channel_name: channel.snippet?.title || 'Unknown',
      latest_video_id: latestVideoId,
    };
  }

  private async getChannelInfoViaYtDlp(urlOrHandle: string): Promise<ChannelInfo> {
    return new Promise((resolve, reject) => {
      let channelUrl = urlOrHandle;

      if (!urlOrHandle.startsWith('http')) {
        if (urlOrHandle.startsWith('@')) {
          channelUrl = `https://www.youtube.com/${urlOrHandle}`;
        } else {
          channelUrl = `https://www.youtube.com/@${urlOrHandle}`;
        }
      }

      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--playlist-items', '1',
        '--skip-download',
        channelUrl,
      ]);

      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          reject(new NotFoundError(`Channel not found: ${stderr}`));
          return;
        }

        try {
          const lines = stdout.trim().split('\n');
          const videoData = JSON.parse(lines[0]);

          resolve({
            channel_id: videoData.channel_id || '',
            channel_name: videoData.channel || videoData.uploader || 'Unknown',
            latest_video_id: videoData.id || '',
          });
        } catch (error) {
          reject(new NotFoundError('Failed to parse channel info'));
        }
      });
    });
  }

  /**
   * Get recent videos from a channel
   * Tries YouTube API first, falls back to RSS
   */
  async getRecentVideos(channelId: string, days: number = 7): Promise<Video[]> {
    console.log('before getRecentVideos videos');

    if (this.client.isConfigured()) {
      console.log('client is configured');
      try {
        console.log('before getVideosViaAPI');
        return await this.getVideosViaAPI(channelId, days);
      } catch (error: any) {
        // If quota exceeded, fall back to RSS
        if (error.code === 403 || error.statusCode === 403) {
          console.warn('YouTube API quota exceeded, using RSS fallback');
          return await this.getVideosViaRSS(channelId, days);
        }
        throw error;
      }
    }

    // No API key, use RSS directly
    return await this.getVideosViaRSS(channelId, days);
  }

  private async getVideosViaAPI(channelId: string, days: number): Promise<Video[]> {
    const youtube = this.client.getClient();

    console.log('getVideosViaAPI 1');

    // Get channel uploads playlist
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });

    console.log('getVideosViaAPI 2');

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new NotFoundError('Channel uploads not found');
    }

    console.log('getVideosViaAPI 3');

    // Get recent videos
    const playlistResponse = await this.client.getPlaylistItems(uploadsPlaylistId, 50);

    const videoIds = playlistResponse.data.items
      ?.map(item => item.snippet?.resourceId?.videoId)
      .filter((id): id is string => !!id) || [];

    console.log('getVideosViaAPI 4 ' + videoIds.length);

    if (videoIds.length === 0) {
      return [];
    }

    // Get video details
    const videosResponse = await this.client.getVideoDetails(videoIds);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const videos: Video[] = [];

    for (const item of videosResponse.data.items || []) {
      const publishedAt = item.snippet?.publishedAt;
      if (!publishedAt) continue;

      const publishDate = new Date(publishedAt);
      if (publishDate < cutoffDate) continue;

      const duration = this.parseDuration(item.contentDetails?.duration || '');

      // Filter out YouTube Shorts (< 1 minute)
      if (this.isShort(duration)) continue;

      videos.push({
        id: item.id || '',
        title: item.snippet?.title || 'Untitled',
        published_at: publishedAt,
        has_caption: (item.contentDetails?.caption === 'true'),
        duration,
        source: 'api', // Track source as API
      });
    }

    console.log('getVideosViaAPI 5');
    console.log('data: ' + JSON.stringify(videos));

    return videos;
  }

  public async getVideosViaRSS(channelId: string, days: number): Promise<Video[]> {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const response = await axios.get(rssUrl);
    const data = this.parser.parse(response.data);

    const entries = data.feed?.entry || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const videos: Video[] = [];

    for (const entry of Array.isArray(entries) ? entries : [entries]) {
      const publishedAt = entry.published;
      if (!publishedAt) continue;

      const publishDate = new Date(publishedAt);
      if (publishDate < cutoffDate) continue;

      const videoId = entry['yt:videoId'] || entry.id?.split(':').pop() || '';
      if (!videoId) continue;

      // RSS videos have incomplete metadata - no API enrichment
      videos.push({
        id: videoId,
        title: entry.title || 'Untitled',
        published_at: publishedAt,
        has_caption: false,
        duration: 'N/A', // Unknown from RSS - display as N/A
        source: 'rss', // Track source as RSS
      });
    }

    return videos;
  }

  /**
   * Parse ISO 8601 duration format (PT1H2M10S) to HH:MM:SS
   */
  private parseDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return '00:00';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Check if video is a YouTube Short (< 1 minute)
   */
  private isShort(duration: string): boolean {
    const parts = duration.split(':');

    if (parts.length === 3) {
      // HH:MM:SS format
      return false; // Definitely not a short if it has hours
    }

    if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0], 10);
      return minutes < 1;
    }

    return false;
  }
}

// Singleton instance
export const youtubeService = new YouTubeService();
