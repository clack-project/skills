---
name: clack-skill-package
description: 클랙 플랫폼 스킬(캐릭터 챗봇·퀴즈·세계관 등 제작 템플릿) 패키지를 검사·업로드·심사 제출·게시·지원종료한다. CLACK platform skill package, template authoring, review submission 작업에 사용한다. 클랙 레지스트리에 등록·심사되어 크리에이터 제작에 쓰이는 스킬을 다루며, 이 저장소의 CLACK 사용법 에이전트 스킬을 설치·수정하는 작업에는 쓰지 않는다.
---

# 클랙 플랫폼 스킬 패키지

요구 버전: `clack >= 0.1.1`(`display.description`·`tags_i18n`·`release_notes`나 폼의 `x-clack-help-i18n`·`x-clack-placeholder-i18n`을 쓰는 패키지는 `clack >= 0.3.0`), Node.js 20 이상. 여기서 "스킬"은 클랙 플랫폼이 제공하는 제작 템플릿(캐릭터 챗봇, 퀴즈, 세계관 등)이며 크리에이터가 만들어 다른 이용자가 쓰게 하는 산출물이다. 지침형(`instruction`) 스킬은 이 저장소의 에이전트 스킬과 같은 `SKILL.md`·`references/` 형식을 쓰지만, **클랙 레지스트리에 올려 심사받고 클랙 제작 AI와 다른 이용자가 쓰게 한다는 점**이 다르다. 사용자가 "클랙에 내 스킬을 등록·공개하고 싶다"고 하면 이 스킬을 쓰고, 이 저장소의 CLACK 사용법 스킬 설치·갱신은 `clack-setup`의 안내(`npx skills`)를 따른다.

| 명령 | 필요한 권한 |
|---|---|
| `list`, `get`, `form`, `status` | `skill:read` |
| `validate`(로컬), `validate --remote`, `push`, `complete` | 로컬 검증은 로그인 불필요, 나머지는 `skill:write` |
| `cancel` | `skill:write` |
| `submit` | `skill:write`와 `skill:publish` 모두(CLI가 제출 전에 상태를 조회하므로 `skill:read`도 필요) |
| `release` | `skill:publish`(CLI가 게시 전에 상태를 조회하므로 `skill:read`도 필요) |
| `deprecate` | `skill:publish` |

서버 경로는 현재 개발 환경에서 기능 플래그가 켜진 계정과 해당 권한의 개인 액세스 토큰이 필요하다. 변경 명령은 PAT만 쓴다(서버 키 불가). 제출·게시·지원 종료까지 할 작업이면 아래처럼 세 권한을 처음부터 함께 요청해 재로그인을 피한다.

테스트 앱(스테이징) 사용자라면 먼저 `clack config set env dev`를 한 번 실행한다. 이후 모든 `clack skill ...` 명령이 이 환경을 따르므로 매 명령에 `--env dev`를 붙이지 않는다.

```sh
clack login --scopes skill:read,skill:write,skill:publish --no-browser --no-qr
```

로그인은 필요한 경우만 실행하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 코드 안내와 승인 대기·이어받기(`--no-wait`, `--resume`)는 `clack-setup`의 '로그인 승인 대기'를 따른다.

## 로컬 검증

```sh
clack skill validate ./my-skill --json
clack skill validate ./my-skill.zip --remote --json
```

`clack.skill.json`과 `SKILL.md`가 있는 디렉터리 또는 ZIP을 검사한다. 로컬 검증은 로그인 없이 실행할 수 있다. `--remote`는 서버에서도 같은 패키지를 드라이런 검증한다(PAT 필요). 패키지 구조·필수 필드·파일 한도는 [references/manifest.md](references/manifest.md)를 읽는다. 최소 예시(`type: instruction`)는 다음과 같이 실제로 검증을 통과한다.

```json
{
  "manifest_version": 1, "name": "my-skill", "version": "1.0.0", "type": "instruction",
  "display": { "title": { "ko": "내 스킬" }, "summary": { "ko": "간단한 설명" }, "category": "character_chat" },
  "authoring": { "modes": ["agent"], "surfaces": ["cli"] },
  "output": { "content_kind": "html" }
}
```

