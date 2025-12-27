# 📺 Short-Tube: AI-Powered YouTube Monitoring (React + Express)

**Short-Tube**는 사용자가 관심 있는 유튜브 채널을 모니터링하고, 새로운 영상이 올라오면 **Gemini AI**를 통해 내용을 요약하여 브리핑해주는 스마트 비서 서비스입니다.

**v2.0**: Python Streamlit에서 Next.js + Express BFF 구조로 완전 재구축

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)

---

## ✨ 핵심 기능 (Key Features)

### 1. 지능형 유튜브 모니터링
- **키워드 필터링**: 채널별로 관심 있는 태그(키워드)를 설정하여 관련 영상만 추출
- **이중 데이터 수집**: YouTube Data API(v3)를 우선 사용하며, 할당량 초과 시 자동으로 **RSS Feed**를 통해 데이터를 수집
- **스마트 캐싱**: 영상 목록을 로컬에 캐싱하여 불필요한 API 호출 최소화

### 2. Gemini AI 기반 요약 (AI Summarization)
- **자막 분석**: 영상의 자막을 추출하여 핵심 내용을 요약 (한국어 → 영어 → 모든 언어 폴백)
- **관심사 맞춤형**: 사용자가 설정한 태그에 맞춰 요약 포인트를 최적화
- **모델 폴백**: Gemini 2.5 Flash → 2.0 Flash Lite → Flash Latest → 1.5 Flash 순서로 자동 폴백

### 3. 데일리 브리핑 & 알림
- **일일 통합 리포트**: 하루 동안 수집된 모든 영상 요약을 하나의 유기적인 브리핑 리포트로 통합
- **텔레그램 알림**: 실시간 영상 요약 알림 및 예약된 시간에 데일리 브리핑을 텔레그램으로 전송
- **아카이브**: 과거에 진행된 모든 요약 내역을 대시보드에서 확인 가능

### 4. 자동화된 백그라운드 모니터링
- **스케줄러**: node-cron을 사용한 정확한 시간 기반 실행
- **지능형 처리**: 새 영상만 감지하여 중복 처리 방지
- **Rate Limiting**: API 요청 제한을 준수하는 안전한 처리

---

## 🛠 Tech Stack

### Frontend (Coming Soon - Phase 3-5)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod

### Backend (✅ Completed - Phase 1-2)
- **Framework**: Express.js
- **Language**: TypeScript
- **AI Model**: Google Gemini (multiple models with fallback)
- **Scheduling**: node-cron
- **Data Fetching**: YouTube Data API v3, RSS (fast-xml-parser)
- **YouTube**: googleapis, youtube-transcript, yt-dlp
- **Notification**: Telegram (node-telegram-bot-api)
- **Storage**: JSON-based Local Persistence
- **Validation**: Zod

---

## 📂 프로젝트 구조 (Project Structure)

```
short-tube/
├── package.json                    # Monorepo workspace config
├── ecosystem.config.js             # PM2 configuration
│
├── packages/
│   └── types/                      # Shared TypeScript types
│       ├── package.json
│       └── src/
│           └── index.ts           # All shared type definitions
│
├── apps/
│   ├── web/                        # Next.js Frontend (Phase 3-5)
│   │   └── (coming soon)
│   │
│   └── server/                     # Express BFF (✅ Completed)
│       ├── package.json
│       ├── tsconfig.json
│       ├── nodemon.json
│       └── src/
│           ├── index.ts            # Server entry point
│           ├── app.ts              # Express app setup
│           ├── scheduler.ts        # node-cron scheduler
│           │
│           ├── routes/             # API routes
│           │   ├── subscriptions.ts
│           │   ├── videos.ts
│           │   ├── summaries.ts
│           │   ├── briefing.ts
│           │   ├── settings.ts
│           │   └── monitor.ts
│           │
│           ├── controllers/        # Route controllers
│           ├── services/           # Business logic
│           │   ├── data.service.ts         # JSON file operations
│           │   ├── youtube.service.ts      # YouTube API + RSS
│           │   ├── transcript.service.ts   # Caption extraction
│           │   ├── gemini.service.ts       # AI summarization
│           │   ├── audio.service.ts        # yt-dlp wrapper
│           │   └── notifier.service.ts     # Telegram notifications
│           │
│           ├── jobs/               # Background jobs
│           │   └── monitor.job.ts  # Monitoring & briefing logic
│           │
│           ├── lib/                # External clients
│           │   ├── youtube-client.ts
│           │   ├── gemini-client.ts
│           │   ├── telegram-client.ts
│           │   └── file-storage.ts
│           │
│           ├── middleware/         # Express middleware
│           │   ├── error-handler.ts
│           │   ├── logger.ts
│           │   └── validate.ts
│           │
│           ├── schemas/            # Zod validation schemas
│           └── utils/              # Utilities
│
└── data/                           # JSON data storage
    ├── data.json                   # User settings + subscriptions
    ├── summaries.json              # Video summaries + briefings
    └── video_cache.json            # Cached video lists
```

