---
name: clack-creator-content
description: 클랙 크리에이터 HTML/ZIP 작품(포켓 콘텐츠)을 등록·업로드하고 앱 확인·심사 제출·공개·게시중단하며 이미지 화보·캐릭터 자산을 제작한다. CLACK creator content, HTML upload, review submission, publish, image authoring 작업에 사용한다. 게시판·피드 글과 댓글은 별도 clack-content 스킬이다.
---

# 클랙 크리에이터 콘텐츠와 이미지 제작

요구 버전: `clack >= 0.1.1`(제작 세션 완료·포기는 `clack >= 0.3.1`), Node.js 20 이상. 여기서 다루는 "콘텐츠"는 크리에이터가 만드는 HTML/ZIP 작품(포켓)이며, 일반 게시판·피드 글은 `clack-content` 스킬이 다룬다.

테스트 앱(스테이징) 사용자라면 먼저 `clack config set env dev`를 한 번 실행한다. 이후 모든 명령이 이 환경을 따르므로 매 명령에 `--env dev`를 붙이지 않는다.

필요한 권한은 명령마다 다르다.

| 명령 | 필요한 권한 |
|---|---|
| `config` | 없음(로그인 불필요) |
| `list`, `status`, `preview` | `creator-content:read` |
| `create`, `upload`, `complete`, `withdraw`, 이미지 화보·캐릭터 자산 제작(`authoring`) | `creator-content:write` |
| `submit` | `creator-content:write`와 `creator-content:publish` 모두 |
| `publish`, `unpublish` | `creator-content:publish` |
| `server-keys`, `shared` | `platform:read`/`platform:write`(`clack-platform-data` 스킬) |

약식 `clack login --scopes creator-content`는 읽기·쓰기만 요청한다. 심사 제출까지 할 작업이면 처음부터 `creator-content:publish`를 함께 요청해 재로그인을 피한다.

기능 제공 여부는 환경마다 다르므로 단정하지 말고 `clack content config --json`의 기능 플래그로 확인한다. `uploads_enabled`는 업로드, `app_preview_enabled`는 앱 확인, `review_enabled`는 심사 제출, `publication_enabled`는 공개다. 꺼진 기능은 CLI·MCP로 우회하지 않는다. 대화로 작품을 만드는 채팅 제작(`chat_enabled`)은 크리에이터 센터 기능이며 CLI·MCP 명령은 없다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. `clack --version`, `clack doctor --json`으로 계정·권한을 확인한다.

```sh
clack content config --json
clack login --scopes creator-content:read,creator-content:write,creator-content:publish --no-browser --no-qr
```

`content config`는 로그인 없이도 조회할 수 있어 기능 제공 여부를 먼저 확인하기 좋다. 로그인은 필요한 경우만 실행하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 코드 안내와 승인 대기·이어받기(`--no-wait`, `--resume`)는 `clack-setup`의 '로그인 승인 대기'를 따른다. 수동 토큰은 `clack login --token`의 숨김 입력이나 안전한 `CLACK_TOKEN` 주입으로 전달한다.

## 등록과 업로드

```sh
clack content list --json
clack content status <콘텐츠-UUID> --json
clack content create --title '확정한 제목' --policy-version 2026-09-22 --json
clack content upload <콘텐츠-UUID> ./index.html --json
clack content upload <콘텐츠-UUID> ./bundle.zip --header scroll_hide --color dark --json
```

`create`는 `title`(1~120자), `description`(선택, 최대 2000자), `kind`(`html`|`gallery`|`slideshow`|`video`, 기본 `html`), `policy_version`이 필요하다. 현재 유효한 정책 버전은 `2026-09-22` 하나뿐이며, 값이 다르면 서버가 거부한다. 실제 정책 내용은 사용자에게 크리에이터 센터에서 확인하도록 안내하고, 사용자가 동의한 버전만 지정한다. 임의로 값을 지어내지 않는다.

