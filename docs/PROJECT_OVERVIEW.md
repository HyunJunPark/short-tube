# Short-Tube: YouTube 채널 모니터링 및 AI 요약 시스템

## 📖 프로젝트 개요

### 프로젝트 목적
Short-Tube는 YouTube 채널을 모니터링하고 새로운 비디오의 내용을 AI로 자동 요약하여 제공하는 풀스택 웹 애플리케이션입니다. 사용자는 관심 있는 YouTube 채널을 구독하면, 시스템이 자동으로 신규 비디오를 감지하고 Gemini AI를 통해 요약을 생성한 후 Telegram으로 알림을 발송합니다.

### 핵심 기능
1. **YouTube 채널 구독 관리**: 채널 추가/삭제, 카테고리/태그 지정
2. **자동 비디오 모니터링**: 15분마다 신규 비디오 자동 감지
3. **AI 기반 요약 생성**: Google Gemini를 활용한 비디오 자막 요약
4. **실시간 알림**: Telegram Bot을 통한 요약 자동 발송
5. **일일 브리핑**: 하루 동안의 모든 요약을 통합한 브리핑 생성
6. **요약 아카이브**: 검색 및 필터링 가능한 요약 저장소

### 사용 시나리오
- **정보 큐레이션**: 여러 채널의 콘텐츠를 빠르게 파악
- **시간 절약**: 긴 비디오를 보지 않고 핵심 내용만 확인
- **트렌드 파악**: 관심 분야의 최신 동향 모니터링
- **학습 보조**: 교육 콘텐츠의 주요 내용 정리

---

## 🏗️ 기술 아키텍처

