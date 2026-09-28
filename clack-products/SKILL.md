---
name: clack-products
description: 클랙 상품 조회·등록·일괄 등록·가격 수정·판매 상태·끌어올리기·숨김·삭제를 수행한다. CLACK products, product listing, bulk upload 작업에 사용한다.
---

# 클랙 상품 관리

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. 조회는 `product:read`, 변경은 `product:write`가 필요하다. 설치가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. 패키지·기능이 공개되지 않은 상태는 우회하지 않는다.

```sh
clack --version
clack doctor --json
clack login --scopes product:read,product:write --no-browser
```

로그인은 필요한 경우만 실행한다. 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 수동 토큰은 `clack login --token`의 숨김 입력이나 안전하게 주입한 `CLACK_TOKEN`으로 전달한다. 토큰을 대화·명령 인자·로그에 남기지 않는다.

## 조회와 입력 준비

```sh
clack product list --status selling --all --json
clack product get 123 --json
clack product types --json
clack product categories --json
clack product shipping-methods --json
```

상태 필터는 `selling|trading|sold|hidden`이다. `hidden`은 소유자가 숨긴 상품이다. 목록 페이지는 최대 50개이며 `--cursor`로 이어 읽을 수 있다. 변경할 ID·현재 상태·가격을 먼저 확정한다.

등록·수정 필드는 [references/fields.md](references/fields.md)를 읽는다. 저장용 카테고리는 명령 결과의 값을 그대로 사용한다. 상품명·유형·금액·이미지·설명을 사용자 자료로 준비하고, 사용자가 제공하지 않은 상태·정품 여부·배송 조건을 지어내지 않는다.

## 등록·변경

```sh
clack product create -f product.json --dry-run --json
clack product create -f product.json --json
clack product update 123 --price 12000 --dry-run --json
clack product update 123 --price 12000 --json
clack product status 123 trading --json
clack product hide 123 --json
clack product unhide 123 --json
clack product bump 123 124 --json
```

`create`는 바로 게시한다. `--dry-run`은 입력·로컬 파일을 검증하지만 업로드·상품 저장을 하지 않는다. 생성 성공 후 ID를 보관한다. 이미지는 로컬 파일이면 자동 업로드하며 파일당 10MB 이하, 상품당 1~12장이다. JSON의 상대 경로는 JSON 파일 기준이다.

거래완료·삭제는 ID·상품명·효과를 제시하고 사용자의 구체적 확인을 받은 뒤 아래 명령을 사용한다. 같은 대상·행위를 이미 승인했다면 다시 묻지 않는다. 삭제는 주문 상태 등에 따라 서버가 거부할 수 있다.

```sh
clack product status 123 sold --yes --json
clack product delete 123 --yes --json
```

`selling`은 판매중으로 되돌린다. 판매 상태 변경은 결제나 주문 처리가 아니다. 전체 끌어올리기를 사용자가 요청한 경우 `clack product bump --all --json`을 사용한다. 끌어올리기 시간 제한을 우회하지 않는다. 복수 ID 끌어올리기는 순차 처리이므로 중간 실패 시 앞선 성공을 확인한다.

일괄 등록은 [references/bulk.md](references/bulk.md)의 JSON 배열·보고서·재개 절차를 따른다. 실행 전 대상 개수·이미지 수와 현재 `doctor` 한도를 알린다. 기본 한도는 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 상품 50개·이미지 200개이며 서버 현재 값이 우선한다.

## 결과·안전·오류

- `--json`의 `ok`, `data`, `pagination`, `time_contract`를 확인한다. 시각 원문과 `utc-v1|legacy-kst` 계약을 함께 유지하고 임의 UTC 변환을 하지 않는다. 사람용 UTC 표시는 `--time utc`다.
- 타인 상품 수정·스팸성 반복 등록·한도 회피를 하지 않는다. 토큰·개인정보·서명 URL·전체 입력 보고서를 공개하거나 커밋하지 않는다.
- 네트워크 실패·응답 유실·5xx 뒤에는 생성·변경을 자동 재시도하지 않는다. 조회나 앱에서 반영 여부를 확인한다. `OUTCOME_UNKNOWN`은 등록 실패 확정이 아니다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | 필요한 상품 scope만 승인 |
| `IDENTITY_VERIFICATION_REQUIRED` | 앱에서 본인인증 완료 |
| `USER_BANNED`, 423 | 앱에서 계정 제한 확인 |
| 404 / `NOT_FOUND` | ID·소유권 확인 |
| `VALIDATION_ERROR`, 409 | 필드·현재 상태·중복 확인 |
| 429 | `retry_after`초 이상 대기. 토큰 교체로 회피 금지 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED` | 해당 기능 중단, 복구 후 재개 |
| `BATCH_FAILED`, `OUTCOME_UNKNOWN` | 보고서별 성공·실패·미확정 분리, 미확정 자동 재등록 금지 |
