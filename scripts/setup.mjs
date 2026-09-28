import { access, lstat, mkdir, readlink, realpath, symlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, delimiter, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export const SKILLS = ['clack-setup', 'clack-products', 'clack-content', 'clack-channel', 'clack-profile', 'clack-mcp',
  'clack-creator-content', 'clack-page', 'clack-skill-package', 'clack-platform-data'];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const HOSTS = {
  'claude-code': { config: '.claude', project: '.claude/skills' },
  codex: { config: '.codex', project: '.agents/skills' },
  cursor: { config: '.cursor', project: '.agents/skills' },
  'gemini-cli': { config: '.gemini', project: '.agents/skills' },
  antigravity: { config: '.gemini/antigravity', project: '.agents/skills' },
  'antigravity-cli': { config: '.gemini/antigravity-cli', project: '.agents/skills' },
  'github-copilot': { config: '.copilot', project: '.agents/skills' },
  opencode: { config: '.config/opencode', project: '.agents/skills' },
  windsurf: { config: '.codeium/windsurf', project: '.windsurf/skills' },
};

export function parseArgs(args) {
  const options = { hosts: [], scope: 'user', dryRun: false, skipCli: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--skip-cli') options.skipCli = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--host', '--scope', '--project-dir', '--home-dir'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} 값이 필요합니다.`);
      if (arg === '--host') options.hosts.push(...value.split(','));
      else if (arg === '--scope') options.scope = value;
      else if (arg === '--project-dir') options.projectDir = resolve(value);
      else options.homeDir = resolve(value);
    } else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  if (!['user', 'project'].includes(options.scope)) throw new Error('--scope은 user 또는 project입니다.');
  for (const host of options.hosts) if (!Object.hasOwn(HOSTS, host)) throw new Error(`지원하지 않는 호스트: ${host}`);
  options.hosts = [...new Set(options.hosts)];
  return options;
}

async function statOrNull(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function configDirectory(host, options, env, userDir) {
  if (!options.homeDir) {
    if (host === 'codex' && env.CODEX_HOME) return resolve(env.CODEX_HOME);
    if (host === 'claude-code' && env.CLAUDE_CONFIG_DIR) return resolve(env.CLAUDE_CONFIG_DIR);
    if (host === 'opencode' && env.XDG_CONFIG_HOME) return join(resolve(env.XDG_CONFIG_HOME), 'opencode');
  }
  return join(userDir, HOSTS[host].config);
}

export async function planInstallation(options, context = {}) {
  const root = context.root ?? ROOT;
  const env = context.env ?? process.env;
  const userDir = options.homeDir ?? context.userDir ?? homedir();
  const projectDir = options.projectDir ?? context.cwd ?? process.cwd();
  let hosts = options.hosts;
  if (!hosts.length) {
    hosts = [];
    for (const host of Object.keys(HOSTS)) {
      if (await statOrNull(configDirectory(host, options, env, userDir))) hosts.push(host);
    }
  }
  if (!hosts.length) throw new Error('에이전트를 감지하지 못했습니다. --host로 설치 대상을 지정하세요.');
  const links = new Map();
  for (const name of SKILLS) {
    const source = await realpath(join(root, name));
    await access(join(source, 'SKILL.md'), constants.R_OK);
    for (const host of hosts) {
      const parent = options.scope === 'project'
        ? join(projectDir, HOSTS[host].project)
        : host === 'codex' ? join(userDir, '.agents/skills') : join(configDirectory(host, options, env, userDir), 'skills');
      const destination = join(parent, name);
      const current = await statOrNull(destination);
      let installed = false;
      if (current?.isSymbolicLink()) {
        const target = await readlink(destination);
        try { installed = await realpath(resolve(dirname(destination), target)) === source; } catch {}
      }
      if (current && !installed) throw new Error(`기존 설치를 보존하기 위해 중단합니다: ${destination}`);
      links.set(destination, { source, destination, installed });
    }
  }
  return { hosts, links: [...links.values()] };
}

export async function findExecutable(command, env = process.env) {
  for (const directory of (env.PATH ?? '').split(delimiter)) {
    if (!directory || !isAbsolute(directory)) continue;
    const path = join(directory, command);
    try { await access(path, constants.X_OK); return path; } catch {}
  }
  return null;
}

export function runCommand(command, args, { quiet = false } = {}) {
  const result = spawnSync(command, args, {
    shell: false, stdio: quiet ? 'pipe' : 'inherit', timeout: quiet ? 30_000 : 180_000,
    maxBuffer: 1024 * 1024,
  });
  return result.error ? 1 : (result.status ?? 1);
}

export async function install(options, dependencies = {}) {
  const log = dependencies.log ?? console.log;
  const find = dependencies.find ?? findExecutable;
  const run = dependencies.run ?? runCommand;
  const plan = await planInstallation(options, dependencies.context);
  log(`설치 대상: ${plan.hosts.join(', ')} (${options.scope})`);
  for (const item of plan.links) log(`${item.installed ? '유지' : '연결'}: ${item.destination} → ${item.source}`);
  if (options.dryRun) {
    if (!options.skipCli) log('실행 예정: 필요 시 npm install -g @clack-platform/cli, 이후 clack doctor --json');
    log('사전 확인 완료: 파일·CLI·네트워크를 변경하지 않았습니다.');
    return plan;
  }
  let cli;
  if (!options.skipCli) {
    cli = await find('clack');
    if (!cli) {
      const npm = await find('npm');
      if (!npm) throw new Error('npm을 찾을 수 없습니다. Node.js 20 이상을 설치하세요.');
      if (await run(npm, ['install', '-g', '@clack-platform/cli']) !== 0) throw new Error('CLI 설치에 실패했습니다. 사용자 소유 npm 전역 경로를 확인하세요.');
      cli = await find('clack');
      if (!cli) throw new Error('설치한 clack을 PATH에서 찾을 수 없습니다. npm 전역 실행 경로를 확인하세요.');
    }
  }
  for (const item of plan.links) {
    if (item.installed) continue;
    await mkdir(dirname(item.destination), { recursive: true });
    // 경쟁 중 생긴 기존 파일도 symlink의 EEXIST 오류로 보존합니다.
    await symlink(item.source, item.destination, 'dir');
  }
  log('CLACK 스킬 설치를 완료했습니다. 에이전트 세션을 다시 시작하세요.');
  if (cli) {
    const status = await run(cli, ['doctor', '--json'], { quiet: true });
    log(status === 0 ? 'CLACK 계정 연결을 확인했습니다.' : '연결 확인이 필요합니다. clack login 또는 clack doctor --json을 직접 실행하세요.');
  }
  return plan;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('사용법: ./setup [--host 이름] [--scope user|project] [--project-dir 경로] [--home-dir 경로] [--skip-cli] [--dry-run]');
    console.log(`지원 호스트: ${Object.keys(HOSTS).join(', ')}`);
    return;
  }
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Node.js 20 이상이 필요합니다.');
  if (process.platform === 'win32') throw new Error('Windows에서는 npx skills add 또는 WSL을 사용하세요.');
  await install(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`설치 실패: ${error.message}`); process.exitCode = 1; });
}
