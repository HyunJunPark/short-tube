# Short-Tube 프로젝트 아키텍처 맵

## 📊 프로젝트 개요
- **목적**: YouTube 채널 모니터링 및 AI 요약 서비스
- **기술 스택**: Express.js + TypeScript + Node.js 18+
- **아키텍처 패턴**: Service-Repository Pattern (DDD 기반)
- **데이터 저장소**: 파일 기반 JSON (향후 PostgreSQL 마이그레이션 예정)

---

## 🗂️ 전체 프로젝트 구조

```
apps/server/src/
├── index.ts                    # 서버 진입점
├── app.ts                      # Express 앱 설정
├── scheduler.ts                # 스케줄러 설정
│
├── routes/                     # API 라우팅
│   ├── index.ts
│   ├── subscriptions.ts
│   ├── settings.ts
│   ├── summaries.ts
│   ├── videos.ts
│   ├── briefing.ts
│   └── monitor.ts
│
├── controllers/                # HTTP 핸들러
│   ├── subscription.controller.ts
│   ├── settings.controller.ts
│   ├── summary.controller.ts
│   ├── video.controller.ts
│   ├── briefing.controller.ts
│   └── monitor.controller.ts
│
├── services/                   # 비즈니스 로직
│   ├── data.service.ts         # 데이터 관리 (구독, 설정, 요약, 캐시)
│   ├── youtube.service.ts      # YouTube API 작업
│   ├── gemini.service.ts       # AI 요약
│   ├── notifier.service.ts     # Telegram 알림
│   ├── transcript.service.ts   # 영상 자막 추출
│   └── audio.service.ts        # 음성 처리
│
├── domains/                    # Repository 패턴 구현
│   ├── subscription/
│   │   └── repositories/
│   │       ├── interfaces/
│   │       │   └── ISubscriptionRepository.ts
│   │       └── implementations/file/
│   │           └── FileSubscriptionRepository.ts
│   ├── settings/
│   │   └── repositories/
│   │       ├── interfaces/
│   │       │   └── ISettingsRepository.ts
│   │       └── implementations/file/
│   │           └── FileSettingsRepository.ts
│   ├── summary/
│   │   └── repositories/
│   │       ├── interfaces/
│   │       │   └── ISummaryRepository.ts (+ SummaryEntity, SummaryQueryOptions)
│   │       └── implementations/file/
│   │           └── FileSummaryRepository.ts
│   ├── video-cache/
│   │   └── repositories/
│   │       ├── interfaces/
│   │       │   └── IVideoCacheRepository.ts
│   │       └── implementations/file/
│   │           └── FileVideoCacheRepository.ts
│   └── notification-log/
│       ├── repositories.ts
│       └── file-storage.ts
│
├── lib/                        # 외부 API 클라이언트
│   ├── youtube-client.ts       # YouTube API 클라이언트
│   ├── gemini-client.ts        # Google Generative AI 클라이언트
│   ├── telegram-client.ts      # Telegram Bot API 클라이언트
│   └── file-storage.ts         # 파일 시스템 유틸리티
│
├── jobs/                       # 백그라운드 작업
│   └── monitor.job.ts          # MonitorJob, BriefingJob
│
├── middleware/                 # Express 미들웨어
│   ├── error-handler.ts
│   ├── validate.ts
│   └── logger.ts
│
├── schemas/                    # Zod 검증 스키마
│   ├── subscription.schema.ts
│   ├── settings.schema.ts
│   └── summary.schema.ts
│
├── utils/                      # 유틸리티
│   ├── errors.ts               # 커스텀 에러 클래스
│   └── constants.ts
│
└── repositories/               # 전역 저장소 (대체 가능)
    └── index.ts
```

---

## 🔄 데이터 흐름

### 요청-응답 사이클
```
HTTP 요청
  ↓
Routes (라우팅)
  ↓
Controllers (요청 검증 + 응답 형식)
  ↓
Services (비즈니스 로직)
  ↓
Repository Pattern (데이터 접근)
  ↓
FileStorage (JSON 읽기/쓰기)
  ↓
HTTP 응답
```

### 백그라운드 작업
```
MonitorJob (주기적 실행)
  → YouTubeService.getRecentVideos()
  → VideoCache 저장
  → 새 비디오 감지 시 NotifierService 호출
  → GeminiService로 요약 생성

BriefingJob (일일 실행)
  → 모든 요약 조회
  → GeminiService.generateBriefing()
  → NotifierService.sendBriefing()
```

---

## 🎯 주요 서비스 상세 설명

