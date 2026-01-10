# Supabase Migration Guide

Complete guide for migrating Short-Tube from file-based JSON storage to Supabase PostgreSQL database.

## Overview

This migration maintains backward compatibility through a feature flag system. You can instantly switch between file-based and database storage by changing a single environment variable.

**Key Features:**
- ✅ Zero code changes in services/controllers
- ✅ Instant rollback capability
- ✅ Preserves all existing data
- ✅ Backend-only Supabase access (secure)
- ✅ No frontend changes required

---

## Prerequisites

- Existing Supabase project (you mentioned you have one)
- Supabase project URL and Service Role Key
- Node.js 18+ installed
- Backup of your current data (recommended)

---

## Migration Steps

### Step 1: Set Up Supabase Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file located at:
   ```
   apps/server/src/database/migrations/001_initial_schema.sql
   ```
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

**What this creates:**
- `user_settings` table (1 row, singleton)
- `subscriptions` table (your YouTube channels)
- `videos` table (cached video metadata)
- `summaries` table (AI-generated summaries)
- `notification_logs` table (notification tracking)
- Indexes for optimal query performance
- Foreign keys with CASCADE delete
- Row Level Security (RLS) policies
- Auto-update triggers for timestamps

### Step 2: Configure Environment Variables

1. Add Supabase credentials to your `.env` file:

```env
# Database Configuration (add these lines)
USE_DATABASE=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Where to find your credentials:**
- Go to Supabase Project Settings → API
- **URL**: Project URL
- **Service Role Key**: service_role secret (⚠️ Keep this secret!)

⚠️ **Important**: Keep `USE_DATABASE=false` until migration is complete!

### Step 3: Test Supabase Connection

Before migrating data, verify everything is set up correctly:

```bash
cd apps/server
npm run db:test
```

**Expected output:**
```
🔍 Testing Supabase connection...

📋 Checking environment variables...
   ✓ SUPABASE_URL: https://...
   ✓ SUPABASE_SERVICE_KEY: ey...

📡 Testing connection to Supabase...
   ✓ Connected successfully

🗄️  Checking database tables...
   ✓ user_settings       - 1 rows
   ✓ subscriptions       - 0 rows
   ✓ videos              - 0 rows
   ✓ summaries           - 0 rows
   ✓ notification_logs   - 0 rows

