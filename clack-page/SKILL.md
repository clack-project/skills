---
name: clack-page
description: 클랙 내 공개 홈(프로필)과 내가 소유한 세계관 페이지를 HTML로 꾸미고 앱 확인·심사·적용·복원·해제한다. CLACK custom page, profile home, space page, HTML presentation 작업에 사용한다.
---

# 클랙 공개 홈·세계관 페이지 꾸미기

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. `page` 명령은 게시글·HTML 콘텐츠(포켓)와 별도로 `custom-page:read`, `custom-page:write`, `custom-page:publish` 권한을 쓴다. 페이지 소유자만 편집할 수 있고, 개인 공개 홈의 대상 이용자는 서버가 로그인 계정으로 정한다.

| 명령 | 필요한 권한 |
|---|---|
| `list`, `status`, `preview` | `custom-page:read` |
| `create`, `upload`, `complete`, `presentation` | `custom-page:write` |
| `submit` | `custom-page:write`와 `custom-page:publish` 모두 |
| `apply`, `restore`, `disable` | `custom-page:publish` |

약식 `clack login --scopes custom-page`는 읽기·쓰기만 요청하므로 제출·적용까지 하려면 `custom-page:publish`를 추가로 요청한다. 기능 제공 여부는 대상 환경의 센터·API 설정에 따라 다르므로 실제 응답으로 확인한다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. `clack --version`, `clack doctor --json`으로 계정·권한을 확인한다.

```sh
clack login --scopes custom-page:read,custom-page:write,custom-page:publish --no-browser
```

로그인은 필요한 경우만 실행하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다.

## 페이지 만들고 파일 올리기

```sh
clack page list --json
clack page status <페이지-UUID> --json
clack page create --target profile --policy-version 2026-09-22 --json
clack page create --target space --space-id <세계관-UUID> --policy-version 2026-09-22 --json
clack page upload <페이지-UUID> ./index.html --header translucent_scroll_hide --color dark --json
```

`create`의 `--target`은 `profile`(내 공개 홈) 또는 `space`(내가 소유한 세계관)다. `space`에는 `--space-id`가 필요하고 `profile`에는 지정하지 않는다. `--policy-version`은 사용자가 동의한 정책 버전이며 현재 유효한 값은 `2026-09-22` 하나뿐이다.

`upload`는 최대 30 MiB의 HTML/ZIP을 올리며 헤더 설정을 함께 저장한다. `--header`(`fixed`|`scroll_hide`|`translucent_scroll_hide`|`floating_close`, 기본 `fixed`)와 `--color`(`light`|`dark`, 기본 `light`)를 생략하면 기본값이 적용된다. 파일과 헤더 설정은 같은 버전에 고정되므로 헤더만 바뀌어도 앱 확인·심사가 다시 필요하다. 전송 후 완료 처리까지 자동 진행되며, 완료 요청만 실패하면 오류에 표시된 `clack page complete <페이지-UUID> <업로드-UUID>`로 재시도한다. 헤더·화면 표시 규칙과 안전 영역 CSS는 [references/presentation.md](references/presentation.md)를 읽는다.

## 앱 확인·심사·적용

```sh
clack page preview <페이지-UUID> <버전-UUID> --json
# 위 링크를 같은 계정의 앱에서 열고 확인 완료(CLI·MCP로 대신할 수 없음)
clack page submit <페이지-UUID> <버전-UUID> --json
clack page status <페이지-UUID> --json
clack page apply <페이지-UUID> <버전-UUID> --revision <status의 현재 수정 번호> --json
```

`preview`가 반환한 확인 링크는 반드시 페이지 소유자와 같은 계정의 앱에서 열어 실제 표시를 확인해야 하며, 이 확인 완료 단계는 앱 전용이라 CLI·MCP가 대신할 수 없다. `submit`은 앱에서 확인을 마친 버전만 심사에 제출하며, 승인만으로 자동 적용되지 않는다. 이 환경에서 자동 승인 조건(정적 HTML·CSS만 사용, 새로 판정할 이미지 8장 이하 등)을 모두 만족하면 관리자 개입 없이 바로 승인될 수 있지만 적용은 별도다.

