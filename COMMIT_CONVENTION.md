# Commit Message Convention

Short-Tube 프로젝트의 커밋 메시지 작성 가이드입니다.

## 커밋 메시지 형식

```
<타입>: <제목>

<본문>

<푸터>
```

---

## 1. 타입 (Type)

커밋의 종류를 나타냅니다.

| 타입 | 설명 | 예시 |
|------|------|------|
| **Feat** | 새로운 기능 추가 | `Feat: Add dark mode toggle` |
| **Fix** | 버그 수정 | `Fix: Prevent data loss in refresh endpoint` |
| **Refactor** | 코드 리팩토링 (기능 변경 없음) | `Refactor: Move TagSelector to collapsible Accordion` |
| **Improve** | 기존 기능 개선 | `Improve: Change RSS video duration display text` |
| **Docs** | 문서 추가/수정 | `Docs: Add commit convention guide` |
| **Test** | 테스트 코드 추가/수정 | `Test: Add unit tests for summary generation` |
| **Chore** | 빌드, 설정, 의존성 변경 | `Chore: Update dependencies` |
| **Style** | 코드 스타일 변경 (기능 변경 없음) | `Style: Fix indentation` |

제목은 짧게 20자 내외로 작성합니다.
본문은 기능 위주의 설명을 짧게 작성합니다.

타입을 제외한 모든 텍스트는 항상 한국어를 사용합니다.
제목 본문 푸터까지 총 5줄 이내로 요약하여 작성합니다.
