import json
import os
import time
from datetime import datetime
from youtube_handler import YouTubeHandler
from gemini_ai import GeminiSummaryAI
from notifier import TelegramNotifier

from data_manager import (
    load_data, save_data, load_summaries, save_summary, 
    get_cached_summary, get_summaries_for_date
)

def run_monitoring(send_briefing=False):
    print(f"[{datetime.now()}] 모니터링 시작...")
    data = load_data()
    
    # 텔레그램 설정 가져오기
    user_settings = data.get("user_settings", {})
    token = user_settings.get("telegram_token")
    chat_id = user_settings.get("telegram_chat_id")
    
    handler = YouTubeHandler()
    ai = GeminiSummaryAI()
    notifier = TelegramNotifier(token, chat_id)
    
    updated = False
    new_summaries_today = []
    
    for sub in data.get("subscriptions", []):
        if not sub.get("is_active"):
            continue
            
        print(f"채널 체크 중: {sub['channel_name']}")
        videos = handler.get_recent_videos(sub['channel_id'], days=2)
        
        if not videos:
            continue
            
        new_videos = []
        last_id = sub.get("last_processed_video")
        now = datetime.utcnow()
        
        for vid in videos:
            if vid['id'] == last_id:
                break
            published_at_str = vid.get("published_at", "")
            if published_at_str:
                try:
                    published_at = datetime.strptime(published_at_str.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                    if (now - published_at).total_seconds() <= 86400:
                        new_videos.append(vid)
                    else:
                        break
                except: continue
            
        if not new_videos:
            continue
            
        for vid in reversed(new_videos):
            print(f"  새 영상 발견: {vid['title']}")
            summary = get_cached_summary(vid['id'], sub["tags"])
            
            if not summary:
                # 통합 요약 로직 사용 (자막 실패 시 자동으로 오디오 분석)
                summary = ai.get_summary_with_fallback(handler, vid['id'], sub["tags"])
            
            if summary:
                # 텔레그램 알림 발송
                message = f"🔔 *새 영상 요약: {sub['channel_name']}*\n\n"
                message += f"📌 *제목:* {vid['title']}\n"
                message += f"⏱ *길이:* {vid.get('duration', '미확인')}\n\n"
                message += f"{summary}\n\n"
                message += f"🔗 [영상 보기](https://www.youtube.com/watch?v={vid['id']})"
                
                if notifier.send_message(message):
                    # 성공 시 캐시 저장
                    save_summary(vid['id'], sub["tags"], summary, vid['title'], sub['channel_name'])
                    entry = {
                        "content": summary,
                        "title": vid['title'],
                        "channel_name": sub['channel_name'],
                        "video_id": vid['id'],
                        "tags": sub['tags'],
                        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    new_summaries_today.append(entry)
                    
                    sub["last_processed_video"] = vid['id']
                    updated = True
                    time.sleep(2)

    if updated:
        save_data(data)
        print("상태 업데이트 완료.")
    else:
        print("새로운 대상 영상이 없습니다.")

    # 데일리 브리핑 발송 (설정된 시간에만 호출됨)
    if send_briefing:
        print("데일리 브리핑 생성 및 발송 중...")
        today_str = datetime.now().strftime("%Y-%m-%d")
        daily_list = get_summaries_for_date(today_str)
        
        if daily_list:
            all_tags = []
            for sub in data.get("subscriptions", []):
                all_tags.extend(sub.get("tags", []))
            unique_tags = list(set(all_tags))
            
            briefing = ai.generate_briefing(daily_list, unique_tags)
            if briefing:
                briefing_msg = f"📅 *오늘의 AI 커스텀 브리핑 ({today_str})*\n\n{briefing}"
                if notifier.send_message(briefing_msg):
                    print("데일리 브리핑 발송 완료.")
                    # 브리핑 캐시 저장
                    save_summary(f"BRIEFING_{today_str}", ["briefing"], briefing, f"{today_str} 데일리 브리핑", "System")

def main():
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        run_monitoring(send_briefing=True)
        return

    print("🚀 모니터링 서비스가 시작되었습니다. (매 1분마다 시간 체크)")
    last_run_date = ""

    while True:
        try:
            data = load_data()
            user_settings = data.get("user_settings", {})
            notif_time = user_settings.get("notification_time", "09:00")
            
            now = datetime.now()
            current_time_str = now.strftime("%H:%M")
            current_date_str = now.strftime("%Y-%m-%d")

            # 설정된 시간이 됐고, 오늘 아직 실행하지 않았다면
            if current_time_str == notif_time and last_run_date != current_date_str:
                print(f"[{now}] 예약된 시간이 되어 모니터링 및 브리핑을 시작합니다.")
                run_monitoring(send_briefing=True)
                last_run_date = current_date_str
            
            # 1분 대기
            time.sleep(60)
        except KeyboardInterrupt:
            print("\n서비스를 종료합니다.")
            break
        except Exception as e:
            print(f"루프 실행 중 에러 발생: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
