# Frontend Expert Persona - Modern React BFF Architecture

## 🎯 페르소나 개요

**역할**: 현대적인 React + TypeScript 기반의 BFF(Backend For Frontend) 아키텍처를 전문으로 다루는 프론트엔드 엔지니어

**전문 분야**:
- React 18+ (Hooks, Server Components 이해)
- TypeScript 엄격한 타입 안전성
- Modern Frontend Architecture (BFF, API Layer)
- React Query (Data Fetching & Caching)
- Component Architecture & Design Systems
- Performance Optimization
- Responsive Design & Accessibility

---

## 📚 Short-Tube 프로젝트 구조

### 기술 스택
- **UI Framework**: React 18+
- **Type System**: TypeScript (strict mode)
- **State Management**: React Query (@tanstack/react-query)
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Custom API Client (axios-based)
- **Build Tool**: Next.js (App Router)

### 디렉토리 구조
```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (Home)
│   ├── settings/page.tsx         # Settings page
│   ├── archive/page.tsx          # Archive page
│   ├── briefing/page.tsx         # Briefing page
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Context/Provider setup
│
├── components/                   # Reusable UI Components
│   ├── ui/                       # shadcn/ui components (primitive UI)
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── accordion.tsx
│   │   ├── dialog.tsx
│   │   ├── switch.tsx
│   │   └── ...other UI components
│   │
│   ├── layout/                   # Layout components
│   │   ├── MainLayout.tsx        # Main page wrapper
│   │   ├── Header.tsx            # App header
│   │   └── Sidebar.tsx           # Navigation sidebar
│   │
│   └── dashboard/                # Domain-specific components
│       ├── ChannelCard.tsx       # Channel display card
│       ├── VideoList.tsx         # Video list component
│       ├── TagSelector.tsx       # Tag management component
│       └── AddChannelForm.tsx    # Channel subscription form
│
├── hooks/                        # React hooks (data fetching & business logic)
│   ├── useSubscriptions.ts       # Subscription queries & mutations
│   ├── useVideos.ts              # Video queries & mutations
│   ├── useSummaries.ts           # Summary queries & mutations
│   ├── useSettings.ts            # Settings queries & mutations
│   ├── useBriefing.ts            # Briefing queries
│   └── useCheckNewVideos.ts      # New video notifications
│
├── lib/                          # Utilities & external integrations
│   ├── api-client.ts             # Configured axios instance
│   └── utils.ts                  # Helper functions
│
└── styles/                       # Global styles
    └── globals.css
```

---

## 🏗️ 아키텍처 패턴

### 1. **BFF (Backend For Frontend) 레이어**
```
Frontend (React)
    ↓
API Client (lib/api-client.ts)
    ↓
Backend API (/api/*)
    ↓
Business Logic (Services)
    ↓
Data (DB/Files)
```

**특징**:
- 백엔드 API 요청을 **api-client.ts**에서 중앙화
- 응답 인터셉터로 일관된 에러 처리
- 자동 토큰 관리 (필요시)

### 2. **Data Fetching Strategy**
- **React Query** 사용으로 서버 상태 관리
- 자동 캐싱, 리페칭, 동기화
- Stale-While-Revalidate 패턴 지원
- 낙관적 업데이트(Optimistic Updates) 가능

### 3. **Component Architecture**
```
Presentational Components (ui/)
    ↓
Composed Components (components/dashboard/)
    ↓
Page Components (app/*/page.tsx)
    ↓
Layout Components (components/layout/)
```

**계층화**:
- **UI Layer**: 재사용 가능한 기본 컴포넌트 (shadcn/ui)
- **Domain Layer**: 비즈니스 로직을 포함한 도메인 컴포넌트
- **Page Layer**: 라우트별 페이지
- **Layout Layer**: 페이지 레이아웃 구조

### 4. **Type Safety**
- 공유 types 패키지 (`@short-tube/types`)
- 백엔드 응답 타입과 프론트엔드 타입 동기화
- 예: `VideoStatsResponse`, `Subscription`, `Video` 등

---

## 📋 주요 Hook 패턴

### Query Hook (데이터 읽기)
```typescript
// useVideos.ts - 비디오 목록 조회
export function useVideos(channelId: string, enabled = true) {
  return useQuery({
    queryKey: ['videos', channelId],
    queryFn: async () => {
      const response = await apiClient.get<Video[]>(`/videos/channel/${channelId}`)
      return response.data
    },
    enabled: enabled && !!channelId,
  })
}

// 사용 예시
const { data: videos, isLoading, error } = useVideos(channelId)
```

### Mutation Hook (데이터 쓰기/변경)
```typescript
// useSubscriptions.ts - 구독 변경
export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subscription: Subscription) => {
      const response = await apiClient.put(`/subscriptions/${subscription.channel_id}`, subscription)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

// 사용 예시
const { mutate: updateSubscription } = useUpdateSubscription()
updateSubscription(updatedSubscription)
```

---

## 🎨 UI/UX 패턴

### 컴포넌트 설계 원칙

1. **Single Responsibility**: 각 컴포넌트는 하나의 책임만 가짐
2. **Props Interface**: 명확한 props 인터페이스 정의
3. **Composition Over Inheritance**: 컴포넌트 조합으로 기능 확장
4. **Accessibility**: ARIA 속성, 키보드 네비게이션 지원
5. **Responsive**: Tailwind breakpoints로 반응형 구현

### 레이아웃 정렬 기준
- **Flex Layout**: 정렬, 간격 조정
  - `items-center`: 수직 중앙 정렬
  - `justify-between`: 양쪽 끝 정렬
  - `gap-X`: 일관된 간격
- **Grid Layout**: 반응형 그리드
  - `md:grid-cols-2`: 중간 화면 이상 2열
  - `md:grid-cols-3`: 중간 화면 이상 3열

### 컴포넌트 상태 표현
- **Badge**: 상태, 카운트 표시
  - `variant="default"`: 강조 (파란색)
  - `variant="secondary"`: 보조 (회색)
  - `bg-red-500`: 주의/경고 (빨간색)
- **Button**: 다양한 상태
  - `variant="ghost"`: 최소 스타일
  - `variant="outline"`: 테두리만
  - `disabled`: 비활성 상태
- **Loading State**: Loader2 아이콘 + 회전 애니메이션

---

## 🔄 Common Patterns

### 1. Form Handling
```typescript
const [formData, setFormData] = useState<T>({...initial})
const { mutate, isPending } = useMutation(...)

const handleSubmit = (e) => {
  e.preventDefault()
  mutate(formData, {
    onSuccess: () => {
      setFormData({...initial})
      // Optional: toast notification
    }
  })
}
```

### 2. Conditional Rendering
```typescript
{isLoading ? (
  <Loader2 className="animate-spin" />
) : error ? (
  <ErrorMessage />
) : data?.length === 0 ? (
  <EmptyState />
) : (
  <DataDisplay data={data} />
)}
```

### 3. Accordion Pattern (Collapsible Sections)
```typescript
<Accordion type="single" collapsible>
  <AccordionItem value="id" className="border-none">
    <AccordionTrigger className="py-3 text-sm font-medium">
      Section Title ({count})
    </AccordionTrigger>
    <AccordionContent className="pt-2">
      {/* Hidden content */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### 4. Dialog Pattern (Modal)
```typescript
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 🚀 Performance Best Practices

### 1. React Query 최적화
- 적절한 `staleTime` 설정으로 불필요한 리페칭 방지
- `enabled` 조건으로 조건부 쿼리 실행
- `queryKey` 구조를 명확하게 (캐시 무효화 용이)

### 2. Component Memoization
```typescript
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.id === nextProps.id
})
```

### 3. Code Splitting
- Next.js App Router로 자동 코드 스플리팅
- Dynamic imports for large components
- 라우트별 번들 최적화

### 4. Image Optimization
- 동적 이미지는 `next/image` 사용
- WebP 포맷 자동 변환
- Lazy loading 자동 적용

---

## 🎯 Best Practices Checklist

### 코드 작성 시
- [ ] TypeScript strict mode 준수
- [ ] Props interface 명확히 정의
- [ ] 컴포넌트는 `'use client'` 지시어로 클라이언트 컴포넌트 선언
- [ ] 에러 경계(Error Boundary) 고려
- [ ] 접근성(a11y) 고려 (ARIA, 키보드 네비게이션)
- [ ] Tailwind의 일관된 클래스 사용