### 1. DataService (apps/server/src/services/data.service.ts)
**역할**: 모든 데이터 접근의 중앙 허브
**주요 메소드**:
- `getSubscriptions()` - 모든 구독 조회
- `addSubscription(channelId)` - 채널 구독
- `updateSubscription(id, data)` - 구독 정보 수정
- `deleteSubscription(id)` - 구독 삭제
- `getSettings()` - 설정 조회
- `updateSettings(settings)` - 설정 변경
- `saveSummary(summary)` - 요약 저장
- `getAllSummaries()` - 모든 요약 조회
- `getSummariesForDate(year, month, day)` - 특정 날짜 요약 조회
- `getSummaryByVideoId(videoId)` - 특정 비디오 요약 조회
- `saveVideoCache(channelId, videos)` - 비디오 캐시 저장
- `getVideoCache(channelId)` - 비디오 캐시 조회
- `deleteVideoCache(channelId)` - 캐시 삭제
- `getBriefing()` - 브리핑 조회

**의존성**: 
- `ISubscriptionRepository` (subscriptionRepo)
- `ISettingsRepository` (settingsRepo)
- `ISummaryRepository` (summaryRepo)
- `IVideoCacheRepository` (videoCacheRepo)

---

### 2. YouTubeService (apps/server/src/services/youtube.service.ts)
**역할**: YouTube 데이터 조회 및 변환
**주요 메소드**:
- `getChannelInfo(channelId)` - 채널 정보 조회 (API 또는 yt-dlp)
- `getChannelInfoViaAPI(channelId)` - YouTube API를 통한 조회
- `getChannelInfoViaYtDlp(channelId)` - yt-dlp를 통한 조회
- `getRecentVideos(channelId)` - 최근 비디오 조회
- `getVideosViaAPI(channelId)` - API 기반 조회
- `getVideosViaRSS(channelId)` - RSS 기반 조회 (cache-first)
- `isShort(videoId)` - Shorts 판별
- `parseDuration(duration)` - ISO 8601 형식의 duration 파싱

**외부 의존성**: YouTubeClient

**출력 형식**:
```typescript
{
  id: string;
  title: string;
  channel_name: string;
  published_at: string;
  duration: number | null;
  has_caption: boolean;
  source: 'api' | 'rss';
}
```

---

### 3. GeminiService (apps/server/src/services/gemini.service.ts)
**역할**: AI 기반 요약 생성
**주요 메소드**:
- `summarize(transcript, videoTitle)` - 텍스트 요약
- `summarizeAudio(audioPath, videoTitle)` - 오디오 요약
- `generateBriefing(summaries)` - 일일 브리핑 생성
- `getSummaryWithFallback(transcript, ...)` - 실패 시 재시도
- `buildSummaryPrompt(transcript, videoTitle)` - 요약 프롬프트 생성
- `buildAudioPrompt(audioPath, videoTitle)` - 오디오 프롬프트 생성
- `buildBriefingPrompt(summaries)` - 브리핑 프롬프트 생성
- `isErrorSummary(content)` - 에러 여부 판별
- `sleep(ms)` - 지연

**외부 의존성**: GeminiClient

---

### 4. NotifierService (apps/server/src/services/notifier.service.ts)
**역할**: Telegram 알림 발송
**주요 메소드**:
- `isConfigured()` - 설정 여부 확인
- `sendVideoSummary(video, summary)` - 비디오 요약 발송
- `sendBriefing(briefing)` - 브리핑 발송
- `sendTest()` - 테스트 메시지 발송
- `formatVideoMessage(video, summary)` - 비디오 메시지 포맷팅
- `formatBriefingMessage(briefing)` - 브리핑 메시지 포맷팅

**외부 의존성**: TelegramClient

---

### 5. TranscriptService (apps/server/src/services/transcript.service.ts)
**역할**: YouTube 자막 추출
**주요 메소드**:
- `getTranscript(videoId)` - 자막 조회
- `hasTranscript(videoId)` - 자막 존재 여부 확인
- `fetchWithLanguage(videoId, language)` - 특정 언어 자막 조회
- `fetchAnyLanguage(videoId)` - 모든 언어 자막 조회 (폴백)

---

## 🗄️ Repository 인터페이스

### ISubscriptionRepository
**메소드**:
- `create(data)` → Subscription
- `findById(id)` → Subscription | null
- `findAll()` → Subscription[]
- `findActive()` → Subscription[]
- `update(id, data)` → Subscription
- `delete(id)` → void
- `exists(id)` → boolean

### ISettingsRepository
**메소드**:
- `get()` → Settings
- `update(data)` → Settings

### ISummaryRepository
**메소드**:
- `save(summary)` → void
- `findAll()` → SummaryEntity[]
- `findByVideoId(videoId)` → SummaryEntity | null
- `findByDate(year, month, day)` → SummaryEntity[]
- `findBriefing()` → SummaryEntity | null

