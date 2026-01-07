# Short-Tube 기술 상세 문서

## 📚 목차
1. [프론트엔드 아키텍처](#프론트엔드-아키텍처)
2. [백엔드 아키텍처](#백엔드-아키텍처)
3. [React Query 패턴](#react-query-패턴)
4. [Service-Repository 패턴](#service-repository-패턴)
5. [외부 API 통합](#외부-api-통합)
6. [백그라운드 작업](#백그라운드-작업)
7. [에러 처리 전략](#에러-처리-전략)
8. [성능 최적화](#성능-최적화)

---

## 프론트엔드 아키텍처

### Next.js App Router 구조

Short-Tube는 Next.js 15의 App Router를 사용하며, 다음과 같은 파일 기반 라우팅을 따릅니다:

```
app/
├── layout.tsx              # 루트 레이아웃 (전역 설정)
├── providers.tsx           # React Query Provider
├── page.tsx                # / (Dashboard)
├── briefing/
│   └── page.tsx           # /briefing
├── archive/
│   └── page.tsx           # /archive
└── settings/
    └── page.tsx           # /settings
```

#### 레이아웃 계층
```
RootLayout (layout.tsx)
├── React Query Provider (providers.tsx)
├── Inter 폰트
└── globals.css

MainLayout (components/layout/MainLayout.tsx)
├── Sidebar (고정 네비게이션)
└── Content Area
    ├── Header (페이지 타이틀, 액션 버튼)
    └── Page Content
```

### 컴포넌트 설계 패턴

#### 1. Container/Presenter 패턴
```typescript
// Container: 데이터 로직 (Hooks)
function DashboardPage() {
  const { data: subscriptions, isLoading } = useSubscriptions()
  const { data: stats } = useVideoStats()

  return <DashboardView subscriptions={subscriptions} stats={stats} />
}

// Presenter: UI 렌더링
function DashboardView({ subscriptions, stats }) {
  return (
    <div>
      <StatsCards stats={stats} />
      <ChannelList subscriptions={subscriptions} />
    </div>
  )
}
```

#### 2. Compound Component 패턴
```typescript
// ChannelCard는 여러 하위 섹션으로 구성
<ChannelCard subscription={subscription}>
  <ChannelCard.Header />
  <ChannelCard.Categories />
  <ChannelCard.Tags />
  <ChannelCard.Videos />
</ChannelCard>
```

Accordion을 사용하여 각 섹션을 접고 펼칠 수 있습니다.

#### 3. Custom Hooks 패턴
모든 API 호출은 Custom Hooks로 추상화:

```typescript
// hooks/useSubscriptions.ts
export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await apiClient.get<Subscription[]>('/subscriptions')
      return response.data
    },
  })
}

export function useAddSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelInput: string) => {
      const response = await apiClient.post<Subscription>('/subscriptions', {
        channelInput,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}
```

### shadcn/ui 통합

Short-Tube는 shadcn/ui를 사용하여 일관된 디자인 시스템을 유지합니다.

**주요 컴포넌트**:
- `Button`, `Input`, `Select` - 폼 요소
- `Card`, `CardHeader`, `CardContent` - 콘텐츠 컨테이너
- `Dialog` - 모달 (채널 추가, 요약 보기)
- `Accordion` - 접이식 섹션 (카테고리, 태그, 비디오)
- `Badge` - 라벨 (신규 비디오, 자막, duration)
- `Switch` - 토글 (활성/비활성)
- `Tabs` - 카테고리 필터링

**커스터마이징**:
- Tailwind CSS의 CSS 변수를 통해 테마 색상 정의 (`globals.css`)
- `cn()` 유틸리티로 조건부 클래스 병합

---

## 백엔드 아키텍처

### Express.js 서버 구조

```typescript
// index.ts - 서버 진입점
import express from 'express'
import cors from 'cors'
import routes from './routes'
import errorHandler from './middleware/error-handler'
import { startScheduler } from './scheduler'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', routes)
app.use(errorHandler)

startScheduler() // 백그라운드 작업 시작

app.listen(PORT)
```

### 라우팅 구조

```typescript
// routes/index.ts
import { Router } from 'express'
import subscriptionsRouter from './subscriptions'
import videosRouter from './videos'
import summariesRouter from './summaries'
import briefingRouter from './briefing'
import settingsRouter from './settings'
import monitorRouter from './monitor'

const router = Router()

router.use('/subscriptions', subscriptionsRouter)
router.use('/videos', videosRouter)
router.use('/summaries', summariesRouter)
router.use('/briefing', briefingRouter)
router.use('/settings', settingsRouter)
router.use('/monitor', monitorRouter)

export default router
```

### 컨트롤러 패턴

컨트롤러는 HTTP 요청을 받아 검증하고, Service를 호출한 후 응답을 반환합니다.

```typescript
// controllers/subscription.controller.ts
export class SubscriptionController {
  constructor(
    private dataService: DataService,
    private youtubeService: YouTubeService
  ) {}

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelInput } = req.body

      // 1. 채널 정보 조회
      const channelInfo = await this.youtubeService.getChannelInfo(channelInput)

      // 2. 구독 추가
      const subscription = this.dataService.addSubscription({
        channel_id: channelInfo.id,
        channel_name: channelInfo.name,
        // ...
      })

      // 3. 응답
      res.json({ success: true, data: subscription })
    } catch (error) {
      next(error) // 에러 핸들러로 전달
    }
  }
}
```

### 미들웨어

#### 1. 에러 핸들러
```typescript
// middleware/error-handler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  const statusCode = (err as any).statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
  })
}
```

#### 2. Zod 검증 미들웨어
```typescript
// middleware/validate.ts
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      next(new ValidationError(error.message))
    }
  }
}

// 사용 예시
router.post(
  '/subscriptions',
  validate(subscriptionSchema),
  subscriptionController.add
)
```

---

## React Query 패턴

### 쿼리 키 전략

쿼리 키는 계층적 구조를 따릅니다:

```typescript
['subscriptions']                   // 모든 구독
['videos', channelId]               // 특정 채널의 비디오
['videos', 'stats']                 // 비디오 통계
['summaries']                       // 모든 요약
['summaries', { year, month, day }] // 필터링된 요약
['summary', videoId]                // 특정 비디오 요약
['briefing', date]                  // 특정 날짜 브리핑
['settings']                        // 설정
```

### 캐시 무효화 전략

#### 1. 전체 무효화
```typescript
// 구독 추가/수정/삭제 후 모든 구독 데이터 무효화
queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
```

#### 2. 특정 항목 무효화
```typescript
// 특정 채널의 비디오만 무효화
queryClient.invalidateQueries({ queryKey: ['videos', channelId] })
```

#### 3. Optimistic Update
```typescript
// 요약 생성 시 즉시 캐시 업데이트
onSuccess: (data) => {
  queryClient.setQueryData(['summary', videoId], data)
}
```

### 뮤테이션 패턴

#### 기본 뮤테이션
```typescript
export function useAddSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelInput: string) => {
      const response = await apiClient.post('/subscriptions', { channelInput })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
    onError: (error) => {
      console.error('Failed to add subscription:', error)
    },
  })
}
```

#### 사용 예시
```typescript
function AddChannelForm() {
  const { mutate: addSubscription, isPending } = useAddSubscription()

  const handleSubmit = (channelInput: string) => {
    addSubscription(channelInput, {
      onSuccess: () => {
        toast.success('Channel added!')
        closeDialog()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="channelInput" />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Channel'}
      </Button>
    </form>
  )
}
```

### 로딩 상태 관리

#### 1. 전역 로딩
```typescript
const { data, isLoading, error } = useSubscriptions()

if (isLoading) return <Loader />
if (error) return <Error message={error.message} />
return <SubscriptionList data={data} />
```

#### 2. 개별 뮤테이션 로딩
```typescript
const { mutate: generateSummary, isPending } = useGenerateSummary()
const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null)

const handleGenerate = (videoId: string) => {
  setGeneratingVideoId(videoId)
  generateSummary(videoId, {
    onSettled: () => setGeneratingVideoId(null),
  })
}

// UI에서 특정 비디오의 로딩 상태 표시
{isPending && generatingVideoId === video.id ? (
  <Button disabled>
    <Loader2 className="animate-spin" />
    Generating...
  </Button>
) : (
  <Button onClick={() => handleGenerate(video.id)}>
    Summarize
  </Button>
)}
```

---

## Service-Repository 패턴

### Repository 인터페이스 정의

```typescript
// domains/subscription/repositories/interfaces/ISubscriptionRepository.ts
export interface ISubscriptionRepository {
  create(data: CreateSubscriptionData): Subscription
  findById(id: string): Subscription | null
  findAll(): Subscription[]
  findActive(): Subscription[]
  update(id: string, data: Partial<Subscription>): Subscription
  delete(id: string): void
  exists(id: string): boolean
}
```

### 파일 기반 구현체

```typescript
// domains/subscription/repositories/implementations/file/FileSubscriptionRepository.ts
export class FileSubscriptionRepository implements ISubscriptionRepository {
  constructor(private fileStorage: FileStorage) {}

  create(data: CreateSubscriptionData): Subscription {
    const allData = this.fileStorage.readJSON<DataFile>(DATA_FILE_PATH)

    const newSubscription: Subscription = {
      id: uuidv4(),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    allData.subscriptions.push(newSubscription)
    this.fileStorage.writeJSON(DATA_FILE_PATH, allData)

    return newSubscription
  }

  findAll(): Subscription[] {
    const data = this.fileStorage.readJSON<DataFile>(DATA_FILE_PATH)
    return data.subscriptions
  }

  // ... 기타 메소드
}
```

### 데이터베이스 구현체 (향후)

```typescript
// domains/subscription/repositories/implementations/postgres/PostgresSubscriptionRepository.ts
export class PostgresSubscriptionRepository implements ISubscriptionRepository {
  constructor(private db: Database) {}

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const result = await this.db.query(
      'INSERT INTO subscriptions (id, channel_id, channel_name, ...) VALUES ($1, $2, $3, ...) RETURNING *',
      [uuidv4(), data.channel_id, data.channel_name, ...]
    )
    return result.rows[0]
  }

  async findAll(): Promise<Subscription[]> {
    const result = await this.db.query('SELECT * FROM subscriptions')
    return result.rows
  }

  // ... 기타 메소드
}
```

### DataService: Repository 조율

```typescript
// services/data.service.ts
export class DataService {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private settingsRepo: ISettingsRepository,
    private summaryRepo: ISummaryRepository,
    private videoCacheRepo: IVideoCacheRepository
  ) {}

  // Subscription 메소드
  getSubscriptions(): Subscription[] {
    return this.subscriptionRepo.findAll()
  }

  getActiveSubscriptions(): Subscription[] {
    return this.subscriptionRepo.findActive()
  }

  addSubscription(data: CreateSubscriptionData): Subscription {
    return this.subscriptionRepo.create(data)
  }

  // Settings 메소드
  getSettings(): Settings {
    return this.settingsRepo.get()
  }

  // Summary 메소드
  saveSummary(summary: SummaryEntity): void {
    this.summaryRepo.save(summary)
  }

  // ... 기타 메소드
}
```

### 의존성 주입

```typescript
// repositories/index.ts
import { FileStorage } from '../lib/file-storage'
import { FileSubscriptionRepository } from '../domains/subscription/repositories/implementations/file/FileSubscriptionRepository'
// ... 기타 Repository

const fileStorage = new FileStorage()

export const subscriptionRepo = new FileSubscriptionRepository(fileStorage)
export const settingsRepo = new FileSettingsRepository(fileStorage)
export const summaryRepo = new FileSummaryRepository(fileStorage)
export const videoCacheRepo = new FileVideoCacheRepository(fileStorage)

// DataService 인스턴스 생성
export const dataService = new DataService(
  subscriptionRepo,
  settingsRepo,
  summaryRepo,
  videoCacheRepo
)
```

---

## 외부 API 통합

### YouTube Data API v3

#### 클라이언트 설정
```typescript
// lib/youtube-client.ts
import { google } from 'googleapis'

export class YouTubeClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  getClient() {
    return google.youtube({
      version: 'v3',
      auth: this.apiKey,
    })
  }

  async getChannelById(channelId: string) {
    const youtube = this.getClient()
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId],
    })
    return response.data.items?.[0]
  }

  async getVideoDetails(videoId: string) {
    const youtube = this.getClient()
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    })
    return response.data.items?.[0]
  }
}
```

#### Fallback: RSS Feed
```typescript
// services/youtube.service.ts
async getVideosViaRSS(channelId: string): Promise<Video[]> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const response = await axios.get(rssUrl)
  const xml = response.data

  // XML 파싱
  const videos = parseXML(xml)

  return videos.map(video => ({
    id: video.id,
    title: video.title,
    channel_name: video.author,
    published_at: video.published,
    duration: 'N/A', // RSS에서 제공 안 됨
    has_caption: null, // RSS에서 제공 안 됨
    source: 'rss',
  }))
}
```

### Google Gemini API

#### 클라이언트 설정
```typescript
// lib/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiClient {
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  getGenerativeModel(modelName = 'gemini-1.5-flash') {
    return this.genAI.getGenerativeModel({ model: modelName })
  }

  async generateWithFallback(
    prompt: string,
    fallbackModel = 'gemini-1.5-pro'
  ): Promise<string> {
    try {
      const model = this.getGenerativeModel('gemini-1.5-flash')
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.warn('Flash model failed, trying Pro model')
      const model = this.getGenerativeModel(fallbackModel)
      const result = await model.generateContent(prompt)
      return result.response.text()
    }
  }
}
```

#### 프롬프트 엔지니어링
```typescript
// services/gemini.service.ts
buildSummaryPrompt(transcript: string, videoTitle: string): string {
  return `
다음은 YouTube 비디오의 자막입니다. 핵심 내용을 요약해주세요.

비디오 제목: ${videoTitle}

자막:
${transcript}

요약 가이드라인:
1. 3-5개의 핵심 포인트로 정리
2. 각 포인트는 1-2문장으로 간결하게
3. 중요한 숫자, 날짜, 이름은 그대로 유지
4. 한국어로 작성
5. 마크다운 형식 사용 (불릿 포인트, 볼드 등)

요약:
`
}

async summarize(transcript: string, videoTitle: string): Promise<string> {
  const prompt = this.buildSummaryPrompt(transcript, videoTitle)
  const summary = await this.geminiClient.generateWithFallback(prompt)
  return summary
}
```

### Telegram Bot API

#### 클라이언트 설정
```typescript
// lib/telegram-client.ts
import axios from 'axios'

export class TelegramClient {
  private botToken: string
  private chatId: string

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken
    this.chatId = chatId
  }

  async sendMessage(message: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`

    await axios.post(url, {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
    })
  }
}
```

#### 메시지 포맷팅
```typescript
// services/notifier.service.ts
formatVideoMessage(video: Video, summary: string): string {
  return `
🎥 *새로운 비디오*

*제목:* ${video.title}
*채널:* ${video.channel_name}
*게시일:* ${new Date(video.published_at).toLocaleString('ko-KR')}

*요약:*
${summary}

*링크:* https://youtube.com/watch?v=${video.id}
`
}

async sendVideoSummary(video: Video, summary: string): Promise<void> {
  const message = this.formatVideoMessage(video, summary)
  await this.telegramClient.sendMessage(message)
}
```

---

## 백그라운드 작업

### node-cron 스케줄러

```typescript
// scheduler.ts
import cron from 'node-cron'
import { MonitorJob, BriefingJob } from './jobs/monitor.job'

export function startScheduler() {
  const monitorJob = new MonitorJob(
    dataService,
    youtubeService,
    geminiService,
    notifierService,
    transcriptService
  )

  const briefingJob = new BriefingJob(
    dataService,
    geminiService,
    notifierService
  )

  // 15분마다 실행
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running MonitorJob...')
    await monitorJob.run()
  })

  // 매일 09:00 실행
  cron.schedule('0 9 * * *', async () => {
    console.log('Running BriefingJob...')
    await briefingJob.run()
  })
}
```

### MonitorJob 구현

```typescript
// jobs/monitor.job.ts
export class MonitorJob {
  constructor(
    private dataService: DataService,
    private youtubeService: YouTubeService,
    private geminiService: GeminiService,
    private notifierService: NotifierService,
    private transcriptService: TranscriptService
  ) {}

  async run(): Promise<void> {
    const subscriptions = this.dataService.getActiveSubscriptions()

    for (const subscription of subscriptions) {
      try {
        await this.processSubscription(subscription)
        await this.sleep(5000) // Rate limit 회피
      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error)
      }
    }
  }

  async processSubscription(subscription: Subscription): Promise<void> {
    // 1. 최근 비디오 조회
    const videos = await this.youtubeService.getRecentVideos(subscription.channel_id)

    // 2. 신규 비디오 필터링
    const newVideos = this.filterNewVideos(videos, subscription.last_video_id)

    if (newVideos.length === 0) return

    // 3. 각 신규 비디오 처리
    for (const video of newVideos) {
      await this.processVideo(video, subscription)
    }

    // 4. last_video_id 업데이트
    this.dataService.updateSubscription(subscription.id, {
      last_video_id: videos[0].id,
    })
  }

  async processVideo(video: Video, subscription: Subscription): Promise<void> {
    try {
      // 1. 자막 추출
      const transcript = await this.transcriptService.getTranscript(video.id)

      // 2. 요약 생성
      const summary = await this.geminiService.summarize(transcript, video.title)

      // 3. 요약 저장
      this.dataService.saveSummary({
        video_id: video.id,
        title: video.title,
        channel_name: video.channel_name,
        content: summary,
        date: new Date().toISOString().split('T')[0],
        tags: subscription.tags,
      })

      // 4. 알림 발송
      if (this.notifierService.isConfigured()) {
        await this.notifierService.sendVideoSummary(video, summary)
      }
    } catch (error) {
      console.error(`Failed to process video ${video.id}:`, error)
    }
  }

  filterNewVideos(videos: Video[], lastVideoId: string): Video[] {
    const lastIndex = videos.findIndex(v => v.id === lastVideoId)
    return lastIndex === -1 ? videos : videos.slice(0, lastIndex)
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

---

## 에러 처리 전략

### 커스텀 에러 클래스

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}
```

### 전역 에러 핸들러

```typescript
// middleware/error-handler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  // 알 수 없는 에러
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  })
}
```

### Try-Catch 패턴

```typescript
// Service 레벨
async getChannelInfo(channelInput: string): Promise<ChannelInfo> {
  try {
    return await this.getChannelInfoViaAPI(channelInput)
  } catch (error) {
    console.warn('API failed, trying yt-dlp')
    return await this.getChannelInfoViaYtDlp(channelInput)
  }
}

// Controller 레벨
async add(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await this.service.add(req.body)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error) // 에러 핸들러로 전달
  }
}
```

---

## 성능 최적화

### Frontend 최적화

#### 1. React Query 캐싱
```typescript
// 기본 캐시 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
    },
  },
})
```

#### 2. Lazy Loading (VideoList)
```typescript
function VideoList({ videos }) {
  const [displayCount, setDisplayCount] = useState(2) // 초기 2개만 로드

  const visibleVideos = videos.slice(0, displayCount)
  const hasMore = displayCount < videos.length

  return (
    <div>
      {visibleVideos.map(video => <VideoItem video={video} />)}
      {hasMore && (
        <Button onClick={() => setDisplayCount(prev => prev + 2)}>
          Load More ({videos.length - displayCount} more)
        </Button>
      )}
    </div>
  )
}
```

#### 3. Optimistic Updates
```typescript
const { mutate: updateSubscription } = useMutation({
  mutationFn: updateSubscriptionAPI,
  onMutate: async (newData) => {
    // 이전 데이터 백업
    const previousData = queryClient.getQueryData(['subscriptions'])

    // 즉시 UI 업데이트
    queryClient.setQueryData(['subscriptions'], (old) => {
      return old.map(sub =>
        sub.id === newData.id ? { ...sub, ...newData } : sub
      )
    })

    return { previousData }
  },
  onError: (err, newData, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(['subscriptions'], context.previousData)
  },
})
```

### Backend 최적화

#### 1. 비디오 캐싱
```typescript
// 첫 조회 시 캐시 저장
const videos = await youtubeService.getRecentVideos(channelId)
dataService.saveVideoCache(channelId, videos)

