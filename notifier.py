import requests
import os
from dotenv import load_dotenv

load_dotenv()

class TelegramNotifier:
    def __init__(self, token: str = None, chat_id: str = None):
        self.token = token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")

    def send_message(self, text: str):
        if not self.token or not self.chat_id:
            print("텔레그램 설정(토큰 또는 챗 ID)이 되어있지 않습니다.")
            return False
            
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        
        # HTML 모드가 마크다운보다 특수문자( 특히 AI 요약 내의 _ 등)에 덜 민감하므로 변경
        # 기본적인 HTML 태그만 허용하며, 나머지는 안전하게 처리
        payload = {
            "chat_id": self.chat_id,
            "text": text.replace("*", "<b>").replace("<b> ", "<b>").replace(" <b>", "<b>").replace("</b>", " </b>").replace("<b>", "<b>"), # 단순 변환 로직 (필요 시 보강)
            "parse_mode": "HTML"
        }
        
        # 텍스트 내의 별표(*)를 <b>태그로 변환하여 가독성 유지
        formatted_text = text.replace("**", "<b>").replace("*", "•") # **은 볼트로, *은 불렛으로
        # HTML 파싱 에러 방지를 위해 최소한의 이스케이프 (태그 제외)
        # 단, 여기서는 간단하게 Markdown 파싱으로 유지하되 에러 시 일반 텍스트로 재시도하도록 수정
        
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        
        try:
            response = requests.post(url, json=payload)
            if response.status_code != 200:
                # 마크다운 에러 가능성이 높으므로 일반 텍스트 모드로 재시도
                payload["parse_mode"] = ""
                response = requests.post(url, json=payload)
            
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"텔레그램 발송 에러: {e}")
            return False

# 테스트용
if __name__ == "__main__":
    notifier = TelegramNotifier()
    notifier.send_message("🚀 유튜브 요약 비서가 활성화되었습니다!")