영어 화면까지 채우려면 `display`에 `title.en`·`summary.en`을 더한다. 상세 소개는 `display.description`, 영어 태그는 `display.tags_i18n`, 새 버전의 변경 안내는 `display.release_notes`에 적는다(모두 `ko` 필수·`en` 선택, `clack >= 0.3.0`). `description`이 없으면 상세 소개는 `SKILL.md`의 `description`으로 폴백하고, `release_notes`에 `en`이 없으면 영어 화면에서는 변경 안내를 보이지 않는다. 변경 기록은 `SKILL.md`가 아니라 `release_notes`에 적고, `SKILL.md`의 `description`에는 버전 표현을 넣지 않는다.

```json
"display": {
  "title": { "ko": "내 스킬", "en": "My skill" },
  "summary": { "ko": "간단한 설명", "en": "A short description" },
  "category": "character_chat",
  "tags": ["소개"],
  "tags_i18n": { "en": ["intro"] },
  "description": { "ko": "스킬 상세에 보일 소개", "en": "Introduction shown on the skill page" },
  "release_notes": { "ko": "이미지 칸을 추가했어요.", "en": "Added an image slot." }
}
```

**현재 `push`(업로드)는 `instruction`·`template` 유형만 지원한다.** `type: "tool"`은 매니페스트 스키마상 존재하지만 업로드가 거부된다(`SKILL_TYPE_UNSUPPORTED`). `template` 유형은 `runtime`·`authoring.form`·`output.template`·`output.metadata`가 추가로 필요하고 `runtime/{entry}` 파일·프로필 YAML·예시 JSON을 함께 넣어야 하므로, 실제 구조는 기존 공식 템플릿을 `clack skill get <slug>`·`clack skill form <slug> <버전>`으로 조회해 참고한 뒤 만드는 편이 안전하다.

## 업로드와 조회

```sh
clack skill push ./my-skill --json
clack skill push ./my-skill --skill-id <스킬-UUID> --json
clack skill complete <스킬-UUID> <버전-UUID> --json
clack skill list --category character_chat --official true --json
clack skill list --all --json
clack skill get my-skill --json
clack skill form my-skill 1.0.0 --json
clack skill status <스킬-UUID> <버전-UUID> --json
```

`push`는 서버 사전 검증 후 새 스킬 또는 기존 스킬(`--skill-id`)의 새 버전을 예약하고, 서명된 URL에 ZIP을 전송한 뒤 완료 처리까지 한 번에 진행한다. 완료 응답만 실패하면 출력된 `clack skill complete <스킬-UUID> <버전-UUID>`로 같은 버전을 재처리한다. `--dry-run`은 서버를 변경하지 않는다. `SKILL_VERSION_MAJOR_REQUIRED` 오류는 같은 버전 번호를 호환되지 않게 고칠 수 없다는 뜻이므로, `clack.skill.json`·`SKILL.md`의 `version`을 올려 다시 푸시하거나 먼저 `clack skill cancel`로 이 버전을 지운다.

`list`는 `-q`(이름 검색, 1~100자), `--category`, `--entity character`, `--type template|instruction|tool`, `--official true|false`, `--cursor`, `--all`을 지원한다.

## 심사 제출·게시·취소·지원종료

```sh
clack skill submit <스킬-UUID> <버전-UUID> --json
clack skill cancel <스킬-UUID> <버전-UUID> --json
clack skill release <스킬-UUID> <버전-UUID> --visibility unlisted --json
clack skill deprecate <스킬-UUID> --json
```

`submit`은 서버에서 검증 완료 상태(`review_status: validated`)와 패키지 해시를 다시 조회한 뒤에만 요청되며, 대상 버전과 해시를 보여주고 사용자 확인을 받는다. `--dry-run`은 제출 요청 없이 상태만 확인한다. 심사 판정 자체는 관리자 화면에서 이뤄진다.