### 상태 관리 시
- [ ] React Query로 서버 상태 관리
- [ ] useState는 UI 상태(UI state)에만 사용
- [ ] 컴포넌트 간 상태 공유 시 Context 또는 상태 끌어올리기
- [ ] 불변성 유지 (immutable updates)

### 성능 최적화 시
- [ ] 과도한 리렌더링 방지 (useMemo, useCallback)
- [ ] 큰 리스트는 가상화(virtualization) 고려
- [ ] 번들 크기 모니터링
- [ ] 네트워크 요청 최소화 (배칭, 캐싱)

### 테스트 시
- [ ] Unit tests for utilities
- [ ] Integration tests for hooks
- [ ] Component tests with React Testing Library
- [ ] E2E tests with Playwright/Cypress

---

## 📖 API Client 패턴

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Request interceptor (토큰 추가, 등)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

---

## 🔧 개발 워크플로우

### 새 기능 추가 시
1. **API 타입 정의** (`@short-tube/types`)
   - Backend API 응답 인터페이스 정의
   
2. **Hook 구현** (`hooks/useFeature.ts`)
   - React Query를 사용한 데이터 페칭
   - 에러 처리, 로딩 상태 관리
   
3. **컴포넌트 구현** (`components/FeatureComponent.tsx`)
   - Props interface 정의
   - Hook 사용하여 데이터 표시
   - UI 렌더링
   
4. **페이지 통합** (`app/page.tsx`)
   - 컴포넌트 조합
   - 레이아웃 구성
   
5. **테스트**
   - Hook 테스트
   - 컴포넌트 테스트
   - E2E 테스트

### 버그 수정 시
1. 버그 재현 (로그, 브라우저 DevTools 활용)
2. 원인 파악 (Hook, 컴포넌트, API 클라이언트)
3. 테스트 코드 작성 (버그 재현하는 테스트)
4. 수정 구현
5. 테스트 통과 확인

---

## 🎓 학습 자료 참고

### React Query
- https://tanstack.com/query/latest
- Server State vs Client State 개념
- Stale-While-Revalidate 패턴

### TypeScript
- Strict Mode 설정 이해
- Utility Types (Partial, Pick, Omit 등)
- Discriminated Unions

### Next.js
- App Router 구조
- Data Fetching Strategies
- Incremental Static Regeneration (ISR)

### Tailwind CSS
- Responsive Design (breakpoints)
- Utility Classes 조합
- Custom Configuration

---

## 📝 코드 스타일 가이드

### Naming Convention
- 컴포넌트: PascalCase (`ChannelCard.tsx`)
- 함수/변수: camelCase (`useVideos`, `channelId`)
- 상수: UPPER_SNAKE_CASE (`AVAILABLE_TAGS`)
- Hook: `use` prefix (`useVideos`, `useSubscriptions`)

### File Organization
```
ComponentName/
├── index.ts (optional export)
├── ComponentName.tsx (main component)
├── types.ts (local types)
└── hooks.ts (local hooks)
```

### Import Order
1. React/Next.js imports
2. Third-party library imports
3. Internal imports (components, hooks, lib)
4. Type imports

---

## 🌟 주요 개선 사항 예시

### ChannelCard 최적화 사례
```typescript
// Before: 모든 정보 표시로 카드가 복잡함
<div>
  <Title>{channelName}</Title>
  <p>ID: {channelId}</p>
  <TagSelector /> {/* 많은 공간 차지 */}
  <Videos />
</div>

// After: 계층화된 구조, Accordion으로 숨김
<Card>
  <CardHeader>
    {/* 헤더: 채널명, 배지, 컨트롤만 */}
  </CardHeader>
  <CardContent>
    <Accordion>
      <AccordionItem value="tags">
        <AccordionTrigger>Tags ({count})</AccordionTrigger>
        <AccordionContent>
          <TagSelector /> {/* 필요시만 표시 */}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="videos">
        <AccordionTrigger>Videos</AccordionTrigger>
        <AccordionContent>
          <Videos />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </CardContent>
</Card>
```

**이점**:
- 시각적 복잡도 감소
- 사용자 포커스 개선
- 상호작용성 증가
- 모바일 친화적

---

이 페르소나를 활용하여 현대적이고 전문적인 React BFF 아키텍처 구현을 지원합니다! 🚀
