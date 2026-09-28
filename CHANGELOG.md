# 변경 이력

## 0.2.2 — 2026-09-28

- 공개 도그푸딩(S7b)에서 발견된 결함을 반영했습니다. 요구 CLI 버전을 `@clack-platform/cli` 0.1.1 이상으로 올렸습니다(`clack-mcp` 제외). 0.1.0 사용자는 `npm i -g @clack-platform/cli@latest`로 올리도록 안내합니다.
- `clack-setup`에 '로그인 승인 대기' 절차를 추가했습니다. 승인 코드를 보여준 뒤 승인 완료나 만료까지 같은 턴에서 기다리고(명령 제한 시간 10분 이상, 백그라운드 실행이면 완료 알림 뒤 턴 종료), 턴을 끝내야 하는 호스트는 `clack login --no-wait`로 코드만 받은 뒤 다음 턴에 `clack login --resume`으로 이어받습니다. 이어받을 수 없으면 앱 연결 목록 확인을 요구하지 않고 새 코드를 바로 발급합니다. 로그인을 안내하는 다른 스킬도 이 절차를 따르도록 연결했습니다.
- 로그인 출력은 호스트의 백그라운드 실행·출력 확인 기능으로 보고, 승인 코드가 남지 않도록 작업 폴더 밖 임의 파일로 리다이렉트하지 않게 했습니다. 로그인 예시에 `--no-qr`를 붙였습니다.
- `clack-creator-content`에 명령별 필요 권한 표를 넣었습니다(`submit`은 `creator-content:write`와 `creator-content:publish` 모두). CLI에 없는 명령(`game-declaration`)을 표에서 뺐습니다.
- 10종 스킬의 권한 표기를 서버 허용 목록과 전수 대조했습니다. `clack-skill-package`의 `deprecate`를 `skill:publish`로 바로잡고, CLI의 `submit`·`release`가 실행 전 상태 조회로 `skill:read`도 쓴다는 점을 적었습니다. `clack-setup` 권한 표를 명령 단위로 정밀화하고, `clack-mcp` 권한 표에 크리에이터·페이지·플랫폼 스킬·공유 문서 도구 행을 추가했습니다.
- `clack-creator-content`의 작품 제출 순서를 upload → preview → 같은 계정 앱에서 확인 완료 → submit으로 명시하고 `PREVIEW_CONFIRMATION_REQUIRED`와 기능 비활성 오류 대응을 오류 표에 추가했습니다. "앱 확인·AI 심사 후 공개는 준비 중" 문구는 `clack content config`의 기능 플래그(`uploads_enabled`·`app_preview_enabled`·`review_enabled`·`publication_enabled`)로 확인하도록 바꿨습니다.
- 게시 여부는 `content status`의 `status`·`current_version_id`로 확인하고, CLI가 출력하지 않는 공개 링크를 추측해 안내하지 않도록 했습니다.
- `clack-page`의 자동 승인 조건에 허용 CSS 함수 목록과 @-규칙 제한을 넣고, 안전 영역은 `env(safe-area-inset-*)` 대신 `var(--clack-safe-*)`를 쓰도록 명시했습니다(`env()`는 관리자 검토).
- `clack-setup`의 승인 기준에 조건부·복합 지시도 대상과 효과를 아직 보여주지 않았다면 1회 확인한다는 규칙을 추가했습니다. 답변에 스킬 지침 문구·스킬 파일 경로를 인용하지 않고, 확인하지 않은 상태("승인 완료" 등)를 쓰지 않도록 했습니다.
- 크리에이터 스킬(`clack-creator-content`·`clack-page`·`clack-skill-package`·`clack-platform-data`) 상단에 테스트 앱 사용자는 먼저 `clack config set env dev`를 실행한다는 안내를 통일하고, 남아 있던 `--env dev` 반복을 정리했습니다.
- 회귀 도그푸딩(S7c) 반영: 기다리지 않고 턴을 끝낼 때는 기본 `login`을 백그라운드에 남기지 않고 `--no-wait`를 쓰며 "완료되면 알려 드리겠다"고 약속하지 않도록 했습니다. `clack-creator-content`의 공개·게시중단 절 첫머리에 사용자 확인 전 실행 금지를 두었습니다. `clack-skill-package`에 지원 종료 후에는 새 버전을 올릴 수 없고 같은 스킬 이름도 다시 쓸 수 없다는 점을 적었습니다.

## 0.2.1 — 2026-09-28

