import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { createMcpServer } from '@/lib/pulumi/mcp.server'

/**
 * Serves the same provider-docs tools as the `/mcp` HTTP route over stdio, for MCP
 * clients that spawn a server process instead of connecting to a URL.
 *
 * Unlike the HTTP route this is a single long-lived server (one process, one client),
 * and stdout is the protocol channel — nothing on this path may write to it, so any
 * diagnostics belong on stderr.
 */
export async function runStdioMcpServer(): Promise<void> {
  const server = createMcpServer()
  await server.connect(new StdioServerTransport())
}
