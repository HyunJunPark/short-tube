from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
import os
import requests
import xml.etree.ElementTree as ET
from googleapiclient.discovery import build
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

class YouTubeHandler:
    @staticmethod
    def get_transcript(video_id: str) -> str:
        """
        영상 ID로부터 자막을 추출합니다.
        지원되는 언어: 한국어(ko), 영어(en)
        """
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # 1순위: 한국어 수동 자막
            # 2순위: 한국어 자동 생성 자막
            # 3순위: 영어 자막 (번역 가능 여부 확인)
            try:
                transcript = transcript_list.find_transcript(['ko'])
            except:
                try:
                    transcript = transcript_list.find_generated_transcript(['ko'])
                except:
                    # 번역 시도 (영어를 한국어로)
                    try:
                        transcript = transcript_list.find_transcript(['en']).translate('ko')
                    except:
                        transcript = transcript_list.find_transcript(['en'])
            
            data = transcript.fetch()
            return " ".join([item['text'] for item in data])
        
        except (NoTranscriptFound, TranscriptsDisabled):
            return "자막을 찾을 수 없거나 자막 기능이 비활성화되었습니다."
        except Exception as e:
            return f"자막 추출 오류: {str(e)}"

    @staticmethod
    def _get_youtube_client():
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            return None
        return build("youtube", "v3", developerKey=api_key)

    @staticmethod
    def get_channel_info(url_or_handle: str) -> dict:
        """
        YouTube Data API를 최우선으로 사용하고, 없으면 yt-dlp로 폴백합니다.
        """
        youtube = YouTubeHandler._get_youtube_client()
        
        # 1. YouTube Data API 사용 (키가 있는 경우)
        if youtube:
            try:
                # 핸들(@) 처리
                query = url_or_handle
                if "youtube.com" in query:
                    if "@" in query:
                        query = "@" + query.split("@")[-1].split("/")[0]
                    else:
                        # URL인 경우 채널 ID 추출 시도 등 추가 로직 필요하지만 검색으로 처리
                        pass
                
                search_response = youtube.search().list(
                    q=query,
                    type="channel",
                    part="id,snippet",
                    maxResults=1
                ).execute()

                if search_response.get("items"):
                    item = search_response["items"][0]
                    channel_id = item["id"]["channelId"]
                    channel_name = item["snippet"]["title"]
                    
                    # 최신 영상 1개 가져오기
                    video_response = youtube.search().list(
                        channelId=channel_id,
                        order="date",
                        part="id",
                        maxResults=1
                    ).execute()
                    
                    latest_video_id = ""
                    if video_response.get("items"):
                        latest_video_id = video_response["items"][0]["id"]["videoId"]

                    return {
                        "channel_id": channel_id,
                        "channel_name": channel_name,
                        "latest_video_id": latest_video_id,
                        "success": True
                    }
            except Exception as e:
                print(f"YouTube API 오류 (yt-dlp로 전환): {e}")

        # 2. yt-dlp 사용 (API 키가 없거나 실패한 경우)
        if url_or_handle.startswith("@"):
            url = f"https://www.youtube.com/{url_or_handle}"
        elif "youtube.com" not in url_or_handle:
            url = f"https://www.youtube.com/@{url_or_handle}"
        else:
            url = url_or_handle

        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    "channel_id": info.get('channel_id') or info.get('id'),
                    "channel_name": info.get('channel') or info.get('uploader') or url_or_handle,
                    "latest_video_id": info['entries'][0].get('id', "") if 'entries' in info and len(info['entries']) > 0 else "",
                    "success": True
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_recent_videos(channel_id: str, days: int = 7) -> list:
        """
        최근 n일간의 영상 목록을 가져옵니다.
        """
        youtube = YouTubeHandler._get_youtube_client()
        videos = []
        
        if youtube:
            try:
                # 일주일 전 날짜 계산 (RFC 3339 format)
                published_after = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
                
                request = youtube.search().list(
                    channelId=channel_id,
                    part="id,snippet",
                    order="date",
                    publishedAfter=published_after,
                    maxResults=10,
                    type="video"
                )
                response = request.execute()
                
                for item in response.get("items", []):
                    videos.append({
                        "id": item["id"]["videoId"],
                        "title": item["snippet"]["title"],
                        "published_at": item["snippet"]["publishedAt"],
                        "has_caption": False # Default
                    })
                
                # 자막 유무 및 영상 길이 확인 (Shorts 필터링 및 아이콘 표시 준비)
                if videos:
                    video_ids = [v["id"] for v in videos]
                    vid_response = youtube.videos().list(
                        id=",".join(video_ids),
                        part="contentDetails"
                    ).execute()
                    
                    details_map = {item["id"]: item["contentDetails"] for item in vid_response.get("items", [])}
                    
                    filtered_videos = []
                    for v in videos:
                        details = details_map.get(v["id"], {})
                        duration = details.get("duration", "") # ISO 8601 형식 (예: PT1M30S)
                        
                        # Shorts 필터링 (간이: PT1M 미만이고 S만 있거나, 60초 미만인 경우)
                        # 유튜브 쇼츠는 보통 60초 이하입니다.
                        is_short = False
                        if "M" not in duration and "H" not in duration:
                            is_short = True # 1분 미만
                        elif duration == "PT1M":
                            is_short = True # 정확히 1분
                            
                        if not is_short:
                            v["has_caption"] = details.get("caption") == "true"
                            v["duration"] = YouTubeHandler._parse_duration(duration)
                            filtered_videos.append(v)
                    
                    return filtered_videos
                
                return []
            except Exception as e:
                error_msg = str(e)
                # 할당량 초과(Quota Exceeded) 등 API 에러 시 RSS로 대체 시도
                if "quota" in error_msg.lower() or "403" in error_msg:
                    # 사용자에게 혼란을 주는 긴 에러 로그 대신 깔끔한 안내 출력
                    print(f"ℹ️ YouTube API 할당량이 부족하여 RSS 피드로 자동 전환합니다. (채널: {channel_id})")
                    return YouTubeHandler._get_videos_via_rss(channel_id, days)
                
                print(f"❌ YouTube API get_recent_videos 오류: {error_msg}")
                return []
        else:
            # 설정된 youtube client가 없는 경우에도 RSS 시도
            return YouTubeHandler._get_videos_via_rss(channel_id, days)

    @staticmethod
    def _get_videos_via_rss(channel_id: str, days: int = 7) -> list:
        """
        RSS 피드를 통해 최근 영상 목록을 가져옵니다. (API 할당량을 사용하지 않음)
        """
        videos = []
        try:
            url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                return []
            
            root = ET.fromstring(response.content)
            # 네임스페이스 정의
            ns = {
                'atom': 'http://www.w3.org/2005/Atom',
                'yt': 'http://www.youtube.com/xml/schemas/2015',
                'media': 'http://search.yahoo.com/mrss/'
            }
            
            threshold_date = datetime.utcnow() - timedelta(days=days)
            
            for entry in root.findall('atom:entry', ns):
                video_id_elem = entry.find('yt:videoId', ns)
                title_elem = entry.find('atom:title', ns)
                published_elem = entry.find('atom:published', ns)
                
                if video_id_elem is None or title_elem is None or published_elem is None:
                    continue
                    
                video_id = video_id_elem.text
                title = title_elem.text
                published_str = published_elem.text
                
                # RSS 날짜 형식: 2023-12-22T14:30:00+00:00
                try:
                    published_at = datetime.fromisoformat(published_str.replace('Z', '+00:00'))
                    # 시간대 정보 제거 후 비교
                    if published_at.replace(tzinfo=None) > threshold_date:
                        videos.append({
                            "id": video_id,
                            "title": title,
                            "published_at": published_str,
                            "has_caption": True, # RSS로는 확인 불가하므로 우선 True (Summary 시도 시 체크)
                            "duration": "00:00"   # RSS로는 확인 불가
                        })
                except Exception:
                    continue
            
            return videos
        except Exception as e:
            print(f"RSS 피드 가져오기 실패: {e}")
            return []

    @staticmethod
    def _parse_duration(duration_str: str) -> str:
        """
        ISO 8601 기간 형식을 HH:MM:SS 또는 MM:SS 형식으로 변환합니다.
        예: PT1M30S -> 01:30, PT1H2M10S -> 01:02:10
        """
        import re
        if not duration_str:
            return "00:00"
        
        hours = re.search(r'(\d+)H', duration_str)
        minutes = re.search(r'(\d+)M', duration_str)
        seconds = re.search(r'(\d+)S', duration_str)
        
        h = int(hours.group(1)) if hours else 0
        m = int(minutes.group(1)) if minutes else 0
        s = int(seconds.group(1)) if seconds else 0
        
        if h > 0:
            return f"{h:02d}:{m:02d}:{s:02d}"
        return f"{m:02d}:{s:02d}"

    @staticmethod
    def download_audio(video_id: str) -> str:
        """
        영상의 오디오를 다운로드하여 mp3로 변환합니다. (Gemini AI 호환성 확보)
        """
        output_dir = "temp_audio"
        os.makedirs(output_dir, exist_ok=True)
        # 확장자를 제외한 기본 파일 이름 설정
        base_path = os.path.join(output_dir, f"{video_id}")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': base_path + ".%(ext)s",
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://www.google.com/',
            'http_headers': {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            # FFmpeg을 사용하여 mp3로 변환
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
        
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                # 변환된 파일명은 .mp3가 됩니다.
                final_filename = base_path + ".mp3"
                if os.path.exists(final_filename):
                    return final_filename
                return ydl.prepare_filename(info)
        except Exception as e:
            print(f"오디오 다운로드 에러: {e}")
            return None

# 테스트용
if __name__ == "__main__":
    # 조코딩 채널 영상 예시: https://www.youtube.com/watch?v=0_fV8jS_iWk
    test_vid = "0_fV8jS_iWk"
    handler = YouTubeHandler()
    print("--- 자막 추출 테스트 ---")
    print(handler.get_transcript(test_vid)[:500] + "...")