### 시스템 구성도
```
┌─────────────────────────────────────────────────────────────────┐
│                        Short-Tube System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │   Frontend (Web)  │ ◄────►  │  Backend (API)   │             │
│  │                   │          │                   │             │
│  │  Next.js 15       │  HTTP    │  Express.js      │             │
│  │  React 19         │  REST    │  TypeScript      │             │
│  │  React Query      │  API     │  Node.js 18+     │             │
│  │  Tailwind CSS     │          │                   │             │
│  │  shadcn/ui        │          │  Service-Repo    │             │
│  └──────────────────┘          │  Pattern          │             │
│                                 └──────────────────┘             │
│                                          │                        │
│                                          ▼                        │
│                              ┌───────────────────────┐           │
│                              │   External Services   │           │
│                              ├───────────────────────┤           │
│                              │ • YouTube Data API    │           │
│                              │ • Google Gemini API   │           │
│                              │ • Telegram Bot API    │           │
│                              │ • yt-dlp (fallback)   │           │
│                              └───────────────────────┘           │
│                                          │                        │
│                                          ▼                        │
│                              ┌───────────────────────┐           │
│                              │   Data Storage        │           │
│                              ├───────────────────────┤           │
│                              │ • data.json           │           │
│                              │ • summaries.json      │           │
│                              │ • video_cache.json    │           │
│                              │ • notification_log.json│          │
│                              └───────────────────────┘           │
│                                                                   │
│                              ┌───────────────────────┐           │
│                              │  Background Jobs      │           │
│                              ├───────────────────────┤           │
│                              │ • MonitorJob (주기)   │           │
│                              │ • BriefingJob (일일)  │           │
│                              └───────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 기술 스택

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **State Management**: React Query (TanStack Query v5)
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios
- **언어**: TypeScript

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **아키텍처 패턴**: Service-Repository Pattern (DDD 기반)
- **검증**: Zod schemas
- **스케줄링**: node-cron
- **언어**: TypeScript

#### External APIs
- **YouTube Data API v3**: 채널 정보, 비디오 메타데이터 조회
- **Google Gemini API**: AI 기반 텍스트 요약 생성
- **Telegram Bot API**: 실시간 알림 발송
- **yt-dlp**: YouTube API 실패 시 fallback

#### Data Storage
- **현재**: 파일 기반 JSON 스토리지
- **향후**: PostgreSQL + TypeORM/Prisma 마이그레이션 예정

---

## 📂 프로젝트 구조

### 모노레포 구조
```
short-tube/
├── apps/
│   ├── web/                    # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router 페이지
│   │   │   │   ├── page.tsx                  # Dashboard
│   │   │   │   ├── briefing/page.tsx         # Briefing
│   │   │   │   ├── archive/page.tsx          # Archive
│   │   │   │   └── settings/page.tsx         # Settings
│   │   │   ├── components/     # React 컴포넌트
│   │   │   │   ├── layout/     # MainLayout, Header, Sidebar
│   │   │   │   ├── dashboard/  # AddChannelForm, ChannelCard, VideoList
│   │   │   │   └── ui/         # shadcn/ui 컴포넌트
│   │   │   ├── hooks/          # React Query Hooks
│   │   │   │   ├── useSubscriptions.ts
│   │   │   │   ├── useVideos.ts
│   │   │   │   ├── useSummaries.ts
│   │   │   │   ├── useBriefing.ts
│   │   │   │   └── useSettings.ts
│   │   │   └── lib/
│   │   │       ├── api-client.ts         # Axios 클라이언트
│   │   │       └── utils.ts
│   │   └── package.json
│   │
│   └── server/                 # Express 백엔드
│       ├── src/
│       │   ├── routes/         # API 라우팅
│       │   ├── controllers/    # HTTP 요청 핸들러
│       │   ├── services/       # 비즈니스 로직
│       │   │   ├── data.service.ts       # 데이터 관리
│       │   │   ├── youtube.service.ts    # YouTube API
│       │   │   ├── gemini.service.ts     # AI 요약
│       │   │   ├── notifier.service.ts   # Telegram 알림
│       │   │   └── transcript.service.ts # 자막 추출
│       │   ├── domains/        # Repository 패턴
│       │   │   ├── subscription/
│       │   │   ├── settings/
│       │   │   ├── summary/
│       │   │   └── video-cache/
│       │   ├── lib/            # 외부 API 클라이언트
│       │   ├── jobs/           # 백그라운드 작업
│       │   │   └── monitor.job.ts        # MonitorJob, BriefingJob
│       │   ├── middleware/     # Express 미들웨어
│       │   ├── schemas/        # Zod 검증 스키마
│       │   └── utils/
│       └── package.json
│
├── packages/
│   └── types/                  # 공유 타입 정의
│       └── src/
│           └── index.ts
│
├── data/                       # JSON 데이터 파일
│   ├── data.json               # 구독 및 설정
│   ├── summaries.json          # AI 요약
│   ├── video_cache.json        # 비디오 캐시
│   └── notification_log.json   # 알림 로그
│
├── docs/                       # 프로젝트 문서
├── agent.md                    # AI 에이전트 가이드
├── package.json                # 루트 패키지 (워크스페이스)
└── README.md
```

---

## 🔄 핵심 데이터 플로우

### 1. 채널 구독 추가 플로우
```
사용자 입력 (채널 ID/핸들/URL)
    ↓
[Frontend] useAddSubscription() → POST /api/subscriptions
    ↓
[Backend] SubscriptionController.add()
    ↓
YouTubeService.getChannelInfo()
    ├→ YouTube Data API (forHandle/id)
    └→ 실패 시 yt-dlp fallback
    ↓
DataService.addSubscription()
    ↓
SubscriptionRepository.create()
    ↓
FileSubscriptionRepository → data.json 저장
    ↓
Response 200 { subscription }
    ↓
[Frontend] React Query invalidation
    ↓
UI 업데이트 (새 ChannelCard 렌더링)
```

### 2. AI 요약 생성 플로우
```
사용자 클릭 (Summarize 버튼)
    ↓
[Frontend] useGenerateSummary() → POST /api/summaries/generate
    ↓
[Backend] SummaryController.generate()
    ↓
1. 기존 요약 확인 (중복 방지)
    ↓
2. TranscriptService.getTranscript(videoId)
   └→ youtube-transcript-api 사용
    ↓
3. GeminiService.summarize(transcript, title)
   └→ Google Generative AI API 호출
    ↓
