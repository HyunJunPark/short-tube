import streamlit as st
import json
import os
from datetime import datetime, time
from gemini_ai import GeminiSummaryAI
from youtube_handler import YouTubeHandler

# --- Configuration & Constants ---
DATA_FILE = "data.json"

# --- Data Management ---
def load_data():
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
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

SUMMARIES_FILE = "summaries.json"

def load_summaries():
    if os.path.exists(SUMMARIES_FILE):
        with open(SUMMARIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_summary(video_id, tags, content, title="", channel_name=""):
    from datetime import datetime
    summaries = load_summaries()
    # 태그를 정렬하여 키로 사용
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
    summaries = load_summaries()
    tag_key = ",".join(sorted(tags)) if tags else "none"
    cache_key = f"{video_id}_{tag_key}"
    data = summaries.get(cache_key)
    if isinstance(data, dict):
        return data.get("content")
    return data # 기존 스트링 형태 하위 호환

# --- UI Components ---
def apply_custom_css():
    st.markdown("""
        <style>
        .stButton>button {
            border-radius: 10px;
            margin-top: 28px !important; /* 익스팬더 타이틀 높이에 맞춤 */
        }
        /* 요약/목록 내 버튼들은 마진 제외 */
        .stExpander .stButton>button {
            margin-top: 0px !important;
        }
        .tag-chip {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 2px 10px;
            border-radius: 15px;
            margin-right: 5px;
            font-size: 0.8rem;
        }
        </style>
    """, unsafe_allow_html=True)

def main():
    st.set_page_config(page_title="YouTube AI Assistant", page_icon="📹", layout="wide")
    apply_custom_css()
    
    # Initialize session state
    if 'data' not in st.session_state:
        st.session_state.data = load_data()
    if 'video_lists' not in st.session_state:
        st.session_state.video_lists = {}

    st.title("📹 유튜브 키워드 모니터링 & AI 요약 비서")
    
    # --- Sidebar: Settings ---
    with st.sidebar:
        st.header("⚙️ 설정 및 제어")
        
        # Notification Time
        current_time = st.session_state.data["user_settings"].get("notification_time", "09:00")
        h, m = map(int, current_time.split(":"))
        selected_time = st.time_input("알림 수신 시간", time(h, m))
        st.session_state.data["user_settings"]["notification_time"] = selected_time.strftime("%H:%M")
        
        # Target Platform
        platform = st.selectbox("알림 플랫폼", ["Telegram", "Slack", "Discord"], 
                                index=["Telegram", "Slack", "Discord"].index(st.session_state.data["user_settings"].get("target_platform", "Telegram")))
        st.session_state.data["user_settings"]["target_platform"] = platform
        
        # Telegram Specific Settings
        if platform == "Telegram":
            st.markdown("---")
            st.subheader("🤖 텔레그램 설정")
            token = st.text_input("봇 토큰", type="password", value=st.session_state.data["user_settings"].get("telegram_token", ""))
            chat_id = st.text_input("챗 ID (User ID)", value=st.session_state.data["user_settings"].get("telegram_chat_id", ""))
            
            st.session_state.data["user_settings"]["telegram_token"] = token
            st.session_state.data["user_settings"]["telegram_chat_id"] = chat_id
            
            st.caption("팁: @userinfobot에게 메시지를 보내 챗 ID를 확인하세요.")
            
            if st.button("🔔 테스트 메시지 전송"):
                from notifier import TelegramNotifier
                notifier = TelegramNotifier(token, chat_id)
                if notifier.send_message("✅ 텔레그램 알림 설정이 완료되었습니다!"):
                    st.success("테스트 메시지 발송 성공!")
                else:
                    st.error("발송 실패. 토큰과 ID를 확인해주세요.")
        
        # Save settings button
        if st.button("설정 저장"):
            save_data(st.session_state.data)
            st.success("설정이 저장되었습니다!")

    # --- Main Navigation ---
    tab1, tab2 = st.tabs(["🏠 대시보드", "📚 요약 기록 아카이브"])
    
    with tab1:
        # --- Main Dashboard ---
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("📺 구독 채널 관리")
            
            # Add Channel Section
            with st.expander("➕ 새 채널 추가", expanded=False):
                channel_input = st.text_input("유튜브 핸들(@handle) 또는 URL 입력", placeholder="예: @jocoding 또는 https://www.youtube.com/@jocoding")
                if st.button("채널 등록"):
                    if channel_input:
                        with st.spinner("채널 정보를 확인 중입니다..."):
                            handler = YouTubeHandler()
                            info = handler.get_channel_info(channel_input)
                            
                            if info["success"]:
                                # 중복 체크
                                if any(sub['channel_id'] == info['channel_id'] for sub in st.session_state.data["subscriptions"]):
                                    st.warning("이미 등록된 채널입니다.")
                                else:
                                    new_channel = {
                                        "channel_id": info["channel_id"],
                                        "channel_name": info["channel_name"],
                                        "tags": [],
                                        "last_processed_video": info["latest_video_id"],
                                        "is_active": True
                                    }
                                    st.session_state.data["subscriptions"].append(new_channel)
                                    save_data(st.session_state.data)
                                    st.success(f"'{info['channel_name']}' 채널이 등록되었습니다!")
                                    st.rerun()
                            else:
                                st.error(f"채널 정보를 가져오지 못했습니다: {info.get('error')}")
                    else:
                        st.error("채널 정보를 입력해주세요.")

            # Channel Cards
            if not st.session_state.data["subscriptions"]:
                st.info("등록된 채널이 없습니다. 위에서 채널을 추가해보세요!")
            else:
                for idx, sub in enumerate(st.session_state.data["subscriptions"]):
                    # 1. 채널별 카드 생성 (Streamlit 공식 방식)
                    with st.container(border=True):
                        # Channel Header
                        st.markdown(f"### 📺 {sub['channel_name']}")
                        st.caption(f"ID: {sub['channel_id']}")
                        
                        # Tag Management
                        tags = st.multiselect(f"관심 태그", 
                                             options=["AI", "ChatGPT", "신기술", "부동산", "주식", "코딩", "뉴스", "비즈니스", "동기부여"],
                                             default=sub["tags"],
                                             key=f"tags_{sub['channel_id']}")
                        
                        if tags != sub["tags"]:
                            st.session_state.data["subscriptions"][idx]["tags"] = tags
                            save_data(st.session_state.data)

                        # Recent Videos List (+ Refresh Button)
                        # 스타일 통일을 위해 10:1 비율로 조정하고 상단 정렬
                        list_col1, list_col2 = st.columns([10, 1])
                        with list_col1:
                            expander_label = "📅 최근 일주일 영상 목록"
                            expander = st.expander(expander_label, expanded=False)
                        with list_col2:
                            # 익스팬더 타이틀과 수평을 맞추기 위해 버튼의 상단 여백 제거 (CSS 적용 예정)
                            refresh_key = f"refresh_{sub['channel_id']}"
                            if st.button("🔄", key=refresh_key, help="영상 목록 새로고침"):
                                with st.spinner(""):
                                    handler = YouTubeHandler()
                                    st.session_state.video_lists[sub['channel_id']] = handler.get_recent_videos(sub['channel_id'])
                                st.rerun()

                        with expander:
                            video_list = st.session_state.video_lists.get(sub['channel_id'], [])
                            if not video_list:
                                st.write("오른쪽 🔄 버튼을 눌러 목록을 불러오세요.")
                            else:
                                for vid in video_list:
                                    # 1. 제목과 버튼을 위한 첫 번째 줄 (타이틀 정중앙 정렬)
                                    v_col_title, v_col_btn1, v_col_btn2 = st.columns([10, 1.5, 1], vertical_alignment="center")
                                    
                                    with v_col_title:
                                        st.markdown(f"**🔹 {vid['title']}**")
                                    
                                    # 2. 메타데이터 (제목 바로 아래에 배치)
                                    pub_date = vid.get("published_at", "")
                                    date_str = ""
                                    if pub_date:
                                        try:
                                            date_obj = datetime.strptime(pub_date.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                                            date_str = date_obj.strftime("%m/%d %H:%M")
                                        except:
                                            date_str = "일시 미확인"
                                    
                                    caption_text = f"📅 {date_str}  |  ⏱ {vid.get('duration', '00:00')}  |  💬 {'자막 있음' if vid.get('has_caption') else '자막 없음'}"
                                    st.markdown(f"<div style='margin-left: 25px; margin-top: -15px; margin-bottom: 5px;'><small style='color: gray;'>{caption_text}</small></div>", unsafe_allow_html=True)
                                    
                                    # 0. 캐시 확인
                                    cached_summary = get_cached_summary(vid['id'], sub["tags"])
                                    
                                    # 요약 버튼
                                    btn_label = "요약보기" if cached_summary else "요약"
                                    btn_type = "secondary" if cached_summary else "primary"
                                    
                                    if v_col_btn1.button(btn_label, key=f"sum_{sub['channel_id']}_{vid['id']}", type=btn_type, use_container_width=True):
                                        if cached_summary:
                                            st.info(f"#### ✨ '{vid['title']}' 요약 (저장됨)\n{cached_summary}")
                                        else:
                                            with st.spinner("분석 중..."):
                                                handler = YouTubeHandler()
                                                ai = GeminiSummaryAI()
                                                summary = None
                                                if vid.get("has_caption"):
                                                    transcript = handler.get_transcript(vid['id'])
                                                    if "자막을 찾을 수 없거나" not in transcript:
                                                        summary = ai.summarize(transcript, sub["tags"])
                                                
                                                if not summary:
                                                    audio_file = handler.download_audio(vid['id'])
                                                    if audio_file:
                                                        summary = ai.summarize_audio(audio_file, sub["tags"])
                                                        if os.path.exists(audio_file): os.remove(audio_file)
                                                
                                                if summary:
                                                    save_summary(vid['id'], sub["tags"], summary, vid['title'], sub['channel_name'])
                                                    st.rerun()
                                    
                                    # 영상 보기 버튼
                                    v_col_btn2.link_button("보기", f"https://www.youtube.com/watch?v={vid['id']}", use_container_width=True)

                        # Action Buttons (Delete / Toggle)
                        c1, c2, _ = st.columns([1, 1, 4])
                        if c1.button("🗑️ 채널 삭제", key=f"del_{sub['channel_id']}"):
                            st.session_state.data["subscriptions"].pop(idx)
                            save_data(st.session_state.data)
                            st.rerun()
                        
                        status_label = "✅ 활성" if sub["is_active"] else "❌ 비활성"
                        if c2.button(status_label, key=f"toggle_{sub['channel_id']}"):
                            st.session_state.data["subscriptions"][idx]["is_active"] = not sub["is_active"]
                            save_data(st.session_state.data)
                            st.rerun()
                        
                        st.divider()

        with col2:
            st.subheader("📊 상태 요약")
            st.metric("구독 중인 채널", len(st.session_state.data["subscriptions"]))
            st.metric("활성 필터링", sum(1 for s in st.session_state.data["subscriptions"] if s["is_active"]))
            
            st.info("💡 팁: 각 채널별로 관심 있는 키워드를 태그로 등록하세요. 해당 키워드가 포함된 영상만 요약됩니다.")

    with tab2:
        st.subheader("📚 요약 기록 검색 및 관리")
        
        all_summaries = load_summaries()
        if not all_summaries:
            st.info("아직 저장된 요약 기록이 없습니다.")
        else:
            # 검색 및 필터 UI
            search_col1, search_col2 = st.columns([3, 1])
            query = search_col1.text_input("🔍 제목 또는 내용 검색", placeholder="검색어를 입력하세요...")
            
            channels = sorted(list(set(
                data.get("channel_name", "미분류 채널") if isinstance(data, dict) else "미분류 채널" 
                for data in all_summaries.values()
            )))
            selected_channel = search_col2.selectbox("📺 채널 필터", ["전체"] + channels)
            
            # 데이터 정렬 및 필터링
            display_items = []
            for key, val in all_summaries.items():
                if not isinstance(val, dict):
                    # 하위 호환: 이전 데이터는 최소 정보로 변환
                    val = {
                        "title": "기존 요약 기록 (제목 정보 없음)", 
                        "content": val, 
                        "channel_name": "미분류 채널", 
                        "date": "기존 데이터", 
                        "video_id": key.split("_")[0]
                    }
                
                # 필터링 조건
                display_channel = val.get("channel_name", "미분류 채널")
                if selected_channel != "전체" and display_channel != selected_channel:
                    continue
                if query and query.lower() not in val.get("title", "").lower() and query.lower() not in val.get("content", "").lower():
                    continue
                    
                display_items.append(val)
            
            # 날짜순 정렬 (최신순)
            display_items.sort(key=lambda x: x.get("date", ""), reverse=True)
            
            st.write(f"총 {len(display_items)}개의 결과를 찾았습니다.")
            st.divider()
            
            # 결과 출력
            for item in display_items:
                with st.expander(f"📌 {item['title']} ({item.get('channel_name', 'Unknown')})", expanded=False):
                    st.caption(f"📅 요약 일시: {item.get('date', 'Unknown')} | ID: {item.get('video_id', 'Unknown')}")
                    st.markdown(item["content"])
                    st.link_button("📺 영상 바로가기", f"https://www.youtube.com/watch?v={item.get('video_id', '')}")

if __name__ == "__main__":
    main()
