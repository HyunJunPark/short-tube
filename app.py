import streamlit as st
import json
import os
from datetime import datetime, time
from dotenv import load_dotenv
from gemini_ai import GeminiSummaryAI
from youtube_handler import YouTubeHandler
from data_manager import (
    load_data, save_data, load_summaries, save_summary, 
    get_cached_summary, get_summaries_for_date,
    load_video_cache, save_video_cache
)

load_dotenv()

# --- UI Components & Logic ---

def apply_custom_css():
    st.markdown("""
        <style>
        .stButton>button {
            border-radius: 8px;
            padding: 4px 12px !important;
            min-height: auto !important;
            height: auto !important;
            margin-top: 28px !important;
        }
        .stExpander .stButton>button {
            margin-top: 0px !important;
            white-space: nowrap !important;
            justify-content: center !important;
            text-align: center !important;
            width: 100% !important;
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

def render_sidebar():
    """사이드바 설정 영역 렌더링"""
    with st.sidebar:
        st.header("⚙️ 설정 및 제어")
        
        # Notification Time
        current_time = st.session_state.data["user_settings"].get("notification_time", "09:00")
        try:
            h, m = map(int, current_time.split(":"))
            default_time = time(h, m)
        except:
            default_time = time(9, 0)
            
        selected_time = st.time_input("알림 수신 시간", value=default_time)
        new_time_str = selected_time.strftime("%H:%M")
        if new_time_str != current_time:
            st.session_state.data["user_settings"]["notification_time"] = new_time_str
            save_data(st.session_state.data)
        
        # Target Platform
        platforms = ["Telegram", "Slack", "Discord"]
        saved_platform = st.session_state.data["user_settings"].get("target_platform", "Telegram")
        platform_idx = platforms.index(saved_platform) if saved_platform in platforms else 0
        
        platform = st.selectbox("알림 플랫폼", platforms, index=platform_idx)
        if platform != saved_platform:
            st.session_state.data["user_settings"]["target_platform"] = platform
            save_data(st.session_state.data)
        
        if platform == "Telegram":
            render_telegram_settings()
        
        if st.button("설정 저장"):
            save_data(st.session_state.data)
            st.success("설정이 저장되었습니다!")

def render_telegram_settings():
    """텔레그램 상세 설정 렌더링"""
    st.markdown("---")
    st.subheader("🤖 텔레그램 설정")
    
    env_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    env_chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    saved_token = st.session_state.data["user_settings"].get("telegram_token", "")
    saved_chat_id = st.session_state.data["user_settings"].get("telegram_chat_id", "")

    masked_env_token = f"{env_token[:3]}..." if env_token else ""
    token_placeholder = f"현재 .env: {masked_env_token}" if env_token else "봇 토큰을 입력하세요"
    token = st.text_input("봇 토큰", type="password", value=saved_token, placeholder=token_placeholder)
    
    masked_env_chat_id = f"{env_chat_id[:3]}..." if env_chat_id else ""
    chat_id_placeholder = f"현재 .env: {masked_env_chat_id}" if env_chat_id else "챗 ID를 입력하세요"
    chat_id = st.text_input("챗 ID (User ID)", type="password", value=saved_chat_id, placeholder=chat_id_placeholder)
    
    if token != saved_token or chat_id != saved_chat_id:
        st.session_state.data["user_settings"]["telegram_token"] = token
        st.session_state.data["user_settings"]["telegram_chat_id"] = chat_id
        save_data(st.session_state.data)
        
    if not token and env_token:
        st.info("💡 입력란이 비어있어 .env 파일의 토큰을 사용 중입니다.")
    elif token:
        st.success("✅ 직접 입력한 토큰을 사용 중입니다.")

    st.caption("팁: @userinfobot에게 메시지를 보내 챗 ID를 확인하세요.")
    
    if st.button("🔔 테스트 메시지 전송"):
        from notifier import TelegramNotifier
        notifier = TelegramNotifier(token, chat_id)
        if notifier.send_message("✅ 텔레그램 알림 설정이 완료되었습니다!"):
            st.success("테스트 메시지 발송 성공!")
        else:
            st.error("발송 실패. 토큰과 ID를 확인해주세요.")

def render_dashboard_tab():
    """대시보드 탭 렌더링"""
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📺 구독 채널 관리")
        render_add_channel_section()
        
        if not st.session_state.data["subscriptions"]:
            st.info("등록된 채널이 없습니다. 위에서 채널을 추가해보세요!")
        else:
            for idx, sub in enumerate(st.session_state.data["subscriptions"]):
                render_channel_card(sub, idx)

    with col2:
        st.subheader("📊 상태 요약")
        st.metric("구독 중인 채널", len(st.session_state.data["subscriptions"]))
        st.metric("활성 필터링", sum(1 for s in st.session_state.data["subscriptions"] if s["is_active"]))
        st.info("💡 팁: 각 채널별로 관심 있는 키워드를 태그로 등록하세요. 해당 키워드가 포함된 영상만 요약됩니다.")

def render_add_channel_section():
    """채널 추가 섹션 렌더링"""
    with st.expander("➕ 새 채널 추가", expanded=False):
        channel_input = st.text_input("유튜브 핸들(@handle) 또는 URL 입력", placeholder="예: @jocoding 또는 https://www.youtube.com/@jocoding")
        if st.button("채널 등록"):
            if channel_input:
                with st.spinner("채널 정보를 확인 중입니다..."):
                    handler = YouTubeHandler()
                    info = handler.get_channel_info(channel_input)
                    if info["success"]:
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

def render_channel_card(sub, idx):
    """개별 채널 카드 렌더링"""
    with st.container(border=True):
        st.markdown(f"### 📺 {sub['channel_name']}")
        st.caption(f"ID: {sub['channel_id']}")
        
        tags = st.multiselect(f"관심 태그", 
                             options=["AI", "ChatGPT", "신기술", "부동산", "주식", "코딩", "뉴스", "비즈니스", "동기부여"],
                             default=sub["tags"],
                             key=f"tags_{sub['channel_id']}")
        
        if tags != sub["tags"]:
            st.session_state.data["subscriptions"][idx]["tags"] = tags
            save_data(st.session_state.data)

        # Video list section
        list_col1, list_col2 = st.columns([10, 1])
        with list_col1:
            expander = st.expander("📅 최근 일주일 영상 목록", expanded=False)
        with list_col2:
            if st.button("🔄", key=f"refresh_{sub['channel_id']}"):
                with st.spinner(""):
                    handler = YouTubeHandler()
                    videos = handler.get_recent_videos(sub['channel_id'])
                    st.session_state.video_lists[sub['channel_id']] = videos
                    save_video_cache(st.session_state.video_lists)
                st.rerun()

        with expander:
            render_video_list(sub)

        # Action Buttons
        c1, c2, _ = st.columns([1, 1, 4])
        if c1.button("🗑️ 채널 삭제", key=f"del_{sub['channel_id']}"):
            st.session_state.video_lists.pop(sub['channel_id'], None)
            save_video_cache(st.session_state.video_lists)
            st.session_state.data["subscriptions"].pop(idx)
            save_data(st.session_state.data)
            st.rerun()
        
        status_label = "✅ 활성" if sub["is_active"] else "❌ 비활성"
        if c2.button(status_label, key=f"toggle_{sub['channel_id']}"):
            st.session_state.data["subscriptions"][idx]["is_active"] = not sub["is_active"]
            save_data(st.session_state.data)
            st.rerun()

def render_video_list(sub):
    """채널 카드 내 영상 목록 렌더링"""
    video_list = st.session_state.video_lists.get(sub['channel_id'], [])
    if not video_list:
        st.write("오른쪽 🔄 버튼을 눌러 목록을 불러오세요.")
        return

    for vid in video_list:
        v_col_title, v_col_btn1, v_col_btn2 = st.columns([7, 1.5, 1.5], vertical_alignment="center", gap="medium")
        with v_col_title:
            st.markdown(f"**🔹 {vid['title']}**")
        
        # Metadata markdown
        pub_date = vid.get("published_at", "")
        date_str = ""
        if pub_date:
            try:
                date_obj = datetime.strptime(pub_date.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                date_str = date_obj.strftime("%m/%d %H:%M")
            except:
                date_str = "일시 미확인"
        
        cap_info = "자막 있음" if vid.get("has_caption") is True else "자막 없음" if vid.get("has_caption") is False else "자막 확인필요"
        caption_text = f"📅 {date_str}  |  ⏱ {vid.get('duration', '00:00')}  |  💬 {cap_info}"
        st.markdown(f"<div style='margin-left: 25px; margin-top: -15px; margin-bottom: 5px;'><small style='color: gray;'>{caption_text}</small></div>", unsafe_allow_html=True)
        
        cached_summary = get_cached_summary(vid['id'], sub["tags"])
        btn_label, btn_type = ("요약보기", "secondary") if cached_summary else ("요약", "primary")
        
        if v_col_btn1.button(btn_label, key=f"sum_{sub['channel_id']}_{vid['id']}", type=btn_type, use_container_width=True):
            if cached_summary:
                st.info(f"#### ✨ '{vid['title']}' 요약 (저장됨)\n{cached_summary}")
            else:
                with st.spinner("분석 중..."):
                    handler = YouTubeHandler()
                    ai = GeminiSummaryAI()
                    summary = ai.get_summary_with_fallback(handler, vid['id'], sub["tags"])
                    if summary:
                        save_summary(vid['id'], sub["tags"], summary, vid['title'], sub['channel_name'])
                        st.rerun()
        
        v_col_btn2.link_button("영상링크", f"https://www.youtube.com/watch?v={vid['id']}", use_container_width=True)

def render_briefing_tab():
    """데일리 브리핑 탭 렌더링"""
    st.subheader("📅 AI 데일리 브리핑")
    st.markdown("오늘 생성된 여러 영상의 요약본들을 하나로 갈무리하여 핵심 트렌드 리포트를 생성합니다.")
    
    day_col1, day_col2 = st.columns([1, 2])
    target_date = day_col1.date_input("날짜 선택", datetime.now())
    target_date_str = target_date.strftime("%Y-%m-%d")

    daily_summaries = get_summaries_for_date(target_date_str)
    
    if not daily_summaries:
        st.info(f"💡 {target_date_str}에 생성된 요약 정보가 없습니다. 대시보드에서 영상을 먼저 요약해주세요.")
    else:
        with st.container(border=True):
            st.write(f"✅ 총 **{len(daily_summaries)}개**의 요약본이 준비되어 있습니다.")
            all_tags = []
            for sub in st.session_state.data["subscriptions"]:
                all_tags.extend(sub.get("tags", []))
            unique_tags = list(set(all_tags))
            
            if st.button("✨ 오늘의 브리핑 생성하기", type="primary", use_container_width=True):
                with st.spinner("작성 중..."):
                    ai = GeminiSummaryAI()
                    briefing = ai.generate_briefing(daily_summaries, unique_tags)
                    save_summary(f"BRIEFING_{target_date_str}", ["briefing"], briefing, f"{target_date_str} 데일리 브리핑", "System")
                    st.rerun()

        stored_briefing = get_cached_summary(f"BRIEFING_{target_date_str}", ["briefing"])
        if stored_briefing:
            st.markdown("---")
            st.markdown(f"### 📋 {target_date_str} 데일리 브리핑 리포트")
            st.container(border=True).markdown(stored_briefing)
            st.download_button("📥 브리핑 리포트 저장 (TXT)", stored_briefing, file_name=f"briefing_{target_date_str}.txt")
        
        with st.expander("📑 브리핑에 참조된 개별 요약 목록"):
            for item in daily_summaries:
                st.markdown(f"- **{item['title']}** ({item['channel_name']})")

def render_archive_tab():
    """요약 아카이브 탭 렌더링"""
    st.subheader("📚 요약 기록 검색 및 관리")
    all_summaries = load_summaries()
    
    if not all_summaries:
        st.info("아직 저장된 요약 기록이 없습니다.")
        return

    search_col1, search_col2 = st.columns([3, 1])
    query = search_col1.text_input("🔍 제목 또는 내용 검색", placeholder="검색어를 입력하세요...")
    channels = sorted(list(set(data.get("channel_name", "미분류") for data in all_summaries.values() if isinstance(data, dict))))
    selected_channel = search_col2.selectbox("📺 채널 필터", ["전체"] + channels)
    
    display_items = []
    for key, val in all_summaries.items():
        if key.startswith("BRIEFING_") or not isinstance(val, dict): continue
        if selected_channel != "전체" and val.get("channel_name") != selected_channel: continue
        if query and query.lower() not in val.get("title", "").lower() and query.lower() not in val.get("content", "").lower(): continue
        display_items.append(val)
    
    display_items.sort(key=lambda x: x.get("date", ""), reverse=True)
    st.write(f"총 {len(display_items)}개의 결과를 찾았습니다.")
    st.divider()
    
    for item in display_items:
        with st.expander(f"📌 {item['title']} ({item.get('channel_name', 'Unknown')})"):
            st.caption(f"📅 요약 일시: {item.get('date', 'Unknown')} | ID: {item.get('video_id', 'Unknown')}")
            st.markdown(item["content"])
            st.link_button("📺 영상 바로가기", f"https://www.youtube.com/watch?v={item.get('video_id', '')}")

def main():
    st.set_page_config(page_title="YouTube AI Assistant", page_icon="📹", layout="wide")
    apply_custom_css()
    
    if 'data' not in st.session_state:
        st.session_state.data = load_data()
    if 'video_lists' not in st.session_state:
        st.session_state.video_lists = load_video_cache()

    st.title("📹 유튜브 키워드 모니터링 & AI 요약 비서")
    
    render_sidebar()
    
    tab1, tab2, tab3 = st.tabs(["🏠 대시보드", "📅 데일리 브리핑", "📚 요약 기록 아카이브"])
    with tab1: render_dashboard_tab()
    with tab2: render_briefing_tab()
    with tab3: render_archive_tab()

if __name__ == "__main__":
    main()
