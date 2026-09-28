# 스킬 패키지 구조와 `clack.skill.json`

## 파일과 크기 한도

| 항목 | 제한 |
|---|---|
| 전체 ZIP | 비어 있지 않은 10 MiB 이하 |
| 압축 해제 총량 | 30 MiB 이하 |
| 파일 수 | 500개 이하 |
| `SKILL.md` | 20 KiB 이하, 루트에 위치 |
| `clack.skill.json` | 64 KiB 이하, 루트에 위치 |
| 프로필 `runtime/.clack/profiles/*.yaml` | 파일당 16 KiB 이하 |
| 예시 `examples/*.json` | 1~10개, 파일당 64 KiB 이하 |

경로는 220자 이하, NFC 정규화, 공백·`\`·`%`·`?`·`#`·`:`·제어 문자 금지, `..`·숨김 파일(루트의 `.clack`만 예외) 금지, `scripts/`나 실행 확장자(`.sh`·`.py`·`.exe` 등)도 금지다. `SKILL.md`의 frontmatter는 유효한 YAML이어야 하고 `name`(디렉터리·매니페스트 이름과 동일)·`description`(1~1024자)이 필요하며 **`allowed-tools:` 키가 있으면 거부된다.**

## `clack.skill.json` 필수 필드(모든 유형)

- `manifest_version`: `1`
- `name`: `^[a-z][a-z0-9-]{0,63}$`
- `version`: SemVer(`1.0.0`, `1.0.0-beta.1` 등)
- `type`: `instruction` | `template` | `tool`
- `display`: `title.ko`, `summary.ko`(각 1~200자, `en` 선택), `category`(`character_chat`|`quiz`|`worldbuilding`|`gallery`|`story`|`agent_tool`). `icon`·`screenshots`(최대 10)·`tags`(최대 10, 각 40자 이하)는 선택.
- `authoring`: `modes`(`template`|`agent` 중 1개 이상), `surfaces`(`center`|`app`|`cli` 중 1개 이상). `form`·`ai_fill`·`references`·`tools`·`plugin`은 선택(유형에 따라 일부는 사실상 필수, 아래 참고).
- `output`: `content_kind`(`html`|`gallery`|`slideshow`)가 필수. 나머지는 유형에 따라 다르다.

`instruction` 유형은 위 필드만으로 유효하다([SKILL.md](../SKILL.md)의 검증된 최소 예시 참고).

## `template`·`tool` 유형의 추가 요구사항

두 유형 모두 다음이 추가로 필요하다.

- `authoring.form`: 제작 폼 JSON Schema 파일 경로(예시는 아래 참고). `authoring.modes`에 `template`이 포함돼야 한다.
- `output.discovery_category`: `display.category`와 같은 6종 enum.
- `output.template`: `{root: "runtime", entry: "실행 진입 파일 상대경로"}`. `runtime/{entry}` 파일이 실제로 있어야 한다.
- `output.metadata.title`: `^[a-z][a-z0-9_-]{0,31}$` 형식의 폼 필드 참조(사람이 읽는 텍스트가 아니라 필드 이름).
- `runtime`: `sdk_version`(`1`), `capabilities`(아래 10종 중 선택), `collections`, `profiles`(배열, 각 이름은 `runtime/.clack/profiles/{이름}.yaml`과 정확히 일치), `rating_max`(`all`|`12`|`15`), `game`(`not_game`|`game`)가 모두 필수.

`tool` 유형은 여기에 더해 `authoring.tools`(최소 1개, 현재 `tool: "image.generate"`만 지원, `max_calls`·`purpose` 필수)도 필요하다. 단, **현재 `push`는 `instruction`·`template`만 업로드를 허용**하므로 `tool` 유형은 로컬 검증까지만 가능하다.

`capabilities`/`optional_capabilities` 선택지: `identity.basic`, `events.track`, `data.viewer`, `data.shared`, `data.creator`, `identity.profile`, `ai.conversation`, `ai.completion`, `cash.purchase`, `ai.image`.

## 제작 폼(`authoring.form`)

JSON Schema 객체이며 최상위는 `type: "object"`, `additionalProperties: false`, `properties`가 필수다. 각 최상위 필드는 `x-clack-visibility`(`public`|`private`)와 `x-clack-widget`(`text`|`textarea`|`select`|`radio`|`chips`|`toggle`|`number`|`image`|`list`|`rating`|`tier`|`image_list`|`content_ref`)이 필수다. 이미지 위젯을 쓰는 필드는 `output.asset_slots`의 같은 `field` 선언과 종류가 일치해야 한다(`image`↔단일 슬롯, `image_list`↔`multiple` 슬롯). `x-clack-source`(콘텐츠 가져오기)는 `content_ref` 위젯에만 쓴다.

## 예시(`examples/*.json`)

`template`/`tool` 유형은 `examples/` 아래 1~10개의 JSON 파일이 필요하며, 각각 `authoring.form`의 JSON Schema를 통과해야 한다(서버·CLI가 실제로 그 스키마로 검증한다).

## 실제 구조를 참고하는 방법

`template`/`tool` 매니페스트는 필드 간 의존성(자산 슬롯 ↔ 폼 위젯, 엔티티 매핑 등)이 많아 처음부터 새로 설계하기보다, 이미 공개된 공식 템플릿 하나를 `clack skill get <slug> --env dev`로 찾고 `clack skill form <slug> <버전> --env dev`로 실제 폼 스키마를 내려받아 참고한 뒤 필요한 부분만 바꾸는 편이 안전하다. 최종 판정은 항상 `clack skill validate --remote` 또는 실제 `push`의 서버 응답을 따른다.
