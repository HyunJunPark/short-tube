from abc import ABC, abstractmethod

class SummaryAI(ABC):
    @abstractmethod
    def summarize(self, text: str, keywords: list) -> str:
        pass

    @abstractmethod
    def summarize_audio(self, file_path: str, keywords: list) -> str:
        """오디오 파일을 직접 분석하여 요약합니다."""
        pass
