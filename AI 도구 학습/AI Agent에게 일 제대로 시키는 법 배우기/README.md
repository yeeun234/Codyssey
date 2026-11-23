# AI Agent에게 일 제대로 시키는 법 배우기

고객 상담 채팅 로그에서 확정된 예약 정보를 추출하는 반복 과업을 대상으로, 3개 LLM 모델 비교부터 페르소나·시스템 프롬프트 설계, 10턴 이상 실전 대화 및 환각 검증, 프롬프트 개선 이력까지 정리한 저장소입니다.

## 문서 구성
1. [`docs/model-comparison.md`](docs/model-comparison.md) — 동일 조건 LLM 3종(Claude Sonnet 5.5, GPT-6, Gemini) 비교표 및 선정 보고서
2. [`docs/system-design.md`](docs/system-design.md) — 과업 정의, 페르소나, Few-shot 프롬프트, 환각 검증(Pass/Fail) 및 v1→v2 개선 기록
3. [`docs/run-log.md`](docs/run-log.md) — 선정 모델 기반 10턴 이상 무편집 대화 원문 및 작업 단위 기록
4. [`docs/unresolved.md`](docs/unresolved.md) — 프롬프트 개선으로도 해결이 어려웠던 한계 과업 및 원인 분석

## 모델 3종 동일 조건 비교 원본 링크 (모두 무료 요금제 실행)
- **Claude (`Claude Sonnet 5.5`)** — 2026-11-21 19:20 KST: [공유 링크](https://claude.ai/share/97f896ad-27e4-40c4-8c39-70362e900e82)
- **ChatGPT (`GPT-6`)** — 2026-11-21 19:22 KST: [공유 링크](https://chatgpt.com/share/6b0171de-5ad0-83e8-91ee-8a1a8673dad1)
- **Gemini (`웹 자동 라우팅 모드`)** — 2026-11-21 19:24 KST: [공유 링크](https://share.gemini.google/H6FWLpXnjai7)