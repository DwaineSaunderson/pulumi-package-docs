#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { parseArgs, printHelp } from './args.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const options = parseArgs(process.argv.slice(2))

if (options.help) {
  printHelp()
  process.exit(0)
}

const vitePkgJson = require.resolve('vite/package.json')
const viteBin = join(dirname(vitePkgJson), 'bin', 'vite.js')

const hasProductionBuild = existsSync(
  join(packageRoot, 'dist', 'server', 'server.js'),
)
const viteArgs = [
  hasProductionBuild ? 'preview' : 'dev',
  '--port',
  options.port,
]
if (options.host) viteArgs.push('--host')
if (options.open) viteArgs.push('--open')

if (!hasProductionBuild) {
  console.log(
    'No production build found, starting the dev server instead (this is slower).',
  )
}
console.log(`Serving provider docs for: ${options.dir}`)

const child = spawn(process.execPath, [viteBin, ...viteArgs], {
  cwd: packageRoot,
  stdio: 'inherit',
  env: { ...process.env, PULUMI_LOCAL_DOCS_DIR: options.dir },
})

child.on('exit', (code) => process.exit(code ?? 0))
child.on('error', (err) => {
  console.error('Failed to start pulumi-package-docs:', err)
  process.exit(1)
})
