#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function parseArgs(argv) {
  const options = { dir: process.cwd(), port: '3000', host: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dir' || arg === '-d') {
      options.dir = resolve(argv[++i])
    } else if (arg === '--port' || arg === '-p') {
      options.port = argv[++i]
    } else if (arg === '--host') {
      options.host = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }
  return options
}

function printHelp() {
  console.log(`pulumi-package-docs [options]

Serves local documentation for the parameterized/local Pulumi providers used
by a Pulumi project.

Options:
  -d, --dir <path>   Pulumi project directory to inspect (default: current directory)
  -p, --port <port>  Port to serve on (default: 3000)
  --host             Expose the server on your network
  -h, --help         Show this help message
`)
}

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

if (!hasProductionBuild) {
  console.log(
    'No production build found, starting the dev server instead (this is slower).',
  )
}
console.log(`Serving provider docs for: ${options.dir}`)
console.log(`MCP endpoint: http://localhost:${options.port}/mcp`)

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
