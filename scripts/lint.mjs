import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { SKILLS } from './setup.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (file, message) => errors.push(`${relative(root, file)}: ${message}`);
const read = file => readFile(file, 'utf8');
const exists = async file => { try { await stat(file); return true; } catch { return false; } };

async function walk(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(item.name)) continue;
    const path = join(directory, item.name);
    if (item.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

for (const skill of SKILLS) {
  const file = join(root, skill, 'SKILL.md');
  if (!await exists(file)) { fail(file, '스킬 문서가 없습니다.'); continue; }
  const text = await read(file);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) { fail(file, 'YAML frontmatter가 필요합니다.'); continue; }
  try {
    const data = parse(match[1], { uniqueKeys: true });
    if (data?.name !== skill || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data?.name ?? '')) fail(file, 'name은 디렉터리명과 같은 kebab-case여야 합니다.');
    if (typeof data?.description !== 'string' || !data.description.trim()) fail(file, 'description이 필요합니다.');
  } catch (error) { fail(file, `YAML 오류: ${error.message}`); }
  if (text.trimEnd().split('\n').length > 300) fail(file, 'SKILL.md는 300줄 이하여야 합니다.');
  if (/\bTODO\b|\bFIXME\b|\[insert\b/i.test(text)) fail(file, '미완성 문구가 있습니다.');
}

for (const file of await walk(root)) {
  if (!/\.(md|json|ya?ml)$/.test(file) || file.endsWith('package-lock.json')) continue;
  const text = await read(file);
  if (/pat_[a-f0-9]{64}\b|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) fail(file, '민감한 값 형식이 발견되었습니다.');
  if (/https?:\/\/[^\s)'"<>]*(?:localhost|127\.0\.0\.1|(?:^|[.\/-])(?:dev|internal|staging)[.\/-])/.test(text)) fail(file, '공개하지 않는 환경 URL이 있습니다.');
  if (/클락|\bClack\b/.test(text)) fail(file, '브랜드 표기는 클랙 또는 CLACK입니다.');
  if (!file.endsWith('.md')) continue;
  const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1].split(/\s+['"]/)[0];
    if (/^https:\/\//.test(href)) {
      try { const url = new URL(href); if (url.username || url.password) fail(file, 'URL에 자격 증명이 있습니다.'); } catch { fail(file, `잘못된 URL: ${href}`); }
      continue;
    }
    if (/^(?:mailto:|#)/.test(href)) continue;
    if (/^[a-z]+:/i.test(href)) { fail(file, `HTTPS가 아닌 링크: ${href}`); continue; }
    const local = decodeURIComponent(href.split('#')[0]);
    const target = resolve(dirname(file), local);
    if (!target.startsWith(`${root}/`) || !await exists(target)) fail(file, `상대 링크를 찾을 수 없습니다: ${href}`);
  }
}

try {
  const plugin = JSON.parse(await read(join(root, '.claude-plugin/plugin.json')));
  const marketplace = JSON.parse(await read(join(root, '.claude-plugin/marketplace.json')));
  if (plugin.name !== 'clack' || plugin.license !== 'MIT') fail(root, '플러그인 이름·라이선스를 확인하세요.');
  if (JSON.stringify([...plugin.skills].sort()) !== JSON.stringify(SKILLS.map(name => `./${name}`).sort())) fail(root, '플러그인은 스킬 6종을 정확히 등록해야 합니다.');
  if (marketplace.name !== 'clack' || marketplace.plugins?.length !== 1 || marketplace.plugins[0].name !== 'clack' || marketplace.plugins[0].source !== './') fail(root, '마켓플레이스 등록이 일치하지 않습니다.');
  if (plugin.version !== marketplace.metadata?.version) fail(root, '플러그인·마켓플레이스 버전이 다릅니다.');
} catch (error) { fail(root, `플러그인 JSON 오류: ${error.message}`); }

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`CLACK 스킬 ${SKILLS.length}종과 패키징 검증을 통과했습니다.`);
