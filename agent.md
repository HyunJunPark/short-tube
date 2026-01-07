# Short-Tube 프로젝트 에이전트 가이드

## 커밋 메시지 규칙

### 형식
```
<타입>: <제목>

<본문>

<푸터>
```

### 타입
- **Feat**: 새로운 기능 추가 (예: `Feat: Add dark mode toggle`)
- **Fix**: 버그 수정 (예: `Fix: Prevent data loss in refresh endpoint`)
- **Refactor**: 코드 리팩토링, 기능 변경 없음 (예: `Refactor: Move TagSelector to collapsible Accordion`)
- **Improve**: 기존 기능 개선 (예: `Improve: Change RSS video duration display text`)
- **Docs**: 문서 추가/수정 (예: `Docs: Add commit convention guide`)
- **Test**: 테스트 코드 추가/수정 (예: `Test: Add unit tests for summary generation`)
- **Chore**: 빌드, 설정, 의존성 변경 (예: `Chore: Update dependencies`)
- **Style**: 코드 스타일 변경, 기능 변경 없음 (예: `Style: Fix indentation`)

### 작성 규칙
1. 제목은 20자 내외로 간결하게
2. 본문은 기능 위주의 설명을 짧게 작성
3. **타입을 제외한 모든 텍스트는 한국어 사용**
4. 총 5줄 이내로 요약 (제목, 본문, 푸터)
5. 푸터는 항상 다음 형식 사용:
   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
6. 기능 추가라면 어떤 기능이 추가되었는지 어떤 UI 및 탭이 추가되었는지에 대해서만 짧게 설명하고 그외의 내용은 제외
7. 버그 수정이라면 수정된 버그에 대해서만 짧게 설명하고 그외의 내용은 제외
8. 코드 리팩토링이라면 수정된 코드에 대해서만 짧게 설명하고 그외의 내용은 제외

### 예시
```
Fix: YouTube 채널 핸들 조회 시 잘못된 채널이 등록되는 버그 수정

search API 대신 forHandle 파라미터를 사용하여 정확한 채널 조회

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## 프로젝트 구조 및 맵

### 📚 전체 프로젝트 맵 및 UI 흐름도
프로젝트의 전체적인 구조, 기능, UI 흐름도는 다음 세레나 메모리를 참조하세요:
- **메모리 이름**: `project_map_and_ui_flow`
- **포함 내용**:
  - 프로젝트 전체 아키텍처 다이어그램
  - 프론트엔드 구조 (Next.js App Router, 컴포넌트, Hooks)
  - 백엔드 구조 (Service-Repository 패턴, API 엔드포인트)
  - UI 페이지별 상세 흐름도 (Dashboard, Briefing, Archive, Settings)
  - 데이터 플로우 (구독 추가, 요약 생성, 비디오 새로고침 등)
  - 주요 사용자 시나리오
  - React Query 캐시 전략
  - 에러 처리 및 성능 최적화

### 🏗️ 아키텍처 요약

**모노레포 구조**:
- **apps/web**: Next.js 15 프론트엔드 (React 19, React Query, Tailwind CSS)
- **apps/server**: Express 백엔드 (TypeScript, Service-Repository 패턴)
- **packages/types**: 공유 타입 정의

**주요 페이지**:
- `/` - Dashboard (채널 관리, 비디오 모니터링, 요약 생성)
- `/briefing` - 일일 브리핑 생성 및 조회
- `/archive` - 요약 검색 및 필터링
- `/settings` - API 키 및 알림 설정

**데이터 저장소** (현재):
- `data.json` - 구독 및 설정
- `summaries.json` - AI 요약
- `video_cache.json` - 채널별 비디오 캐시
- `notification_log.json` - 알림 로그

## 주요 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS, shadcn/ui
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Architecture**: Service-Repository Pattern
- **APIs**: 
  - YouTube Data API v3 (비디오 메타데이터)
  - Google Gemini API (AI 요약 생성)
  - Telegram Bot API (알림)
  - yt-dlp (YouTube API fallback)
- **Scheduling**: node-cron (백그라운드 작업)
- **Validation**: Zod schemas

## 세레나 메모리 참조 가이드

기능 추가 또는 리팩토링 시 다음 메모리를 참조하세요:

### 필수 참조
1. **`project_map_and_ui_flow`** - 프로젝트 전체 맵 및 UI 흐름도
   - 새 기능 추가 시 기존 구조 파악
   - UI 흐름 이해
   - 데이터 플로우 확인
   - 사용자 시나리오 참조

2. **`project_architecture_map`** - 백엔드 아키텍처 상세 맵
   - Service-Repository 패턴
   - API 엔드포인트 구조
   - 백그라운드 작업 로직

3. **`commit_convention`** - 커밋 메시지 작성 규칙
   - 커밋 전 필수 확인

### 기능별 참조
- **React Query 관련**: `react_query_internal_mechanism`, `react_query_hook_definition`, `react_query_rerender_scope`
- **VideoItem 리렌더링**: `videoitem_rerender_triggers`
- **요약 생성 플로우**: `handleGenerateSummary_flow`
- **useMutation 사용법**: `usemutation_mutate_ispending`

## 기능 추가 가이드

### 1. 새로운 기능 추가 시 체크리스트
1. ✅ `project_map_and_ui_flow` 메모리 읽기
2. ✅ 기존 아키텍처 패턴 확인
3. ✅ 관련 컴포넌트/서비스 파악
4. ✅ 데이터 플로우 설계
5. ✅ API 엔드포인트 정의 (필요 시)
6. ✅ React Query Hook 작성 (Frontend)
7. ✅ 컴포넌트 구현
8. ✅ 테스트
9. ✅ 커밋 (`commit_convention` 참조)

### 2. 리팩토링 시 체크리스트
1. ✅ 기존 코드 흐름 파악
2. ✅ 관련 메모리 읽기
3. ✅ 영향 범위 확인
4. ✅ 리팩토링 실행
5. ✅ 기능 동작 확인
6. ✅ 관련 메모리 업데이트 (필요 시)
7. ✅ 커밋

## 주의사항

- 새로운 기능을 추가할 때는 **항상 기존 패턴을 따르세요**
- 프론트엔드: React Query + Custom Hooks
- 백엔드: Controller → Service → Repository
- UI 컴포넌트: shadcn/ui 스타일 유지
- 메모리가 오래되었거나 부정확하다면 업데이트하세요
