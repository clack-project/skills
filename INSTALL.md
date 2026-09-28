# CLACK 스킬 설치

클랙 CLI·스킬 저장소는 공개돼 있습니다. 아래 방법 중 하나를 선택하세요. 여러 방법을 함께 사용하면 같은 스킬이 중복으로 노출될 수 있습니다. 외부 도구 연결(계정 로그인)은 단계적으로 여는 중이라 현재는 테스트(스테이징) 앱 참여자만 실제로 연결할 수 있으며, 운영 계정 연결은 이후 순차 공개됩니다. 환경 전환은 [clack-setup](clack-setup/SKILL.md)을 참조하세요.

## 1. 권장: skills CLI

Node.js와 npm이 있는 터미널에서 실행합니다.

```sh
npx skills add clack-project/skills
```

기본은 현재 프로젝트 설치입니다. 설치 화면에서 스킬·에이전트를 선택하고 파일을 확인하세요. 전체 CLACK 스킬을 지정한 에이전트에 설치하려면 다음을 사용합니다.

```sh
npx skills add clack-project/skills --skill '*' --agent claude-code codex
npx skills add clack-project/skills --skill '*' --agent codex -g
npx skills add clack-project/skills --skill clack-setup clack-products --agent cursor
```

선택 설치에서는 로그인·공통 절차용 `clack-setup`을 함께 설치하세요. `--copy`는 심링크 대신 복사하며, `--all`은 감지된 대상만이 아니라 모든 지원 에이전트를 선택하므로 필요한 범위를 먼저 정하세요.

```sh
npx skills list
npx skills list -g
npx skills update
npx skills remove clack-products --agent cursor
npx skills remove clack-products --agent codex -g
```

공유 경로에 설치된 스킬을 제거하면 그 경로를 읽는 다른 에이전트에도 영향이 있으므로 설치 목록과 경로를 함께 확인하세요.

현행 Codex의 공식 사용자 스킬 경로는 `~/.agents/skills`입니다. `skills@1.7.0`의 기본 설치를 격리 환경에서 확인했으며 Codex·Cursor·Gemini CLI는 프로젝트와 사용자 범위에서 `.agents/skills`를 공유하고, Claude Code는 `.claude/skills`를 사용합니다. `--copy` 모드는 호스트별 경로를 사용할 수 있으므로 설치 결과에 표시된 경로를 확인하세요. setup은 Codex 사용자 스킬을 `~/.agents/skills`에 연결합니다. [Codex 공식 설치 경로](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)를 참조하세요.

