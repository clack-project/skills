---
name: clack-setup
description: 클랙 CLI 설치·로그인·토큰 권한·doctor 오류를 설정하고 진단한다. CLACK CLI setup, login, authentication 작업에 사용한다.
---

# 클랙 연결과 공통 실행 규약

요구 버전: `clack >= 0.1.1`, Node.js 20 이상. 이 스킬은 일반 사용자의 계정을 연결한다.
배포 여부와 계정별 사용 가능 여부는 실제 설치 결과와 `doctor`로 확인한다. 패키지가 아직 공개되지 않았거나 기능이 중단된 경우 우회 설치·접근을 시도하지 않는다.

## 연결

1. 사용자가 테스트 앱(스테이징)·내부 테스트·개발 환경 참여자임을 밝히면, 연결 전에 `clack config set env dev`를 한 번 실행한다. 이후 로그인·조회·변경 등 모든 명령이 이 설정을 그대로 따르므로 매 명령에 `--env dev`를 따로 붙일 필요가 없다. 운영(prod, 기본값)은 외부 도구 연결을 단계적으로 여는 중이라 아직 모든 계정에서 쓸 수 없다.
2. `clack --version`으로 설치·버전을 확인한다. 없으면 사용자의 CLI 설치 요청 범위에서 `npm install -g @clack-platform/cli`를 실행한다. 0.1.0이면 로그인 대기 이어받기(`--no-wait`·`--resume`)가 없으므로 사용자에게 알리고 `npm i -g @clack-platform/cli@latest`로 올린다. 전역 설치가 맞지 않으면 `npx @clack-platform/cli@latest --help`로 실행한다.
3. 이미 연결되어 있으면 `clack doctor --json`으로 계정·`scopes`·`expires_at`·`features`·`limits`를 확인한다. `profile:read`가 없으면 계정 이름은 표시되지 않을 수 있다.
4. 로그인이 필요하면 아래에서 작업에 필요한 권한만 요청한다. 읽기 권한과 쓰기 권한은 별개다. 기본 `clack login`은 `profile:read`만 요청한다.

| 작업 | scope |
|---|---|
| 프로필·배송지 조회 / 변경 | `profile:read` / `profile:write` |
| 상품 조회 / 변경 | `product:read` / `product:write` |
| 글·댓글·채널 조회 / 변경 | `content:read` / `content:write` |
| 새 이미지 업로드 | `product:write` 또는 `content:write` |
| 크리에이터 HTML/ZIP 작품·이미지 제작(`clack-creator-content`) | 조회 `creator-content:read`, 등록·업로드·심사 취소·이미지 제작 `creator-content:write`, 심사 제출은 write와 `creator-content:publish` 모두, 재공개·게시중단 `creator-content:publish` |
| 내 공개 홈·세계관 페이지 꾸미기(`clack-page`) | 조회 `custom-page:read`, 등록·업로드 `custom-page:write`, 심사 제출은 write와 `custom-page:publish` 모두, 적용·복원·해제 `custom-page:publish` |
| 클랙 플랫폼 스킬(제작 템플릿) 패키지(`clack-skill-package`) | 조회 `skill:read`, 검증·업로드·취소 `skill:write`, 심사 제출은 write와 `skill:publish` 모두, 게시·지원 종료 `skill:publish`(CLI는 제출·게시 전에 상태를 조회하므로 `skill:read`도 함께) |
| 콘텐츠 서버 키·공유 문서 관리(`clack-platform-data`) | `platform:read` / `platform:write`(서버 키 자체 데이터 조회·쓰기는 `CLACK_SERVER_KEY`의 별도 `data:read`/`data:write`) |

```sh
clack login --scopes profile:read,product:read,product:write --no-browser --no-qr
clack whoami --json
clack doctor --json
```

연결한 서버가 외부 도구 연결을 아직 지원하지 않으면 CLI가 종료 코드 8과 `USER_API_UNAVAILABLE`을 반환한다. 이때 임의로 우회하지 말고 사용자에게 테스트 앱 사용 여부를 물은 뒤 필요하면 1번으로 돌아가 dev로 전환해 다시 연결한다. 이전 CLI는 같은 상황에서 `406 TIME_CONTRACT_NOT_READY`를 보여줄 수 있다.

앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 CLI가 표시한 코드를 입력하고 계정·기기·요청 권한을 확인해 승인한다. 승인 과정은 사용자가 수행하므로, CLI가 출력한 승인 코드(`user_code`)와 승인 주소는 지금 대화 중인 사용자에게 그대로 보여준다. 코드는 발급 후 10분만 유효하고 계정 소유자 본인만 입력해야 하며, 입력 경로(앱 마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결)를 함께 안내한다. 이는 '실행 경계'의 비밀값 비공개 원칙의 예외이며, 대화 표시와 별개로 공개 파일·커밋·기록용 로그에는 남기지 않는다. 웹 승인 화면의 사용 가능성을 가정하지 않는다.

### 로그인 승인 대기

`clack login`은 코드를 발급한 뒤 승인 완료나 만료(발급 후 10분)까지 기다렸다가 연결을 저장한다. 기다리는 프로세스가 도중에 끝나면 사용자가 앱에서 승인해도 연결이 저장되지 않으므로 다음을 지킨다.

1. 로그인은 호스트의 백그라운드 실행·실행 중 출력 확인 기능으로 실행하고, 출력에 코드가 나오면 바로 사용자에게 보여준다. 승인 코드가 파일에 남지 않도록 출력을 작업 폴더 밖 임의 파일(`/tmp/...` 등)로 리다이렉트하지 않는다.
2. 코드를 보여준 뒤 승인 완료나 만료까지 같은 턴에서 기다린다. 명령 제한 시간은 10분 이상으로 잡고, 백그라운드로 실행했다면 완료 알림(종료 출력)을 받은 뒤에 턴을 끝낸다.
3. 턴을 끝내야 사용자에게 코드가 전달되는 호스트라면 `--no-wait`로 코드만 받아 보여주고 턴을 끝낸다. 다음 턴에 `clack login --resume`으로 같은 요청을 이어받는다. `--resume`은 새 코드를 발급하지 않고 남은 유효 시간 동안 승인을 기다린다. 기다리지 않고 턴을 끝낼 때는 기본 `login`을 백그라운드에 남겨 두지 말고 `--no-wait`를 쓴다. 헤드리스·비대화형 실행에서는 턴이 끝나면 백그라운드 작업도 끝나므로 "완료되면 알려 드리겠다"고 약속하지 않고, "앱에서 승인한 뒤 알려 달라"고 안내한다.
4. 대기가 끊겼거나 다음 턴에 `LOGIN_REQUIRED`가 나오면 먼저 `clack login --resume`을 실행한다. 이어받을 요청이 없거나(`DEVICE_REQUEST_NOT_FOUND`) 만료·거부·이미 교부된 요청(`EXPIRED_TOKEN`, `ACCESS_DENIED`, `DEVICE_CODE_CONSUMED`)이면 사용자에게 앱의 연결 목록 확인을 요구하지 말고 바로 `clack login`으로 새 코드를 발급해 다시 안내한다. `DEVICE_REQUEST_ORIGIN_MISMATCH`는 `--env`·`--base-url` 없이 `--resume`을 다시 실행한다.
5. 연결 여부는 로그인 성공 출력이나 `clack whoami --json`으로만 판단한다. 확인하기 전에는 "승인 완료"·"연결됨" 같은 상태를 쓰지 않는다.

```sh
clack login --scopes profile:read,product:read --no-browser --no-qr --no-wait --json
clack login --resume
```

`--no-wait --json`은 `user_code`, `verification_uri_complete`, `expires_at`을 반환한다. `--resume`은 발급할 때 요청한 권한을 그대로 쓰므로 권한을 바꾸려면 새로 로그인한다. 두 옵션은 CLI 0.1.1부터 있다.

### 수동 토큰과 연결 관리

수동 토큰은 앱에서 발급하고 `clack login --token`의 숨김 입력에 붙여 넣는다. 비대화형 실행은 보호된 표준 입력 또는 `CLACK_TOKEN` 환경변수 주입을 사용한다. 채팅에 토큰을 붙이게 하거나 `--token <원문>`을 셸 기록에 남기지 않는다. `CLACK_TOKEN`은 저장된 토큰보다 우선하며 다른 계정으로 전환할 때도 남아 있을 수 있다.

