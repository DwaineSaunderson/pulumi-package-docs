import { defineConfig } from 'vite'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

// Matches the ANSI styling Vite's own CLI uses for its "Local"/"Network"
// bullets (picocolors' green/bold/cyan), so this reads as one more item in
// that same list rather than a separately-styled line.
const green = (s: string) => `\x1b[32m${s}\x1b[39m`
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`
const colorUrl = (url: string) =>
  cyan(url.replace(/:(\d+)\//, (_, port) => `:${bold(port)}/`))

/** Prints the MCP endpoint alongside Vite's own "Local"/"Network" bullets. */
function printMcpUrl(): Plugin {
  function withMcpUrl(server: ViteDevServer | PreviewServer) {
    const printUrls = server.printUrls.bind(server)
    server.printUrls = () => {
      printUrls()
      const base = server.resolvedUrls?.local[0]
      if (!base) return
      const url = new URL('mcp', base).toString()
      // Padded to the same 9-column label width Vite uses ("Local:   " /
      // "Network: " are both 9 characters before the URL).
      server.config.logger.info(
        `  ${green('➜')}  ${bold('MCP')}:     ${colorUrl(url)}`,
      )
    }
  }

  return {
    name: 'print-mcp-url',
    configureServer: withMcpUrl,
    configurePreviewServer: withMcpUrl,
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart(), viteReact(), printMcpUrl()],
})

export default config
