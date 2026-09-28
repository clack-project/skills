# ZIP 패키지 선언 규칙

`content upload`에 ZIP을 지정하면 전송 전에 구조를 검사하고 문제를 표준 오류에 경고로만 남긴다(업로드를 막지 않음). 선언이 없는 기존 정적 ZIP도 계속 업로드할 수 있다. 경고는 서버의 최종 검증·심사 결과를 대신하지 않는다. 전송 없이 확인하려면 `content upload ... --dry-run`을 쓴다.

## 필수·선택 파일

- 번들 루트에 비어 있지 않은 `index.html`이 있어야 한다(없으면 경고).
- `clack.content.json`(선언 매니페스트)과 `.clack/`(비공개 설정)는 둘 다 선택이지만, 하나만 있으면 경고한다(`.clack/`가 있으면 루트 `clack.content.json`도 있어야 한다).
- `.clack/`에는 `profiles/{이름}.yaml`(이름은 소문자·숫자·하이픈, 32자 이하)과 `config.private.json`만 둘 수 있다. 다른 경로는 경고 대상이다.

## 크기·경로 제한

| 항목 | 제한 |
|---|---|
| ZIP 전체 업로드(모든 콘텐츠 공통) | 30 MiB |
| ZIP 압축 해제 총량 | 150 MiB |
| ZIP 안 파일 수 | 2,000개 |
| `clack.content.json` | 64 KiB |
| `.clack/config.private.json` | 256 KiB |
| `.clack/profiles/*.yaml` 파일 하나 | 32 KiB |

경로는 대소문자 구분 없이 중복될 수 없고, NFC 정규화된 상대 경로만 허용하며 `..`·숨김 파일(`.clack` 제외)·제어 문자·공백·`\`·`%`·`?`·`#`·`:`를 포함할 수 없다.

## `clack.content.json` 필수 키

`manifest_version`(1), `sdk`(예: `"1"`, `"1.2"`, `"1.2.3"`), `capabilities`(배열), `profiles`(배열), `collections`(객체), `items`(객체), `config`(객체)가 있어야 한다. 허용된 최상위 키는 이 6개와 `built_with`뿐이며 다른 키가 있으면 경고한다.

- `capabilities`는 다음 중에서만 선택하고 중복할 수 없다: `identity.basic`, `events.track`, `data.viewer`, `data.shared`, `data.creator`, `identity.profile`, `ai.conversation`, `ai.completion`, `cash.purchase`, `ai.image`.
- `profiles`는 `.clack/profiles/*.yaml`의 실제 파일명과 정확히 일치해야 한다(선언에 없는 파일, 파일 없는 선언 모두 경고).
- `config`에는 `private` 키를 둘 수 없고(비공개 값은 `.clack/config.private.json`에 넣는다), 직렬화 크기가 32 KiB를 넘을 수 없다.

경고가 나오면 선언을 고치거나, 의도한 대로인지 사용자에게 확인한 뒤 계속 진행할지 판단한다. 서버 심사가 최종 결정권을 가진다.
