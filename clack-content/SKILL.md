---
name: clack-content
description: 클랙 게시판·피드 글 작성과 수정·삭제, 댓글·답글, 글에 상품 연결을 수행한다. CLACK posts, feed, comments 작업에 사용한다. 채널 블록 포스트는 별도 채널 작업이다.
---

# 클랙 게시글과 댓글

요구 버전: `clack >= 0.1.1`, Node.js 20 이상. 조회는 `content:read`, 쓰기는 `content:write`다. CLI의 게시글 생성·수정은 게시판 조회도 하므로 두 scope가 필요하다. 상품 연결 전 상품을 조회하려면 `product:read`도 필요하다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`로 실행한다. `clack --version`, `clack doctor --json`으로 계정·권한·기능·한도를 확인한다. 필요한 경우 `clack login --scopes content:read,content:write --no-browser --no-qr`로 연결하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 코드 안내와 승인 대기·이어받기(`--no-wait`, `--resume`)는 `clack-setup`의 '로그인 승인 대기'를 따른다. 수동 토큰은 `clack login --token`의 숨김 입력 또는 안전한 `CLACK_TOKEN` 주입으로 전달한다.

## 게시판 확인과 작성

```sh
clack post boards --json
clack post list --all --json
clack post get 123 --json
clack post create -f post.json --dry-run --json
clack post create -f post.json --json
```

작성 전 [references/boards.md](references/boards.md)의 게시판 유형·제목·이미지 규칙을 읽는다. `board_id`와 `board_type`은 다르다. 목록에 있는 실제 `board_id`를 사용하고 `can_write:false`인 게시판에 쓰지 않는다.

```sh
clack post create --feed --content '확정한 게시글 본문' --images ./photo.jpg --dry-run --json
clack post update 123 --content-file revised.txt --dry-run --json
clack post update 123 --content-file revised.txt --json
clack post link-products 123 --ids 456 457 --dry-run --json
clack post link-products 123 --ids 456 457 --json
```

`create`는 바로 게시한다. 초안 작성만 요청받았다면 로컬 파일·미리보기까지 진행한다. `--feed`는 `board_id=challenge`를 선택하며 이미지 게시판 규칙을 따른다. 링크할 상품 ID와 원하는 최종 연결 목록을 확인한다. 연결 전에 본인의 상품인지 조회한다.

수정은 필요한 필드만 전달한다. `images`를 전달하면 원하는 최종 목록을 구성한다. 게시글 삭제는 연결된 댓글에도 영향을 준다. ID·게시글·영향을 확인하고 사용자가 구체적으로 승인한 경우 아래 명령을 실행한다. 순번·조건·"방금 쓴 것"처럼 대상을 지목만 했다면 해석한 실제 ID를 먼저 보여주고 확인받는다(`clack-setup`의 승인 기준 참고). 동일 대상·행위를 이렇게 구체적으로 승인받았다면 반복 확인하지 않는다. 여러 글을 한 번에 삭제·상태 변경할 때도 대상 표를 보여주고 1회 확인을 받는다(`clack-setup` 참고).

```sh
clack post delete 123 --yes --json
```

## 댓글·답글

```sh
clack comment list 123 --all --json
clack comment add 123 --content '사용자가 요청한 댓글' --dry-run --json
clack comment add 123 --content '사용자가 요청한 댓글' --json
clack comment add 123 --parent 234 --content '사용자가 요청한 답글' --json
```

댓글 생성은 지정 게시글에 새 댓글을 쓰는 작업이다. 타인의 기존 댓글은 변경·삭제할 수 없다. 답글은 한 단계만 지원하며 `--parent`는 부모 댓글 ID다. 수정 명령은 없다. 댓글 수정을 삭제·재작성으로 임의 대체하지 않는다. 삭제 대상을 순번·조건으로만 지목했다면 해석한 실제 댓글 ID를 먼저 보여주고, 본인 댓글 삭제를 구체적으로 승인받았을 때 `clack comment delete 123 234 --yes --json`을 사용한다.

## 한도·결과·안전

- 대량 게시 전 글·댓글·이미지 수와 `doctor`의 현재 한도를 알려준다. 기본 토큰당 10분 600회·시간당 쓰기 120회, 회원당 UTC 일일 글 50개·댓글 300개·이미지 200개이며 실제 서버 값이 우선한다. 스팸성 반복 게시와 한도 회피를 하지 않는다.
- `--dry-run`은 입력·파일 검증과 필요한 조회만 하며 서버 저장·업로드를 하지 않는다. 본문·이미지·게시판을 확정한 뒤 요청 범위대로 작성한다.
- `--json`의 `ok`, `data`, ID, `time_contract`를 확인한다. JSON 시각 원문과 `utc-v1|legacy-kst` 계약을 함께 유지한다. 생일·본문을 시각으로 변환하지 않는다. 사람용 UTC 출력은 `--time utc`다.
- 토큰·승인 코드·개인정보·비공개 원고·서명 URL을 공개 파일·로그·커밋에 남기지 않는다. 비밀값을 사용자에게 채팅으로 붙이게 하지 않는다.
- 네트워크 실패·응답 유실·5xx 뒤에는 글·댓글·이미지·연결 변경을 자동 재시도하지 않는다. 조회나 앱에서 반영 여부를 확인하고 중복 게시를 피한다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 앱에서 연결 상태 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN`, `FORBIDDEN` | 필요한 scope·게시판 작성 권한 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인, 우회 금지 |
| 404 / `NOT_FOUND`, `HTTP_404` | 게시글·부모 댓글 ID와 소유권 확인 |
| `VALIDATION_ERROR`, 409 | 게시판 유형·필수값·현재 상태 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED` | 기능 복구까지 중단 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 반영 여부 확인 전 자동 재실행 금지 |