// 이후 조회는 캐시에서
const cachedVideos = dataService.getVideoCache(channelId)
if (cachedVideos) return cachedVideos

// 캐시 없으면 API 호출
```

#### 2. Rate Limiting
```typescript
// MonitorJob에서 채널별 대기
for (const subscription of subscriptions) {
  await processSubscription(subscription)
  await sleep(5000) // 5초 대기
}
```

#### 3. 요약 중복 방지
```typescript
// 요약 생성 전 기존 요약 확인
const existingSummary = dataService.getSummaryByVideoId(videoId)
if (existingSummary) {
  return existingSummary // 기존 요약 반환
}

// 없으면 새로 생성
const summary = await geminiService.summarize(transcript, title)
dataService.saveSummary(summary)
```

---

## 디버깅 가이드

### 로그 레벨
```typescript
// 개발 환경
console.log('[INFO]', message)
console.warn('[WARN]', message)
console.error('[ERROR]', message)

// 프로덕션 환경 (향후 Winston 사용)
logger.info(message)
logger.warn(message)
logger.error(message)
```

### React Query Devtools
```typescript
// providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### API 디버깅
```typescript
// api-client.ts
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url)
  return config
})

apiClient.interceptors.response.use((response) => {
  console.log('Response:', response.status, response.config.url)
  return response
})
```

---

이 문서는 Short-Tube의 기술적 구현 세부사항을 다룹니다. 추가 질문이나 명확히 해야 할 부분이 있다면 프로젝트 팀에 문의하세요.
