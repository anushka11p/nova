// One-time setup for the AI server: creates ml/.venv and installs backend/requirements.txt.
// Usage: npm run setup:ai            (add --training to also install ml/requirements.txt)
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { IS_WINDOWS, ROOT, VENV, venvPython } from './python-env.mjs';

const SUPPORTED = ['3.13', '3.12', '3.11', '3.10']; // TensorFlow 2.21 supports Python 3.10 to 3.13
const training = process.argv.includes('--training');

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function versionOf(cmd, args) {
  const r = spawnSync(cmd, [...args, '-c', 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Finds a Python interpreter TensorFlow supports. */
function findPython() {
  const candidates = IS_WINDOWS
    ? [...SUPPORTED.map((v) => ['py', [`-${v}`]]), ['python', []]]
    : [...SUPPORTED.map((v) => [`python${v}`, []]), ['python3', []], ['python', []]];
  for (const [cmd, args] of candidates) {
    const v = versionOf(cmd, args);
    if (v && SUPPORTED.includes(v)) return { cmd, args, v };
  }
  return null;
}

if (!venvPython()) {
  const py = findPython();
  if (!py) {
    console.error(
      `\nNo supported Python found. TensorFlow needs Python ${SUPPORTED.at(-1)} to ${SUPPORTED[0]} (3.14 is not supported yet).\n` +
        (IS_WINDOWS
          ? 'Install Python 3.11 from https://www.python.org/downloads/ (tick "Add python.exe to PATH"), then run: npm run setup:ai\n'
          : 'Install it with: brew install python@3.11   then run: npm run setup:ai\n'),
    );
    process.exit(1);
  }
  console.log(`Creating ml/.venv with Python ${py.v}`);
  run(py.cmd, [...py.args, '-m', 'venv', VENV]);
}

const python = venvPython();
// Environments made by uv have no pip; bootstrap it if needed.
if (spawnSync(python, ['-m', 'pip', '--version'], { stdio: 'ignore' }).status !== 0) run(python, ['-m', 'ensurepip', '--upgrade']);
run(python, ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(python, ['-m', 'pip', 'install', '-r', join(ROOT, training ? 'ml/requirements.txt' : 'backend/requirements.txt')]);
console.log('\nAI server environment ready. Start everything with: npm run dev');