4. DataService.saveSummary()
   └→ summaries.json 저장
    ↓
Response 200 { summary }
    ↓
[Frontend] 요약 다이얼로그 표시
    ↓
버튼 "Summarize" → "View Summary"로 변경
```

### 3. 백그라운드 모니터링 플로우 (자동)
```
[Scheduler] 15분마다 MonitorJob 실행
    ↓
1. DataService.getActiveSubscriptions()
    ↓
2. 각 구독별 처리:
   YouTubeService.getRecentVideos(channelId)
   ├→ YouTube Data API (정확한 메타데이터)
   └→ 실패 시 RSS feed fallback
    ↓
3. 신규 비디오 필터링 (last_video_id 기준)
    ↓
4. 각 신규 비디오 처리:
   - TranscriptService.getTranscript()
   - GeminiService.summarize()
   - DataService.saveSummary()
   - NotifierService.sendVideoSummary()
     └→ Telegram API 호출
    ↓
5. last_video_id 업데이트
    ↓
6. 다음 구독 처리 (5초 대기)
```

### 4. 일일 브리핑 생성 플로우 (자동)
```
[Scheduler] 매일 설정된 시간 (예: 09:00)에 BriefingJob 실행
    ↓
1. DataService.getAllSummaries()
   └→ 최근 24시간 요약 필터링
    ↓
2. GeminiService.generateBriefing(summaries)
   └→ 모든 요약을 통합하여 브리핑 생성
    ↓
3. DataService.saveSummary()
   └→ video_id: 'BRIEFING_YYYY-MM-DD'
    ↓
4. NotifierService.sendBriefing()
   └→ Telegram으로 브리핑 발송
