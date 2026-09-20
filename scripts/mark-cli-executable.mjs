import { chmodSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'win32') {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  chmodSync(resolve(packageRoot, 'dist/cli.js'), 0o755)
}
