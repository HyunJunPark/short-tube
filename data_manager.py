import json
import os
from datetime import datetime

DATA_FILE = "data.json"
SUMMARIES_FILE = "summaries.json"

def load_data():
    """사용자 설정 및 구독 정보를 로드합니다."""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "user_settings": {
            "notification_time": "09:00", 
            "target_platform": "Telegram",
            "telegram_token": "",
            "telegram_chat_id": ""
        },
        "subscriptions": []
    }

def save_data(data):
    """사용자 설정 및 구독 정보를 저장합니다."""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_summaries():
    """전체 요약 아카이브를 로드합니다."""
    if os.path.exists(SUMMARIES_FILE):
        with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_summary(video_id, tags, content, title="", channel_name=""):
    """새로운 요약을 저장하거나 기존 요약을 업데이트합니다."""
    summaries = load_summaries()
    tag_key = ",".join(sorted(tags)) if tags else "none"
    cache_key = f"{video_id}_{tag_key}"
    
    summaries[cache_key] = {
        "content": content,
        "title": title,
        "channel_name": channel_name,
        "video_id": video_id,
        "tags": tags,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(SUMMARIES_FILE, "w", encoding="utf-8") as f:
        json.dump(summaries, f, indent=2, ensure_ascii=False)

def get_cached_summary(video_id, tags):
    """캐시된 요약 텍스트를 반환합니다."""
    summaries = load_summaries()
    tag_key = ",".join(sorted(tags)) if tags else "none"
    cache_key = f"{video_id}_{tag_key}"
    data = summaries.get(cache_key)
    if isinstance(data, dict):
        return data.get("content")
    return data # 하위 호환용

def get_summaries_for_date(target_date_str):
    """특정 날짜(YYYY-MM-DD)에 생성된 요약 목록을 반환합니다 (브리핑용)."""
    all_summaries = load_summaries()
    daily_summaries = []
    for key, data in all_summaries.items():
        if isinstance(data, dict) and "date" in data:
            if data["date"].startswith(target_date_str) and not key.startswith("BRIEFING_"):
                daily_summaries.append(data)
    return daily_summaries
