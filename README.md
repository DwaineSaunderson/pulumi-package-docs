# local-provider-docs

A local documentation viewer for the parameterized/local Pulumi providers used
by a Pulumi project (e.g. providers added with `pulumi package add`). Run it
from inside a Pulumi project and it lists the packages declared in
`Pulumi.yaml`'s `packages` section, fetches each one's schema via the `pulumi`
CLI, and renders its resources and functions.

## Usage

```bash
npx local-provider-docs
```

This serves docs for the Pulumi project in your current directory. Options:

```
local-provider-docs [options]

  -d, --dir <path>   Pulumi project directory to inspect (default: current directory)
  -p, --port <port>  Port to serve on (default: 3000)
  --host             Expose the server on your network
  -h, --help         Show this help message
```

Requires the `pulumi` CLI to be installed and on `PATH`; it's used to fetch
each provider's schema (`pulumi package get-schema`). If a schema was fetched
successfully before, it's cached and reused if a later CLI call fails.

## Development

```bash
npm install
npm run dev
```

This starts the TanStack Start dev server, and inspects the Pulumi project in
this repo's own directory by default. Point it at another project's
`Pulumi.yaml` with the `LOCAL_PROVIDER_DOCS_DIR` env var:

```bash
LOCAL_PROVIDER_DOCS_DIR=/path/to/pulumi/project npm run dev
```

Routes live under `src/routes`; TanStack Router regenerates
`src/routeTree.gen.ts` automatically. Pulumi project discovery and schema
fetching live in `src/lib/pulumi`.

Build the production app with:

```bash
npm run build
```

`bin/cli.js` is the `npx` entry point: it serves the production build with
`vite preview` if one exists (`npm run build` first), otherwise falls back to
`vite dev`.
