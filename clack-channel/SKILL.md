---
name: clack-channel
description: 클랙 크리에이터 채널·채널 포스트·시리즈를 관리하고 마크다운 원고를 블록 포스트로 작성한다. CLACK channel, series, markdown publishing 작업에 사용한다.
---

# 클랙 크리에이터 채널

요구 버전: `clack >= 0.1.1`, Node.js 20 이상. 조회는 `content:read`, 변경은 `content:write`다. 내 채널 ID 자동 조회를 사용하는 명령은 읽기 권한도 필요하다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. `clack --version`, `clack doctor --json`으로 연결을 확인한다. 필요한 경우 `clack login --scopes content:read,content:write --no-browser --no-qr`를 실행하고 사용자가 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 승인한다. 코드 안내와 승인 대기·이어받기(`--no-wait`, `--resume`)는 `clack-setup`의 '로그인 승인 대기'를 따른다. 수동 토큰은 숨김 입력 `clack login --token`이나 안전하게 주입한 `CLACK_TOKEN`으로 전달한다.

## 채널과 시리즈

```sh
clack channel get --json
clack channel create --name '채널 이름' --slug my-channel --dry-run --json
clack channel update --description '확정한 채널 소개' --json
clack channel series list --json
clack channel series get 123 --json
clack channel series create --title '시리즈 제목' --dry-run --json
clack channel series update 123 --is-completed on --json
```

채널 생성은 사용자가 요청하고 자격·기능이 허용될 때만 수행한다. 이름은 1~45자, 슬러그는 소문자·숫자·하이픈 3~30자다. 채널 삭제 명령은 없다. 채널 생성 권한이나 기능이 거부되면 앱에서 상태를 확인한다.

시리즈 제목은 1~100자, 설명은 최대 500자다. 새 시리즈는 `--is-completed`를 지원하지 않으므로 완결 설정은 생성 후 `update`로 수행한다. 목록은 `--page`, `--per-page`를 사용하고 페이지당 최대 50개다. ID를 생략하는 채널·시리즈 생성은 내 채널을 조회한다.

## 원고·초안·발행

마크다운·블록 JSON을 준비할 때 [references/blocks.md](references/blocks.md)를 읽는다. 변환 경고와 이미지 목록을 확인하여 의도한 표현인지 검토한다.

```sh
clack channel post list --status draft --all --json
clack channel post get 456 --json
clack channel post create --from-markdown draft.md --status draft --dry-run --json
clack channel post create --from-markdown draft.md --status draft --json
clack channel post update 456 --from-markdown revised.md --dry-run --json
clack channel post update 456 --from-markdown revised.md --json
clack channel post update 456 --status published --json
```

생성의 기본 상태는 `draft`다. 원고 작성만 요청받았으면 발행하지 않는다. 발행을 요청받은 경우 확정한 원고로 `published`를 사용한다. 생성 시 `--series <id>`, `--tags <쉼표 목록>`, `--thumbnail <이미지>`를 지정할 수 있다. 실제 대상 채널과 시리즈 ID를 조회한다.

수정은 제공한 필드만 변경한다. 본문 `content`나 마크다운을 전달하면 새 최종 본문을 구성한다. `hidden`은 목록 필터에서만 가능하며 작성·수정 상태는 `draft|published`다. 숨겨진 포스트를 발행 상태로 돌려 기능 제한을 우회하지 않는다.

포스트·시리즈 삭제는 대상과 영향을 제시하고 구체적인 사용자 승인을 받은 뒤 실행한다. 순번·조건·"방금 쓴 것"처럼 대상을 지목만 했다면 해석한 실제 ID·제목을 먼저 보여주고 확인받는다(`clack-setup`의 승인 기준 참고). 이미 이렇게 구체적으로 승인받았다면 같은 대상 삭제를 반복 확인하지 않는다. 여러 포스트를 한 번에 삭제·상태 변경할 때도 대상 표를 보여주고 1회 확인을 받는다.

```sh
clack channel post delete 456 --yes --json
clack channel series delete 123 --yes --json
```

## 한도·결과·안전

- 대량 작업 전 포스트·이미지 수와 `doctor`의 한도를 알린다. 기본 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 채널 포스트 30개·이미지 200개다. 실제 서버 값이 우선한다. 시리즈 생성도 쓰기 요청을 사용한다.
- `--dry-run`은 필요한 조회·이미지 검증만 하며 업로드·저장을 하지 않는다. CDN 이미지의 크기 확인을 위한 읽기 요청은 가능하다.
- `--json`의 ID·`ok`·`time_contract`를 보관한다. 시각 원문과 `utc-v1|legacy-kst`를 함께 유지하고 임의 변환하지 않는다. 사람용 UTC 출력은 `--time utc`다.
- 토큰·비공개 초안·개인정보·서명 URL을 로그·공개 파일·커밋·답변에 복사하지 않는다. 타인 콘텐츠 변경·스팸성 반복 발행·한도 회피를 하지 않는다.
- 네트워크 실패·응답 유실·5xx 뒤에는 생성·발행·삭제를 자동 재시도하지 않는다. 조회나 앱에서 반영 여부를 확인한다. 여러 단계를 하나의 성공으로 단정하지 않는다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | 필요한 콘텐츠 scope 확인 |
| `CHANNEL_NOT_FOUND`, 404, `HTTP_404` | 내 채널·포스트·시리즈 존재와 ID 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 403, 423 | 앱에서 자격·본인인증·계정 제한 확인 |
| `VALIDATION_ERROR`, 409 | 블록·상태·슬러그 중복 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED` | 복구까지 해당 작업 중단 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 결과 확인 전 자동 재실행 금지 |
