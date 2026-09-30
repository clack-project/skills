# 이미지 화보·캐릭터 자산 제작(authoring) 액션

`clack authoring --input request.json`(로컬 MCP는 `platform_authoring` 도구)은 공개된 클랙 플랫폼 스킬(제작 템플릿)을 세션으로 실행한다. 모든 요청은 `action` 하나와 그에 필요한 필드만 담은 JSON 객체다. `--dry-run`은 입력 형식만 검사하고 세션·과금 요청을 보내지 않는다.

## 세션 시작과 조회

```json
{"action":"create","skill_slug":"clack-character-image","skill_version":"1.0.0"}
```

`tier`(`economy`|`performance`)를 선택으로 줄 수 있다. 이후 모든 요청에 응답의 `session_id`를 사용한다.

```json
{"action":"get","session_id":"UUID"}
{"action":"assets","session_id":"UUID"}
```

`get`은 세션 현재 상태(폼 값·revision·자산 목록 요약)를 반환한다. `assets`는 세션에 이미 업로드·생성된 자산 목록을 조회한다.

## 폼 채우기와 가져오기

```json
{"action":"save","session_id":"UUID","revision":0,"values":{"scene":"공원 벤치"}}
{"action":"import","session_id":"UUID","revision":0,"field":"portrait_source","content_id":"UUID"}
```

`save`는 폼 값을 갱신한다. `revision`은 충돌 감지용 현재 개정 번호이며, 오래된 값으로 저장하면 서버가 거부하므로 `get`으로 최신 값을 다시 읽은 뒤 재시도한다. `import`는 본인이 소유한 콘텐츠에서 매니페스트가 명시적으로 내보내도록 선언한 값만 지정한 `field`로 복사한다. 타인 콘텐츠의 ID를 넣지 않는다.

## 로컬 이미지 업로드

```json
{"action":"upload","session_id":"UUID","field":"plates","file":"./portrait.png","item_index":0}
```

로컬 파일은 4 MiB 이하의 일반 파일만 허용된다. `item_index`(0~23)는 한 필드에 여러 장을 받는 슬롯에서만 지정한다. 응답의 자산 ID를 해당 필드(`plates[0].asset_id` 등)에 저장한다.

## 이미지 생성

```json
{"action":"quote","session_id":"UUID"}
{"action":"image","session_id":"UUID","form_revision":0,"asset_slot":"portrait","approved_price_cash":1200,"idempotency_key":"user-req-20260928-01","item_index":0}
{"action":"image-batch","session_id":"UUID","form_revision":0,"asset_slot":"plates","approved_price_cash":4800,"idempotency_key":"user-req-20260928-02","item_indexes":[0,1,2]}
```

`quote`로 예상 가격을 먼저 확인하고 사용자 승인을 받은 뒤에만 생성을 요청한다. `approved_price_cash`는 사용자가 확인한 가격이며 임의로 지어내지 않는다. `idempotency_key`는 8~128자의 영숫자·밑줄·붙임표이며, 같은 요청을 재시도할 때(네트워크 실패·응답 유실 등) 반드시 같은 키를 다시 사용해 중복 생성과 중복 과금을 막는다. 한 번에 최대 8장(`image-batch`), 콘텐츠당 최대 24장이며 스킬의 `max_calls`와 플랫폼 설정 중 더 작은 한도가 적용된다. 참조 이미지 기반 생성은 아직 비활성이며, 현재는 외모·화풍·팔레트를 텍스트로 설명해 동일성을 유지한다.

```json
{"action":"tool","session_id":"UUID","call_id":"UUID"}
```

생성 작업(이미지 등)의 진행 상태나 결과를 다시 조회할 때 쓴다.

## AI 채우기

```json
{"action":"fill-quote","session_id":"UUID"}
{"action":"fill","session_id":"UUID","revision":0,"fields":["name","summary"],"instruction":"밝고 다정한 성격으로"}
{"action":"fill-status","session_id":"UUID","job_id":"UUID"}
```

`fill`은 지정한 필드(생략하면 폼이 허용하는 전체)를 AI로 채우도록 요청한다. `instruction`은 최대 4000자이며 사용자가 원하는 방향을 그대로 전달하고 지어내지 않는다. 비동기 작업이면 `fill-status`로 완료 여부를 확인한다.

## 검증과 패키징

```json
{"action":"validate","session_id":"UUID"}
{"action":"package","session_id":"UUID","revision":0}
```

`validate`는 현재 폼 값이 스킬의 제작 폼 스키마와 맞는지 서버에서 확인한다. `package`는 완성한 세션을 실제 콘텐츠(또는 스킬 산출물)로 패키징하는 마지막 단계이므로, 사용자가 결과를 확인하고 승인한 뒤에만 호출한다.


## 세션 완료·포기(CLI 0.3.1 이상)

```sh
clack authoring complete <세션-UUID> --json
clack authoring abandon <세션-UUID> --yes --json
```

JSON 입력은 `{"action":"complete","session_id":"UUID"}` 또는 `{"action":"abandon","session_id":"UUID"}`이다. CLI 포기는 대상 세션과 편집 종료 효과를 확인한 뒤 실행하며, 이미 사용자가 승인한 같은 대상·행위에는 `--yes`를 쓴다. 로컬 MCP는 같은 action을 받고 포기는 `confirm:true`에서만 실행한다.

PAT로는 폼(template) 세션만 만들고 끝낼 수 있다. 에디터·지침형 세션 생성·완료·포기는 `SESSION_REQUIRED`(403)이므로 크리에이터 센터로 안내한다. 타인·없는 세션은 `AUTHORING_NOT_FOUND`(404)다.

`complete`는 현재 revision으로 `package`한 뒤에만 된다(`AUTHORING_NOT_PACKAGED` 409). 성공한 응답의 `data.status`가 `completed`인지 확인한다. 필요 없는 세션만 `abandon`해 `abandoned`를 확인한다. 포기는 세션 편집을 종료하고 기존 콘텐츠·버전을 삭제하거나 게시를 취소하지 않는다. 끝난 세션의 재호출은 `AUTHORING_SESSION_LOCKED`(409)이며, 응답 유실 시 `get`으로 상태부터 확인하고 변경 요청을 자동 재시도하지 않는다. 기존 사용자 세션을 상한 확보 목적으로 포기하지 않는다.