---

## 🚀 시작하기 (Quick Start)

### 1. 의존성 설치

```bash
# Clone repository
git clone <repository-url>
cd short-tube

# Install all dependencies
npm install
```

### 2. 환경 변수 설정

`apps/server/.env.example` 파일을 복사하여 `apps/server/.env` 파일을 만들고 필요한 API 키를 입력합니다.

```bash
cp apps/server/.env.example apps/server/.env
```

`.env` 파일 내용:

```env
# Server
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Google APIs
GOOGLE_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Paths
DATA_DIR=../../data
TEMP_AUDIO_DIR=../../temp_audio
```

**API 키 발급 방법:**
- **YouTube API Key**: [Google Cloud Console](https://console.cloud.google.com/) → API & Services → Credentials
- **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Telegram Bot**: [BotFather](https://t.me/botfather)에서 봇 생성

### 3. 애플리케이션 실행

```bash
# Development mode
npm run server:dev

# Production build
npm run server:build

# Production start
npm run server:start
```

서버가 시작되면:
- 🚀 Server: http://localhost:3001
- 📍 Health check: http://localhost:3001/health
- 📍 API docs: http://localhost:3001/api

---

## 📡 API Endpoints

### Subscriptions
- `GET /api/subscriptions` - 구독 목록 조회
- `POST /api/subscriptions` - 채널 추가
- `PATCH /api/subscriptions/:channelId` - 구독 업데이트 (태그, 활성화)
- `DELETE /api/subscriptions/:channelId` - 채널 삭제

### Videos
- `GET /api/videos/channel/:channelId` - 채널 영상 목록
- `POST /api/videos/refresh/:channelId` - 영상 캐시 갱신

### Summaries
- `GET /api/summaries` - 요약 목록 (필터링 지원)
- `POST /api/summaries` - 요약 생성
- `GET /api/summaries/date/:date` - 날짜별 요약

### Briefing
- `GET /api/briefing/:date` - 브리핑 조회
- `POST /api/briefing/generate` - 브리핑 생성

### Settings
- `GET /api/settings` - 설정 조회
- `PATCH /api/settings` - 설정 업데이트
- `POST /api/settings/telegram/test` - 텔레그램 테스트

### Monitor
- `POST /api/monitor/trigger` - 수동 모니터링 트리거

---

## ⚙️ 백그라운드 모니터링

서버가 시작되면 자동으로 스케줄러가 실행됩니다:

1. **매 분마다 체크**: 설정된 알림 시간이 되었는지 확인
2. **자동 실행**: 알림 시간에 도달하면 자동으로 모니터링 시작
3. **새 영상 감지**: 각 활성 구독에서 새로운 영상 찾기
4. **요약 생성**: Gemini AI로 영상 요약 (자막 우선, 폴백 지원)
5. **텔레그램 알림**: 요약 내용을 텔레그램으로 전송
6. **데일리 브리핑**: 모든 요약을 통합한 브리핑 생성 및 발송

### 수동 실행

```bash
# API를 통한 수동 트리거
curl -X POST http://localhost:3001/api/monitor/trigger \
  -H "Content-Type: application/json" \
  -d '{"briefing": true}'
```

---

## 🔧 Production Deployment

### PM2 사용

```bash
# PM2 설치
npm install -g pm2

# 빌드
npm run build

# PM2로 시작
pm2 start ecosystem.config.js

# 로그 확인
pm2 logs short-tube-server

# 재시작
pm2 restart short-tube-server

# 시스템 부팅 시 자동 시작
pm2 startup
pm2 save
```

---

## 🔑 Requirements

### Software
- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **yt-dlp**: 오디오 다운로드용 (선택사항)

### yt-dlp 설치

```bash
# macOS
brew install yt-dlp

# Linux
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# pip
pip install yt-dlp
```

---

## 📝 Migration Progress

- ✅ **Phase 1**: 백엔드 기반 구축 (완료)
  - Monorepo 구조 설정
  - 공유 타입 패키지
  - Express 서버 초기화
  - 모든 핵심 서비스 구현
  - API 라우트 및 컨트롤러
  - Zod 검증

- ✅ **Phase 2**: 스케줄러 & 백그라운드 작업 (완료)
  - node-cron 스케줄러
  - 모니터링 Job
  - 브리핑 Job
  - PM2 설정

- ⏳ **Phase 3**: Next.js 프론트엔드 코어 (예정)
- ⏳ **Phase 4**: 대시보드 페이지 구현 (예정)
- ⏳ **Phase 5**: 브리핑 & 아카이브 페이지 (예정)
- ⏳ **Phase 6**: 테스트 & 배포 준비 (예정)

---

## 📝 라이선스

이 프로젝트는 개인 학습 및 도구 활용 목적으로 제작되었습니다.