```

---

## 🎨 사용자 인터페이스

### 주요 페이지

#### 1. Dashboard (`/`)
**목적**: 채널 관리 및 비디오 모니터링

**주요 기능**:
- 채널 구독 추가 (ID/핸들/URL 지원)
- 카테고리별 채널 필터링
- 채널별 카테고리/태그 설정
- 비디오 목록 조회 및 새로고침
- 비디오 요약 생성/조회
- Active/Inactive 토글
- 채널 삭제

**UI 구성**:
- **Header**: 타이틀 + 채널 추가 버튼
- **Stats Cards**: 총 요약 수, 오늘 비디오 수, 신규 비디오 알림
- **Category Tabs**: 전체 / 카테고리별 필터
- **Channel Cards**: Accordion 형식
  - Categories 섹션
  - Tags 섹션
  - Videos 섹션 (Load More 지원)

#### 2. Briefing (`/briefing`)
**목적**: 일일 브리핑 생성 및 조회

**주요 기능**:
- 날짜 선택 (캘린더 인풋)
- 브리핑 생성 버튼
- 브리핑 내용 표시 (Markdown 형식)

**UI 구성**:
- Date Selection Card
- Briefing Content Card (Markdown 렌더링)

#### 3. Archive (`/archive`)
**목적**: 모든 요약 검색 및 필터링

**주요 기능**:
- 키워드 검색 (제목, 채널명, 내용)
- 태그 필터링 (다중 선택)
- 날짜 필터링 (년/월/일)
- 요약 목록 표시
- YouTube 링크

**UI 구성**:
- Search & Filter Card
  - 검색 인풋
  - Date Selectors (Year/Month/Day)
  - Tag Badges
- Results Card
  - Summary Items (제목, 채널, 날짜, 태그, 내용 미리보기)

#### 4. Settings (`/settings`)
**목적**: 시스템 설정 관리

**주요 기능**:
- YouTube API 키 설정
- Gemini API 키 설정
- Telegram Bot 설정 (토큰, Chat ID)
- 알림 활성화/비활성화
- 브리핑 설정 (활성화, 시간)
- Telegram 테스트 메시지

**UI 구성**:
- API Settings Cards (YouTube, Gemini)
- Telegram Settings Card (+ Test 버튼)
- Notification Settings Card
- Briefing Settings Card

---

## 🔌 API 엔드포인트

### Subscriptions
- `GET /api/subscriptions` - 모든 구독 조회
- `POST /api/subscriptions` - 채널 구독 추가
  - Body: `{ channelInput: string }`
- `PATCH /api/subscriptions/:channelId` - 구독 정보 수정
  - Body: `Partial<Subscription>`
- `DELETE /api/subscriptions/:channelId` - 구독 삭제

### Videos
- `GET /api/videos/channel/:channelId` - 채널의 비디오 조회
- `POST /api/videos/refresh/:channelId` - 비디오 새로고침
- `GET /api/videos/stats` - 비디오 통계 조회
- `POST /api/videos/check-new` - 신규 비디오 확인

### Summaries
- `GET /api/summaries` - 모든 요약 조회
  - Query: `year`, `month`, `day`
- `GET /api/summaries/:videoId` - 특정 비디오 요약 조회
- `POST /api/summaries/generate` - 요약 생성
  - Body: `{ videoId: string, tags?: string[] }`

### Briefing
- `GET /api/briefing` - 브리핑 조회
  - Query: `date` (YYYY-MM-DD)
- `POST /api/briefing/generate` - 브리핑 생성
  - Body: `{ date: string }`

### Settings
- `GET /api/settings` - 설정 조회
- `PATCH /api/settings` - 설정 수정
  - Body: `Partial<Settings>`
- `POST /api/settings/telegram/test` - Telegram 테스트 메시지

### Monitor
- `POST /api/monitor/run` - 모니터링 수동 실행

---

## 🗄️ 데이터 모델

### Subscription
```typescript
interface Subscription {
  id: string                  // 고유 ID (UUID)
  channel_id: string          // YouTube 채널 ID
  channel_name: string        // 채널명
  last_video_id: string       // 마지막 확인 비디오 ID
  is_active: boolean          // 활성 상태
  categories?: string[]       // 카테고리 (예: ['Technology', 'AI'])
  tags: string[]              // 태그 (예: ['ChatGPT', 'AI'])
  created_at: string          // 생성 일시 (ISO 8601)
}
```

### Video
```typescript
interface Video {
  id: string                  // YouTube 비디오 ID
  title: string               // 비디오 제목
  channel_name: string        // 채널명
  published_at: string        // 게시 일시 (ISO 8601)
  duration: number | null     // 영상 길이 (초)
  has_caption: boolean        // 자막 존재 여부
  source: 'api' | 'rss'       // 데이터 소스
}
```

### Summary
```typescript
interface Summary {
  video_id: string            // YouTube 비디오 ID (또는 'BRIEFING_YYYY-MM-DD')
  title: string               // 비디오 제목
  channel_name: string        // 채널명
  content: string             // AI 생성 요약 내용
  date: string                // 생성 날짜 (YYYY-MM-DD)
  tags?: string[]             // 태그
}
```

### Settings
```typescript
interface Settings {
  telegram_token: string      // Telegram Bot 토큰
  telegram_chat_id: string    // Telegram Chat ID
  gemini_api_key: string      // Gemini API 키
  youtube_api_key: string     // YouTube Data API 키
  notification_enabled: boolean // 알림 활성화
  briefing_enabled: boolean   // 브리핑 활성화
  briefing_time: string       // 브리핑 시간 (HH:mm)
}
```

---

## ⚙️ 백엔드 아키텍처 패턴

### Service-Repository Pattern

Short-Tube는 **Service-Repository 패턴**을 기반으로 한 계층형 아키텍처를 사용합니다.

#### 아키텍처 계층
```
HTTP Request
    ↓
Routes (라우팅)
    ↓
Controllers (요청 검증 + 응답 형식)
    ↓
Services (비즈니스 로직)
    ↓
Repositories (데이터 접근 추상화)
    ↓
Storage (파일 시스템 또는 DB)
    ↓
HTTP Response
```

#### 주요 서비스

**1. DataService**
- 역할: 모든 데이터 접근의 중앙 허브
- 의존성: 4개 Repository (Subscription, Settings, Summary, VideoCache)
- 주요 메소드:
  - `getSubscriptions()`, `addSubscription()`, `updateSubscription()`, `deleteSubscription()`
  - `getSettings()`, `updateSettings()`
  - `saveSummary()`, `getAllSummaries()`, `getSummaryByVideoId()`
  - `saveVideoCache()`, `getVideoCache()`, `deleteVideoCache()`

**2. YouTubeService**
- 역할: YouTube 데이터 조회 및 변환
- 외부 의존성: YouTubeClient
- 주요 메소드:
  - `getChannelInfo()` - 채널 정보 조회 (API/yt-dlp)
  - `getRecentVideos()` - 최근 비디오 조회 (API/RSS)
  - `isShort()` - Shorts 판별
  - `parseDuration()` - ISO 8601 duration 파싱

**3. GeminiService**
- 역할: AI 기반 요약 생성
- 외부 의존성: GeminiClient
- 주요 메소드:
  - `summarize()` - 텍스트 요약
  - `summarizeAudio()` - 오디오 요약
  - `generateBriefing()` - 일일 브리핑 생성
  - `getSummaryWithFallback()` - 재시도 로직

**4. NotifierService**
- 역할: Telegram 알림 발송
- 외부 의존성: TelegramClient
- 주요 메소드:
  - `sendVideoSummary()` - 비디오 요약 발송
  - `sendBriefing()` - 브리핑 발송
  - `sendTest()` - 테스트 메시지

**5. TranscriptService**
- 역할: YouTube 자막 추출
- 외부 의존성: youtube-transcript-api
- 주요 메소드:
  - `getTranscript()` - 자막 조회 (한국어 → 영어 → 기타 순)
  - `hasTranscript()` - 자막 존재 여부

#### Repository 인터페이스

모든 Repository는 인터페이스로 정의되어 있어, 향후 데이터베이스 마이그레이션 시 구현체만 교체하면 됩니다.

**ISubscriptionRepository**
```typescript
interface ISubscriptionRepository {
  create(data: CreateSubscriptionData): Subscription
  findById(id: string): Subscription | null
  findAll(): Subscription[]
  findActive(): Subscription[]
  update(id: string, data: Partial<Subscription>): Subscription
  delete(id: string): void
  exists(id: string): boolean
}
```

현재는 `FileSubscriptionRepository`로 구현되어 있으며, 향후 `PostgresSubscriptionRepository` 등으로 교체 가능합니다.

---

## 🕐 백그라운드 작업

### MonitorJob
**실행 주기**: 15분마다 (node-cron)

**작업 흐름**:
1. 활성 구독 조회
2. 각 구독별 최근 비디오 조회
3. 신규 비디오 필터링 (last_video_id 기준)
4. 신규 비디오별 처리:
   - 자막 추출
   - AI 요약 생성
   - 요약 저장
   - Telegram 알림 발송
5. last_video_id 업데이트
6. Rate Limit 회피를 위한 5초 대기

**에러 처리**:
- 자막 추출 실패 시 해당 비디오 스킵
- API 실패 시 fallback 사용 (YouTube → RSS, API → yt-dlp)

### BriefingJob
**실행 주기**: 매일 설정된 시간 (예: 09:00)

**작업 흐름**:
1. `briefing_enabled` 설정 확인
2. 최근 24시간 요약 조회
3. AI 브리핑 생성 (모든 요약 통합)
4. 브리핑 저장 (`video_id: 'BRIEFING_YYYY-MM-DD'`)
5. Telegram 브리핑 발송

---

## 🎯 React Query 전략

### 쿼리 키 구조
```typescript
['subscriptions']                   // 모든 구독
['videos', channelId]               // 특정 채널의 비디오
['videos', 'stats']                 // 비디오 통계
['summaries']                       // 모든 요약
['summaries', { year, month, day }] // 날짜별 요약
['summary', videoId]                // 특정 비디오 요약
['briefing', date]                  // 특정 날짜 브리핑
['settings']                        // 설정
```

### Invalidation 패턴
```typescript
// 구독 변경 후
queryClient.invalidateQueries({ queryKey: ['subscriptions'] })

// 비디오 새로고침 후
queryClient.invalidateQueries({ queryKey: ['videos', channelId] })

// 요약 생성 후 (Optimistic Update)
queryClient.setQueryData(['summary', videoId], newSummary)

// 브리핑 생성 후
queryClient.invalidateQueries({ queryKey: ['briefing', date] })
```

### Optimistic Updates
요약 생성 시 즉시 UI 업데이트:
```typescript
onSuccess: (data) => {
  queryClient.setQueryData(['summary', videoId], data)
  // 버튼이 "Summarize" → "View Summary"로 즉시 변경
}
```

---

## 🔒 보안 및 에러 처리

### API 키 관리
- 모든 API 키는 `settings`에 저장 (현재 data.json)
- 프론트엔드는 API 키를 직접 다루지 않음
- 백엔드에서만 외부 API 호출

### 에러 처리

#### Frontend
```typescript
// Axios Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)
```

#### Backend
```typescript
// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})
```

### Rate Limiting
- YouTube API: Quota 절약을 위해 RSS 우선 사용
- Gemini API: 요약 중복 생성 방지 (기존 요약 확인)
- MonitorJob: 채널별 5초 대기

---

## 🚀 성능 최적화

### Frontend
1. **React Query 캐싱**: 불필요한 API 호출 최소화
2. **Lazy Loading**: VideoList에서 "Load More" 패턴 (초기 2개만 로드)
3. **Optimistic Updates**: 구독 토글 등 즉시 UI 반영
4. **Debouncing**: Archive 검색창 (향후 적용 예정)

### Backend
1. **비디오 캐싱**: video_cache.json으로 반복 조회 방지
2. **RSS 우선 조회**: YouTube API quota 절약
3. **요약 중복 방지**: 생성 전 기존 요약 확인
4. **배치 처리**: MonitorJob에서 채널별 순차 처리

---

## 📊 사용 통계 (예상)

### API 호출 빈도
- **YouTube Data API**:
  - 채널 추가 시: 1회
  - 비디오 새로고침 시: 1-2회 (채널 정보 + 비디오 목록)
  - MonitorJob: 구독 수 × 2회 (15분마다)
- **Gemini API**:
  - 요약 생성: 1회/비디오
  - 브리핑 생성: 1회/일
- **Telegram API**:
  - 신규 비디오 알림: 1회/비디오
  - 일일 브리핑: 1회/일

### 데이터 증가율 (예상)
- **구독**: 10-50개
- **비디오 캐시**: 채널당 50개 × 구독 수
- **요약**: 신규 비디오 수 (일 10-30개)

---

## 🔮 향후 개선 계획

### 단기 (1-2개월)
1. ✅ Repository 패턴 완성
2. Database 마이그레이션 (PostgreSQL)
3. ORM 도입 (TypeORM/Prisma)
4. 테스트 코드 작성 (Jest + Supertest)
5. 로깅 시스템 (Winston)

### 중기 (3-6개월)
1. 사용자 인증 시스템 (JWT)
2. 다중 사용자 지원
3. 실시간 알림 (WebSocket)
4. 비디오 북마크 기능
5. 요약 편집 기능
6. 모바일 반응형 UI 개선

### 장기 (6개월+)
1. 모바일 앱 (React Native)
2. 머신러닝 기반 추천 시스템
3. 다국어 지원 (i18n)
4. 커뮤니티 기능 (공유, 댓글)
5. 프리미엄 플랜

---

## 💡 핵심 설계 원칙

### 1. 관심사의 분리 (Separation of Concerns)
- **Frontend**: UI/UX 및 상태 관리
- **Backend**: 비즈니스 로직 및 데이터 관리
- **Services**: 특정 도메인 로직 (YouTube, AI, Notification)
- **Repositories**: 데이터 접근 추상화

### 2. 의존성 역전 (Dependency Inversion)
- Services는 Repository 인터페이스에 의존
- 구현체 교체 가능 (File → Database)

### 3. 단일 책임 원칙 (Single Responsibility)
- 각 Service/Controller/Repository는 하나의 책임만 가짐
- DataService: 데이터 조율
- YouTubeService: YouTube 데이터 조회
- GeminiService: AI 요약 생성

### 4. DRY (Don't Repeat Yourself)
- 공유 타입은 `packages/types`에 정의
- 공통 로직은 Utils/Middleware로 분리

### 5. 확장 가능성 (Scalability)
- 새로운 데이터 소스 추가: Repository 구현체 추가
- 새로운 알림 채널: NotifierService 확장
- 새로운 AI 모델: GeminiService 교체

---

## 🧪 테스트 전략 (향후)

### Unit Tests
- Services 로직 테스트 (Mock Repository)
- Repository 테스트 (Mock File System)
- Utility 함수 테스트

### Integration Tests
- API 엔드포인트 테스트 (Supertest)
- Service-Repository 통합 테스트

### E2E Tests
- 주요 사용자 시나리오 테스트 (Playwright)
- 백그라운드 작업 테스트

---

## 📝 개발 가이드

### 로컬 환경 설정
1. Node.js 18+ 설치
2. 의존성 설치: `npm install`
3. `.env` 파일 설정 (API 키)
4. 서버 실행: `npm run server:dev`
5. 클라이언트 실행: `npm run web:dev`

### 새 기능 추가 체크리스트
1. ✅ 기존 아키텍처 패턴 확인 (`agent.md` 참조)
2. ✅ 데이터 모델 정의 (`packages/types`)
3. ✅ Repository 인터페이스 정의 (필요 시)
4. ✅ Service 로직 작성
5. ✅ Controller 작성
6. ✅ Route 등록
7. ✅ Frontend Hook 작성 (React Query)
8. ✅ UI 컴포넌트 작성
9. ✅ 테스트
10. ✅ 커밋 (커밋 규칙 준수)

### 커밋 메시지 규칙
```
<타입>: <제목>

