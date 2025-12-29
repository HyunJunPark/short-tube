# Short-Tube Project Overview

## Project Purpose
YouTube monitoring and AI summarization service built with Express + TypeScript.
- Monitors YouTube channels for new videos
- Generates AI summaries using Gemini
- Provides daily briefings and notifications

## Tech Stack
- **Backend**: Express.js, TypeScript, Node.js 18+
- **Frontend**: React (separate app)
- **APIs**: YouTube Data API, Google Generative AI (Gemini)
- **Messaging**: Telegram Bot API
- **Utilities**: axios, zod validation, node-cron scheduling
- **Storage**: File-based JSON (currently), planning DB migration

## Code Style & Conventions
- **Naming**: snake_case for API/data models, camelCase for internal code
- **Architecture**: Service-based pattern (controllers → services → lib)
- **Error Handling**: Custom error classes in utils/errors.ts
- **Validation**: Zod schemas for input validation
- **Async**: Full async/await usage, no callbacks

## Project Structure
```
apps/server/src/
├── controllers/         # Express route handlers
├── services/            # Business logic (data, youtube, gemini, etc.)
├── routes/              # Express routes
├── jobs/                # Scheduled tasks (cron)
├── lib/                 # External client integrations
├── middleware/          # Express middleware
├── schemas/             # Zod validation schemas
├── utils/               # Constants, error classes
└── index.ts            # Server entry point
```

## Key Services
1. **DataService** (427 lines) - Manages subscriptions, settings, summaries, video cache
2. **YouTubeService** - YouTube API operations
3. **GeminiService** - AI summarization
4. **NotifierService** - Telegram notifications
5. **TranscriptService** - Video transcript extraction
6. **AudioService** - Audio processing

## Current Data Storage
- **data.json**: User settings + subscriptions
- **summaries.json**: Cached AI summaries (both string and object formats for backward compatibility)
- **video_cache.json**: Channel video cache (keyed by channelId)

## Current Refactoring Goal
Implement Service-Repository pattern to:
1. Separate business logic from data access
2. Prepare for future database migration (from FileStorage to PostgreSQL + ORM)
3. Enable proper dependency injection
4. Improve testability

## Key Refactoring Design
- Create 4 Repository interfaces for Subscriptions, Settings, Summaries, VideoCache
- Implement FileStorage-based repositories (Phase 2)
- Refactor DataService to inject repositories (Phase 3)
- Plan domain-driven packaging for scalability
- Support TypeORM/Prisma for database migration
