---
name: clack-mcp
description: 클랙 원격 MCP를 연결하고 계정·권한 확인, 상품·콘텐츠·프로필 도구, 이미지 업로드를 수행한다. CLACK MCP, Claude Code, Codex remote MCP 설정 또는 CLI를 실행할 수 없는 클라이언트 작업에 사용한다.
---

# 클랙 원격 MCP

CLI 없이 사용할 수 있다. 설정 출력에 CLI를 쓰는 경우 최소 `clack >= 0.1.0`, Node.js 20 이상이 필요하다. 서버 주소는 환경마다 다르므로 외워 쓰지 않고 `clack mcp config`의 출력(기본은 운영)을 그대로 쓴다. 전송은 **Streamable HTTP**다. 요청마다 개인 액세스 토큰 인증을 사용하며 SSE 구독·GET 폴링 서버로 등록하지 않는다.

사용자가 테스트 앱(스테이징)·내부 테스트·개발 환경 참여자임을 밝히면 `clack mcp config --env dev`처럼 dev 환경으로 주소를 확인한다. 운영은 외부 도구 연결을 단계적으로 여는 중이라 기본 연결이 아직 실패할 수 있다.

## 연결과 비밀값

앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결**에서 필요한 권한만 가진 개인 액세스 토큰을 발급한다. 앱 세션·다른 종류의 키를 사용하지 않는다. 토큰을 채팅으로 요청하거나 원문을 설정 예시·명령 인자·공유 파일·커밋에 넣지 않는다.

호스트의 보호된 비밀 입력이나 프로세스 환경변수 `CLACK_TOKEN`으로 전달한다. 설정은 이 환경변수를 참조해야 하며 셸 확장으로 실제 토큰을 설정 파일에 쓰지 않는다. 임의 HTTP 도구·CDN·업로드 저장소에 PAT 헤더를 전달하지 않는다.

CLI가 있는 경우 원하는 호스트의 설정 예시를 생성한다. 이 명령은 설정을 출력하며 호스트에 등록하거나 자격 파일에서 토큰을 꺼내지 않는다. 기본값·`--print`는 `.mcp.json` 구조, `--claude`는 환경변수 참조를 보존한 `claude mcp add-json --scope project clack` 등록 명령, `--codex`는 `bearer_token_env_var`를 사용하는 TOML을 출력한다. `--json`은 URL·설정·등록 명령·안내를 JSON `data`로 반환한다.

```sh
clack mcp config --print
clack mcp config --claude
clack mcp config --codex
clack mcp config --json
```

사용자가 MCP 연결을 요청한 범위에서 출력 내용을 검토하고 해당 호스트의 설정으로 등록한다. 기존의 다른 MCP 설정은 보존한다. CLI가 없으면 호스트의 원격 MCP 등록 화면에서 아래 예시의 주소·전송·Bearer 인증을 설정한다. 호스트가 환경변수 참조나 안전한 인증 입력을 지원하지 않으면 토큰을 일반 파일에 박아 넣지 말고 지원되는 연결 방식을 사용한다.

아래 두 예시는 **운영** 주소다. 사용자가 테스트 앱 계정인데 CLI를 쓸 수 없다면 이 값을 그대로 쓰지 말고, Node.js가 있는 다른 터미널에서 `npx @clack-platform/cli mcp config --env dev --json`으로 실제 주소를 확인해 바꾸거나 사용자에게 정확한 주소를 문의한다.

Claude Code에 직접 등록할 때도 환경변수 참조를 작은따옴표 안에 유지한다. 다음 명령은 토큰 원문 없이 프로젝트의 `clack` 서버를 등록한다.

```sh
claude mcp add-json --scope project clack '{"type":"http","url":"https://v4-api.clack.kr/v4/mcp","headers":{"Authorization":"Bearer ${CLACK_TOKEN}"}}'
```

Codex의 경우 사용자 요청에 맞는 설정 범위의 TOML에 다음 항목을 병합하고 해당 프로세스에 `CLACK_TOKEN`을 안전하게 주입한다.

```toml
[mcp_servers.clack]
url = "https://v4-api.clack.kr/v4/mcp"
bearer_token_env_var = "CLACK_TOKEN"
```

## 시작 순서와 scope

연결 후 `get_guide({})` → `whoami({})` → `get_meta({})`를 호출한다. 계정 ID·토큰 ID·scope·기능·한도·게시판·상품 카테고리를 확인한다. 읽기와 쓰기 권한은 별개이며 도구 목록에는 현재 scope의 도구만 나타난다.

