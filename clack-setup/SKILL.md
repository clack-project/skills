---
name: clack-setup
description: 클랙 CLI 설치·로그인·토큰 권한·doctor 오류를 설정하고 진단한다. CLACK CLI setup, login, authentication 작업에 사용한다.
---

# 클랙 연결과 공통 실행 규약

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. 이 스킬은 일반 사용자의 계정을 연결한다.
배포 여부와 계정별 사용 가능 여부는 실제 설치 결과와 `doctor`로 확인한다. 패키지가 아직 공개되지 않았거나 기능이 중단된 경우 우회 설치·접근을 시도하지 않는다.

## 연결

1. 사용자가 테스트 앱(스테이징)·내부 테스트·개발 환경 참여자임을 밝히면, 연결 전에 `clack config set env dev`를 실행하거나 이후 모든 명령에 `--env dev`를 붙인다. 운영(prod, 기본값)은 외부 도구 연결을 단계적으로 여는 중이라 아직 모든 계정에서 쓸 수 없다.
2. `clack --version`으로 설치·버전을 확인한다. 없으면 사용자의 CLI 설치 요청 범위에서 `npm install -g @clack-platform/cli`를 실행한다. 전역 설치가 맞지 않으면 `npx @clack-platform/cli --help`로 실행한다.
3. 이미 연결되어 있으면 `clack doctor --json`으로 계정·`scopes`·`expires_at`·`features`·`limits`를 확인한다. `profile:read`가 없으면 계정 이름은 표시되지 않을 수 있다.
4. 로그인이 필요하면 아래에서 작업에 필요한 권한만 요청한다. 읽기 권한과 쓰기 권한은 별개다. 기본 `clack login`은 `profile:read`만 요청한다.

| 작업 | scope |
|---|---|
| 프로필·배송지 조회 / 변경 | `profile:read` / `profile:write` |
| 상품 조회 / 변경 | `product:read` / `product:write` |
| 글·댓글·채널 조회 / 변경 | `content:read` / `content:write` |
| 새 이미지 업로드 | `product:write` 또는 `content:write` |

`creator-content`, `skill`, `platform`, `custom-page` 권한 묶음도 있지만 크리에이터 콘텐츠·페이지·스킬 패키지·플랫폼 데이터는 이 스킬 세트가 아직 다루지 않는다(추후 스킬 추가 예정). 사용자가 이 기능을 요청하면 CLI `--help`로 직접 확인하거나 다음 공개를 기다리도록 안내한다.

```sh
clack login --scopes profile:read,product:read,product:write --no-browser
clack whoami --json
clack doctor --json
```

연결한 서버가 외부 도구 연결을 아직 지원하지 않으면 CLI가 종료 코드 8과 `USER_API_UNAVAILABLE`을 반환한다. 이때 임의로 우회하지 말고 사용자에게 테스트 앱 사용 여부를 물은 뒤 필요하면 1번으로 돌아가 dev로 전환해 다시 연결한다. 이전 CLI는 같은 상황에서 `406 TIME_CONTRACT_NOT_READY`를 보여줄 수 있다.

앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 CLI가 표시한 코드를 입력하고 계정·기기·요청 권한을 확인해 승인한다. 승인 과정은 사용자가 수행한다. 승인 응답을 잃어버린 경우 앱의 연결 목록을 확인하고 새 로그인 필요 여부를 판단한다. 웹 승인 화면의 사용 가능성을 가정하지 않는다.

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
- `--dry-run`은 지원하는 변경 명령의 입력 검증·미리보기이며 업로드와 서버 변경을 하지 않는다. 필요한 조회는 수행할 수 있고 성공 실행을 보장하지 않는다. `login`은 지원하지 않는다.
- 대량 작업 전 예상 상품·글·댓글·이미지 수와 `doctor`의 현재 한도를 알려준다. 기본값은 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 상품 50개·글 50개·댓글 300개·채널 포스트 30개·이미지 200개다. 서버의 현재 값이 우선하며 남은 할당량을 의미하지 않는다.
- 429는 `retry_after`초 이상 기다린다. 토큰 재발급·계정 전환으로 한도를 회피하지 않는다. 네트워크 오류·응답 유실·5xx 뒤의 쓰기는 결과가 미확정이므로 자동 재시도하지 않는다. 대상 조회나 앱에서 반영 여부를 먼저 확인한다.

## 실행 경계

- 사용자가 요청한 계정·대상·변경 범위만 수행한다. 삭제·거래완료는 대상 ID와 결과를 보여준 뒤 사용자 확인을 받는다. 같은 대상·행위를 이미 구체적으로 승인했다면 반복 확인하지 않고 `--yes`를 사용한다.
- 쓰기 결과의 응답과 ID를 기록하고 필요한 조회로 확인한다. 짧은 조회 지연을 생성 실패로 단정해 재등록하지 않는다.
- 토큰·비밀번호·승인 코드·배송지·전체 프로필·업로드 서명 URL을 로그, 공개 파일, 커밋, 답변에 복사하지 않는다. 필요한 비밀값은 호스트의 안전한 입력 기능을 사용한다.
- 타인의 글·상품·댓글을 수정·삭제하지 않는다. 스팸성 반복 게시와 계정 제한·본인인증·채널 권한 우회를 하지 않는다. 본인인증은 앱에서 완료한다.
- 채팅·결제·주문 처리·계좌·탈퇴는 제공하지 않는다. 상품의 판매 상태 변경을 실제 결제·주문 처리로 설명하지 않는다.

## 오류 대응

| 종료 코드 / 오류 | 대응 |
|---|---|
| 3 / `LOGIN_REQUIRED`, `PAT_EXPIRED`, `PAT_REVOKED`, 401 | 앱의 연결 상태 확인 후 필요한 권한으로 다시 로그인 |
| 4 / `SCOPE_DENIED`, `PAT_FORBIDDEN` | 허용된 작업인지 확인하고 필요한 scope만 다시 승인 |
| 4 / `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증 또는 계정 제한 상태 확인 |
| 5 / 404 | ID와 소유권 확인. 임의의 다른 대상을 수정하지 않기 |
| 6 / `VALIDATION_ERROR`, `CONFLICT`, `CONFIRMATION_REQUIRED` | 입력·현재 상태·기존 승인 확인 후 해결 |
| 6 / `BATCH_FAILED` | 항목별 성공·실패·`OUTCOME_UNKNOWN` 구분 |
| 7 / 429 | `retry_after` 준수, 반복 즉시 호출 중단 |
| 8 / `USER_API_UNAVAILABLE` | 연결한 서버에 기능이 아직 없음. 테스트 앱 참여자면 `clack config set env dev` 후 다시 로그인 |
| 8 / `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, `USER_API_MCP_DISABLED` | 기능 복구까지 해당 작업 중단 |
| 1 / 네트워크·5xx, `OUTCOME_UNKNOWN` | 쓰기 결과 확인 전 자동 재실행 금지 |

## MCP·스킬 안내

`clack skills`는 설치 안내만 출력한다. `clack mcp config --print`, `--claude`, `--codex`는 설정 예시를 출력하며 등록하지 않는다. 실제 토큰을 출력하지 않는 환경변수 참조를 유지한다. MCP만 가능한 클라이언트는 `clack-mcp` 스킬 절차대로 `clack mcp config`(테스트 앱이면 `--env dev`)로 확인한 주소를 Streamable HTTP와 개인 액세스 토큰으로 연결하고 `get_guide` → `whoami` → `get_meta` 순으로 확인한다.
