---
name: clack-platform-data
description: 클랙 콘텐츠 서버 키로 사용량·이용자 데이터를 조회·저장하고, 개인 액세스 토큰으로 내 콘텐츠의 서버 키·공유 문서를 관리하며, 로컬 플랫폼 MCP를 설정한다. CLACK platform server key, content data, shared documents, local MCP 작업에 사용한다.
---

# 클랙 플랫폼 서버 키·데이터·공유 문서

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. 이 스킬은 **서로 다른 두 인증 평면**을 다룬다.

| 평면 | 자격 | 용도 | 발급 |
|---|---|---|---|
| 서버 키 | `CLACK_SERVER_KEY`(`csk_...`) | 내 콘텐츠(게임·앱)의 사용량 조회, 이용자 데이터 문서 조회·쓰기(`data:read`/`data:write`) | **크리에이터 센터 로그인 세션 전용**, CLI는 발급·회전하지 않는다 |
| 개인 액세스 토큰(PAT) | `CLACK_TOKEN`(`pat_...`, `platform:read`/`platform:write`) | 내 콘텐츠의 서버 키 목록 조회·폐기, 이용자가 쓴 공유 문서 조회·숨김·삭제 | `clack login`(앱 승인) |

둘은 서로 다른 인증 평면이며 섞어 쓸 수 없다. PAT가 필요하면 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다.

```sh
clack login --env dev --scopes platform --no-browser
```

## 서버 키로 사용량·데이터 조회

```sh
export CLACK_SERVER_KEY=csk_...   # 명령 인자·CLI 자격 파일에 저장하지 않는다
clack platform usage --from 2026-09-01T00:00:00.000Z --to 2026-09-02T00:00:00.000Z --env dev --json
clack platform data get scores slot --env dev --json
clack platform data get scores slot --viewer-id v_xxxxxxxxxxxxxxxxxxxxxxxxxx --env dev --json
clack platform data list scores --owner me --limit 20 --env dev --json
clack platform data leaderboard scores --limit 10 --env dev --json
```

`usage`는 최대 90일 구간만 조회한다. `--viewer-id`(`v_` + 26자)는 시청자(이용자) 범위 문서에 쓴다. 목록은 `--owner me|any`, `--order updated_desc|sort_desc|sort_asc`, `--cursor`, `--limit 1~50`을, 순위는 `--limit 1~100`을 지원한다. 서버 키는 발급받은 환경(`--env dev`/`--env prod`)에서만 쓴다.

## 단일 문서 쓰기·수정·삭제

```sh
clack platform data put scores slot --file ./score.json --if-absent --env dev --json
clack platform data put scores slot --file ./score.json --if-rev 3 --env dev --json
clack platform data patch scores slot --file ./score-patch.json --if-rev 3 --env dev --json
clack platform data delete scores slot --env dev --json
```

`--file`은 64 KiB 이하 JSON 객체 파일이다. `put`은 `--if-absent`(없을 때만 생성) 또는 `--if-rev <현재 개정 번호>` 중 하나가 필요하고, `patch`는 `--if-rev`가 필수다. 삭제에는 개정 조건이 없으므로 실행 전 대상을 다시 확인한다. `--dry-run`은 파일·조건만 검사하고 메서드·경로·본문 크기·SHA-256을 보여주며 서버를 바꾸지 않는다. 비대화형 실제 변경에는 `--yes`가 필요하다.

## PAT 전용: 내 콘텐츠 서버 키·공유 문서

```sh
clack content server-keys list --env dev <콘텐츠-UUID> --json
clack content server-keys revoke --env dev <콘텐츠-UUID> <키-ID> --yes --json
clack content shared collections --env dev <콘텐츠-UUID> --json
clack content shared list --env dev <콘텐츠-UUID> ranking --json
clack content shared get --env dev <콘텐츠-UUID> ranking entry-1 --json
clack content shared hide --env dev <콘텐츠-UUID> ranking entry-1 --yes --json
clack content shared delete --env dev <콘텐츠-UUID> ranking entry-1 --yes --json
```

`platform:read`는 조회, `platform:write`는 폐기·숨김·삭제다. **서버 키 발급·회전은 PAT보다 오래 사는 비밀값을 새로 만들기 때문에 크리에이터 센터 로그인 세션 전용이다.** `content server-keys issue`·`rotate`는 안내만 출력하고 요청을 보내지 않는다. 서버 키 원문은 센터의 발급·회전 응답에만 한 번 표시되며, CLI·MCP 어디에도 다시 표시되지 않는다.

`shared`는 이용자가 쓴 콘텐츠 데이터(순위표 항목 등)를 다룬다. `hide`는 목록·순위에서 제외하되 문서 자체는 남기고, `delete`는 영구 삭제다. 폐기·숨김·삭제 전에는 대상과 효과를 보여주고 사용자 확인을 받는다.

## 로컬 stdio MCP

```sh
clack mcp config --platform --env dev --json
clack mcp config --platform --codex --env dev
```

`clack mcp config --platform`은 로그인·네트워크 요청 없이 `mcp serve-platform`을 실행하는 로컬 설정을 출력한다. 에이전트 실행 환경에 서버 키 도구용 `CLACK_SERVER_KEY`, PAT 도구용 `CLACK_TOKEN`을 필요한 만큼만 설정한다. 설정 출력에는 키·토큰 원문이 들어가지 않는다.

이 로컬 서버는 두 인증 평면의 도구를 한 프로세스에서 함께 제공한다.

- 서버 키 도구(이 스킬의 범위): `platform_usage_get`, `platform_server_data_get/list/leaderboard/put/patch/delete`.
- PAT 도구 중 이 스킬의 범위: `platform_shared_collections_list`, `platform_shared_documents_list`, `platform_shared_document_get/hide/delete`.
- PAT 도구 중 다른 스킬의 범위(입력·안전 규칙은 해당 스킬을 따른다): `platform_skill_list/get/push/status/submit/release`는 `clack-skill-package`, `platform_content_publish`·`platform_authoring`은 `clack-creator-content`가 다룬다.

파괴적 도구(단일 문서 쓰기·수정·삭제, 공유 문서 숨김·삭제, 다른 스킬 범위의 심사 제출·공개)는 먼저 미리보기와 `confirmation_required`를 반환하고, 입력에 `confirm: true`를 명시해야 실제 요청을 보낸다. `mcp serve-platform`의 표준 출력은 JSON-RPC 메시지 전용이므로 다른 로그를 섞지 않는다.

## 한도·결과·안전

- `--json`의 `ok`, `data`, `time_contract`를 확인한다.
- `CLACK_SERVER_KEY`·`CLACK_TOKEN`을 로그·공개 파일·커밋·답변에 복사하지 않는다. 서버 키는 발급받은 콘텐츠·환경에서만 쓰고 다른 콘텐츠·다른 사람의 키를 대신 쓰지 않는다.
- 이용자 데이터 문서를 임의로 대량 조회·수정하지 않는다. 삭제·숨김은 되돌리기 어려우므로 대상을 다시 확인한 뒤 실행한다.
- 네트워크 실패·응답 유실·5xx 뒤에는 쓰기·삭제를 자동 재시도하지 않는다. 조회로 반영 여부를 먼저 확인한다.

| 오류 | 대응 |
|---|---|
| 401 / `SERVER_KEY_REQUIRED` | `CLACK_SERVER_KEY` 환경변수 설정 확인 |
| 401 / `SERVER_KEY_INVALID` | 센터에서 서버 키 상태 확인, 필요하면 새로 발급·회전(CLI 불가) |
| 401 / `PAT_REQUIRED`, `PAT_EXPIRED`, `PAT_REVOKED` | `CLACK_TOKEN` 확인 또는 앱에서 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | `platform:read`/`platform:write` 중 필요한 것만 확인 |
| `SERVER_KEY_CENTER_ONLY` | 발급·회전은 크리에이터 센터 전용, CLI로 시도하지 않기 |
| `VALIDATION_ERROR` | 조회 기간(90일)·본문 크기(64 KiB)·`--if-rev`/`--if-absent` 지정 확인 |
| 409 / `CONFLICT` | 문서의 현재 개정 번호를 다시 조회한 뒤 재시도 |
| 404 / `NOT_FOUND` | 콘텐츠·키·문서 ID와 소유권 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 없거나 중단됨, `clack-setup` 절차로 환경 확인 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |
