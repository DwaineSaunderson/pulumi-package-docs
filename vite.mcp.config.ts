import { defineConfig } from 'vite'

/**
 * Separate from `vite.config.ts` (the TanStack Start app build) on purpose: the stdio
 * MCP server is a plain Node entry point with no HTTP server, no client bundle and no
 * TanStack Start plugin. `npm run build` runs both, writing this one to `dist/mcp`.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    ssr: 'src/lib/pulumi/stdio.server.ts',
    outDir: 'dist/mcp',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: { entryFileNames: 'stdio.js' },
    },
  },
})