`apply`는 승인된 버전의 파일과 헤더 설정을 실제로 내보인다. `--revision`은 `status`로 확인한 **현재** 수정 번호이며, 충돌(`CUSTOM_PAGE_CONFLICT`)이 나면 `status`를 다시 읽어 최신 수정 번호로 재시도한다. 이전에 승인됐던 버전으로 되돌리려면 그 버전 ID로 같은 절차를 쓴다.

```sh
clack page restore <페이지-UUID> <이전-승인-버전-UUID> --revision <status의 현재 수정 번호> --json
clack page disable <페이지-UUID> --revision <status의 현재 수정 번호> --json
```

`restore`는 내부적으로 `apply`와 같은 동작이며 과거에 승인된 버전 ID를 다시 지정하는 방식이다. `disable`은 기본 화면으로 되돌리며 업로드한 버전 자체는 삭제되지 않으므로 나중에 다시 `apply`할 수 있다.

## 파일은 유지하고 헤더만 바꾸기

```sh
clack page presentation <페이지-UUID> <기준-버전-UUID> --header scroll_hide --color light --json
# 응답 data.id가 새 버전 ID. 파일은 재사용하고 새 비공개 버전만 만든다.
clack page preview <페이지-UUID> <새-버전-UUID> --json
# 앱 확인 완료 후
clack page submit <페이지-UUID> <새-버전-UUID> --json
```

`presentation`은 재호출할 때마다 다른 새 버전을 만들므로 응답을 놓치면 `status`의 버전 이력에서 방금 만든 버전을 찾는다. 새 버전도 일일 업로드·저장 한도에 포함되며 앱 확인·심사를 다시 거쳐야 한다. 기존 적용본은 그대로 유지된다.

## 하지 않는 일

- 크리에이터 센터의 "클랙 AI로 페이지 만들고 고치기", 이미지 추가·AI 이미지 생성은 센터 전용이며 **PAT·CLI·MCP로 제공하지 않는다.** 사용자가 요청하면 크리에이터 센터에서 진행하도록 안내한다.
- 런타임 선언(`.clack/` 콘텐츠 매니페스트)이 있는 패키지는 페이지로 올릴 수 없다(`CUSTOM_PAGE_RUNTIME_FORBIDDEN`). 결제·AI·개인정보·세계관 공유 저장소 같은 권한은 페이지 꾸미기만으로 생기지 않는다.
- 세계관에 콘텐츠 제작자로 초대된 것만으로는 그 세계관 페이지를 편집할 수 없다. 소유자 권한을 확인한다.

## 한도·결과·안전

- `--json`의 `ok`, `data`, `time_contract`를 확인한다.
- `--dry-run`은 파일·입력 검증만 하며 업로드·서버 변경을 하지 않는다.
- 적용·복원·해제 전에는 대상 버전과 효과를 보여주고 사용자 확인을 받는다. 같은 대상·행위를 이미 승인받았다면 반복 확인하지 않고 `--yes`를 사용한다.
- 네트워크 실패·응답 유실·5xx 뒤에는 업로드·심사 제출·적용·해제를 자동 재시도하지 않는다. `status`로 반영 여부를 먼저 확인한다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 앱에서 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | `custom-page:read/write/publish` 중 필요한 것만 확인 |
| `CUSTOM_PAGE_CONFLICT` | `status`로 최신 상태·수정 번호를 다시 읽고 재시도 |
| `PREVIEW_CONFIRMATION_REQUIRED` | 사용자가 아직 앱에서 이 버전을 확인하지 않음, 확인 완료 후 재시도 |
| `CUSTOM_PAGE_APPROVAL_REQUIRED` | 파일·설정 확인과 심사 승인이 모두 필요, 상태 재확인 |
| `CUSTOM_PAGE_RUNTIME_FORBIDDEN` | 런타임 선언이 있는 패키지는 페이지로 사용 불가 |
| `CUSTOM_PAGE_DISABLED`, 8 / `USER_API_UNAVAILABLE` | 이 환경에서 기능 준비 중이거나 서버가 아직 지원하지 않음, `clack-setup` 절차로 환경 확인 |
| 404 / `NOT_FOUND` | 페이지·버전 ID와 소유권 확인 |
| 429 | `retry_after`초 이상 대기 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |
