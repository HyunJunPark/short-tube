# API Overview

Short-Tube 서버의 Controller별 API 역할을 정리한 문서입니다.

## 1. Subscription Controller
**위치**: `apps/server/src/controllers/subscription.controller.ts`

유튜브 채널 구독을 관리하는 API입니다.

### API 목록
- `GET /api/subscriptions` - 모든 구독 채널 목록 조회
- `POST /api/subscriptions` - 새 채널 구독 추가
  - 채널 정보를 자동으로 가져오고 AI가 카테고리를 추천
  - 최신 비디오 ID를 자동으로 설정
- `PUT /api/subscriptions/:channelId` - 구독 정보 업데이트
- `DELETE /api/subscriptions/:channelId` - 구독 삭제

## 2. Monitor Controller
**위치**: `apps/server/src/controllers/monitor.controller.ts`

모니터링 작업을 수동으로 트리거하는 API입니다.

### API 목록
- `POST /api/monitor/trigger` - 모니터링 작업 수동 실행
  - `briefing` 옵션으로 브리핑 생성 여부 설정 가능
  - 백그라운드에서 비동기 실행

## 3. Video Controller
**위치**: `apps/server/src/controllers/video.controller.ts`

비디오 캐싱, 조회, 알림 관리를 담당하는 API입니다.

### API 목록
- `GET /api/videos/:channelId` - 채널의 비디오 목록 조회
  - Shorts 영상 자동 필터링 (제목에 #shorts 포함 또는 1분 미만)
  - 캐시된 데이터 반환
- `POST /api/videos/:channelId/refresh` - 비디오 목록 새로고침
  - YouTube API로 30일치 비디오 가져오기
  - RSS 폴백 지원
  - 메타데이터 보완 (RSS → API 데이터로 업그레이드)
- `GET /api/videos/stats` - 비디오 통계 조회
  - 전체 비디오 개수
  - 오늘 업로드된 비디오 개수
- `GET /api/videos/check-new` - 새 비디오 확인
  - RSS로 7일치 비디오 체크
  - 채널별 새 비디오 개수 반환
  - 알림 로그에 자동 기록
- `POST /api/videos/:channelId/mark-checked` - 알림 확인 처리
  - 특정 채널 또는 전체 채널(`*`) 알림 확인 상태 업데이트

## 4. Settings Controller
**위치**: `apps/server/src/controllers/settings.controller.ts`

시스템 설정을 관리하는 API입니다.

### API 목록
- `GET /api/settings` - 설정 조회
  - 환경 변수와 데이터베이스 설정 병합
  - Telegram 토큰, 채팅 ID 등
- `PUT /api/settings` - 설정 업데이트
- `POST /api/settings/test-telegram` - Telegram 테스트 메시지 전송

## 5. Briefing Controller
**위치**: `apps/server/src/controllers/briefing.controller.ts`

일일 브리핑을 생성하고 조회하는 API입니다.

### API 목록
- `GET /api/briefing/:date` - 특정 날짜의 브리핑 조회
- `POST /api/briefing/generate` - 브리핑 생성
  - 지정된 날짜(기본: 오늘)의 모든 요약을 통합
  - AI로 데일리 브리핑 콘텐츠 생성
  - 요약이 없으면 기본 메시지 반환

## 6. Summary Controller
**위치**: `apps/server/src/controllers/summary.controller.ts`

비디오 요약 생성, 캐싱, 조회를 담당하는 API입니다.

### API 목록
- `GET /api/summaries` - 모든 요약 조회
  - 검색 필터: `search`, `channelName`, `year`, `month`, `day`
  - 페이지네이션: `limit`, `offset`
- `POST /api/summaries/generate` - 비디오 요약 생성
  - 캐시 우선 조회
  - 캐시 미스 시 AI로 새 요약 생성
  - 자동 캐싱 및 비디오 메타데이터 포함
- `GET /api/summaries/date/:date` - 특정 날짜의 요약 목록 조회
- `GET /api/summaries/video/:videoId` - 특정 비디오의 요약 조회

---

## 주요 특징

### 캐싱 전략
- 비디오 메타데이터는 채널별로 캐싱
- 요약은 비디오 ID + 태그 조합으로 캐싱
- API 실패 시 RSS 폴백 지원

### AI 통합
- 채널 구독 시 자동 카테고리 추천
- 비디오 요약 자동 생성
- 일일 브리핑 통합 생성

### 알림 시스템
- 새 비디오 자동 감지
- 채널별 알림 로그 관리
- Telegram 연동 테스트 기능