| scope | 작업 |
|---|---|
| `profile:read` / `profile:write` | 내 프로필·배송지 조회 / 수정·알림 설정 |
| `product:read` / `product:write` | 상품 조회·검색 / 등록·수정·상태·삭제 |
| `content:read` / `content:write` | 글·댓글·채널 조회 / 글·댓글·채널 포스트·시리즈 변경 |
| `product:write` 또는 `content:write` | 이미지 업로드 요청·완료 |

`write`가 `read`를 포함하지 않는다. 도구가 없다고 이름을 추측해 권한 밖 호출을 시도하지 않는다. 현재 MCP에는 채널 자체 생성·수정, 시리즈 삭제, 게시글 상품 연결, 비밀번호·이메일 인증 도구가 없다. 필요한 경우 사용자의 터미널 CLI나 앱으로 이어간다.

구체적인 도구와 입력 예시는 [references/tools.md](references/tools.md)를 읽는다. 로컬 이미지가 필요한 작업은 [references/uploads.md](references/uploads.md)를 읽는다. 원격 MCP는 사용자의 로컬 파일 경로를 읽을 수 없다.

## 실행과 확인

1. 사용자 요청에서 대상 계정·ID·변경 내용을 확정한다. 필요하면 목록과 상세를 조회한다. 새 상품·게시글은 바로 공개되며 채널 포스트 초안은 `status:"draft"`를 명시한다.
2. 삭제와 거래완료는 `confirm`을 생략하여 미리보기를 확인한다. 대상과 효과에 대한 사용자 승인이 있으면 같은 인자에 `confirm:true`를 넣어 실행한다. 이미 같은 대상·행위를 구체적으로 승인받았다면 다시 확인을 요구하지 않는다.
3. 결과의 `data`와 ID를 확인하고 필요한 조회로 반영 여부를 검증한다. `preview:true`는 실행 성공이 아니다. 알림 설정의 `completed`는 앞서 반영된 항목이므로 중간 실패 뒤 전체 변경을 재호출하지 않는다.

## 한도·시간·안전

- 대량 작업 전에 작업·이미지 수와 `get_meta`의 현재 한도를 알린다. 기본 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 상품 50개·글 50개·댓글 300개·채널 포스트 30개·이미지 200개다. 현재 서버 값이 우선하며 한도 값은 남은 할당량이 아니다.
- MCP 전송과 내부 API 요청은 각각 전체 요청 한도를 사용한다. 한 도구가 한 요청만 소비한다고 가정하지 않는다. 429의 `retry_after`를 지키고 토큰 변경·계정 전환으로 회피하지 않는다.
- 목록은 최대 50개이며 `pagination.has_more`와 반환된 `next_cursor` 또는 다음 `page`를 사용한다.
- 응답의 `time_contract`는 `utc-v1`이다. 준비되지 않은 레거시 시각은 빠지고 `omitted_legacy_times:true`로 표시될 수 있다. 빠진 시각을 추정해서 채우지 않는다. 생일은 날짜로 유지한다.
- 네트워크 실패·응답 유실·5xx 뒤 쓰기와 업로드 완료를 자동 재시도하지 않는다. 결과가 미확정인 경우 앱이나 조회로 확인한 뒤 다음 작업을 결정한다.
- 토큰·업로드 서명 URL·개인정보·비공개 원고를 공개 답변·로그·파일·커밋에 복사하지 않는다. 타인 콘텐츠 변경·스팸성 게시·앱의 본인인증·제재·채널 권한 우회를 하지 않는다.
- 채팅·결제·주문 처리·계좌·탈퇴는 제공하지 않는다. 상품 판매 상태와 실제 거래 처리를 혼동하지 않는다.

| 오류 | 대응 |
|---|---|
| `PAT_REQUIRED`, `PAT_EXPIRED`, `PAT_REVOKED`, 401 | 앱에서 토큰 상태 확인 후 안전하게 다시 연결 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN`, 403 | 현재 계정·허용 작업·필요한 scope 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인 |
| `INVALID_INPUT`, `VALIDATION_ERROR`, `INVALID_IMAGE_URL` | 도구 입력 스키마·메타·완료된 CDN 주소 확인 |
| `NOT_FOUND`, `CONFLICT` | ID·소유권·현재 상태·중복 확인 |
| 429 / `RATE_LIMITED` | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED`, `USER_API_MCP_DISABLED` | 기능 복구까지 해당 작업 중단 |
| `REQUEST_FAILED`, `INTERNAL_ERROR`, `OUTCOME_UNKNOWN` | 실제 반영 여부 확인 전 자동 재실행 금지 |