설치 위치와 옵션은 [skills 공식 문서](https://github.com/vercel-labs/skills#readme)를 따릅니다. 이 저장소의 CI 탐색 검증은 `skills@1.7.0`을 사용합니다.

## 2. GitHub CLI

`gh skill --help`가 제공되는 GitHub CLI를 사용합니다. 스킬 기능은 현재 preview이며 버전에 따라 옵션이 달라질 수 있습니다.

```sh
gh skill install clack-project/skills
gh skill install clack-project/skills clack-products --agent codex --scope user
gh skill install clack-project/skills clack-setup --agent codex --scope user
```

기본 범위는 프로젝트이며 사용자 범위는 `--scope user`입니다. 갱신은 `gh skill update --all`을 사용합니다. 제거는 현재 설치 위치를 `gh skill list`로 확인한 뒤 해당 스킬 디렉터리만 삭제합니다. [공식 설치 문서](https://cli.github.com/manual/gh_skill_install)와 [preview 안내](https://cli.github.com/manual/gh_skill)를 확인하세요.

## 3. Claude Code 플러그인

Claude Code 안에서 실행합니다.

```text
/plugin marketplace add clack-project/skills
/plugin install clack@clack
```

터미널에서 갱신하거나 제거할 수 있습니다.

```sh
claude plugin marketplace update clack
claude plugin update clack@clack
claude plugin uninstall clack@clack
```

설치 화면에서 범위를 확인하고 세션을 다시 시작하거나 `/reload-plugins`를 실행하세요. 플러그인은 스킬만 제공하며 토큰·MCP 서버 설정을 자동으로 추가하지 않습니다. [공식 마켓플레이스 문서](https://code.claude.com/docs/en/plugin-marketplaces)와 [플러그인 참조](https://code.claude.com/docs/en/plugins-reference)를 따릅니다.

## 4. 저장소 복제 + setup

macOS·Linux·WSL에서 Node.js 20 이상과 npm을 사용합니다. Windows 네이티브 환경에서는 `npx skills add`와 `--copy`를 사용하세요.

```sh
git clone --depth 1 https://github.com/clack-project/skills.git
cd skills
./setup --dry-run
./setup --host codex
```

`setup`은 기본적으로 사용자 범위에 설치합니다. `--host`를 생략하면 에이전트 설정 디렉터리를 감지합니다. 지원 호스트는 `claude-code`, `codex`, `cursor`, `gemini-cli`, `antigravity`, `antigravity-cli`, `github-copilot`, `opencode`, `windsurf`입니다. 다른 호스트는 skills CLI를 사용하세요.

```sh
./setup --host claude-code --host codex
./setup --host codex --scope project --project-dir /path/to/project
./setup --host codex --home-dir /path/to/isolated-user --dry-run
./setup --host codex --skip-cli
```

`--home-dir`는 설치 대상만 명시적으로 바꾸며 셸의 홈·에이전트 환경 변수는 수정하지 않습니다. 지정하면 감지에 사용자 정의 Codex·Claude·XDG 설정 경로를 사용하지 않습니다. `--skip-cli`는 CLI 설치와 진단을 건너뛰며 MCP 전용 환경에서 사용할 수 있습니다. `--dry-run`은 파일 생성, CLI 실행, 네트워크 요청을 하지 않습니다.

설치 순서:

1. 스킬 원본과 모든 대상 경로를 검사합니다. 기존 디렉터리·파일·다른 심링크가 하나라도 있으면 설치를 중단합니다. 같은 원본을 가리키는 링크만 재사용합니다.
2. `clack`이 없으면 `npm install -g @clack-platform/cli`를 실행합니다. 시스템 권한이 부족하면 종료하므로 사용자 소유 npm 전역 경로를 설정한 뒤 다시 실행하세요.
3. 원본 저장소를 가리키는 심링크를 생성합니다. 복제한 저장소는 설치 후에도 유지하세요.
4. `clack doctor --json`으로 연결 상태를 확인합니다. 개인 진단 출력은 표시하지 않습니다. 실패하면 `clack login` 또는 `clack doctor --json`으로 직접 확인하도록 안내합니다. 로그인과 권한 승인은 자동으로 수행하지 않습니다.

갱신은 복제한 저장소에서 `git pull --ff-only` 후 `./setup --dry-run`으로 확인합니다. 제거 시 dry-run에 표시된 각 `clack-*` 링크의 대상을 확인하고 그 링크만 삭제하세요. 원본이나 다른 설치를 덮어쓰는 강제 옵션은 제공하지 않습니다.

## CLACK 계정 연결

스킬만 설치하는 1~3번 방식에서는 CLI를 별도로 설치합니다.

```sh
npm install -g @clack-platform/cli
clack login
clack doctor --json
```

Node.js 20 이상, CLI 0.1.0 이상이 필요합니다. 앱에서 표시된 연결 요청의 권한·만료를 확인하고 승인하세요. 토큰을 명령행 인자나 대화에 복사하지 마세요. CLI를 설치할 수 없는 클라이언트는 [clack-mcp](clack-mcp/SKILL.md)를 참조하세요. 테스트(스테이징) 앱 계정이면 `clack login --env dev`(또는 먼저 `clack config set env dev`)로 연결하세요. 운영에서 API 접근이 비활성화되어 있으면 스킬 설치만으로 접근이 허용되지 않습니다.