```sh
clack token list --json
clack token list --cursor 123 --json
clack logout --json
```

`logout`은 현재 토큰을 서버에서 폐기한다. 단순 상태 확인에 실행하지 않는다. 특정 연결 폐기는 ID·기기를 먼저 확인하고, 사용자가 그 연결의 폐기를 요청했다면 `clack token revoke 123 --yes --json`으로 실행한다. 로그아웃 결과의 `server_revocation_confirmed:false`는 서버 폐기 완료가 아니므로 앱에서 확인한다. 환경변수로 연결했다면 사용자의 실행 환경에서도 해당 비밀값을 제거한다.

## 출력·시간·한도

- 자동 처리에는 `--json`을 사용한다. 성공은 `ok:true,data,pagination?,time_contract`, 실패는 `ok:false,status,code,message,retry_after?`다. 배치 실패는 `data`에 항목별 보고서도 포함한다.
- 목록은 `--limit 1~50`, `--cursor` 또는 `--all`을 사용한다. 반환된 커서를 그대로 사용한다.
- JSON 시각은 원문과 `time_contract`를 함께 유지한다. `utc-v1`과 `legacy-kst`를 혼합 해석하거나 문자열 끝의 `Z`만 보고 UTC로 단정하지 않는다. 사람이 읽는 출력은 `--time utc`로 실제 UTC 표시를 선택할 수 있다. 생일·본문·커서는 시각으로 변환하지 않는다.
- 사용자에게 시각을 보여줄 때(대화·표 등)는 `time_contract`에 맞춰 현지 시각으로 바꿔 표시하고, 원문(UTC ISO 또는 `legacy-kst` 문자열)은 기록·재조회용으로만 남긴다. 서로 다른 계약의 원문을 그대로 나열해 섞어 보여주지 않는다.
- `product.json`처럼 여러 줄의 JSON 입력 파일을 만들 때는 셸 heredoc보다 파일 편집 도구(Write/Edit 등)를 쓴다. 호스트의 명령 실행 권한 확인 창을 줄일 수 있다.
- `--dry-run`은 지원하는 변경 명령의 입력 검증·미리보기이며 업로드와 서버 변경을 하지 않는다. 필요한 조회는 수행할 수 있고 성공 실행을 보장하지 않는다. `login`은 지원하지 않는다.
- 대량 작업 전 예상 상품·글·댓글·이미지 수와 `doctor`의 현재 한도를 알려준다. 기본값은 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 상품 50개·글 50개·댓글 300개·채널 포스트 30개·이미지 200개다. 서버의 현재 값이 우선하며 남은 할당량을 의미하지 않는다.
- 2개 이상 또는 '전부·모두' 같은 대상의 가격·상태·숨김·삭제·끌어올리기 등을 한 번에 바꾸는 작업은, 실행 전에 대상 표(ID·이름·변경 전후 값)와 예상 요청 수·현재 한도를 보여주고 1회 확인을 받은 뒤 실행한다. `--dry-run` 미리보기만으로 이 확인을 대신하지 않는다.
- 429는 `retry_after`초 이상 기다린다. 토큰 재발급·계정 전환으로 한도를 회피하지 않는다. 네트워크 오류·응답 유실·5xx 뒤의 쓰기는 결과가 미확정이므로 자동 재시도하지 않는다. 대상 조회나 앱에서 반영 여부를 먼저 확인한다.

## 실행 경계

