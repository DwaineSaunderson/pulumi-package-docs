import { resolve } from 'node:path'

export function parseArgs(argv) {
  const options = { dir: process.cwd(), port: '3000', host: false, open: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dir' || arg === '-d') {
      options.dir = resolve(argv[++i])
    } else if (arg === '--port' || arg === '-p') {
      options.port = argv[++i]
    } else if (arg === '--host') {
      options.host = true
    } else if (arg === '--open') {
      options.open = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }
  return options
}

export function printHelp() {
  console.log(`pulumi-package-docs [options]

Serves local documentation for the parameterized/local Pulumi providers used
by a Pulumi project.

Options:
  -d, --dir <path>   Pulumi project directory to inspect (default: current directory)
  -p, --port <port>  Port to serve on (default: 3000)
  --host             Expose the server on your network
  --open             Open the docs in your default browser once ready
  -h, --help         Show this help message
`)
}