✅ All tests passed! You can now run migration.
```

If this fails, check:
- SUPABASE_URL is correct
- SUPABASE_SERVICE_KEY is the **service_role** key (not anon key)
- SQL migration script was executed successfully
- No typos in environment variables

### Step 4: Backup Your Data (Optional but Recommended)

```bash
# Create a timestamped backup
mkdir -p data_backup_$(date +%Y%m%d)
cp data/*.json data_backup_$(date +%Y%m%d)/
```

### Step 5: Run Data Migration

This script will:
1. Automatically backup your JSON files
2. Load data from JSON files
3. Migrate data to Supabase tables
4. Validate the migration

```bash
cd apps/server
npm run db:migrate
```

**Expected output:**
```
🚀 Starting migration to Supabase...

📡 Connecting to Supabase...
✅ Connected to Supabase

📦 Creating backup of JSON files...
   ✓ Backed up data.json
   ✓ Backed up summaries.json
   ✓ Backed up video_cache.json
   ✓ Backed up notification_log.json
   📁 Backup location: /path/to/backup_2026-01-10...
✅ Backup created

📂 Loading data from JSON files...
✅ Data loaded from JSON files

👤 Migrating user settings...
✅ User settings migrated

📺 Migrating subscriptions...
✅ Migrated 9 subscriptions

🎬 Migrating videos...
   ✓ Migrated 100 videos so far...
   ✓ Migrated 200 videos so far...
   ...
✅ Migrated 800 videos

📝 Migrating summaries...
   ✓ Migrated 50 summaries so far...
   ✓ Migrated 100 summaries so far...
✅ Migrated 100 summaries

🔔 Migrating notification logs...
✅ Migrated 9 notification logs

🔍 Validating migration...
   User Settings: Expected 1, Got 1
   Subscriptions: Expected 9, Got 9
   Videos: Expected 800, Got 800
   Summaries: Expected 100, Got 100
   Notification Logs: Expected 9, Got 9
✅ Migration validated

🎉 Migration completed successfully!

📊 Migration Summary:
   User Settings: 1
   Subscriptions: 9
   Videos: 800
   Summaries: 100
   Notification Logs: 9

✨ You can now switch to database mode by setting USE_DATABASE=true
```

### Step 6: Switch to Database Mode

Update your `.env` file:

```env
USE_DATABASE=true
```

Restart your server:

```bash
# If running with npm run dev
Ctrl+C (to stop)
npm run dev

# If running with PM2
pm2 restart short-tube

# If running with Docker
docker-compose restart server
```

### Step 7: Verify Everything Works

**Check server startup logs:**
```
[DI] Using Supabase storage
[Supabase] Client initialized successfully
[DI] Supabase repositories initialized
```

**Test API endpoints:**
```bash
# Get subscriptions
curl http://localhost:3002/api/subscriptions

# Get settings
curl http://localhost:3002/api/settings

# Get summaries
curl http://localhost:3002/api/summaries

# Get videos
curl http://localhost:3002/api/videos/stats
```

**Test frontend:**
1. Open http://localhost:3000
2. Verify dashboard loads with all channels
3. Check that videos display correctly
4. Test creating a summary
5. Check settings page

---

## Rollback Procedures

### Instant Rollback (Switch Back to Files)

If you encounter any issues, you can instantly rollback:

1. Update `.env`:
   ```env
   USE_DATABASE=false
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

That's it! Your app is now using the original JSON files.

### Export Data from Supabase

To create new JSON files from Supabase data (e.g., to capture new data added while using database mode):

```bash
npm run db:export
```

This will create fresh JSON files in your data directory from the current Supabase data.

---

## Testing Checklist

### Backend API Tests

Run these tests with `USE_DATABASE=true`:

- [ ] GET `/api/subscriptions` - Returns all 9 channels
- [ ] POST `/api/subscriptions` - Create new channel
- [ ] PATCH `/api/subscriptions/:channelId` - Update tags/categories
- [ ] DELETE `/api/subscriptions/:channelId` - Delete channel
- [ ] GET `/api/settings` - Returns settings
- [ ] PATCH `/api/settings` - Update notification time
- [ ] GET `/api/summaries` - Returns summaries with pagination
- [ ] GET `/api/summaries/:videoId` - Returns specific summary
- [ ] POST `/api/summaries` - Generate new summary
- [ ] GET `/api/summaries/date/:date` - Returns date-filtered summaries
- [ ] GET `/api/videos/:channelId` - Returns channel videos
- [ ] POST `/api/videos/refresh` - Refresh video cache

### Frontend Tests

- [ ] **Dashboard** - Channel cards display correctly
- [ ] **Dashboard** - Today's video count badge accurate
- [ ] **Dashboard** - Video list loads for each channel
- [ ] **Dashboard** - "Summarize" button works
- [ ] **Dashboard** - View Summary modal displays content
- [ ] **Dashboard** - Refresh videos updates cache
- [ ] **Settings** - Settings load correctly
- [ ] **Settings** - Update notification time saves
- [ ] **Settings** - Telegram test sends message
- [ ] **Archive** - Search finds summaries
- [ ] **Archive** - Date filters work
- [ ] **Briefing** - Daily briefing displays

### Cron Job Tests

- [ ] Monitor job runs successfully
- [ ] Notifications sent to Telegram
- [ ] Video cache updated correctly
- [ ] Summaries saved to database

---

## Architecture Details

### Repository Pattern

The migration uses the **Repository pattern** to abstract data access:

```
Controllers → Services → Repository Interface → Implementation (File or Supabase)
```

**Benefits:**
- Zero changes to controllers and services
- Easy to switch implementations
- Testable with mock repositories

### Feature Flag System

```typescript
const USE_DATABASE = process.env.USE_DATABASE === 'true';

if (USE_DATABASE) {
  // Initialize Supabase repositories
} else {
  // Initialize File repositories
}
```

### Database Design

**Key Features:**
- PostgreSQL arrays for tags/categories (native support)
- GIN indexes for fast array queries
- Foreign keys with CASCADE delete
- Full-text search on summaries
- Composite unique constraint on (video_id, tags)

---

## Monitoring

### Week 1: Daily Checks

Monitor these metrics for the first week:

1. **Supabase Dashboard** → Logs
   - Check for any error messages
   - Verify query performance

2. **API Response Times**
   - Target: < 500ms average
   - Alert if > 1 second

3. **Server Logs**
   - Check for database connection errors
   - Verify cron jobs running

4. **Telegram Notifications**
   - Ensure notifications still being sent
   - Verify timing is correct

### Performance Metrics

**Supabase Dashboard → Database → Performance:**
- Average query time
- Slow queries (> 1 second)
- Database connections

**Expected Performance:**
- Subscription queries: < 100ms
- Video queries: < 200ms
- Summary queries: < 300ms
- Search queries: < 500ms

---

## Troubleshooting

### Migration Fails

**Problem:** Migration script errors out

**Solutions:**
1. Check that SQL schema was run successfully
2. Verify Supabase credentials are correct
3. Ensure tables are empty (first migration)
4. Check server logs for specific error messages
5. Your JSON backup is safe, you can try again

### Server Won't Start with USE_DATABASE=true

**Problem:** Server crashes on startup

**Solutions:**
1. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
2. Verify Supabase project is not paused
3. Check server logs for connection errors
4. Temporarily switch back to `USE_DATABASE=false`
5. Run `npm run db:test` to diagnose

### API Returns Empty Data

**Problem:** API endpoints return empty arrays

**Solutions:**
1. Verify migration completed successfully
2. Check Supabase dashboard for data
3. Verify RLS policies are configured correctly
4. Check that service role key is being used (not anon key)

### Foreign Key Constraint Errors

**Problem:** Cannot delete subscription

**Solutions:**
- This should not happen with CASCADE delete
- Check if videos/notification_logs are being deleted
- Verify foreign key constraints in Supabase

---

## Files Created/Modified

### New Files

Backend:
- `apps/server/src/lib/supabase.ts` - Supabase client singleton
- `apps/server/src/domains/settings/repositories/implementations/supabase/SupabaseSettingsRepository.ts`
- `apps/server/src/domains/subscription/repositories/implementations/supabase/SupabaseSubscriptionRepository.ts`
- `apps/server/src/domains/video-cache/repositories/implementations/supabase/SupabaseVideoCacheRepository.ts`
- `apps/server/src/domains/summary/repositories/implementations/supabase/SupabaseSummaryRepository.ts`
- `apps/server/src/domains/notification-log/repositories/supabase/SupabaseNotificationLogRepository.ts`
- `apps/server/src/scripts/migrate-to-supabase.ts` - Data migration
- `apps/server/src/scripts/test-supabase-connection.ts` - Connection test
- `apps/server/src/scripts/export-from-supabase.ts` - Rollback export
- `apps/server/src/database/migrations/001_initial_schema.sql` - Database schema

### Modified Files

Backend:
- `apps/server/src/repositories/index.ts` - Added feature flag DI logic
- `apps/server/.env` - Added Supabase credentials
- `apps/server/package.json` - Added db:test, db:migrate, db:export scripts

Frontend:
- **No changes required** ✅

---

## Next Steps After Migration

### Immediate (Week 1)

1. ✅ Monitor performance metrics daily
2. ✅ Verify Telegram notifications working
3. ✅ Check cron job execution
4. ✅ Test all API endpoints
5. ✅ Verify frontend functionality

### Short-term (Week 2-4)

1. Monitor database storage usage
2. Review slow query logs
3. Optimize indexes if needed
4. Set up Supabase alerts
5. Document any issues encountered

### Long-term (After 30 Days)

If migration is successful:

1. Remove JSON backup files
2. (Optional) Remove file-based repository code
3. Update documentation
4. Make Supabase the default (update code to not require flag)
5. Consider setting up Supabase backups

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review server logs for specific errors
3. Check Supabase dashboard for errors
4. Verify environment variables are correct
5. Run `npm run db:test` to diagnose connection issues

**Emergency Rollback:** Always available via `USE_DATABASE=false`

---

## Summary

✅ **Safe Migration:**
- Automatic JSON backups
- Instant rollback capability
- No data loss risk

✅ **Zero Downtime:**
- Feature flag switching
- No code deployment needed

✅ **Full Compatibility:**
- Frontend unchanged
- API contracts identical
- Cron jobs work the same

✅ **Performance:**
- Proper indexing
- Optimized queries
- Better than file I/O

Good luck with your migration! 🚀
