import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createMcpServer } from '@/lib/pulumi/mcp.server'

let projectDir: string
const originalEnv = process.env.PULUMI_LOCAL_DOCS_DIR

beforeEach(() => {
  projectDir = mkdtempSync(join(tmpdir(), 'pulumi-package-docs-mcp-test-'))
  writeFileSync(
    join(projectDir, 'Pulumi.yaml'),
    `name: my-project\nruntime: nodejs\n`,
  )
  process.env.PULUMI_LOCAL_DOCS_DIR = projectDir
})

afterEach(() => {
  rmSync(projectDir, { recursive: true, force: true })
  if (originalEnv === undefined) delete process.env.PULUMI_LOCAL_DOCS_DIR
  else process.env.PULUMI_LOCAL_DOCS_DIR = originalEnv
})

/**
 * Drives the MCP server the same way the stdio entry point does — a plain in-process
 * server with a transport attached, no HTTP server and no TanStack Start runtime.
 */
async function connectClient(): Promise<Client> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await Promise.all([
    createMcpServer().connect(serverTransport),
    client.connect(clientTransport),
  ])
  return client
}

function parseTextResult(result: unknown): unknown {
  const { content } = result as {
    content?: Array<{ type: string; text: string }>
  }
  expect(content?.[0]?.type).toBe('text')
  return JSON.parse(content![0]!.text)
}

describe('createMcpServer', () => {
  it('advertises the provider docs tools', async () => {
    const client = await connectClient()

    const { tools } = await client.listTools()

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'get_function',
      'get_resource',
      'list_functions',
      'list_providers',
      'list_resources',
      'search_members',
    ])
    await client.close()
  })

  it('reports the discovered project from list_providers', async () => {
    const client = await connectClient()

    const result = await client.callTool({ name: 'list_providers' })

    expect(parseTextResult(result)).toMatchObject({
      targetDir: projectDir,
      project: { root: projectDir, name: 'my-project', runtime: 'nodejs' },
      providers: [],
    })
    await client.close()
  })

  it('returns no matches from search_members when the project has no packages', async () => {
    const client = await connectClient()

    const result = await client.callTool({
      name: 'search_members',
      arguments: { query: 'bucket' },
    })

    expect(parseTextResult(result)).toEqual({
      query: 'bucket',
      matchCount: 0,
      matches: [],
    })
    await client.close()
  })

  it('surfaces a tool error for a provider that is not declared in Pulumi.yaml', async () => {
    const client = await connectClient()

    const result = await client.callTool({
      name: 'list_resources',
      arguments: { provider: 'nope' },
    })

    expect(result.isError).toBe(true)
    expect(JSON.stringify(result.content)).toContain(
      'No local provider named \\"nope\\"',
    )
    await client.close()
  })
})
