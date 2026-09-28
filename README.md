# CLACK 스킬

클랙 계정의 상품·콘텐츠·프로필과 크리에이터 콘텐츠·페이지·스킬 패키지·플랫폼 데이터를 AI 에이전트에서 관리하는 스킬 모음입니다. CLI를 사용하는 Claude Code·Codex·Cursor·Gemini CLI와 원격 MCP 클라이언트를 지원합니다.

> **공개 저장소입니다.** 클랙 CLI·스킬은 공개돼 있지만, 외부 도구 연결(계정 로그인·API 접근)은 단계적으로 여는 중입니다. 현재는 테스트(스테이징) 앱에 참여 중인 계정만 실제로 연결할 수 있고, 운영 계정은 아직 이용할 수 없습니다. 테스트 앱 사용자는 `clack config set env dev`로 전환하세요. 자세한 절차는 [clack-setup](clack-setup/SKILL.md)을 참조하세요.

```sh
npx skills add clack-project/skills
```

설치할 스킬과 에이전트는 대화형 화면에서 선택합니다. 프로젝트 설치가 기본이며, 전역 설치에는 `-g`를 사용합니다. 스킬 설치와 CLACK 계정 연결은 별도입니다. CLI 사용에는 Node.js 20 이상과 `@clack-platform/cli` 0.1.1 이상이 필요합니다. 0.1.0을 쓰고 있다면 `npm i -g @clack-platform/cli@latest`로 올리세요.

```sh
npm install -g @clack-platform/cli
clack login
clack doctor --json
```

테스트 앱 계정은 먼저 `clack config set env dev`를 실행한 뒤 위 순서대로 연결하세요. 이후 모든 명령이 이 환경을 따르므로 매 명령에 `--env dev`를 붙일 필요가 없습니다.

| 스킬 | 용도 |
|---|---|
| [clack-setup](clack-setup/SKILL.md) | CLI 설치·로그인·연결 진단·공통 사용 규칙 |
| [clack-products](clack-products/SKILL.md) | 상품 조회·등록·수정·상태 변경·끌올·삭제·일괄 작업 |
| [clack-content](clack-content/SKILL.md) | 게시판·피드 글과 댓글 관리 |
| [clack-channel](clack-channel/SKILL.md) | 채널 포스트·시리즈·마크다운 원고 |
| [clack-profile](clack-profile/SKILL.md) | 내 프로필·배송지·알림·계정 설정 |
| [clack-mcp](clack-mcp/SKILL.md) | 원격 MCP 연결·도구·이미지 업로드 |
| [clack-creator-content](clack-creator-content/SKILL.md) | 크리에이터 HTML/ZIP 작품 등록·업로드·심사·공개, 이미지 화보·캐릭터 자산 제작 |
| [clack-page](clack-page/SKILL.md) | 내 공개 홈·세계관 페이지 HTML 꾸미기, 앱 확인·심사·적용·복원 |
| [clack-skill-package](clack-skill-package/SKILL.md) | 클랙 플랫폼 스킬(제작 템플릿) 패키지 검사·업로드·심사·게시·지원종료 |
| [clack-platform-data](clack-platform-data/SKILL.md) | 콘텐츠 서버 키 사용량·데이터, 서버 키·공유 문서 관리, 로컬 플랫폼 MCP |

자기 계정에 허용된 작업만 수행합니다. 채팅·결제·탈퇴·계좌 변경은 지원하지 않습니다. 토큰은 채팅, 이슈, 저장소에 붙여 넣지 마세요. CLI는 디바이스 코드 로그인을 지원하며, 앱에서 연결 권한을 확인하고 폐기할 수 있습니다.

설치·갱신·제거와 대안은 [INSTALL.md](INSTALL.md), 변경 이력은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요. 버그와 제안은 GitHub 이슈로 받습니다. 외부 PR은 유지관리자의 검토 후 병합합니다.

## 개발 검증

```sh
npm ci --ignore-scripts
npm run lint
npm test
npx skills@1.7.0 add . --list
```

CI는 스킬 YAML, 300줄 상한, 저장소 내 링크, 플러그인 경로, 공개 문서의 URL·민감 문자열, 설치 스크립트 회귀를 검사합니다. 외부 링크는 HTTPS 형식을 검사하며 네트워크 가용성은 검증하지 않습니다. 스킬 변경 시 CLI 계약과 함께 확인하고 버전·변경 이력을 갱신합니다. 릴리스는 `v0.1.0` 형태의 Git 태그로 관리합니다.

[MIT 라이선스](LICENSE) · CLACK Inc.
