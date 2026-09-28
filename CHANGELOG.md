# 변경 이력

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
