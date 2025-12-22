import google.generativeai as genai
import os
from ai_interface import SummaryAI
from dotenv import load_dotenv

load_dotenv()

class GeminiSummaryAI(SummaryAI):
    def __init__(self, api_key: str = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API Key is required. Set GOOGLE_API_KEY in .env or pass it to constructor.")
        
        genai.configure(api_key=self.api_key)
        self.model_name = model_name
        self.model = genai.GenerativeModel(self.model_name)
        # 쿼터 에러 방지를 위한 백업 모델 리스트
        self.fallback_models = ["gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-1.5-flash"]

    def _get_model_response(self, content):
        """쿼터 부족 시 다른 모델로 재시도합니다."""
        try:
            # generation_config는 summarize 메서드에서 직접 전달하지 않고,
            # _get_model_response 내부에서 필요하다면 추가할 수 있습니다.
            # 현재는 prompt만 전달하도록 변경되었으므로, generate_content 호출 시
            # generation_config를 직접 명시하지 않습니다.
            return self.model.generate_content(content)
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                print(f"메인 모델 ({self.model_name}) 쿼터 초과. 백업 모델 시도 중...")
                for fallback in self.fallback_models:
                    try:
                        print(f"백업 모델 시도: {fallback}")
                        temp_model = genai.GenerativeModel(fallback)
                        return temp_model.generate_content(content)
                    except Exception as fe:
                        print(f"백업 모델 {fallback} 실패: {fe}")
                        continue
            raise e

    def summarize(self, text: str, keywords: list) -> str:
        if not text or len(text.strip()) < 10:
            return "요약할 수 있는 충분한 내용이 없습니다. (자막이 없거나 너무 짧습니다.)"
        
        keyword_str = ", ".join(keywords) if keywords else "전체 내용"
        prompt = f"""
        당신은 유튜브 영상 요약 비서입니다. 
        다음 제공된 텍스트(자막)를 바탕으로, 특히 [{keyword_str}] 키워드와 관련된 내용을 중점적으로 요약해주세요.
        
        [요약 규칙]
        1. 반드시 한국어로 작성하세요.
        2. 주제별로 문단을 놔눠서 작성하세요.
        3. 각 줄은 불렛 포인트(-)로 시작하세요.
        4. 내용이 길면 핵심적인 사건이나 지식 위주로 정리하세요.

        [텍스트]
        {text[:10000]} # 텍스트가 너무 길 경우 토큰 제한을 위해 일부 절삭
        """
        
        try:
            response = self._get_model_response(prompt)
            return response.text.strip()
        except Exception as e:
            return f"AI 요약 중 오류 발생: {str(e)}\n(여러 모델의 쿼터가 모두 소진되었을 수 있습니다.)"

    def summarize_audio(self, file_path: str, keywords: list) -> str:
        if not os.path.exists(file_path):
            return "오디오 파일을 찾을 수 없습니다."

        try:
            # 1. 파일 업로드
            audio_file = genai.upload_file(path=file_path)
            
            # 2. 업로드 완료 대기 (ACTIVE 상태가 될 때까지)
            import time
            for _ in range(30):  # 최대 30초 대기
                audio_file = genai.get_file(audio_file.name)
                if audio_file.state.name == "ACTIVE":   
                    break
                elif audio_file.state.name == "FAILED":
                    raise Exception("오디오 파일 처리가 실패했습니다.")
                time.sleep(1)
            else:
                raise Exception("오디오 파일 처리 시간이 초과되었습니다 (ACTIVE 상태 미도달).")
            
            # 3. 분석 요청
            keyword_str = ", ".join(keywords) if keywords else "전체 내용"
            prompt = f"제공된 오디오의 내용을 분석해서 [{keyword_str}] 키워드 중심으로 3줄 요약해줘. 한국어로 작성해."
            
            response = self._get_model_response([audio_file, prompt])
            
            # 4. 파일 삭제 (관리용)
            audio_file.delete()
            
            return response.text.strip()
        except Exception as e:
            return f"오디오 AI 분석 중 에러: {str(e)}"

    def generate_briefing(self, summaries: list, keywords: list) -> str:
        """여러 요약본을 바탕으로 종합 브리핑을 생성합니다."""
        if not summaries:
            return "오늘 생성된 요약이 없습니다. 영상 목록에서 요약을 먼저 진행해주세요."
        
        # 요약본들을 텍스트로 합침
        context = ""
        for i, s in enumerate(summaries):
            title = s.get('title', '제목 없음')
            content = s.get('content', '')
            channel = s.get('channel_name', '알 수 없는 채널')
            context += f"[{i+1}] 영상 제목: {title} (채널: {channel})\n요약 내용: {content}\n\n"
        
        keyword_str = ", ".join(keywords) if keywords else "IT/기술 트렌드"
        prompt = f"""
        당신은 IT 트렌드 분석가이자 요약 비서입니다. 
        제공된 여러 개의 유튜브 영상 요약본들을 바탕으로, 오늘의 핵심 내용을 갈무리하는 '데일리 브리핑'을 작성해주세요.
        관심 키워드: [{keyword_str}]
        
        [브리핑 규칙]
        1. 반드시 한국어로 작성하세요.
        2. '오늘의 주요 트렌드'를 한 문장으로 먼저 제시하세요.
        3. 그 후 주요 이슈별로 묶어서 상세 내용을 기술하세요.
        4. 각 이슈의 끝에는 관련 영상 번호(예: [1], [2])를 기재하세요.
        5. 마지막에 이 정보들이 사용자에게 주는 인사이트나 시사점을 1문장으로 덧붙이세요.
        6. 말투는 신뢰감 있고 전문적인 어휘를 사용하세요.

        [요약 데이터]
        {context}
        """
        
        try:
            response = self._get_model_response(prompt)
            return response.text.strip()
        except Exception as e:
            return f"데일리 브리핑 생성 중 오류 발생: {str(e)}"

# 테스트용 코드 (직접 실행 시)
if __name__ == "__main__":
    # .env 파일이 있고 API 키가 설정되어 있어야 함
    try:
        ai = GeminiSummaryAI()
        test_text = "이 영상은 인공지능 신기술인 제미나이에 대해 다룹니다. 제미나이는 구글에서 만들었으며 매우 강력합니다."
        result = ai.summarize(test_text, ["AI", "구글"])
        print("--- 요약 결과 ---")
        print(result)
    except Exception as e:
        print(f"테스트 실패: {e}")