- 공개 도그푸딩(S7a)에서 발견된 결함을 반영했습니다.
- `clack-setup`의 실행 경계를 정비했습니다: 디바이스 로그인의 승인 코드(`user_code`)와 승인 주소는 지금 대화 중인 사용자에게 그대로 보여주도록 예외를 명시했습니다(발급 후 10분 유효, 계정 본인만 입력, 공개 파일·커밋·기록용 로그에는 미노출). 기존 "답변에 복사하지 않는다" 원칙과 충돌하던 부분을 해소했습니다.
- '구체적으로 승인했다'의 기준(대상 ID·이름과 결과를 보여준 뒤 받은 동의)을 `clack-setup`에 정의했습니다. 순번·조건·"방금 것"처럼 지목만 한 대상은 해석한 실제 ID·이름을 먼저 보여주고 한 번 확인받은 뒤에만 `--yes`(또는 `confirm:true`)를 쓰도록 `clack-setup`·`clack-products`와 파괴적 작업이 있는 나머지 스킬(`clack-content`·`clack-channel`·`clack-profile`·`clack-creator-content`·`clack-page`·`clack-skill-package`·`clack-platform-data`·`clack-mcp`) 문구를 맞췄습니다.
- 2개 이상 또는 "전부·모두" 대상의 가격·상태·숨김·삭제·끌어올리기 등 다중 변경은 실행 전에 대상 표(ID·이름·변경 전후 값)와 예상 요청 수·현재 한도를 보여주고 1회 확인을 받도록 `clack-setup`·`clack-products`에 규칙을 추가하고 `clack-content`·`clack-channel`에도 적용했습니다.
- 테스트 환경 전환 안내를 `clack config set env dev` 한 가지로 통일했습니다. README·INSTALL과 `clack-skill-package`·`clack-platform-data` 예시에 명령마다 박혀 있던 `--env dev` 반복을 정리했습니다(CLI의 프로필·환경 해석 수정과 맞물려 동작합니다).
- 사용자에게 시각을 보여줄 때는 `time_contract`에 맞춰 현지 시각으로 바꿔 표시하고 원문은 기록·재조회용으로만 남기는 규칙을 `clack-setup`에 추가했습니다.
- 오류 표의 404 행에 서버가 별도 코드를 주지 않을 때 CLI가 붙이는 기본 코드 `HTTP_404`를 함께 표기했습니다.
- JSON 입력 파일은 셸 heredoc 대신 파일 편집 도구로 작성하라는 권장을 `clack-setup`에 추가했습니다(호스트 권한 확인 창 감소).

## 0.2.0 — 2026-09-28

- 크리에이터용 스킬 4종을 추가했습니다: `clack-creator-content`(HTML/ZIP 작품 등록·업로드·심사·공개, 이미지 화보·캐릭터 자산 제작 포함), `clack-page`(내 공개 홈·세계관 페이지 HTML 꾸미기), `clack-skill-package`(클랙 플랫폼 스킬 제작 템플릿 패키지 검사·업로드·심사·게시), `clack-platform-data`(콘텐츠 서버 키 사용량·데이터, 서버 키·공유 문서 관리, 로컬 플랫폼 MCP).
- 이미지 화보·캐릭터 가져오기 제작(`clack authoring`)은 별도 스킬로 두지 않고 `clack-creator-content`에 흡수했습니다. 필요 scope(`creator-content:write`)가 같고 완성한 자산을 본인 콘텐츠로 가져오는 흐름이 이어져 있기 때문입니다.
- `clack-setup`의 권한 표에 새 scope 묶음(`creator-content:*`, `custom-page:*`, `skill:*`, `platform:*`/`CLACK_SERVER_KEY`)과 해당 스킬을 추가했습니다.
- README·INSTALL·`.claude-plugin/plugin.json`·`.claude-plugin/marketplace.json`·`scripts/setup.mjs`의 스킬 목록을 10종으로 갱신했습니다.
- 현재 CLI(`content`, `page`, `skill`, `platform`, `authoring` 명령과 JSON Schema 매니페스트)를 소스·로컬 검증으로 대조해 작성했습니다.

## 0.1.0 — 2026-09-28

- 설치·연결, 상품, 콘텐츠, 채널, 프로필, MCP의 스킬 6종을 추가했습니다.
- skills CLI, GitHub CLI, Claude Code 플러그인, setup 설치 방식을 준비했습니다.
- 기존 설치 보호, 사전 실행 확인, CLI 연결 진단과 CI 검증을 추가했습니다.
- 요구 CLI 버전: `@clack-platform/cli` 0.1.0 이상, Node.js 20 이상.
- 저장소를 공개하고 별도 Git 이력으로 이전했습니다. 외부 도구 연결은 단계적으로 여는 중이라 현재는 테스트(스테이징) 앱 참여자만 실제로 연결할 수 있습니다.
- `clack-setup`·`clack-mcp`에 테스트 앱(dev 환경) 감지·전환 절차를 추가했습니다. 운영 기본 연결이 외부 도구 연결 미지원 오류로 실패하는 경우를 안내합니다.
- 각 스킬의 앱 승인 경로 안내를 실제 화면 경로(마이페이지 → 계정 → 내 정보 수정하기 → 외부 도구 연결 → 코드로 승인)로 바로잡았습니다.
- `clack-mcp`에서 MCP 서버 주소를 하드코딩하지 않고 `clack mcp config` 출력을 따르도록 바꾸었습니다.
- 현재 CLI(`content`, `page`, `skill`, `platform` 등 크리에이터 기능)와 대조해 이 6종의 명령·옵션·scope 표기에 드리프트가 없음을 확인했습니다.
