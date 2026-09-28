---
name: clack-profile
description: 클랙 내 프로필·판매자 소개·배송지·알림·선호 언어·비밀번호·알림 이메일을 관리한다. CLACK profile, address, notification settings 작업에 사용한다. 계좌·본인인증 실행·회원 탈퇴는 지원하지 않는다.
---

# 클랙 프로필과 배송지

요구 버전: `clack >= 0.1.0`, Node.js 20 이상. 조회는 `profile:read`, 변경은 `profile:write`다. 새 아바타 파일의 업로드에는 별도로 `product:write` 또는 `content:write`가 필요하다. 프로필 수정만 하려고 관련 없는 쓰기 권한을 자동 요청하지 말고 기존 클랙 CDN 이미지나 앱 변경을 사용할 수 있다.

CLI가 없으면 공개된 `@clack-platform/cli`를 설치하거나 `npx @clack-platform/cli`를 사용한다. `clack --version`, `clack doctor --json`으로 계정·권한·기능·한도를 확인한다. 필요할 때만 `clack login --scopes profile:read,profile:write --no-browser`를 실행하고 앱 **마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인**에서 사용자가 승인한다. 수동 토큰은 `clack login --token`의 숨김 입력이나 안전한 `CLACK_TOKEN` 주입으로 전달한다.

## 프로필·소개·알림

```sh
clack me get --json
clack me update --name '확정한 닉네임' --dry-run --json
clack me update --name '확정한 닉네임' --json
clack me seller-intro set '사용자가 확정한 판매자 소개' --json
clack me notifications set --marketing off --json
clack me notifications set --langs ko,en --json
clack me notifications set --allow-notification on --json
```

프로필 JSON은 `name`, `instagram`, `twitter`, `birth`, `avatar`, `allow_notification`을 지원한다. `name`은 1~16자, `birth`는 실제 날짜의 `YYYY-MM-DD`다. 아바타는 실제 클랙 CDN HTTPS URL 또는 로컬 이미지 파일을 사용한다. 생년월일을 임의로 채우지 않는다. 계좌 필드는 지원하지 않는다.

`notifications --langs`는 회원의 선호 언어다. CLI의 `config set lang ko`는 요청 언어 설정이므로 사용자 선호 언어 변경과 구분한다. 마케팅 동의를 일반 알림 허용에 자동으로 묶지 않는다. 여러 설정을 한 명령으로 바꾸면 순차 실행되므로 중간 실패 시 이미 반영된 값을 앱에서 확인한다. 전체 명령을 자동 재실행하지 않는다.

## 배송지

사용자 주소는 보호된 로컬 `address.json`으로 준비한다. 필수 키는 `name`, `contact`, `zipcode`, `address`, `address_detail`이고 모두 빈 값이 아니어야 한다. 선택 키는 `label`(최대 50자 또는 null), `is_default`(boolean)다. 실제 개인정보를 공개 예시나 공유 로그에 넣지 않는다.

```sh
clack me address list --json
clack me address add -f address.json --dry-run --json
clack me address add -f address.json --json
clack me address update 123 -f address-changes.json --json
clack me address default 123 --json
```

수정 파일에는 바꿀 필드만 넣는다. 삭제는 수령인·식별에 필요한 최소 주소·ID를 제시하고 구체적인 사용자 승인을 받은 뒤 `clack me address delete 123 --yes --json`을 실행한다. 같은 주소 삭제를 이미 승인했다면 반복 확인하지 않는다.

## 비밀번호와 알림 이메일

`clack me password change`는 대화형 터미널에서만 동작한다. 사용자가 현재 비밀번호·새 비밀번호·확인을 숨김 입력한다. 에이전트가 비밀번호를 채팅으로 요청하거나 파일·명령 인자로 전달하지 않는다. 대화형 입력을 제공할 수 없는 호스트에서는 앱에서 변경하도록 안내한다.

알림 이메일을 새로 설정할 때만 다음 단계를 진행한다. `send`는 실제 메일을 보내므로 사용자가 해당 주소의 인증을 요청한 범위에서 실행한다. 아래 주소·코드·ID는 예시이며 실제 입력으로 바꾼다.

```sh
clack me email send user@example.com --json
clack me email verify user@example.com 123456 --json
clack me email set --email user@example.com --verification-id 123 --enabled on --json
clack me email set --enabled off --json
```

인증 ID는 `verify`의 성공 응답 `verification_id`에서 가져오며 지어내지 않는다. 위 `verify`는 사용자 본인이 셸 기록을 끈 로컬 터미널에서 실행하는 형식 예시다. 에이전트 도구 호출·대화·답변에 실제 OTP를 담지 않는다. 안전한 로컬 입력을 보장할 수 없으면 앱에서 인증한다. 인증 메일 주소 변경은 로그인 이메일 전환이 아니다. 수신을 끄는 데 새 인증 메일을 보낼 필요가 없다.

## 한도·결과·안전

- 대량 변경 전 작업 개수와 `doctor`의 현재 한도를 알린다. 기본 토큰당 10분 600회·시간당 쓰기 120회이며 서버 현재 값이 우선한다. 새 이미지 업로드는 회원당 UTC 일일 이미지 한도도 소비한다(기본 200개).
- `--dry-run`은 미리보기이며 저장·메일 발송·업로드를 하지 않는다. 비밀번호 변경의 입력 검증은 여전히 대화형 입력이 필요하다.
- `--json`의 성공 여부·ID·`time_contract`를 확인한다. 시각 원문과 `utc-v1|legacy-kst`를 함께 유지하고 생일은 날짜로 유지한다. 사람용 UTC 출력은 `--time utc`다.
- 계정·배송지 전체 원문·연락처·토큰·비밀번호·OTP를 공개 파일·로그·커밋·답변에 복사하지 않는다. 조회 결과는 사용자 요청에 필요한 필드만 보여준다.
- 타인 계정·주소 변경, 본인인증·계정 제한 우회, 반복 인증 발송·한도 회피를 하지 않는다. 본인인증은 앱에서 진행한다.
- 네트워크 실패·응답 유실·5xx 뒤에는 주소 생성·정보 변경·인증 메일 발송을 자동 재시도하지 않는다. 앱이나 조회로 반영 여부를 먼저 확인한다.

| 오류 | 대응 |
|---|---|
| 401 / `PAT_EXPIRED`, `PAT_REVOKED` | 앱에서 연결 확인 후 다시 로그인 |
| `SCOPE_DENIED`, `PAT_FORBIDDEN` | 필요한 profile 권한·별도 이미지 업로드 권한 확인 |
| `IDENTITY_VERIFICATION_REQUIRED`, `USER_BANNED`, 423 | 앱에서 본인인증·계정 제한 확인 |
| `TTY_REQUIRED` | 사용자의 대화형 터미널 또는 앱 사용 |
| 404 / `NOT_FOUND` | 배송지 ID와 소유권 확인 |
| `VALIDATION_ERROR`, 409 | 필드·현재 상태·인증 결과 확인 |
| 429 | `retry_after`초 이상 대기 |
| `USER_API_DISABLED`, `USER_API_WRITE_DISABLED` | 해당 기능 복구까지 중단 |
| `OUTCOME_UNKNOWN`, 네트워크·5xx | 결과 확인 전 자동 재실행 금지 |
