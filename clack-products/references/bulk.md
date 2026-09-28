# 일괄 등록과 실패 재개

`items.json`은 상품 객체의 배열이다. 각 객체는 [fields.md](fields.md)의 필수 필드를 모두 가진다. 이미지 상대 경로는 배열 파일 기준이다.

```json
[
  {
    "type": "sell",
    "images": ["./images/item-1.jpg"],
    "name": "아크릴 스탠드 1",
    "category": "아크릴 > 아크릴 스탠드",
    "price": 12000,
    "description": "첫 번째 상품의 확인된 설명"
  },
  {
    "type": "sell",
    "images": ["./images/item-2.jpg"],
    "name": "아크릴 스탠드 2",
    "category": "아크릴 > 아크릴 스탠드",
    "price": 15000,
    "description": "두 번째 상품의 확인된 설명"
  }
]
```

1. 중복 상품·필수값·개수·이미지 수를 검토한다. `clack doctor --json`의 현재 한도와 예상 작업량을 사용자에게 알려준다. 한도 값은 현재 잔여량이 아니다.
2. `clack product create -f items.json --dry-run --json`으로 검증한다. 아직 상품·이미지를 저장하지 않는다.
3. 승인된 등록 범위에서 `clack product create -f items.json --report report.json --json`으로 실행한다. 장시간 실행에서도 보고서를 보존한다.
4. `results`의 `index`, `ok`, `id`, `code`, `retryable`와 `summary`를 확인한다. 일부 실패는 종료 코드 6, `ok:false`, `code:BATCH_FAILED`, `data` 안의 보고서로 나온다.
5. 확정 실패의 원인을 해결한 뒤 `clack product create --resume report.json --report resumed-report.json --json`을 사용한다. `--resume`에 `-f`·상품 옵션을 함께 넣지 않는다. 실제 실행 보고서만 재개할 수 있고 dry-run 보고서는 재개할 수 없다.

`ok:true` 및 `retryable:false` 항목은 재개 시 건너뛴다. `OUTCOME_UNKNOWN`은 요청이 성공했을 가능성이 있어 자동 재등록에서 제외된다. 앱이나 상품 목록에서 반영 여부를 확인하기 전 이 표시를 제거하거나 전체 입력을 다시 실행하지 않는다. 조회 지연만으로 실패를 단정하지 않는다.

배치 생성의 확정 429는 CLI가 서버 `retry_after`에 따라 최대 3회 재시도한다. 네트워크 오류·응답 유실·5xx는 자동 재생성하지 않는다. 에이전트가 CLI 전체 실행을 무조건 재시도하는 루프를 추가하지 않는다.

보고서에는 입력과 로컬 경로·상품 설명이 포함된다. 비공개 작업 파일로 보관하고 공개 로그·커밋·답변에 원문 전체를 붙이지 않는다. 사용자에게는 성공 ID·실패 원인·미확정 건수와 필요한 다음 행동을 전달한다.