<본문>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**타입**:
- `Feat`: 새로운 기능 추가
- `Fix`: 버그 수정
- `Refactor`: 코드 리팩토링
- `Improve`: 기능 개선
- `Docs`: 문서 추가/수정
- `Test`: 테스트 코드
- `Chore`: 빌드, 설정 변경
- `Style`: 코드 스타일 변경

---

## 🔗 관련 문서

### 내부 문서
- [agent.md](../agent.md) - AI 에이전트 가이드
- [COMMIT_CONVENTION.md](../COMMIT_CONVENTION.md) - 커밋 규칙

### 세레나 메모리
- `project_map_and_ui_flow` - 프로젝트 맵 및 UI 흐름도
- `project_architecture_map` - 백엔드 아키텍처 상세 맵
- `commit_convention` - 커밋 규칙
- `react_query_internal_mechanism` - React Query 내부 동작
- `handleGenerateSummary_flow` - 요약 생성 플로우

### 외부 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Google Generative AI](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🙋 FAQ

### Q: YouTube API quota가 부족하면 어떻게 되나요?
A: RSS feed를 fallback으로 사용합니다. 단, RSS는 자막 정보와 정확한 duration을 제공하지 않으므로, "Refresh" 버튼을 통해 API로 업데이트할 수 있습니다.

### Q: 자막이 없는 비디오도 요약할 수 있나요?
A: 현재는 자막이 있는 비디오만 요약 가능합니다. 향후 AudioService를 통해 음성 인식 기반 요약을 지원할 예정입니다.

### Q: 요약 품질을 개선하려면?
A: GeminiService의 프롬프트를 수정하거나, 더 강력한 모델(Gemini Pro)을 사용할 수 있습니다.

### Q: Telegram 대신 다른 알림 채널을 추가하려면?
A: NotifierService를 확장하여 Discord, Slack 등을 추가할 수 있습니다.

### Q: 데이터베이스로 마이그레이션하려면?
A: Repository 구현체만 교체하면 됩니다 (예: `PostgresSubscriptionRepository`). Service 레이어는 수정 불필요합니다.

---

## 📧 문의

프로젝트에 대한 질문이나 제안은 GitHub Issues를 통해 남겨주세요.

---

**Short-Tube** - YouTube 콘텐츠를 효율적으로 모니터링하고 요약하는 스마트한 방법 🚀
