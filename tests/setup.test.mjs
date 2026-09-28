import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, readlink, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SKILLS, install, parseArgs, planInstallation } from '../scripts/setup.mjs';

async function fixture(t) {
  const base = await mkdtemp(join(tmpdir(), 'clack-skills-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = join(base, 'source with spaces');
  const userDir = join(base, 'isolated-user');
  const cwd = join(base, 'project');
  for (const name of SKILLS) {
    await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, name, 'SKILL.md'), `# ${name}\n`);
  }
  await mkdir(userDir);
  await mkdir(cwd);
  return { root, userDir, cwd, env: {}, base };
}

const quiet = { log: () => {} };

test('프로젝트의 공유 경로를 중복 생성하지 않고 재실행할 수 있다', async t => {
  const context = await fixture(t);
  const options = parseArgs(['--host', 'codex', '--host', 'cursor', '--scope', 'project', '--skip-cli']);
  const plan = await install(options, { context, ...quiet });
  assert.equal(plan.links.length, SKILLS.length);
  assert.equal(await readlink(join(context.cwd, '.agents/skills/clack-setup')), join(context.root, 'clack-setup'));
  const again = await install(options, { context, ...quiet });
  assert.ok(again.links.every(link => link.installed));
});

test('기존 파일과 끊어진 심링크 충돌은 다른 설치와 CLI 실행 전에 중단한다', async t => {
  for (const dangling of [false, true]) {
    const context = await fixture(t);
    const destination = join(context.userDir, '.agents/skills/clack-products');
    await mkdir(join(context.userDir, '.agents/skills'), { recursive: true });
    if (dangling) await symlink(join(context.base, 'missing'), destination);
    else await writeFile(destination, '사용자 파일');
    let calls = 0;
    await assert.rejects(install(parseArgs(['--host', 'codex']), { context, ...quiet, find: () => { calls++; } }), /기존 설치/);
    assert.equal(calls, 0);
    assert.deepEqual(await readdir(join(context.userDir, '.agents/skills')), ['clack-products']);
    if (!dangling) assert.equal(await readFile(destination, 'utf8'), '사용자 파일');
  }
});

test('dry-run은 파일과 subprocess를 만들지 않는다', async t => {
  const context = await fixture(t);
  let calls = 0;
  const plan = await install(parseArgs(['--host', 'claude-code', '--dry-run']), { context, ...quiet, find: () => { calls++; }, run: () => { calls++; } });
  assert.equal(plan.links.length, SKILLS.length);
  assert.deepEqual(await readdir(context.userDir), []);
  assert.equal(calls, 0);
});

test('CLI 미설치 시 인자를 분리해 설치하고 doctor 출력은 숨긴다', async t => {
  const context = await fixture(t);
  const calls = [];
  let installed = false;
  await install(parseArgs(['--host', 'codex']), {
    context, ...quiet,
    find: command => command === 'npm' ? '/safe path/npm' : installed ? '/safe path/clack' : null,
    run: (command, args, options) => { calls.push([command, args, options]); installed = true; return 0; },
  });
  assert.deepEqual(calls, [
    ['/safe path/npm', ['install', '-g', '@clack-platform/cli'], undefined],
    ['/safe path/clack', ['doctor', '--json'], { quiet: true }],
  ]);
});

test('npm 실패 시 스킬 링크를 만들지 않는다', async t => {
  const context = await fixture(t);
  await assert.rejects(install(parseArgs(['--host', 'codex']), {
    context, ...quiet, find: command => command === 'npm' ? '/npm' : null, run: () => 1,
  }), /CLI 설치에 실패/);
  assert.deepEqual(await readdir(context.userDir), []);
});

test('doctor 실패를 계정 연결 성공으로 표시하지 않는다', async t => {
  const context = await fixture(t);
  const logs = [];
  await install(parseArgs(['--host', 'codex']), { context, find: () => '/clack', run: () => 1, log: line => logs.push(line) });
  assert.ok(logs.some(line => line.includes('clack login')));
  assert.ok(!logs.some(line => line === 'CLACK 계정 연결을 확인했습니다.'));
});

test('호스트 감지와 명시적 설치 홈은 실제 시스템 설정과 분리된다', async t => {
  const context = await fixture(t);
  await mkdir(join(context.userDir, '.claude'));
  const detected = await planInstallation(parseArgs(['--skip-cli']), context);
  assert.deepEqual(detected.hosts, ['claude-code']);
  const custom = join(context.base, 'custom codex');
  context.env = { CODEX_HOME: custom };
  const respected = await planInstallation(parseArgs(['--host', 'codex']), context);
  assert.equal(respected.links[0].destination, join(context.userDir, '.agents/skills/clack-setup'));
  assert.equal(context.env.CODEX_HOME, custom);
  const isolated = await planInstallation(parseArgs(['--host', 'codex', '--home-dir', context.userDir]), context);
  assert.equal(isolated.links[0].destination, join(context.userDir, '.agents/skills/clack-setup'));
});

test('불명확한 옵션과 호스트는 실행 전에 거부한다', () => {
  assert.throws(() => parseArgs(['--host', 'codex;touch /tmp/unwanted']), /지원하지 않는/);
  assert.throws(() => parseArgs(['--scope', 'system']), /user 또는 project/);
  assert.throws(() => parseArgs(['--host']), /값이 필요/);
  assert.throws(() => parseArgs(['--force']), /알 수 없는/);
});
