import streamlit as st
import json
import base64
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

def get_base64_image(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return ""



# --- UI Components & Logic ---

def apply_custom_css():
    st.markdown("""
        <style>
        /* Minimalist Dark Theme Colors */
        :root {
            --bg-dark: #0D1117;
            --bg-card: rgba(22, 27, 34, 0.8);
            --text-white: #C9D1D9; /* Toned down from #E6EDF3 */
            --text-gray: #8B949E;
            --accent-gray: rgba(240, 246, 252, 0.15); /* Subtle border color */
            --border-color: rgba(48, 54, 61, 0.6);
            --hover-bg: rgba(240, 246, 252, 0.1); 
            --active-item: rgba(240, 246, 252, 0.2);
            --focus-border: #8B949E; /* Gray focus border */
        }
        
        /* ===== Global Styles ===== */
        .stApp {
            background: #0D1117;
        }
        
        /* Ensure header interactions are visible */
        header[data-testid="stHeader"] {
            background: transparent !important;
            z-index: 99 !important;
        }

        /* Hide the 'Deploy' button and hamburger menu if needed, OR keep them */
        .stDeployButton {
            display: none !important;
        }
        
        #MainMenu {
            visibility: hidden !important;
        }
        
        footer {
            visibility: hidden !important;
        }
        
        section[data-testid="stSidebar"] {
            background: linear-gradient(180deg, #161B22 0%, #0D1117 100%);
            border-right: 1px solid var(--border-color) !important;
        }
        
        section[data-testid="stSidebar"] > div {
            background: transparent;
        }
        
        /* Center main content with 70% width and visual separation */
        .main .block-container {
            width: 70% !important;
            max-width: 70% !important;
            padding-top: 2rem !important; /* Reduce top padding significantly */
            padding-bottom: 5rem !important;
            padding-left: 3rem !important;
            padding-right: 3rem !important;
            margin: 0 auto !important;
            background: #0D1117;
            border-left: 1px solid rgba(240, 246, 252, 0.1);
            border-right: 1px solid rgba(240, 246, 252, 0.1);
            box-shadow: none;
            min-height: 100vh;
        }
        
        @media (max-width: 1400px) {
            .main .block-container {
                width: 85% !important;
                max-width: 85% !important;
            }
        }
        
        @media (max-width: 1024px) {
            .main .block-container {
                width: 95% !important;
                max-width: 95% !important;
                padding-left: 1rem !important;
                padding-right: 1rem !important;
                border: none;
            }
        }
        
        /* Ensure sidebar is strictly on the left */
        /* Ensure sidebar is strictly on the left */
        section[data-testid="stSidebar"] {
            border-right: 1px solid var(--border-color) !important;
            box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
            z-index: 100;
        }
        
        /* Restrict styling to center content */
        .stTabs {
            border-bottom: 1px solid var(--border-color) !important;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        /* ===== Typography ===== */
        h1, h2, h3, h4, h5, h6 {
            color: var(--text-white) !important;
            font-weight: 600 !important;
            text-shadow: none !important;
        }
        
        h1 {
            font-size: 2.2rem !important;
            text-align: center;
            margin-bottom: 1rem !important;
            margin-top: 0.5rem !important;
            letter-spacing: 1px;
            font-weight: 500 !important;
            padding: 0 !important;
        }
        
        h2 {
            font-size: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            font-weight: 500 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        
        h3 {
            font-size: 1.2rem !important;
            margin-bottom: 1rem !important;
            font-weight: 500 !important;
        }
        
        p, span, div, label {
            color: var(--text-gray) !important;
            font-weight: 400 !important;
        }
        
        /* ===== Clean Card Styles ===== */
        div[data-testid="stVerticalBlock"] > div[style*="border"] {
            background: rgba(22, 27, 34, 0.6) !important;
            border: 1px solid rgba(48, 54, 61, 0.8) !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            padding: 1.5rem !important;
            margin-bottom: 1rem !important;
        }
        
        div[data-testid="stVerticalBlock"] > div[style*="border"]:before {
            display: none !important;
        }

        /* ===== Clean & Ghost Buttons ===== */
        .stButton > button {
            background: transparent !important;
            border: 1px solid rgba(240, 246, 252, 0.1) !important;
            color: #C9D1D9 !important; /* Brighter text/icon color */
            border-radius: 8px !important;
            padding: 0.25rem 0.75rem !important;
            font-size: 0.9rem !important;
            font-weight: 400 !important;
            transition: all 0.2s ease !important;
            height: auto !important;
            min-height: 36px !important;
        }
        
        .stButton > button:hover {
            border-color: var(--text-gray) !important;
            color: var(--text-white) !important;
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .stButton > button[kind="primary"] {
            background: rgba(255, 255, 255, 0.1) !important;
            color: var(--text-white) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
            box-shadow: none !important;
        }
        
        .stButton > button[kind="primary"]:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
            opacity: 1 !important;
            box-shadow: none !important;
        }
        
        .stButton > button[kind="secondary"] {
            border-color: var(--accent-gray) !important;
            color: var(--text-gray) !important;
            box-shadow: none !important;
        }
        
        .stButton > button[kind="secondary"]:hover {
            border-color: rgba(255, 255, 255, 0.4) !important;
            color: white !important;
            background: var(--hover-bg) !important;
        }
        
        /* ===== Modern Dark Input & Dropdown Styling ===== */
        
        /* 1. Reset Streamlit's default outer container styles to prevent double borders */
        .stTextInput > div, .stSelectbox > div, .stTimeInput > div, .stDateInput > div {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* 2. Style the actual Baseweb Input Container */
        div[data-baseweb="base-input"], 
        div[data-baseweb="select"] > div {
            background-color: rgba(22, 27, 34, 0.95) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 6px !important;
            color: var(--text-white) !important;
            box-shadow: none !important;
            transition: all 0.2s ease !important;
        }

        /* 3. Remove default borders from the raw HTML input element */
        input {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            color: var(--text-white) !important;
            caret-color: white !important;
            min-height: 0 !important;
        }

        /* 4. Focus State - Minimal gray border */
        div[data-baseweb="base-input"]:focus-within,
        div[data-baseweb="select"] > div:focus-within {
            border-color: var(--focus-border) !important;
            box-shadow: none !important;
        }
        
        /* 5. Fix icons (Password eye, padding, etc) */
        div[data-baseweb="base-input"] button {
             color: var(--text-gray) !important;
        }

        /* Force Dark Theme on Dropdown Popovers */
        div[data-baseweb="popover"],
        div[data-baseweb="menu"],
        div[data-baseweb="menu"] > div {
            background-color: #161B22 !important;
            border: 1px solid var(--border-color) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        
        /* SVG Icons in inputs (like dropdown arrows) */
        div[data-baseweb="select"] svg {
            fill: var(--text-white) !important;
            color: var(--text-white) !important;
        }
        
        div[data-baseweb="select"] svg path {
            fill: var(--text-white) !important;
        }
        
        /* Multiselect Tags - Cleaner Pill Style */
        [data-baseweb="tag"],
        [data-baseweb="tag"] > div,
        div[data-testid="stMultiSelect"] span[data-baseweb="tag"] {
            background-color: rgba(240, 246, 252, 0.15) !important;
            border: 1px solid rgba(240, 246, 252, 0.1) !important;
            border-radius: 12px !important;
            color: var(--text-white) !important;
            box-shadow: none !important;
            padding-left: 8px !important;
        }
        
        /* Inner text of the tag */
        [data-baseweb="tag"] span {
            color: #E6EDF3 !important; /* Bright text */
            font-weight: 300 !important;
            font-size: 0.85rem !important;
        }

        /* Tag Close 'x' icon */
        [data-baseweb="tag"] svg {
            fill: #8B949E !important; /* Dimmed close icon */
            color: #8B949E !important;
        }
        
        [data-baseweb="tag"] svg:hover {
            fill: #E6EDF3 !important; /* Brighter on hover */
        }

        /* Hover & Focus states */
        div[data-baseweb="select"]:hover > div,
        div[data-baseweb="base-input"]:hover {
            border-color: var(--text-gray) !important;
        }

        /* Target the UL list specifically */
        ul[data-baseweb="menu"] {
            background-color: #161B22 !important;
        }

        /* Target unique list items */
        li[data-baseweb="option"] {
            background-color: #161B22 !important;
            color: rgba(255, 255, 255, 0.9) !important;
        }
        
        /* Hover states */
        li[data-baseweb="option"]:hover,
        li[data-baseweb="option"][aria-selected="true"] {
            background-color: var(--active-item) !important;
            color: var(--text-white) !important;
        }
        
        /* ===== Dividers ===== */
        hr {
            border-color: rgba(255, 255, 255, 0.2) !important;
            background-color: rgba(255, 255, 255, 0.2) !important;
            opacity: 1 !important;
        }
        
        /* Target ANY virtualized list container */
        div[role="listbox"] ul {
           background-color: #161B22 !important;
        }
        
        div[role="listbox"] li {
           background-color: #161B22 !important;
           color: var(--text-white) !important;
        }
        
        div[role="listbox"] li:hover,
        div[role="listbox"] li[aria-selected="true"] {
            background-color: var(--active-item) !important;
        }

        /* Fix text color for any nested spans in options */
        li[data-baseweb="option"] * {
            color: inherit !important;
        }

        /* Dropdown selection text color */
        div[data-testid="stSelectbox"] div[data-baseweb="select"] span {
            color: white !important;
        }
        
        /* SVG Icons in inputs (like dropdown arrows) */
        div[data-baseweb="select"] svg {
            fill: var(--neon-cyan) !important;
        }

        /* Multiselect Tags */
        span[data-baseweb="tag"] {
            background-color: rgba(0, 217, 255, 0.15) !important;
            border: 1px solid rgba(0, 217, 255, 0.4) !important;
        }
        
        span[data-baseweb="tag"] span {
            color: var(--neon-cyan) !important;
        }
        
        /* Hover & Focus states */
        div[data-baseweb="select"]:hover > div,
        div[data-baseweb="base-input"]:hover {
            border-color: var(--neon-cyan) !important;
        }
        
        /* ===== Tabs ===== */
        .stTabs [data-baseweb="tab-list"] {
            gap: 2rem;
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 0 !important;
        }
        
        .stTabs [data-baseweb="tab"] {
            padding: 1rem 0.5rem !important;
            background: transparent !important;
            color: var(--text-gray) !important;
            font-weight: 500 !important;
            border: none !important;
            border-bottom: 2px solid transparent !important;
            border-radius: 0 !important;
            transition: all 0.3s ease !important;
            flex: 0 !important; /* Prevent expanding to fill space */
        }
        
        .stTabs [data-baseweb="tab"]:hover {
            color: var(--text-white) !important;
            border-bottom-color: var(--text-gray) !important;
            box-shadow: none !important;
        }
        
        button[data-baseweb="tab"] {
            color: var(--text-gray) !important;
            border-bottom: 2px solid transparent !important;
        }

        button[data-baseweb="tab"][aria-selected="true"],
        div[data-testid="stTabs"] button[aria-selected="true"] {
            color: #FFFFFF !important; /* Pure White */
            border-bottom-color: #FFFFFF !important;
        }

        /* Force inner text color */
        button[data-baseweb="tab"][aria-selected="true"] p,
        div[data-testid="stTabs"] button[aria-selected="true"] p {
             color: #FFFFFF !important;
             font-weight: 700 !important;
        }
        
        /* ===== Metrics ===== */
        div[data-testid="stMetricValue"] {
            color: var(--text-white) !important;
            font-size: 2.5rem !important;
            font-weight: 700 !important;
            text-shadow: none !important;
        }
        
        div[data-testid="stMetricLabel"] {
            color: var(--text-white) !important;
            font-weight: 600 !important;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* ===== Clean Expander Styles ===== */
        div[data-testid="stExpander"] {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        
        div[data-testid="stExpander"] details {
            border: 1px solid var(--border-color) !important;
            border-radius: 8px !important;
            background: rgba(22, 27, 34, 0.6) !important;
        }

        div[data-testid="stExpander"] summary {
            color: var(--text-white) !important;
            background-color: transparent !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
        }

        div[data-testid="stExpander"] summary:hover {
            color: white !important;
            background-color: rgba(255, 255, 255, 0.05) !important;
        }
        
        div[data-testid="stExpander"] summary svg {
            fill: var(--text-gray) !important;
        }
        
        div[data-testid="stExpander"] summary:hover svg {
            fill: white !important;
        }
        
        /* ===== Alert Boxes ===== */
        .stAlert {
            background: rgba(13, 17, 23, 0.8);
            border-left: 4px solid var(--neon-cyan);
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
        }
        
        div[data-testid="stNotificationContentInfo"] {
            border-left-color: var(--neon-cyan);
            box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
        }
        
        div[data-testid="stNotificationContentSuccess"] {
            border-left-color: var(--neon-green);
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
        }
        
        div[data-testid="stNotificationContentWarning"] {
            border-left-color: var(--neon-yellow);
            box-shadow: 0 0 15px rgba(255, 214, 10, 0.2);
        }
        
        div[data-testid="stNotificationContentError"] {
            border-left-color: var(--neon-magenta);
            box-shadow: 0 0 15px rgba(255, 0, 110, 0.2);
        }
        
        /* ===== Dividers ===== */
        hr {
            border-color: rgba(0, 217, 255, 0.3) !important;
            margin: 2rem 0 !important;
            box-shadow: 0 0 5px rgba(0, 217, 255, 0.2);
        }
        
        /* ===== Scrollbar ===== */
        ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--bg-darker);
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-purple) 100%);
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
        }
        
        ::-webkit-scrollbar-thumb:hover {
            box-shadow: 0 0 15px rgba(0, 217, 255, 0.8);
        }
        
        /* ===== Link Buttons ===== */
        .stLinkButton > a {
            background: transparent !important;
            border: 1px solid var(--accent-gray) !important;
            color: var(--text-white) !important;
            border-radius: 6px !important;
            padding: 0.6rem 1.2rem !important; /* Match button padding */
            font-weight: 600 !important;
            text-transform: none !important;
            letter-spacing: 0 !important;
            box-shadow: none !important;
            transition: all 0.2s ease !important;
            text-decoration: none !important;
            min-height: 40px !important; /* Match button height */
            height: 40px !important;
            line-height: normal !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        .stLinkButton > a:hover {
            border-color: rgba(255, 255, 255, 0.4) !important;
            color: white !important;
            background: var(--hover-bg) !important;
            box-shadow: none !important;
            transform: none !important;
        }
        
        /* ===== Custom Neon Classes ===== */
        .neon-text-cyan {
            color: var(--neon-cyan) !important;
            text-shadow: 0 0 10px rgba(0, 217, 255, 0.6);
        }
        
        .neon-text-magenta {
            color: var(--neon-magenta) !important;
            text-shadow: 0 0 10px rgba(255, 0, 110, 0.6);
        }
        
        .neon-text-yellow {
            color: var(--neon-yellow) !important;
            text-shadow: 0 0 10px rgba(255, 214, 10, 0.6);
        }
        
        .neon-text-purple {
            color: var(--neon-purple) !important;
            text-shadow: 0 0 10px rgba(157, 78, 221, 0.6);
        }
        
        .neon-glow-box {
            background: rgba(13, 17, 23, 0.8);
            border: 2px solid var(--neon-cyan);
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 
                0 0 20px rgba(0, 217, 255, 0.4),
                inset 0 0 20px rgba(0, 217, 255, 0.05);
        }
    """, unsafe_allow_html=True)


def render_sidebar():
    """사이드바 설정 영역 렌더링"""
    with st.sidebar:
        st.subheader("⚙ 설정 및 제어")
        
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
    st.markdown("<div style='height: 1px; background-color: rgba(255, 255, 255, 0.2); margin: 1.5rem 0; width: 100%;'></div>", unsafe_allow_html=True)
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
        st.markdown("<h2 style='color: #00D9FF; text-shadow: 0 0 12px rgba(0, 217, 255, 0.6); font-weight: 500; letter-spacing: 1px;'>구독 채널 관리</h2>", unsafe_allow_html=True)
        render_add_channel_section()
        
        if not st.session_state.data["subscriptions"]:
            st.info("등록된 채널이 없습니다. 위에서 채널을 추가해보세요!")
        else:
            for idx, sub in enumerate(st.session_state.data["subscriptions"]):
                render_channel_card(sub, idx)

    with col2:
        st.markdown("<h3 style='color: #C9D1D9; font-size: 1.2rem; margin-bottom: 1rem;'>상태 요약</h3>", unsafe_allow_html=True)
        st.metric("구독 중인 채널", len(st.session_state.data["subscriptions"]))
        st.metric("활성 필터링", sum(1 for s in st.session_state.data["subscriptions"] if s["is_active"]))
        st.markdown("<div class='clean-box' style='margin-top: 1rem;'><p style='margin: 0; color: #8B949E;'>💡 <strong style='color: #C9D1D9;'>팁:</strong> 각 채널별로 관심 있는 키워드를 태그로 등록하세요. 해당 키워드가 포함된 영상만 요약됩니다.</p></div>", unsafe_allow_html=True)

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
    # All gray color for headers
    color = {"name": "white", "hex": "#FFFFFF", "rgba": "255, 255, 255"}
    
    with st.container(border=True):
        # Header Row: Channel Info (Left) + Toggle Switch (Right)
        # Use top alignment to match title, modify ratio to push toggle right
        header_col1, header_col2 = st.columns([6, 1], vertical_alignment="top")
        
        with header_col1:
            st.markdown(f"""
                <div style='display: flex; flex-direction: column; gap: 2px;'>
                    <h3 style='color: {color['hex']}; font-weight: 500; letter-spacing: 0.5px; margin: 0; line-height: 1.0; padding: 0;'>{sub['channel_name']}</h3>
                    <p style='color: #8B949E; font-size: 0.8rem; margin: 0; line-height: 1.2;'>ID: {sub['channel_id']}</p>
                </div>
            """, unsafe_allow_html=True)
            
        with header_col2:
            # Remove top padding and add larger negative right margin for strict edge alignment
            st.markdown("<div style='display: flex; justify-content: flex-end; width: 100%; padding-top: 0px; margin-right: -20px;'>", unsafe_allow_html=True)
            toggle_label = "활성" if sub['is_active'] else "비활성"
            is_active = st.toggle(toggle_label, value=sub['is_active'], key=f"toggle_header_{sub['channel_id']}")
            st.markdown("</div>", unsafe_allow_html=True)
            
            if is_active != sub['is_active']:
                st.session_state.data["subscriptions"][idx]["is_active"] = is_active
                save_data(st.session_state.data)
                st.rerun()
        
        st.markdown(f"<p style='color: {color['hex']}; font-weight: 500; margin-bottom: 0.5rem;'>관심 태그</p>", unsafe_allow_html=True)
        tags = st.multiselect(f"관심 태그", 
                             options=["AI", "ChatGPT", "신기술", "부동산", "주식", "코딩", "뉴스", "비즈니스", "동기부여"],
                             default=sub["tags"],
                             key=f"tags_{sub['channel_id']}",
                             label_visibility="collapsed")
        
        if tags != sub["tags"]:
            st.session_state.data["subscriptions"][idx]["tags"] = tags
            save_data(st.session_state.data)

        # Video list section with improved styling
        st.markdown(f"<div style='margin-top: 1rem; margin-bottom: 0.5rem;'></div>", unsafe_allow_html=True)
        list_col1, list_col2 = st.columns([10, 1])
        with list_col1:
            expander = st.expander("📅 최근 일주일 영상 목록", expanded=False)
        with list_col2:
            # Use custom icon via CSS
            if st.button("새로고침", key=f"refresh_{sub['channel_id']}", help="영상 목록 새로고침"):
                with st.spinner("목록 업데이트 중..."):
                    handler = YouTubeHandler()
                    videos = handler.get_recent_videos(sub['channel_id'])
                    st.session_state.video_lists[sub['channel_id']] = videos
                    save_video_cache(st.session_state.video_lists)
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

        with expander:
            render_video_list(sub)

        # Action Buttons (Delete only at the bottom now)
        st.markdown("<div style='margin-top: 1rem;'></div>", unsafe_allow_html=True)
        c1, c2 = st.columns([1, 5])
        
        if c1.button("🗑️ 삭제", key=f"del_btn_{sub['channel_id']}", type="secondary", help="이 채널을 구독 목록에서 제거합니다."):
            confirm_delete_channel(sub, idx)

@st.dialog("채널 삭제")
def confirm_delete_channel(sub, idx):
    st.write(f"정말로 **{sub['channel_name']}** 채널을 삭제하시겠습니까?")
    st.caption("이 작업은 되돌릴 수 없으며, 저장된 채널 설정과 영상 목록이 모두 제거됩니다.")
    
    col1, col2 = st.columns(2)
    if col1.button("삭제", type="primary", use_container_width=True):
        st.session_state.video_lists.pop(sub['channel_id'], None)
        save_video_cache(st.session_state.video_lists)
        st.session_state.data["subscriptions"].pop(idx)
        save_data(st.session_state.data)
        st.rerun()
        
    if col2.button("취소", type="secondary", use_container_width=True):
        st.rerun()

def render_video_list(sub):
    """채널 카드 내 영상 목록 렌더링"""
    video_list = st.session_state.video_lists.get(sub['channel_id'], [])
    if not video_list:
        st.write("오른쪽 🔄 버튼을 눌러 목록을 불러오세요.")
        return

                
    for vid in video_list:
        with st.container(border=True):
            v_col_title, v_col_btn1, v_col_btn2 = st.columns([7, 1.5, 1.5], vertical_alignment="center", gap="small")
            with v_col_title:
                st.markdown(f"<h4 style='color: #FFFFFF !important; font-size: 1rem; font-weight: 700; margin: 0 0 0.25rem 0; padding: 0; line-height: 1.4;'>🎬 {vid['title']}</h4>", unsafe_allow_html=True)
                
                # Metadata no neon
                pub_date = vid.get("published_at", "")
                date_str = ""
                if pub_date:
                    try:
                        date_obj = datetime.strptime(pub_date.replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
                        date_str = date_obj.strftime("%m/%d %H:%M")
                    except:
                        date_str = "일시 미확인"
                
                cap_info = "자막 O" if vid.get("has_caption") is True else "자막 X" if vid.get("has_caption") is False else "자막 ?"
                caption_text = f"<span style='color: #8B949E;'>📅 {date_str}</span>  •  <span style='color: #8B949E;'>⏱ {vid.get('duration', '00:00')}</span>  •  <span style='color: #8B949E;'>{cap_info}</span>"
                st.markdown(f"<p style='font-size: 0.85rem; margin: 0;'>{caption_text}</p>", unsafe_allow_html=True)
            
            cached_summary = get_cached_summary(vid['id'], sub["tags"])
            btn_label, btn_type = ("요약보기", "secondary") if cached_summary else ("요약", "primary")
            
            if v_col_btn1.button(btn_label, key=f"sum_{sub['channel_id']}_{vid['id']}", type=btn_type, use_container_width=True):
                if cached_summary:
                    st.info(f"#### ✨ '{vid['title']}' 요약\n\n{cached_summary}")
                else:
                    with st.spinner("AI가 영상을 분석하는 중..."):
                        handler = YouTubeHandler()
                        ai = GeminiSummaryAI()
                        summary = ai.get_summary_with_fallback(handler, vid['id'], sub["tags"])
                        if summary:
                            save_summary(vid['id'], sub["tags"], summary, vid['title'], sub['channel_name'])
                            st.rerun()
            
            v_col_btn2.link_button("영상", f"https://www.youtube.com/watch?v={vid['id']}", use_container_width=True)

def render_briefing_tab():
    """데일리 브리핑 탭 렌더링"""
    st.markdown("<h2 style='color: #C9D1D9; font-weight: 500; letter-spacing: 1px;'>AI 데일리 브리핑</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #a0aec0; margin-bottom: 1.5rem;'>오늘 생성된 여러 영상의 요약본들을 하나로 갈무리하여 핵심 트렌드 리포트를 생성합니다.</p>", unsafe_allow_html=True)
    
    day_col1, day_col2 = st.columns([1, 2])
    target_date = day_col1.date_input("날짜 선택", datetime.now())
    target_date_str = target_date.strftime("%Y-%m-%d")

    daily_summaries = get_summaries_for_date(target_date_str)
    
    if not daily_summaries:
        st.info(f"💡 {target_date_str}에 생성된 요약 정보가 없습니다. 대시보드에서 영상을 먼저 요약해주세요.")
    else:
        with st.container(border=True):
            st.markdown(f"<p style='color: #a0aec0;'>✅ 총 <strong style='color: #667eea;'>{len(daily_summaries)}개</strong>의 요약본이 준비되어 있습니다.</p>", unsafe_allow_html=True)
            all_tags = []
            for sub in st.session_state.data["subscriptions"]:
                all_tags.extend(sub.get("tags", []))
            unique_tags = list(set(all_tags))
            
            if st.button("✨ 오늘의 브리핑 생성하기", type="primary", use_container_width=True):
                with st.spinner("AI가 브리핑을 작성하는 중..."):
                    ai = GeminiSummaryAI()
                    briefing = ai.generate_briefing(daily_summaries, unique_tags)
                    save_summary(f"BRIEFING_{target_date_str}", ["briefing"], briefing, f"{target_date_str} 데일리 브리핑", "System")
                    st.rerun()

        stored_briefing = get_cached_summary(f"BRIEFING_{target_date_str}", ["briefing"])
        if stored_briefing:
            st.markdown("---")
            st.markdown(f"<h3 style='color: #ffffff;'>📋 {target_date_str} 데일리 브리핑 리포트</h3>", unsafe_allow_html=True)
            st.markdown(f"<div style='background: rgba(37, 43, 74, 0.4); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(102, 126, 234, 0.2);'>{stored_briefing}</div>", unsafe_allow_html=True)
            st.download_button("📥 브리핑 리포트 저장 (TXT)", stored_briefing, file_name=f"briefing_{target_date_str}.txt")
        
        with st.expander("📑 브리핑에 참조된 개별 요약 목록"):
            for item in daily_summaries:
                st.markdown(f"- **{item['title']}** ({item['channel_name']})")

def render_archive_tab():
    """요약 아카이브 탭 렌더링"""
    st.markdown("<h2 style='color: #C9D1D9; font-weight: 500; letter-spacing: 1px;'>요약 기록 검색 및 관리</h2>", unsafe_allow_html=True)
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
    st.markdown(f"<p style='color: #a0aec0; margin: 1rem 0;'>총 <strong style='color: #667eea;'>{len(display_items)}개</strong>의 결과를 찾았습니다.</p>", unsafe_allow_html=True)
    st.divider()
    
    for item in display_items:
        with st.expander(f"📌 {item['title']} ({item.get('channel_name', 'Unknown')})"):
            st.caption(f"📅 요약 일시: {item.get('date', 'Unknown')} | ID: {item.get('video_id', 'Unknown')}")
            st.markdown(f"<div style='background: rgba(37, 43, 74, 0.3); padding: 1rem; border-radius: 8px; margin: 0.5rem 0;'>{item['content']}</div>", unsafe_allow_html=True)
            st.link_button("📺 영상 바로가기", f"https://www.youtube.com/watch?v={item.get('video_id', '')}")

def main():
    st.set_page_config(page_title="YouTube AI Assistant", page_icon="📹", layout="wide", initial_sidebar_state="expanded")
    apply_custom_css()
    
    if 'data' not in st.session_state:
        st.session_state.data = load_data()
    if 'video_lists' not in st.session_state:
        st.session_state.video_lists = load_video_cache()

    # Main title - text only, clean gray
    st.markdown("<div style='max-width: 70%; margin: 0 auto; padding: 1rem 0;'><h1 style='text-align: center; color: #C9D1D9; margin: 0; letter-spacing: 1px; font-weight: 500;'>유튜브 AI 요약 비서</h1></div>", unsafe_allow_html=True)
    
    render_sidebar()
    
    tab1, tab2, tab3 = st.tabs(["대시보드", "데일리 브리핑", "요약 기록 아카이브"])
    with tab1: render_dashboard_tab()
    with tab2: render_briefing_tab()
    with tab3: render_archive_tab()

if __name__ == "__main__":
    main()
