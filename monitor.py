import json
import os
import time
from datetime import datetime
from youtube_handler import YouTubeHandler
from gemini_ai import GeminiSummaryAI
from notifier import TelegramNotifier

DATA_FILE = "data.json"
SUMMARIES_FILE = "summaries.json"

def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(file_path, data):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_cached_summary(video_id, tags):
    summaries = load_json(SUMMARIES_FILE)
    tag_key = ",".join(sorted(tags)) if tags else "none"
    cache_key = f"{video_id}_{tag_key}"
    return summaries.get(cache_key)

def run_monitoring():
    print(f"[{datetime.now()}] 모니터링 시작...")
    data = load_json(DATA_FILE)
    
    # 텔레그램 설정 가져오기
    user_settings = data.get("user_settings", {})
    token = user_settings.get("telegram_token")
    chat_id = user_settings.get("telegram_chat_id")
    
    handler = YouTubeHandler()
    ai = GeminiSummaryAI()
    notifier = TelegramNotifier(token, chat_id)
    
    updated = False
    
    for sub in data.get("subscriptions", []):
        if not sub.get("is_active"):
            continue
            
        print(f"채널 체크 중: {sub['channel_name']}")
        # 최근 영상 목록 가져오기 (충분한 범위를 위해 days=2 설정)
        videos = handler.get_recent_videos(sub['channel_id'], days=2)
        
        if not videos:
            continue
            
        new_videos = []
        last_id = sub.get("last_processed_video")
        now = datetime.utcnow()
        
        # 마지막으로 본 영상 이후이며, 24시간 이내인 영상들 찾기
        for vid in videos:
            if vid['id'] == last_id:
                break
                
            # 시간 형식 파싱 (예: 2025-12-22T14:30:00Z)
            published_at_str = vid.get("published_at", "")
            if published_at_str:
                try:
                    # ISO 8601 형식 파싱
                    published_at = datetime.strptime(published_at_str.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                    time_diff = now - published_at
                    
                    # 24시간(86400초) 이내인 영상만 추가
                    if time_diff.total_seconds() <= 86400:
                        new_videos.append(vid)
                    else:
                        # 리스트는 최신순이므로, 한 번 24시간을 넘어가면 그 이전 영상들은 볼 필요 없음
                        break
                except Exception as pe:
                    print(f"시간 파싱 에러 ({vid['title']}): {pe}")
            
        if not new_videos:
            continue
            
        # 최신순이므로 뒤집어서 오래된 것부터 처리
        for vid in reversed(new_videos):
            print(f"  새 영상 발견: {vid['title']}")
            
            # 1. 캐시 확인
            summary = get_cached_summary(vid['id'], sub["tags"])
            
            # 2. 캐시 없으면 요약 생성
            if not summary:
                # 자막 시도
                transcript = handler.get_transcript(vid['id'])
                if "자막을 찾을 수 없거나" not in transcript or vid.get("has_caption"):
                    summary = ai.summarize(transcript, sub["tags"])
                
                # 자막 실패 시 오리에 분석 (선택 사항 - 여기서는 안정성을 위해 자막 위주로)
                if not summary:
                    audio_file = handler.download_audio(vid['id'])
                    if audio_file:
                        summary = ai.summarize_audio(audio_file, sub["tags"])
                        if os.path.exists(audio_file):
                            os.remove(audio_file)
            
            if summary:
                # 텔레그램 알림 발송
                message = f"🔔 *새 영상 요약: {sub['channel_name']}*\n\n"
                message += f"📌 *제목:* {vid['title']}\n"
                message += f"⏱ *길이:* {vid.get('duration', '미확인')}\n\n"
                message += f"{summary}\n\n"
                message += f"🔗 [영상 보기](https://www.youtube.com/watch?v={vid['id']})"
                
                if notifier.send_message(message):
                    # 성공 시 캐시 및 아카이브 저장
                    summaries = load_json(SUMMARIES_FILE)
                    tag_key = ",".join(sorted(sub["tags"])) if sub["tags"] else "none"
                    summaries[f"{vid['id']}_{tag_key}"] = {
                        "content": summary,
                        "title": vid['title'],
                        "channel_name": sub['channel_name'],
                        "video_id": vid['id'],
                        "tags": sub['tags'],
                        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    save_json(SUMMARIES_FILE, summaries)
                    
                    sub["last_processed_video"] = vid['id']
                    updated = True
                    # 연속 발송 시 텔레그램 제한 방지를 위해 잠시 대기
                    time.sleep(2)

    if updated:
        save_json(DATA_FILE, data)
        print("상태 업데이트 완료.")
    else:
        print("새로운 대상 영상이 없습니다.")

if __name__ == "__main__":
    run_monitoring()
