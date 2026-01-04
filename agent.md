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

### 예시
```
Fix: YouTube 채널 핸들 조회 시 잘못된 채널이 등록되는 버그 수정

search API 대신 forHandle 파라미터를 사용하여 정확한 채널 조회

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## 프로젝트 구조

- **apps/web**: React 프론트엔드 (Vite + TypeScript)
- **apps/server**: Express 백엔드 (TypeScript)
- **packages/types**: 공유 타입 정의

## 주요 기술 스택

- React Query: 서버 상태 관리
- YouTube Data API v3: 비디오 메타데이터
- OpenAI API: 비디오 요약 생성
- yt-dlp: YouTube API fallback