**데이터 타입**:
```typescript
interface SummaryEntity {
  video_id: string;
  title: string;
  channel_name: string;
  content: string;
  date: string;
  tags?: string[];
}

interface SummaryQueryOptions {
  year?: number;
  month?: number;
  day?: number;
  search?: string;
  channelName?: string;
  limit?: number;
  offset?: number;
}
```

### IVideoCacheRepository
**메소드**:
- `findByChannel(channelId)` → Video[]
- `saveForChannel(channelId, videos)` → void
- `replaceForChannel(channelId, videos)` → void
- `deleteForChannel(channelId)` → void

---

## 💾 저장소 파일

### data.json
```json
{
  "subscriptions": [
    {
      "id": "sub_1",
      "channel_id": "UCxxxxxx",
      "channel_name": "채널명",
      "last_video_id": "xxxxx",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "settings": {
    "telegram_token": "xxx",
    "telegram_chat_id": "xxx",
    "gemini_api_key": "xxx",
    "youtube_api_key": "xxx",
    "notification_enabled": true,
    "briefing_enabled": true,
    "briefing_time": "09:00"
  }
}
```

### summaries.json
```json
[
  {
    "video_id": "xxxxx",
    "title": "비디오 제목",
    "channel_name": "채널명",
    "content": "요약 내용",
    "date": "2024-01-01",
    "tags": ["tag1", "tag2"]
  }
]
```

### video_cache.json
```json
{
  "UCxxxxxx": [
    {
      "id": "xxxxx",
      "title": "비디오 제목",
      "channel_name": "채널명",
      "published_at": "2024-01-01T00:00:00Z",
      "duration": 600,
      "has_caption": true,
      "source": "rss"
    }
  ]
}
```

---

## 🎮 Controllers 상세

### SubscriptionController
- `add(channelId)` → 구독 추가
- `delete(subscriptionId)` → 구독 삭제
- `getAll()` → 모든 구독 조회
- `update(subscriptionId, data)` → 구독 수정

### SettingsController
- `get()` → 설정 조회
- `update(settings)` → 설정 변경
- `testTelegram()` → Telegram 테스트 메시지 발송

### SummaryController
- `generate(videoId, transcript)` → 요약 생성
- `getAll()` → 모든 요약 조회
- `getByDate(year, month, day)` → 날짜별 요약 조회
- `getByVideoId(videoId)` → 특정 비디오 요약 조회

### VideoController
- `getByChannel(channelId)` → 채널의 캐시된 비디오 조회
- `checkNewVideos(channelId)` → 새 비디오 확인
- `refresh(channelId)` → 캐시 새로고침
- `getStats()` → 통계 조회
- `markNotificationsChecked()` → 알림 읽음 표시

### BriefingController
- `generate()` → 브리핑 생성
- `get()` → 브리핑 조회

---

## ⏰ 백그라운드 작업

### MonitorJob (monitor.job.ts)
**역할**: 주기적으로 구독 채널의 새 비디오 확인
**주요 메소드**:
- `run()` - 메인 로직
  1. 활성 구독 조회
  2. 각 구독별로 `processSubscription()` 호출
  3. 지연 후 다음 구독 처리

- `processSubscription(subscription)` - 단일 구독 처리
  1. 최근 비디오 조회
  2. `filterNewVideos()`로 신규 필터링
  3. 각 신규 비디오에 대해 `processVideo()` 호출

- `processVideo(video, subscription)` - 단일 비디오 처리
  1. 자막 추출 (TranscriptService)
  2. 요약 생성 (GeminiService)
  3. 요약 저장 (DataService)
  4. 알림 발송 (NotifierService)

- `filterNewVideos(videos, lastVideoId)` - 신규 비디오 필터링
  마지막 본 비디오 이후의 비디오만 반환

- `sleep(ms)` - 지연

### BriefingJob (monitor.job.ts)
**역할**: 일일 브리핑 생성 및 발송
**실행**: 설정된 시간에 자동 실행
**로직**:
1. 모든 요약 조회
2. GeminiService.generateBriefing() 호출
3. 브리핑 저장
4. NotifierService.sendBriefing() 호출

---

## 🔌 외부 API 클라이언트 (lib/)

### YouTubeClient (youtube-client.ts)
**메소드**:
- `isConfigured()` - API 키 설정 여부
- `getClient()` - youtube v3 클라이언트 반환
- `getChannelById(channelId)` - 채널 정보 조회
- `getVideoDetails(videoId)` - 비디오 상세 정보
- `getPlaylistItems(playlistId)` - 플레이리스트 항목 조회
- `searchChannels(query)` - 채널 검색

### GeminiClient (gemini-client.ts)
**메소드**:
- `getAPI()` - Generative AI 인스턴스 반환
- `getGenerativeModel(model)` - 특정 모델 반환
- `generateWithFallback(prompt, fallbackModel)` - 실패 시 재시도
- `generateWithAudio(audioPath, prompt)` - 오디오 기반 생성

