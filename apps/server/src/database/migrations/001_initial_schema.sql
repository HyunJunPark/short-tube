-- ============================================
-- Short-Tube Database Schema
-- Migration: 001_initial_schema
-- Description: Initial database setup for Supabase migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- User Settings Table
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  target_platform VARCHAR(20) NOT NULL DEFAULT 'Telegram' CHECK (target_platform IN ('Telegram', 'Slack', 'Discord')),
  telegram_token TEXT,
  telegram_chat_id TEXT,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings (single row)
INSERT INTO user_settings (notification_time, target_platform, notification_enabled)
VALUES ('09:00', 'Telegram', true);

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id VARCHAR(255) NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  last_processed_video VARCHAR(255) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_tags ON subscriptions USING GIN(tags);
CREATE INDEX idx_subscriptions_categories ON subscriptions USING GIN(categories);

-- ============================================
-- Videos Table
-- ============================================
CREATE TABLE videos (
  id VARCHAR(255) PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  has_caption BOOLEAN NOT NULL DEFAULT false,
  duration VARCHAR(20) NOT NULL DEFAULT 'N/A',
  source VARCHAR(10) NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'rss')),
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_videos_channel FOREIGN KEY (channel_id) REFERENCES subscriptions(channel_id) ON DELETE CASCADE
);

-- Indexes for videos
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_cached_at ON videos(cached_at DESC);
CREATE INDEX idx_videos_channel_published ON videos(channel_id, published_at DESC);

-- ============================================
-- Summaries Table
-- ============================================
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id, tags)
);

-- Indexes for summaries
CREATE INDEX idx_summaries_video_id ON summaries(video_id);
CREATE INDEX idx_summaries_tags ON summaries USING GIN(tags);
CREATE INDEX idx_summaries_date ON summaries(date DESC);
CREATE INDEX idx_summaries_channel_name ON summaries(channel_name);
CREATE INDEX idx_summaries_title_content ON summaries USING GIN(to_tsvector('english', title || ' ' || content));

-- ============================================
-- Notification Logs Table
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id VARCHAR(255) NOT NULL UNIQUE,
  last_checked_at TIMESTAMPTZ NOT NULL,
  checked_video_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notification_logs_channel FOREIGN KEY (channel_id) REFERENCES subscriptions(channel_id) ON DELETE CASCADE
);

-- Indexes for notification_logs
CREATE INDEX idx_notification_logs_channel_id ON notification_logs(channel_id);
CREATE INDEX idx_notification_logs_last_checked_at ON notification_logs(last_checked_at DESC);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_logs_updated_at BEFORE UPDATE ON notification_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend will use service role)
CREATE POLICY "Service role has full access to user_settings" ON user_settings FOR ALL USING (true);
CREATE POLICY "Service role has full access to subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Service role has full access to videos" ON videos FOR ALL USING (true);
CREATE POLICY "Service role has full access to summaries" ON summaries FOR ALL USING (true);
CREATE POLICY "Service role has full access to notification_logs" ON notification_logs FOR ALL USING (true);

-- ============================================
-- Migration Complete
-- ============================================
-- To verify tables:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--
-- To verify indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
