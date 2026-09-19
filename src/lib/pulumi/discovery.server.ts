import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { parse } from 'yaml'

import type { LocalPackageRef, PulumiProject } from '@/lib/pulumi/types'

const PROJECT_FILE_NAMES = ['Pulumi.yaml', 'Pulumi.yml']

/**
 * The directory of the Pulumi program to inspect. `bin/cli.js` sets this to the
 * directory the user ran `npx pulumi-package-docs` from, since the dev/preview
 * server itself runs with this package's own directory as its cwd.
 */
export function getTargetDir(): string {
  return process.env.PULUMI_LOCAL_DOCS_DIR || process.cwd()
}

function findProjectFile(startDir: string): string | null {
  let dir = startDir
  for (;;) {
    for (const fileName of PROJECT_FILE_NAMES) {
      const candidate = join(dir, fileName)
      if (existsSync(candidate)) return candidate
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function toLocalPackageRefs(packages: unknown): LocalPackageRef[] {
  if (!packages || typeof packages !== 'object') return []

  return Object.entries(packages as Record<string, unknown>).map(
    ([name, value]) => {
      const entry = (value ?? {}) as Record<string, unknown>
      const parameters = Array.isArray(entry.parameters)
        ? entry.parameters.filter((p): p is string => typeof p === 'string')
        : undefined

      return {
        name,
        source: typeof entry.source === 'string' ? entry.source : name,
        version: typeof entry.version === 'string' ? entry.version : undefined,
        parameters,
      }
    },
  )
}

/**
 * Walks up from `startDir` looking for a Pulumi.yaml/Pulumi.yml, then reads its
 * `packages` section to find the local/parameterized providers used by the project.
 */
export function loadPulumiProject(
  startDir: string = getTargetDir(),
): PulumiProject | null {
  const projectFile = findProjectFile(startDir)
  if (!projectFile) return null

  const raw = readFileSync(projectFile, 'utf-8')
  const doc = parse(raw) as Record<string, unknown> | null

  return {
    root: dirname(projectFile),
    name: typeof doc?.name === 'string' ? doc.name : undefined,
    runtime:
      typeof doc?.runtime === 'string'
        ? doc.runtime
        : typeof (doc?.runtime as Record<string, unknown> | undefined)?.name ===
            'string'
          ? ((doc!.runtime as Record<string, unknown>).name as string)
          : undefined,
    packages: toLocalPackageRefs(doc?.packages),
  }
}