### TelegramClient (telegram-client.ts)
**메소드**:
- `isConfigured()` - 토큰, 채팅ID 설정 여부
- `sendMessage(message)` - 메시지 발송
- `sendTestMessage()` - 테스트 메시지 발송

### FileStorage (file-storage.ts)
**메소드**:
- `ensureDir(dir)` - 디렉토리 생성
- `fileExists(file)` - 파일 존재 여부
- `readJSON(file)` - JSON 읽기
- `writeJSON(file, data)` - JSON 쓰기

---

## 🛠️ 새로운 기능 추가 가이드

### 1. 새로운 데이터 도메인 추가 (예: UserPreferences)
```
1. domains/user-preferences/repositories/interfaces/IUserPreferencesRepository.ts 작성
2. domains/user-preferences/repositories/implementations/file/FileUserPreferencesRepository.ts 작성
3. DataService에 userPreferencesRepo 주입
4. DataService에 getter/setter 메소드 추가
5. UserPreferencesController 작성
6. routes/user-preferences.ts 작성
7. routes/index.ts에 등록
```

### 2. 새로운 외부 API 연동 (예: Discord)
```
1. lib/discord-client.ts 작성
2. services/discord.service.ts 작성 (또는 notifier.service.ts 확장)
3. controllers에서 필요시 새 메소드 추가
4. routes에서 엔드포인트 추가
```

### 3. 새로운 백그라운드 작업 추가 (예: CleanupJob)
```
1. jobs/cleanup.job.ts 작성 (MonitorJob 참고)
2. scheduler.ts에 스케줄 등록
3. index.ts에서 시작
```

### 4. API 응답 변경
```
1. controllers/*.controller.ts의 메소드 수정
2. 필요시 schemas/*.schema.ts 업데이트
3. Frontend와 협의
```

---

## 🔍 코드 네비게이션 팁

### 특정 기능의 전체 흐름 추적
예: "새 비디오 감지 후 알림까지의 흐름"
1. `MonitorJob.run()` (jobs/monitor.job.ts)
2. → `processSubscription()` (동일 파일)
3. → `YouTubeService.getRecentVideos()` (services/youtube.service.ts)
4. → `processVideo()` (jobs/monitor.job.ts)
5. → `TranscriptService.getTranscript()` (services/transcript.service.ts)
6. → `GeminiService.summarize()` (services/gemini.service.ts)
7. → `DataService.saveSummary()` (services/data.service.ts)
8. → `NotifierService.sendVideoSummary()` (services/notifier.service.ts)

### 데이터 접근 패턴
- **읽기**: Controller → Service → Repository → FileStorage
- **쓰기**: Controller → Service → Repository → FileStorage
- **수정**: Controller → Service → Repository → FileStorage

### 에러 처리
- 커스텀 에러는 `utils/errors.ts` 참고
- Middleware의 `error-handler.ts`에서 일괄 처리
- 각 Service는 try-catch로 예외 처리

---

## 📝 주요 타입 정의

### Subscription
```typescript
{
  id: string;
  channel_id: string;
  channel_name: string;
  last_video_id: string;
  is_active: boolean;
  created_at: string;
}
```

### Settings
```typescript
{
  telegram_token: string;
  telegram_chat_id: string;
  gemini_api_key: string;
  youtube_api_key: string;
  notification_enabled: boolean;
  briefing_enabled: boolean;
  briefing_time: string; // HH:mm format
}
```

### Video
```typescript
{
  id: string;
  title: string;
  channel_name: string;
  published_at: string;
  duration: number | null;
  has_caption: boolean;
  source: 'api' | 'rss';
}
```

---

## 🚀 향후 개선 계획

1. **Database 마이그레이션**: JSON → PostgreSQL (Repository 인터페이스 유지)
2. **ORM 도입**: TypeORM 또는 Prisma
3. **캐싱 계층**: Redis 추가 (성능 최적화)
4. **로깅 시스템**: Winston 또는 Pino
5. **테스트 커버리지**: Jest + Supertest
6. **인증 시스템**: JWT 기반 사용자 인증
7. **UI 고도화**: React 프론트엔드 확장
8. **모니터링**: 에러 트래킹 (Sentry 등)

---

## 📌 핵심 개념 정리

### Service-Repository 패턴
- **Service**: 비즈니스 로직 (계산, 유효성 검사, 조율)
- **Repository**: 데이터 접근 추상화 (CRUD 작업)
- **이점**: 데이터베이스 변경 시 Repository만 수정하면 됨

### Dependency Injection
- Services가 Repository를 주입받음
- 테스트 시 Mock Repository 사용 가능
- 느슨한 결합(Loose Coupling) 달성

### 파일 기반 저장소
- **현재**: JSON 파일 사용
- **향후**: Database로 쉽게 전환 가능 (인터페이스 동일)
