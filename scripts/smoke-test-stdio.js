#!/usr/bin/env node
// End-to-end smoke test for `--stdio`: spawns the given command as an MCP server
// and drives it with a real MCP client over stdio.
//
// The Node and Bun entry points resolve the stdio server differently (bin/cli.js
// imports the built dist/mcp/stdio.js, bin/cli-bun.js imports the TypeScript
// source), so CI runs this against both. A handshake here also proves stdout
// carries nothing but JSON-RPC — any stray banner on it fails the client's parse.
//
// Usage: node scripts/smoke-test-stdio.js <command> [...args]
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const EXPECTED_TOOLS = [
  'get_function',
  'get_resource',
  'list_functions',
  'list_providers',
  'list_resources',
  'search_members',
]

const [command, ...args] = process.argv.slice(2)
if (!command) {
  console.error('Usage: node scripts/smoke-test-stdio.js <command> [...args]')
  process.exit(1)
}

function assertDeepEqual(actual, expected, what) {
  const [a, b] = [JSON.stringify(actual), JSON.stringify(expected)]
  if (a !== b) throw new Error(`${what}\n  expected: ${b}\n  actual:   ${a}`)
}

const projectDir = mkdtempSync(join(tmpdir(), 'pulumi-package-docs-smoke-'))
writeFileSync(
  join(projectDir, 'Pulumi.yaml'),
  'name: smoke-test-project\nruntime: nodejs\n',
)

const client = new Client({ name: 'smoke-test', version: '0.0.0' })

try {
  await client.connect(
    new StdioClientTransport({
      command,
      args: [...args, '--dir', projectDir],
    }),
  )

  const { tools } = await client.listTools()
  assertDeepEqual(
    tools.map((tool) => tool.name).sort(),
    EXPECTED_TOOLS,
    'Unexpected tool list',
  )

  const result = await client.callTool({ name: 'list_providers' })
  const summary = JSON.parse(result.content[0].text)
  // Also covers --dir plumbing: the server must have discovered the temp project,
  // not whatever directory it happened to be launched from.
  assertDeepEqual(
    [summary.project?.name, summary.project?.root],
    ['smoke-test-project', projectDir],
    'list_providers did not report the project passed via --dir',
  )

  console.log(
    `stdio smoke test passed: ${[command, ...args].join(' ')} (${tools.length} tools)`,
  )
} catch (error) {
  console.error(`stdio smoke test FAILED: ${[command, ...args].join(' ')}`)
  console.error(error)
  process.exitCode = 1
} finally {
  await client.close().catch(() => {})
  rmSync(projectDir, { recursive: true, force: true })
}
