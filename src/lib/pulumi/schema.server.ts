import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import type {
  LocalPackageRef,
  ProviderEntry,
  PulumiSchema,
} from '@/lib/pulumi/types'

const execFileAsync = promisify(execFile)

const CLI_TIMEOUT_MS = 60_000
const MAX_BUFFER_BYTES = 64 * 1024 * 1024

function cacheFilePath(projectRoot: string, ref: LocalPackageRef): string {
  const projectHash = createHash('sha256')
    .update(projectRoot)
    .digest('hex')
    .slice(0, 16)
  const dir = join(tmpdir(), 'pulumi-local-docs', projectHash)
  mkdirSync(dir, { recursive: true })
  return join(dir, `${ref.name}.json`)
}

function readCache(path: string): PulumiSchema | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as PulumiSchema
  } catch {
    return null
  }
}

async function fetchViaCli(
  projectRoot: string,
  ref: LocalPackageRef,
): Promise<PulumiSchema> {
  const args = ['package', 'get-schema', ref.source, ...(ref.parameters ?? [])]
  const { stdout } = await execFileAsync('pulumi', args, {
    cwd: projectRoot,
    timeout: CLI_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  })
  return JSON.parse(stdout) as PulumiSchema
}

/**
 * Resolves the schema for a local package: try the `pulumi` CLI first (it's the
 * source of truth and works for parameterized providers), and fall back to the
 * last schema we successfully cached for this project if the CLI call fails.
 */
export async function resolveProviderSchema(
  projectRoot: string,
  ref: LocalPackageRef,
): Promise<ProviderEntry> {
  const cachePath = cacheFilePath(projectRoot, ref)

  try {
    const schema = await fetchViaCli(projectRoot, ref)
    writeFileSync(cachePath, JSON.stringify(schema))
    return { ref, schema, origin: 'cli' }
  } catch (cliError) {
    const cached = readCache(cachePath)
    if (cached) {
      return { ref, schema: cached, origin: 'cache' }
    }
    return {
      ref,
      schema: null,
      origin: 'error',
      error: cliError instanceof Error ? cliError.message : String(cliError),
    }
  }
}
