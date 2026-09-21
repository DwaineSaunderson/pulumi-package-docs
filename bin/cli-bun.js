#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { parseArgs, printHelp } from './args.js'
import server from '../dist/server/server.js'
import embeddedAssets from './embedded-assets.generated.js'

const options = parseArgs(process.argv.slice(2))

if (options.help) {
  printHelp()
  process.exit(0)
}

process.env.PULUMI_LOCAL_DOCS_DIR = options.dir

function openBrowser(url) {
  const command =
    process.platform === 'darwin'
      ? ['open', url]
      : process.platform === 'win32'
        ? ['cmd', '/c', 'start', '', url]
        : ['xdg-open', url]
  const child = spawn(command[0], command.slice(1), {
    stdio: 'ignore',
    detached: true,
  })
  child.on('error', (err) => {
    console.error(`Could not open browser: ${err.message}`)
  })
  child.unref()
}

console.log(`Serving provider docs for: ${options.dir}`)

const bunServer = Bun.serve({
  port: Number(options.port),
  hostname: options.host ? '0.0.0.0' : undefined,
  async fetch(request) {
    const url = new URL(request.url)
    const embeddedPath = embeddedAssets[url.pathname]
    if (embeddedPath) {
      return new Response(Bun.file(embeddedPath))
    }
    return server.fetch(request)
  },
})

const localUrl = `http://localhost:${bunServer.port}/`
console.log(`  ➜  Local:   ${localUrl}`)
console.log(`  ➜  MCP:     ${new URL('mcp', localUrl)}`)

if (options.open) openBrowser(localUrl)
