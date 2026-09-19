import { createFileRoute } from '@tanstack/react-router'

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import { createMcpServer } from '@/lib/pulumi/mcp.server'

/**
 * Stateless MCP endpoint: a fresh server + transport per request, so concurrent
 * requests never share state. There's nothing here worth persisting across
 * requests (schemas are re-resolved, cached on disk, each call) and every tool
 * is a plain read, so statelessness keeps this simple.
 */
async function handleMcpRequest({ request }: { request: Request }) {
  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  await server.connect(transport)
  return transport.handleRequest(request)
}

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      GET: handleMcpRequest,
      POST: handleMcpRequest,
      DELETE: handleMcpRequest,
    },
  },
})
