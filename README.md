# 📺 Short-Tube: AI-Powered YouTube Monitoring Assistant

**Short-Tube**는 사용자가 관심 있는 유튜브 채널을 모니터링하고, 새로운 영상이 올라오면 **Gemini AI**를 통해 내용을 요약하여 브리핑해주는 스마트 비서 서비스입니다.

![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=Streamlit&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)

---

## ✨ 핵심 기능 (Key Features)

### 1. 지능형 유튜브 모니터링
- **키워드 필터링**: 채널별로 관심 있는 태그(키워드)를 설정하여 관련 영상만 추출합니다.
- **이중 데이터 수집**: YouTube Data API(v3)를 우선 사용하며, 할당량 초과 시 자동으로 **RSS Feed**를 통해 데이터를 수집하여 중단 없는 서비스를 제공합니다.
- **스마트 캐싱**: 영상 목록을 로컬에 캐싱하여 불필요한 API 호출을 최소화합니다.

### 2. Gemini AI 기반 요약 (AI Summarization)
- **자막 분석**: 영상의 자막을 추출하여 핵심 내용을 요약합니다.
- **오디오 분석 폴백(Fallback)**: 자막이 없는 영상의 경우, 자동으로 오디오를 추출하여 Gemini의 멀티모달 기능을 통해 내용을 분석합니다.
- **관심사 맞춤형**: 사용자가 설정한 태그에 맞춰 요약 포인트를 최적화합니다.

### 3. 데일리 브리핑 & 알림
- **일일 통합 리포트**: 하루 동안 수집된 모든 영상 요약을 하나의 유기적인 브리핑 리포트로 통합 생성합니다.
- **텔레그램 알림**: 실시간 영상 요약 알림 및 예약된 시간에 데일리 브리핑을 텔레그램으로 전송합니다.
- **아카이브**: 과거에 진행된 모든 요약 내역을 대시보드에서 간편하게 확인할 수 있습니다.

### 4. 프리미엄 UI/UX
- **Streamlit 기반 대시보드**: 깔끔하고 직관적인 카드형 인터페이스를 제공합니다.
- **다크 모드 지원**: 사용자 환경에 최적화된 시각적 경험을 제공합니다.

---

## 🛠 Tech Stack

- **Frontend**: Streamlit (Custom CSS)
- **Backend**: Python 3.x
- **AI Model**: Google Gemini 1.5 Flash
- **Data Fetching**: YouTube Data API v3, RSS (xml.etree.ElementTree)
- **Extraction**: yt-dlp, youtube-transcript-api
- **Storage**: JSON-based Local Persistence

---

## 🚀 시작하기 (Quick Start)

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 만들고 필요한 API 키를 입력합니다.
- `YOUTUBE_API_KEY`: Google Cloud Console에서 발급
- `GEMINI_API_KEY`: Google AI Studio에서 발급
- `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`: 텔레그램 봇 설정 (선택 사항)

### 3. 애플리케이션 실행

**대시보드 실행 (GUI):**
```bash
streamlit run app.py
```

**모니터링 서비스 실행 (CLI/Background):**
```bash
python monitor.py
```
*(예약된 시간에 자동으로 모니터링 및 텔레그램 발송을 수행합니다.)*

---

## 📂 프로젝트 구조 (Project Structure)

- `app.py`: Streamlit 메인 애플리케이션 및 UI 렌더링
- `monitor.py`: 백그라운드 모니터링 및 알림 스케줄러
- `youtube_handler.py`: 유튜브 API 호출, RSS 수집 및 데이터 추출 로직
- `gemini_ai.py`: Gemini AI를 이용한 요약 및 브리핑 생성 엔진
- `data_manager.py`: 로컬 데이터(구독, 캐시, 요약) 관리 및 지속성 레이어
- `notifier.py`: 텔레그램 알림 발송 모듈
- `ai_interface.py`: AI 모델 인터페이스 정의

---

## 📝 라이선스
이 프로젝트는 개인 학습 및 도구 활용 목적으로 제작되었습니다.