- 사용자가 요청한 계정·대상·변경 범위만 수행한다. 삭제·거래완료는 대상 ID와 이름(과 예상 결과)을 보여준 뒤 사용자 확인을 받는다. **'구체적으로 승인했다'는 대상 ID·이름(과 결과)을 사용자에게 보여준 뒤 받은 동의를 뜻한다.** 사용자가 순번('두 번째'), 조건('제일 비싼 것'), '방금 만든 것/그거'처럼 대상을 지목만 하고 에이전트가 실제 ID·이름으로 해석했다면 아직 구체적 승인이 아니므로, 해석한 대상을 보여주고 반드시 한 번 더 확인을 받는다. 조건부·복합 지시('공개됐으면 게시 중단해 줘', '올리고 바로 제출해 줘' 등)라도 그 파괴적 작업의 대상과 효과를 이 대화에서 아직 보여주지 않았다면, 조건을 확인한 뒤 대상과 효과를 보여주고 1회 확인을 받는다. 이렇게 구체적으로 승인받은 뒤에만 같은 대상·행위의 반복 확인 없이 `--yes`(또는 MCP의 `confirm:true`)를 사용한다.
- 쓰기 결과의 응답과 ID를 기록하고 필요한 조회로 확인한다. 짧은 조회 지연을 생성 실패로 단정해 재등록하지 않는다.
- 토큰·비밀번호·배송지·전체 프로필·업로드 서명 URL을 로그, 공개 파일, 커밋, 답변에 복사하지 않는다. 필요한 비밀값은 호스트의 안전한 입력 기능을 사용한다. 예외적으로 디바이스 로그인의 승인 코드(`user_code`)와 승인 주소는 지금 대화 중인 사용자에게 보여준다(위 '연결' 절 참고). 이 경우도 공개 파일·커밋·기록용 로그에는 남기지 않는다.
- 타인의 글·상품·댓글을 수정·삭제하지 않는다. 스팸성 반복 게시와 계정 제한·본인인증·채널 권한 우회를 하지 않는다. 본인인증은 앱에서 완료한다.
- 채팅·결제·주문 처리·계좌·탈퇴는 제공하지 않는다. 상품의 판매 상태 변경을 실제 결제·주문 처리로 설명하지 않는다.
- 사용자에게 하는 답변에 스킬 지침 문구나 스킬 파일 경로를 인용하지 않는다. 확인을 요청하는 이유는 사용자 관점의 말로 짧게 설명한다. 실제로 확인하지 않은 상태(승인 전의 "승인 완료" 등)를 요약·상태 줄에 쓰지 않는다.

## 오류 대응

| 종료 코드 / 오류 | 대응 |
|---|---|
| 3 / `LOGIN_REQUIRED` | 대기 중이던 로그인이 있었다면 먼저 `clack login --resume`, 없으면 필요한 권한으로 로그인 |
| 3 / `PAT_EXPIRED`, `PAT_REVOKED`, 401 | 필요한 권한으로 다시 로그인 |
| `login --resume`의 `DEVICE_REQUEST_NOT_FOUND`, `EXPIRED_TOKEN`, `ACCESS_DENIED`, `DEVICE_CODE_CONSUMED` | 이어받을 수 없는 요청. 앱 확인을 요구하지 말고 `clack login`으로 새 코드 발급 |
| 4 / `SCOPE_DENIED`, `PAT_FORBIDDEN` | 허용된 작업인지 확인하고 필요한 scope만 다시 승인 |
| 4 / `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증 또는 계정 제한 상태 확인 |
| 5 / 404, `HTTP_404`(서버가 별도 코드를 주지 않을 때 CLI 기본값) | ID와 소유권 확인. 임의의 다른 대상을 수정하지 않기 |
| 6 / `VALIDATION_ERROR`, `CONFLICT`, `CONFIRMATION_REQUIRED` | 입력·현재 상태·기존 승인 확인 후 해결 |
| 6 / `BATCH_FAILED` | 항목별 성공·실패·`OUTCOME_UNKNOWN` 구분 |
| 7 / 429 | `retry_after` 준수, 반복 즉시 호출 중단 |
| 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 아직 없음. 테스트 앱 참여자면 `clack config set env dev` 후 다시 로그인 |
| 8 / `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, `USER_API_MCP_DISABLED` | 기능 복구까지 해당 작업 중단 |
| 1 / 네트워크·5xx, `OUTCOME_UNKNOWN` | 쓰기 결과 확인 전 자동 재실행 금지 |

## MCP·스킬 안내

`clack skills`는 설치 안내만 출력한다. `clack mcp config --print`, `--claude`, `--codex`는 설정 예시를 출력하며 등록하지 않는다. 실제 토큰을 출력하지 않는 환경변수 참조를 유지한다. MCP만 가능한 클라이언트는 `clack-mcp` 스킬 절차대로 `clack mcp config`(테스트 앱이면 `--env dev`)로 확인한 주소를 Streamable HTTP와 개인 액세스 토큰으로 연결하고 `get_guide` → `whoami` → `get_meta` 순으로 확인한다.
