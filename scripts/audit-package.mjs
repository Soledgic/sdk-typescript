#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sdkRoot = resolve(__dirname, '..')
const repoRoot = resolve(sdkRoot, '../..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmOptions = process.platform === 'win32' ? { shell: true } : {}
const rootPackagePath = resolve(repoRoot, 'package.json')
const sdkPackagePath = resolve(sdkRoot, 'package.json')

function fail(message) {
  throw new Error(message)
}

if (existsSync(rootPackagePath)) {
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'))
  if (rootPackage.name === 'soledgic' && rootPackage.private !== true) {
    fail('Root package.json must stay private to prevent accidental monorepo publish.')
  }
}

const sdkPackage = JSON.parse(readFileSync(sdkPackagePath, 'utf8'))
const expectedFilesField = ['dist', 'README.md']
if (JSON.stringify(sdkPackage.files || []) !== JSON.stringify(expectedFilesField)) {
  fail(`SDK package.json files must be exactly ${JSON.stringify(expectedFilesField)}.`)
}

for (const scriptName of ['preinstall', 'install', 'postinstall']) {
  if (sdkPackage.scripts?.[scriptName]) {
    fail(`SDK package must not define ${scriptName}; install lifecycle scripts reduce supply-chain trust.`)
  }
}

const requiredPackedFiles = [
  'README.md',
  'dist/index.d.mts',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.mjs',
  'package.json',
]

const allowedPackedFilePatterns = [
  /^package\.json$/,
  /^README\.md$/,
  /^LICENSE(\.md)?$/,
  /^dist\/[^/]+\.(js|mjs|d\.ts|d\.mts)$/,
]

const packOutput = execFileSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', resolve(tmpdir(), 'soledgic-sdk-pack-cache')],
  { cwd: sdkRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...npmOptions },
)
const packed = JSON.parse(packOutput)[0]
const packedFiles = packed.files.map((file) => file.path).sort()

for (const file of packedFiles) {
  if (!allowedPackedFilePatterns.some((p) => p.test(file))) {
    fail(`Unexpected file in SDK package: ${file}`)
  }
}

for (const file of requiredPackedFiles) {
  if (!packedFiles.includes(file)) {
    fail(`Expected SDK package file is missing: ${file}`)
  }
}

const forbiddenPathPatterns = [
  /^src\//,
  /^test/i,
  /^__tests__\//,
  /^dist\/postinstall\./,
  /^\.env/,
  /\.map$/,
  /supabase\//,
  /apps\//,
  /docs\//,
  /scripts\//,
]

for (const file of packedFiles) {
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) {
      fail(`SDK package contains forbidden path ${file} matching ${pattern}`)
    }
  }
}

const sensitivePatterns = [
  { name: 'live secret key', regex: /\bsk_live_[A-Za-z0-9_]+/ },
  { name: 'test secret key', regex: /\bsk_test_[A-Za-z0-9_]+/ },
  { name: 'live publishable key', regex: /\bpk_live_[A-Za-z0-9_]+/ },
  { name: 'webhook secret value', regex: /\bwhsec_(?!test\b|example\b|placeholder\b)[A-Za-z0-9_]+/ },
  { name: 'Soledgic webhook secret value', regex: /\b(?:slk_whsec_|wh_sec_slk_?)(?!example\b|placeholder\b)[A-Za-z0-9_]+/ },
  { name: 'Supabase service role env', regex: /\bSUPABASE_SERVICE_ROLE_KEY\b/ },
  { name: 'service_role token reference', regex: /\bservice_role\b/ },
  { name: 'Stripe secret env', regex: /\bSTRIPE_(?:TEST_)?SECRET_KEY\b/ },
  { name: 'Mercury integration detail', regex: /\bMERCURY_[A-Z0-9_]+|\bMercury\b|\bmercury\b/ },
  { name: 'Redis secret env', regex: /\bUPSTASH_[A-Z0-9_]+\b/ },
  { name: 'email provider secret env', regex: /\b(?:RESEND|SENDGRID)_API_KEY\b/ },
  {
    name: 'private or local URL',
    regex: /https?:\/\/(?:localhost|127\.0\.0\.1|[^/\s'"`]+\.supabase\.co|[^/\s'"`]+\.vercel\.app)/,
    skipFiles: [/^dist\/cli\./],
  },
  { name: 'env file reference', regex: /(?:^|[/\s])\.env(?:\.local|\.production|\.test)?\b/, skipFiles: [/^README\.md$/, /^dist\/cli\./] },
]

for (const file of packedFiles) {
  const filePath = resolve(sdkRoot, file)
  if (!existsSync(filePath)) continue
  const content = readFileSync(filePath, 'utf8')
  for (const pattern of sensitivePatterns) {
    if (pattern.skipFiles?.some((p) => p.test(file))) continue
    if (pattern.regex.test(content)) {
      fail(`SDK package file ${file} contains ${pattern.name}.`)
    }
  }
  if (/^dist\/cli\.(?:js|mjs)$/.test(file) && /github\.com\/soledgic\/sdk-typescript|soledgic\.com\/docs\/sdks|soledgic\.com\/support/.test(content)) {
    fail(`SDK CLI bundle ${file} appears to inline package metadata URLs; read package.json at runtime instead.`)
  }
}

console.log(`SDK package audit passed for ${sdkPackage.name}@${sdkPackage.version}: ${packedFiles.join(', ')}`)
