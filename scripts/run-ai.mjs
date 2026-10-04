// Starts the AI server (backend/app.py) with ml/.venv on any OS, or explains how to set it up.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, venvPython } from './python-env.mjs';

const python = venvPython();
if (!python) {
  console.error('\n[AI server] Not set up yet: the Python environment ml/.venv is missing.\n[AI server] Run once:  npm run setup:ai   then: npm run dev\n');
  process.exit(1);
}

const check = spawnSync(python, ['-c', 'import tensorflow, flask, flask_cors, PIL'], { encoding: 'utf8' });
if (check.status !== 0) {
  console.error(`\n[AI server] Python packages are missing:\n${check.stderr.trim().split('\n').at(-1)}\n[AI server] Fix with:  npm run setup:ai\n`);
  process.exit(1);
}

if (!existsSync(join(ROOT, 'nova_jaundice.keras'))) {
  console.error('\n[AI server] The model file nova_jaundice.keras is missing from the project folder. Pull it from GitHub again.\n');
  process.exit(1);
}

const server = spawn(python, [join(ROOT, 'backend', 'app.py')], { stdio: 'inherit', cwd: ROOT });
server.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.kill(sig));
