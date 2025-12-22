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
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        
        try:
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
