// Locates the AI server's Python environment (ml/.venv) on Windows, macOS and Linux.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const VENV = join(ROOT, 'ml', '.venv');
export const IS_WINDOWS = process.platform === 'win32';

/** Path to the venv's python, or null if the environment has not been created yet. */
export function venvPython() {
  const p = IS_WINDOWS ? join(VENV, 'Scripts', 'python.exe') : join(VENV, 'bin', 'python');
  return existsSync(p) ? p : null;
}