`upload`는 최대 30 MiB의 HTML 또는 ZIP을 체크섬과 함께 비공개 저장소로 보낸다. 헤더 표시를 지정하려면 `--header fixed|scroll_hide|translucent_scroll_hide|floating_close`와 `--color light|dark`를 함께 준다(생략하면 서버 기본값). 전송 후 완료 처리까지 자동으로 진행되며, 완료 요청만 실패하면 오류에 표시된 `clack content complete <콘텐츠-UUID> <업로드-UUID>`로 같은 업로드를 재처리한다. `--dry-run`은 파일·입력 검사만 한다.

ZIP에 `clack.content.json` 또는 `.clack/`가 있으면 업로드 전에 선언·경로·크기를 검사하고 표준 오류에 경고를 남긴다. 경고는 업로드를 막지 않으며 서버 심사 결과를 대신하지 않는다. 세부 규칙은 [references/packaging.md](references/packaging.md)를 읽는다.

## 앱 확인·심사 제출

작품은 반드시 **upload → preview → 앱에서 확인 완료 → submit** 순서로 진행한다.

```sh
clack content preview <콘텐츠-UUID> <버전-UUID> --json
# 사용자가 같은 계정의 앱에서 위 링크를 끝까지 열고 확인 완료(CLI·MCP로 대신할 수 없음)
clack content submit <콘텐츠-UUID> <버전-UUID> --json
clack content status <콘텐츠-UUID> --json
```

1. `upload` 완료 응답에서 새 버전 ID를 확인한다.
2. `preview`가 반환한 확인 링크를 사용자에게 전달하고, 작품 소유자와 같은 계정의 앱에서 끝까지 열어 실제 표시를 확인한 뒤 확인 완료를 누르도록 안내한다. 이 단계는 앱 전용이라 CLI·MCP가 대신할 수 없다. 사용자가 확인을 마쳤다고 알려주기 전에는 `submit`하지 않는다. 헤더 설정을 바꿔 올린 버전도 다시 확인해야 한다.
3. `submit`은 대상 버전과 효과(심사를 통과하면 자동 공개, `publish_on_approval`)를 보여주고 사용자 확인을 받은 뒤 실행한다. 앱 확인 전에 제출하면 `PREVIEW_CONFIRMATION_REQUIRED`(409)가 나온다. 이때 제출을 반복하지 말고 2번으로 돌아간다.
4. 제출 뒤에는 `content status`로 해당 버전의 심사 상태를 확인한다. 관리자 검토로 넘어간 버전은 결과가 늦을 수 있다.

## 공개·게시중단

`publish`·`unpublish`는 대상과 효과를 보여준 뒤 사용자가 이 대화에서 답한 확인을 받기 전에는 실행하지 않는다. "공개됐으면 게시 중단해 줘"처럼 조건이 붙은 요청은 조건 충족을 확인한 시점에 대상과 효과를 보여주고 확인을 기다린다(아래 설명 참고).

```sh
clack content status <콘텐츠-UUID> --json
clack content withdraw <콘텐츠-UUID> <버전-UUID> --json
clack content publish <콘텐츠-UUID> <버전-UUID> --json
clack content unpublish <콘텐츠-UUID> --json
```

게시 여부는 `content status`에서 콘텐츠의 `status`가 `published`이고 `current_version_id`가 해당 버전인지로 확인한다. 현재 CLI는 게시된 작품의 공개 링크를 출력하지 않는다. 미리보기 링크 등으로 공개 주소를 추측해 안내하지 말고, 공개된 모습은 사용자가 앱에서 확인하도록 안내한다.

`withdraw`는 진행 중인 심사를 취소한다. `publish`는 이미 승인됐지만 지금은 공개되지 않은 버전(게시중단 후 재공개 등)을 다시 공개할 때 쓰며 `creator-content:publish`가 필요하다. `unpublish`는 콘텐츠의 현재 공개를 중단하되 버전 자체는 남기므로, 나중에 사용자가 요청하면 같은 버전을 `publish`로 되살릴 수 있다고 안내한다.

제출·공개·게시중단은 모두 대상 콘텐츠·버전·효과를 먼저 보여주고 사용자의 구체적 확인을 받은 뒤 실행한다. 순번·조건·"방금 올린 것"처럼 대상을 지목만 했다면 해석한 실제 콘텐츠·버전 ID를 먼저 보여주고 확인받는다(`clack-setup`의 승인 기준 참고). "공개됐으면 게시 중단해 줘"처럼 조건부로 요청했어도 그 대상과 효과를 이 대화에서 아직 보여주지 않았다면, 조건을 확인한 뒤 대상과 효과를 보여주고 1회 확인받는다. 같은 대상·행위를 이렇게 구체적으로 승인받았다면 반복 확인하지 않고 `--yes`를 사용한다.

콘텐츠 서버 키(`csk_`) 조회·폐기와 이용자가 쓴 공유 문서 관리는 이 스킬이 아니라 `clack-platform-data` 스킬이 다룬다.

## 이미지 화보·캐릭터 자산 제작(authoring)

`clack authoring --input <파일>`은 공개된 클랙 플랫폼 스킬(예: 캐릭터 이미지 템플릿)을 이용해 세션 기반으로 그림 자산을 만든다. 여기서 말하는 "스킬"은 클랙 플랫폼 자체의 제작 템플릿이며, 이 저장소의 에이전트 스킬과는 다른 개념이다. `creator-content:write` 권한이 필요하다. 로컬 MCP에서는 같은 입력을 `platform_authoring` 도구로 보낸다.

세션을 만들고 폼을 채운 뒤 이미지를 생성하고, 완성한 자산을 본인 콘텐츠로 가져오는 절차는 [references/authoring.md](references/authoring.md)를 읽는다. 이미지 생성은 `approved_price_cash`(사용자가 확인한 가격)와 `idempotency_key`가 필요하며, 같은 요청을 재시도할 때는 반드시 같은 키를 재사용해 중복 생성을 막는다.

## 한도·결과·안전

- `--json`의 `ok`, `data`, `time_contract`를 확인한다. 시각 원문과 `utc-v1` 계약을 함께 유지한다.
- `--dry-run`은 파일·입력 검증만 하며 업로드·서버 변경을 하지 않는다.
- 업로드 서명 URL·체크섬·완료 응답을 로그·공개 파일·커밋·답변에 복사하지 않는다. 업로드 URL은 전용 저장소로만 전송하며 다른 도구에 전달하지 않는다.
- 타인의 콘텐츠를 수정·삭제하지 않는다. 앱 확인·AI 심사 절차를 CLI로 우회하지 않는다.
- 네트워크 실패·응답 유실·5xx 뒤에는 업로드·제출·공개·게시중단을 자동 재시도하지 않는다. `status`로 반영 여부를 먼저 확인한다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 앱에서 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | `creator-content:read/write/publish` 중 필요한 것만 확인 |
| `SERVER_KEY_CENTER_ONLY` | 서버 키 발급·회전은 크리에이터 센터 전용, CLI로 시도하지 않기 |
| `PREVIEW_CONFIRMATION_REQUIRED` | 사용자가 아직 앱에서 이 버전(또는 바뀐 헤더 설정)을 확인하지 않음. 제출을 반복하지 말고 `preview` 링크로 앱 확인 완료를 요청한 뒤 다시 제출 |
| `CONTENT_METADATA_CHANGED` | 제목·설명·종류·썸네일이 바뀜, 새 버전을 업로드하고 앱 확인부터 다시 |
| `CONTENT_PLATFORM_DISABLED`, `CONTENT_REVIEW_NOT_READY`, `CONTENT_SERVING_NOT_READY` | 이 환경에서 해당 기능이 꺼져 있음. `content config`의 플래그를 확인하고 반복 호출하지 않기 |
| `CONTENT_UPLOAD_FAILED`, `INVALID_UPLOAD_RESPONSE` | 새 업로드를 시작(재사용 안 함), 반복 실패 시 파일·네트워크 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인 |
| 404 / `NOT_FOUND`, `HTTP_404` | 콘텐츠·버전 ID와 소유권 확인 |
| `VALIDATION_ERROR`, 409 | 정책 버전·현재 상태·심사 상태 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 없거나 중단됨, `clack-setup` 절차로 환경 확인 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |
