#!/usr/bin/env node
// Generates bin/embedded-assets.generated.js: a module that statically
// imports every file under dist/client with `{ type: "file" }`, so `bun
// build --compile` embeds them into the standalone executable. Must run
// after `npm run build` (dist/client must exist) and before
// `bun build --compile ./bin/cli-bun.js`.
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const clientDir = join(packageRoot, 'dist', 'client')
const outFile = join(packageRoot, 'bin', 'embedded-assets.generated.js')

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walk(full))
    } else {
      files.push(full)
    }
  }
  return files
}

const files = walk(clientDir)
const lines = []
const entries = []

files.forEach((file, i) => {
  const urlPath = `/${relative(clientDir, file).split('\\').join('/')}`
  const importPath = `../dist/client/${relative(clientDir, file).split('\\').join('/')}`
  const name = `asset${i}`
  lines.push(
    `import ${name} from ${JSON.stringify(importPath)} with { type: 'file' }`,
  )
  entries.push(`  ${JSON.stringify(urlPath)}: ${name},`)
})

const source = `${lines.join('\n')}

export default {
${entries.join('\n')}
}
`

writeFileSync(outFile, source)
console.log(
  `Wrote ${files.length} embedded asset imports to ${relative(packageRoot, outFile)}`,
)