`release`는 승인된(`review_status: approved`) 버전만 허용한다. `--visibility`는 `private`, `unlisted`, `public` 중 하나이며 `public`은 별도 라이브러리 등재 승인이 추가로 필요하다. `cancel`은 업로드 또는 심사 중인 버전을 취소한다. `deprecate`는 스킬 **전체**를 지원 종료 상태로 바꾸며 되돌릴 수 없다. 새 설치·새 제작은 막히지만 이미 이 스킬을 고정한 기존 콘텐츠는 계속 동작한다. 지원 종료한 스킬에는 새 버전을 올릴 수 없고, 스킬 이름(slug)은 전체에서 한 번만 쓸 수 있어 같은 이름으로 다시 만들 수도 없다(`SKILL_SLUG_EXISTS`). 계속 제공하려면 다른 이름으로 새 스킬을 만들어야 한다고 확인 전에 함께 알린다. 대상과 효과(특히 `deprecate`의 되돌릴 수 없음)를 명확히 보여준 뒤 사용자의 구체적 확인을 받고, 비대화형 실행에는 `--yes`가 필요하다. 순번·조건으로만 대상을 지목했다면 해석한 실제 스킬·버전 ID를 먼저 보여주고 확인받는다(`clack-setup`의 승인 기준 참고).

## 제작 화면 플러그인(선택, plugin-static-v2)

`clack.skill.json`의 `authoring.plugin`으로 제작 화면 플러그인을 선언하면 서버가 번들을 정적 분석해 위험 기능이 없다고 증명되는 코드만 통과시킨다. 선언·CSP·금지 API·메시지 규칙 요약은 [references/plugin-static-v2.md](references/plugin-static-v2.md)를 읽는다. 상세 정본은 크리에이터 가이드 `/ko/guide/reference/templates/editor-plugins`(T09)와 실습 과정 `/ko/guide/courses/center-editor-plugin`(T05)이다.

## 한도·결과·안전

- `--json`의 `ok`, `data`, `time_contract`를 확인한다.
- 토큰·서명 URL·패키지 원문 경로를 로그·공개 파일·커밋·답변에 복사하지 않는다.
- 타인의 스킬을 수정·제출·게시·지원종료하지 않는다. `deprecate`·`release --visibility public`처럼 넓게 영향을 주는 작업은 특히 신중히 확인한다.
- 네트워크 실패·응답 유실·5xx 뒤에는 업로드·제출·게시·지원종료를 자동 재시도하지 않는다. `status`로 반영 여부를 먼저 확인한다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED`, `SKILL_PAT_REQUIRED` | 앱에서 연결 확인 후 필요한 scope로 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | `skill:read/write/publish` 중 필요한 것만 확인 |
| `SKILL_PACKAGE_INVALID` | 매니페스트·`SKILL.md`·파일 구조를 [references/manifest.md](references/manifest.md)와 대조 |
| `SKILL_TYPE_UNSUPPORTED` | 현재 `push`는 `instruction`·`template`만 지원 |
| `SKILL_VERSION_MAJOR_REQUIRED` | 버전을 올려 재푸시하거나 `cancel`로 해당 버전 취소 후 재작업 |
| `SKILL_NOT_VALIDATED` | 검증 완료 상태가 아님, `status`로 확인 후 재제출 |
| `SKILL_NOT_APPROVED` | 승인된 버전만 게시 가능, 심사 상태 확인 |
| `SKILL_PLUGIN_INVALID`, `PLUGIN_STATIC_CHECK_STALE` | 플러그인 구조·CSP 규칙 재확인, 이전 규칙으로 검사된 버전은 새로 올리기 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인 |
| 404 / `NOT_FOUND`, `HTTP_404` | 스킬·버전 ID와 소유권 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 없거나 중단됨, `clack-setup` 절차로 환경 확인 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |

크리에이터 센터·가이드는 `/ko`·`/en` 주소를 사용하며 로그인 상태에서는 앱 언어 설정을 따릅니다. 콘텐츠는 SDK 1.2.0의 `clack.locale` 또는 `window.__clack_env?.locale`에서 앱 언어(`language`)·기기 지역(`region`)·BCP 47 태그(`tag`)를 동기적으로 읽습니다. 번역은 `language`로 고르고 숫자·날짜는 `tag`를 `Intl`에 전달합니다. 기존 `me().locale`은 `ko|en`이고 `me().locale_tag`가 전체 태그입니다.

새 다국어 계약은 개발 센터와 최신 staging 테스터 앱에서 제공하며, 운영에서는 센터 초기 출시와 함께 별도로 활성화합니다. 상세 계약과 예제는 개발 센터의 가이드 P11(`/ko/guide/reference/platform/multilingual-content`)을 확인하세요. 앱 언어 환경값이 없는 구버전 앱에서는 `clack.locale.source`가 `browser`이며 브라우저 언어로 대체됩니다.
