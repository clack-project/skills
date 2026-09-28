---
name: clack-creator-content
description: 클랙 크리에이터 HTML/ZIP 작품(포켓 콘텐츠)을 등록·업로드하고 앱 확인·심사 제출·공개·게시중단하며 이미지 화보·캐릭터 자산을 제작한다. CLACK creator content, HTML upload, review submission, publish, image authoring 작업에 사용한다. 게시판·피드 글과 댓글은 별도 clack-content 스킬이다.
---

# 클랙 크리에이터 콘텐츠와 이미지 제작

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. 여기서 다루는 "콘텐츠"는 크리에이터가 만드는 HTML/ZIP 작품(포켓)이며, 일반 게시판·피드 글은 `clack-content` 스킬이 다룬다. 조회는 `creator-content:read`, 등록·업로드·제출·취소는 `creator-content:write`, 승인된 버전 공개는 `creator-content:publish`가 필요하다. 셋 다 약식 `creator-content`로 요청하면 읽기·쓰기만 얻으므로 공개까지 하려면 `creator-content:publish`를 따로 추가한다.

**앱 확인·AI 심사 후 공개와 채팅 제작은 아직 준비 중이다. CLI·MCP로 이 확인 요건을 우회하지 않는다.** 기능 제공 여부는 대상 환경에 따라 다르므로 실제 응답으로 확인한다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. `clack --version`, `clack doctor --json`으로 계정·권한을 확인한다.

```sh
clack content config --json
clack login --scopes creator-content:read,creator-content:write,creator-content:publish --no-browser
```

`content config`는 로그인 없이도 조회할 수 있어 기능 제공 여부를 먼저 확인하기 좋다. 로그인은 필요한 경우만 실행하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 수동 토큰은 `clack login --token`의 숨김 입력이나 안전한 `CLACK_TOKEN` 주입으로 전달한다.

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

## 심사·공개·게시중단

```sh
clack content preview <콘텐츠-UUID> <버전-UUID> --json
clack content submit <콘텐츠-UUID> <버전-UUID> --json
clack content withdraw <콘텐츠-UUID> <버전-UUID> --json
clack content publish <콘텐츠-UUID> <버전-UUID> --json
clack content unpublish <콘텐츠-UUID> --json
```

`submit`은 심사를 요청하며 통과하면 자동으로 공개된다(`publish_on_approval`). 대상 버전과 효과를 보여준 뒤 사용자 확인을 받는다. `withdraw`는 진행 중인 심사를 취소한다. `publish`는 이미 승인됐지만 지금은 공개되지 않은 버전(게시중단 후 재공개 등)을 다시 공개할 때 쓰며 `creator-content:publish`가 필요하다. `unpublish`는 콘텐츠의 현재 공개를 중단하되 버전 자체는 남기므로, 나중에 사용자가 요청하면 같은 버전을 `publish`로 되살릴 수 있다고 안내한다.

제출·공개·게시중단은 모두 대상 콘텐츠·버전·효과를 먼저 보여주고 사용자의 구체적 확인을 받은 뒤 실행한다. 순번·조건·"방금 올린 것"처럼 대상을 지목만 했다면 해석한 실제 콘텐츠·버전 ID를 먼저 보여주고 확인받는다(`clack-setup`의 승인 기준 참고). 같은 대상·행위를 이렇게 구체적으로 승인받았다면 반복 확인하지 않고 `--yes`를 사용한다.

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
| `CONTENT_UPLOAD_FAILED`, `INVALID_UPLOAD_RESPONSE` | 새 업로드를 시작(재사용 안 함), 반복 실패 시 파일·네트워크 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인 |
| 404 / `NOT_FOUND`, `HTTP_404` | 콘텐츠·버전 ID와 소유권 확인 |
| `VALIDATION_ERROR`, 409 | 정책 버전·현재 상태·심사 상태 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 없거나 중단됨, `clack-setup` 절차로 환경 확인 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |
