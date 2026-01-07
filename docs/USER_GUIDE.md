# Short-Tube 사용자 가이드

## 📖 소개

Short-Tube는 YouTube 채널을 모니터링하고 새로운 비디오를 AI로 자동 요약해주는 서비스입니다. 관심 있는 채널을 구독하면 신규 비디오가 업로드될 때마다 자동으로 요약을 생성하고 Telegram으로 알림을 보내드립니다.

---

## 🚀 시작하기

### 1. 초기 설정

#### 필수 API 키 발급

Short-Tube를 사용하려면 다음 API 키가 필요합니다:

1. **YouTube Data API 키**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 새 프로젝트 생성
   - "API 및 서비스" → "라이브러리"에서 "YouTube Data API v3" 활성화
   - "사용자 인증 정보" → "API 키 만들기"

2. **Google Gemini API 키**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
   - "Get API Key" 클릭
   - API 키 복사

3. **Telegram Bot 토큰 및 Chat ID**
   - Telegram에서 [@BotFather](https://t.me/BotFather) 검색
   - `/newbot` 명령으로 새 봇 생성
   - Bot Token 복사
   - 본인 Chat ID 확인:
     - [@userinfobot](https://t.me/userinfobot)에게 메시지 전송
     - 표시되는 ID 복사

#### 설정 페이지에서 API 키 입력

1. Short-Tube 웹사이트 접속
2. 왼쪽 사이드바에서 **"Settings"** 클릭
3. 각 API 키 입력:
   - **YouTube API Key**: YouTube Data API 키 입력
   - **Gemini API Key**: Google Gemini API 키 입력
   - **Telegram Bot Token**: Telegram Bot 토큰 입력
   - **Telegram Chat ID**: 본인의 Telegram Chat ID 입력
4. **"Save Settings"** 클릭
5. **"Test Telegram"** 버튼으로 알림 테스트

---

## 📺 채널 구독 관리

### 채널 추가하기

1. **Dashboard** 페이지로 이동
2. 오른쪽 상단 **"+ Add Channel"** 버튼 클릭
3. 채널 정보 입력 (다음 중 하나):
   - **채널 ID**: `UCxxxxxx` 형식
   - **채널 핸들**: `@TechChannel` 형식
   - **채널 URL**: `https://youtube.com/@TechChannel` 또는 `https://youtube.com/channel/UCxxxxxx`
4. **"Add Channel"** 클릭
5. 몇 초 후 새 채널 카드가 리스트에 추가됩니다

**팁**:
- YouTube 채널 페이지의 URL을 복사하여 그대로 붙여넣으면 됩니다
- 채널 핸들(@로 시작)이 가장 편리합니다

### 카테고리 설정하기

채널을 카테고리로 분류하여 관리할 수 있습니다.

1. 채널 카드에서 **"Categories"** 섹션 클릭
2. 원하는 카테고리 선택 (다중 선택 가능):
   - Technology
   - Business
   - Education
   - Entertainment
   - News
   - Finance
   - Health
   - Lifestyle
3. 자동 저장됩니다
4. Dashboard 상단의 탭으로 카테고리별 필터링 가능

### 태그 설정하기

채널에 태그를 추가하여 요약에 컨텍스트를 제공할 수 있습니다.

1. 채널 카드에서 **"Tags"** 섹션 클릭
2. 추천 태그 선택 또는 커스텀 태그 입력:
   - AI
   - ChatGPT
   - 신기술
   - 부동산
   - 주식
   - 코딩
   - 뉴스
   - 비즈니스
   - 동기부여
3. 태그는 요약 생성 시 AI에게 추가 정보를 제공하며, Archive에서 필터링에도 사용됩니다

### 채널 활성화/비활성화

1. 채널 카드 우측 상단의 **토글 스위치** 클릭
2. 비활성화된 채널은 자동 모니터링에서 제외됩니다
3. 언제든지 다시 활성화 가능

### 채널 삭제하기

1. 채널 카드 우측 상단의 **휴지통 아이콘** 클릭
2. 확인 다이얼로그에서 **"Delete"** 클릭
3. 채널과 관련된 비디오 캐시가 삭제됩니다 (요약은 유지)

---

## 🎥 비디오 관리

### 비디오 목록 보기

1. 채널 카드에서 **"Videos"** 섹션 클릭
2. 최근 비디오 목록이 표시됩니다 (최신순)
3. 각 비디오에는 다음 정보가 표시됩니다:
   - 제목
   - 게시 날짜
   - 영상 시간 (또는 "영상시간 미확인")
   - 자막 여부 (또는 "자막확인필요")
   - 데이터 소스 (RSS 뱃지)

### 비디오 새로고침

RSS로 조회된 비디오는 메타데이터가 부족할 수 있습니다. 정확한 정보를 얻으려면:

1. **"Refresh Videos"** 버튼 클릭
2. YouTube Data API를 통해 정확한 정보 조회:
   - 영상 시간
   - 자막 존재 여부
   - 기타 메타데이터
3. 비디오 목록이 업데이트됩니다

### 비디오 요약 생성하기

#### 수동 요약 생성

1. 비디오 항목에서 **"Summarize"** 버튼 클릭
2. AI가 비디오 자막을 분석하여 요약 생성 (20-30초 소요)
3. 요약 다이얼로그가 자동으로 열립니다
4. 버튼이 **"View Summary"**로 변경됩니다

#### 자동 요약 생성 (백그라운드)

Short-Tube는 15분마다 활성 채널을 확인합니다:

1. 신규 비디오 감지
2. 자동으로 자막 추출 및 요약 생성
3. Telegram으로 알림 발송 (설정된 경우)
4. Dashboard에 신규 비디오 뱃지 표시

### 요약 보기

1. 비디오 항목에서 **"View Summary"** 버튼 클릭
2. 요약 내용이 다이얼로그로 표시됩니다
3. 요약은 다음 형식으로 제공됩니다:
   - 3-5개의 핵심 포인트
   - 불릿 포인트 형식
   - 중요한 정보 강조 (볼드)

### YouTube에서 비디오 보기

1. 비디오 항목에서 **"Watch"** 버튼 클릭
2. YouTube 비디오 페이지가 새 탭에서 열립니다

---

## 📋 일일 브리핑

### 브리핑이란?

일일 브리핑은 하루 동안 생성된 모든 요약을 하나로 통합한 종합 리포트입니다. AI가 여러 요약을 분석하여 핵심 트렌드와 인사이트를 제공합니다.

### 브리핑 생성하기

1. **Briefing** 페이지로 이동
2. 날짜 선택 (기본값: 오늘)
3. **"Generate Briefing"** 버튼 클릭
4. AI가 해당 날짜의 모든 요약을 통합하여 브리핑 생성 (30-60초 소요)
5. 브리핑 내용이 표시됩니다

### 자동 브리핑

Settings에서 "Briefing Enabled"를 활성화하면:

1. 매일 설정된 시간(예: 09:00)에 자동 브리핑 생성
2. Telegram으로 브리핑 발송
3. Briefing 페이지에서 언제든지 조회 가능

### 과거 브리핑 조회

1. **Briefing** 페이지에서 날짜 선택
2. 해당 날짜의 브리핑이 자동으로 로드됩니다
3. 브리핑이 없으면 "Generate Briefing" 버튼으로 생성 가능

---

## 🗂️ 아카이브 (요약 검색)

### 요약 검색하기

1. **Archive** 페이지로 이동
2. 검색창에 키워드 입력
3. 검색 범위:
   - 비디오 제목
   - 채널명
   - 요약 내용
4. 실시간으로 결과 필터링됩니다

### 태그로 필터링

1. **"Filter by Tags"** 섹션에서 원하는 태그 클릭
2. 여러 태그 선택 가능 (OR 조건)
3. 선택한 태그가 포함된 요약만 표시됩니다
4. **"Clear filters"** 버튼으로 초기화

### 날짜로 필터링

1. **"Filter by Upload Date"** 섹션 사용
2. 년/월/일을 순차적으로 선택:
   - **Year**: 전체 연도 필터링
   - **Month**: 특정 월 필터링 (년 선택 필수)
   - **Day**: 특정 일 필터링 (월 선택 필수)
3. 서버에서 필터링된 요약을 불러옵니다
4. **"Clear date filter"** 버튼으로 초기화

### 복합 검색

검색창 + 태그 + 날짜를 동시에 사용하여 정밀 검색 가능:

예시:
- 2024년 12월에 업로드된 비디오
- 태그: "AI", "ChatGPT"
- 검색어: "GPT-4"

---

## ⚙️ 설정

### YouTube API 설정

- **API Key**: YouTube Data API 키 입력
- 채널 정보 및 비디오 메타데이터 조회에 사용
- Quota: 하루 10,000 units (보통 충분)

### Gemini API 설정

- **API Key**: Google Gemini API 키 입력
- 비디오 요약 및 브리핑 생성에 사용
- 무료 tier: 60 requests/분

### Telegram 알림 설정

- **Bot Token**: Telegram Bot 토큰 입력
- **Chat ID**: 본인의 Telegram Chat ID 입력
- **Test 버튼**: 테스트 메시지 발송하여 설정 확인
- **Notification Enabled**: 알림 활성화/비활성화

### 브리핑 설정

- **Briefing Enabled**: 자동 브리핑 활성화/비활성화
- **Briefing Time**: 브리핑 생성 시간 설정 (HH:mm 형식)
  - 예: "09:00" → 매일 오전 9시에 브리핑 생성 및 발송

---

## 📱 Telegram 알림

### 알림 종류

1. **신규 비디오 요약 알림**
   - 새 비디오가 업로드되어 요약이 생성되면 즉시 발송
   - 포함 내용:
     - 비디오 제목
     - 채널명
     - 게시 날짜
     - AI 요약
     - YouTube 링크

2. **일일 브리핑 알림**
   - 설정된 시간에 당일 브리핑 발송
   - 포함 내용:
     - 오늘의 주요 트렌드
     - 핵심 요약 통합
     - 인사이트

### 알림 설정하기

1. **Settings** 페이지로 이동
2. Telegram Bot Token 및 Chat ID 입력
3. **"Test Telegram"** 버튼으로 연결 확인
4. **"Notification Enabled"** 스위치 ON
5. **"Save Settings"** 클릭

### 알림 형식 예시

```
🎥 새로운 비디오

제목: ChatGPT의 최신 업데이트
채널: TechTalk
게시일: 2024-01-15 14:30

요약:
• OpenAI가 ChatGPT-4의 새로운 기능 공개
• 이미지 생성 성능 20% 향상
• 코드 작성 정확도 개선

링크: https://youtube.com/watch?v=xxxxx
```

---

## 💡 사용 팁

### 효율적인 채널 관리

1. **카테고리 활용**: 채널을 카테고리별로 분류하여 관심 분야별로 모니터링
2. **태그 전략**: 채널에 관련된 태그를 미리 설정하여 요약 품질 향상
3. **비활성화 기능**: 일시적으로 관심이 없는 채널은 비활성화하여 알림 수 줄이기

### 요약 활용 방법

1. **Telegram으로 즉시 확인**: 이동 중에도 요약 읽기
2. **Archive에서 나중에 검색**: 과거 요약을 태그/날짜로 찾기
3. **브리핑으로 트렌드 파악**: 여러 채널의 내용을 종합하여 큰 그림 보기

### API Quota 절약

1. **RSS 우선 사용**: 비디오 목록은 RSS로 조회 (API quota 0)
2. **필요시에만 Refresh**: 자막 정보가 필요한 경우에만 "Refresh" 버튼 클릭
3. **채널 수 조절**: 너무 많은 채널을 구독하면 API quota 초과 가능

### 요약 품질 향상

1. **태그 활용**: 채널 특성에 맞는 태그 설정 (예: 기술 채널 → "AI", "코딩")
2. **자막 있는 비디오**: 자막이 있는 비디오만 요약 가능 (자막 없으면 스킵)
3. **언어**: 한국어/영어 자막이 있는 비디오가 요약 품질이 좋습니다

---

## 🔧 문제 해결

### 채널이 추가되지 않음

**원인**: 잘못된 채널 ID/핸들/URL

**해결**:
1. YouTube 채널 페이지에서 URL 복사
2. 핸들 형식 확인: `@ChannelName` (@ 포함)
3. YouTube API 키가 올바르게 설정되었는지 확인

### 요약이 생성되지 않음

**원인 1**: 자막이 없는 비디오

**해결**: 자막이 있는 비디오만 요약 가능합니다. YouTube에서 자막 확인

**원인 2**: Gemini API 키 오류

**해결**: Settings에서 Gemini API 키 확인

### Telegram 알림이 오지 않음

**원인 1**: Telegram 설정 오류

**해결**:
1. Settings에서 Bot Token 및 Chat ID 확인
2. "Test Telegram" 버튼으로 연결 테스트
3. Telegram에서 봇에게 `/start` 메시지 전송

**원인 2**: Notification Enabled가 OFF

**해결**: Settings에서 "Notification Enabled" 스위치 ON

### 비디오 메타데이터가 부정확함

**원인**: RSS로 조회한 비디오 (정확도 낮음)

**해결**: 채널 카드에서 "Refresh Videos" 버튼 클릭하여 API로 업데이트

### 백그라운드 모니터링이 작동하지 않음

**원인**: 서버가 실행 중이 아님

**해결**: 서버를 재시작하고 스케줄러가 작동하는지 확인

---

## 📊 사용 통계 이해하기

### Dashboard 상단 카드

1. **Total Summaries**: 지금까지 생성된 총 요약 수
2. **Today's Videos**: 오늘 업로드된 신규 비디오 수
3. **New Videos**: 아직 확인하지 않은 신규 비디오 수

### 채널 카드 뱃지

1. **+N**: 오늘 업로드된 신규 비디오 수 (빨간색)
2. **Inactive**: 비활성화된 채널
3. **RSS**: RSS로 조회한 비디오 (API quota 절약)

---

## 🚀 고급 기능 (향후)

### 예정된 기능

1. **모바일 앱**: React Native 기반 모바일 앱
2. **비디오 북마크**: 나중에 볼 비디오 저장
3. **요약 편집**: 요약 내용 수정 및 메모 추가
4. **공유 기능**: 요약을 다른 사용자와 공유
5. **추천 시스템**: AI 기반 채널 추천

---

## 📧 지원 및 문의

### 문제 보고

GitHub Issues를 통해 버그를 보고하거나 기능을 제안하세요.

### 도움말

추가 질문이 있으시면 프로젝트 문서를 참조하세요:
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - 프로젝트 개요
- [TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md) - 기술 상세
- [agent.md](../agent.md) - 개발자 가이드

---

**Short-Tube와 함께 YouTube 콘텐츠를 효율적으로 관리하세요!** 🎉
