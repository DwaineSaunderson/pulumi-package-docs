# pulumi-package-docs

A local documentation viewer for the parameterized/local Pulumi providers used by a Pulumi project (e.g. providers added with `pulumi package add`). Run it from inside a Pulumi project and it lists the packages declared in `Pulumi.yaml`'s `packages` section, fetches each one's schema via the `pulumi` CLI, and renders its resources and functions.

## Usage

```bash
npx pulumi-package-docs
```

This serves docs for the Pulumi project in your current directory. Options:

```bash
pulumi-package-docs [options]

  -d, --dir <path>   Pulumi project directory to inspect (default: current directory)
  -p, --port <port>  Port to serve on (default: 3000)
  --host             Expose the server on your network
  --open             Open the docs in your default browser once ready
  --stdio            Run as an MCP server over stdio instead of serving the docs site
  -h, --help         Show this help message
```

Requires the `pulumi` CLI to be installed and on `PATH`; it's used to fetch each provider's schema (`pulumi package get-schema`). If a schema was fetched successfully before, it's cached and reused if a later CLI call fails.

### Standalone binary

Each [release](https://github.com/pierskarsenbarg/pulumi-package-docs/releases) also includes standalone executables (macOS arm64/x64, Linux x64/arm64, Windows x64) built with Bun — no Node.js install required. Download the one for your platform, make it executable, and run it the same way:

```bash
chmod +x pulumi-package-docs-darwin-arm64
./pulumi-package-docs-darwin-arm64 --dir /path/to/pulumi/project
```

On macOS or Linux, it's also available via Homebrew:

```bash
brew install pierskarsenbarg/tap/pulumi-package-docs
```

## MCP

The same local provider docs are available to coding agents over [MCP](https://modelcontextprotocol.io), via either transport.

**Streamable HTTP**, while the docs site is running: the server exposes an MCP endpoint at `/mcp`, so point an MCP client at `http://localhost:3000/mcp` (e.g. in Claude Code, `claude mcp add --transport http pulumi-package-docs http://localhost:3000/mcp`).

**stdio**, for clients that spawn a server process instead of connecting to a URL: run with `--stdio` and no docs site is started at all — the process speaks MCP on stdin/stdout and exits with the client.

```bash
claude mcp add pulumi-package-docs -- npx -y pulumi-package-docs --stdio --dir /path/to/pulumi/project
```

Or, in an MCP client's JSON config:

```json
{
  "mcpServers": {
    "pulumi-package-docs": {
      "command": "npx",
      "args": [
        "-y",
        "pulumi-package-docs",
        "--stdio",
        "--dir",
        "/path/to/pulumi/project"
      ]
    }
  }
}
```

`--dir` defaults to the process's working directory, so it can be omitted when the client launches the server from the Pulumi project itself. The standalone binary works the same way — use its path in place of `npx -y pulumi-package-docs`.

Both transports serve the same tools:

- `list_providers` — the local providers declared in `Pulumi.yaml`, with resource/function counts and schema load status.
- `list_resources` / `list_functions` — a provider's resource or function tokens, with a one-line summary and deprecation status for each.
- `get_resource` / `get_function` — full docs for one resource or function: description, a usage example in the project's own language, and inputs/outputs (name, type, required, description).
- `search_members` — keyword search across one or all providers' resources and functions, for when a provider is too large to list in full.

## Development

```bash
npm install
npm run dev
```

This starts the TanStack Start dev server, and inspects the Pulumi project in this repo's own directory by default. Point it at another project's `Pulumi.yaml` with the `PULUMI_LOCAL_DOCS_DIR` env var:

```bash
PULUMI_LOCAL_DOCS_DIR=/path/to/pulumi/project npm run dev
```

Routes live under `src/routes`; TanStack Router regenerates `src/routeTree.gen.ts` automatically. Pulumi project discovery and schema fetching live in `src/lib/pulumi`.

Run the tests with:

```bash
npm test
```

Build the production app with:

```bash
npm run build
```

`bin/cli.js` is the `npx` entry point: it serves the production build with `vite preview` if one exists (`npm run build` first), otherwise falls back to `vite dev`. With `--stdio` it skips Vite entirely and runs `dist/mcp/stdio.js` in-process, which `npm run build` produces from `vite.mcp.config.ts` (so `--stdio` needs a build — there's no dev-server fallback for it). `bin/cli-bun.js` is a separate entry point used to build the standalone Bun executables (see above); it serves the built SSR handler directly with `Bun.serve` instead of shelling out to Vite. Build one locally with:

```bash
npm run build
npm run compile:bun
```
