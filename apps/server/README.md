# Short-Tube Server

Express BFF server for YouTube monitoring and AI summarization.

## Development

```bash
# Start development server
npm run server:dev

# Build
npm run server:build

# Start production server
npm run server:start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Google APIs
GOOGLE_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Paths
DATA_DIR=../../data
TEMP_AUDIO_DIR=../../temp_audio
```

## API Endpoints

### Subscriptions
- `GET /api/subscriptions` - List all subscriptions
- `POST /api/subscriptions` - Add new channel
- `PATCH /api/subscriptions/:channelId` - Update subscription
- `DELETE /api/subscriptions/:channelId` - Delete subscription

### Videos
- `GET /api/videos/channel/:channelId` - Get channel videos
- `POST /api/videos/refresh/:channelId` - Refresh video cache

### Summaries
- `GET /api/summaries` - Get all summaries
- `POST /api/summaries` - Generate new summary
- `GET /api/summaries/date/:date` - Get summaries by date

### Briefing
- `GET /api/briefing/:date` - Get briefing for date
- `POST /api/briefing/generate` - Generate new briefing

### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings
- `POST /api/settings/telegram/test` - Send test Telegram message

### Monitor
- `POST /api/monitor/trigger` - Manually trigger monitoring

## Scheduler

The server runs a background scheduler that:
- Checks every minute if it's time to run monitoring
- Runs at the configured `notification_time`
- Processes new videos from active subscriptions
- Generates summaries and sends Telegram notifications
- Creates daily briefing

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs short-tube-server

# Stop
pm2 stop short-tube-server

# Restart
pm2 restart short-tube-server

# Enable auto-start on system boot
pm2 startup
pm2 save
```

## Requirements

- Node.js 18+
- yt-dlp (for audio download)

### Installing yt-dlp

```bash
# macOS
brew install yt-dlp

# Linux
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Or with pip
pip install yt-dlp
```
