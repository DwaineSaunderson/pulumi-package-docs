import { getTargetDir, loadPulumiProject } from '@/lib/pulumi/discovery.server'
import { resolveProviderSchema } from '@/lib/pulumi/schema.server'
import type { ProviderEntry, PulumiProject } from '@/lib/pulumi/types'

export interface ProviderSummary {
  name: string
  source: string
  version?: string
  parameters?: string[]
  resourceCount: number
  functionCount: number
  origin: ProviderEntry['origin']
  error?: string
}

export interface ProjectSummary {
  targetDir: string
  project: Pick<PulumiProject, 'root' | 'name' | 'runtime'> | null
  providers: ProviderSummary[]
}

export interface ProviderDetail extends ProviderEntry {
  /** The Pulumi project's runtime (e.g. "nodejs", "python", "go"), used to render Inputs/Outputs names in that language's casing. */
  runtime?: string
}

/**
 * The project + provider summaries shown on the index route and by the MCP
 * `list_providers` tool. Plain async functions (no TanStack Start server-fn
 * wrapper) so they can run either inside the web server or in the stdio MCP
 * process, which has no HTTP server at all.
 */
export async function loadProjectSummary(): Promise<ProjectSummary> {
  const targetDir = getTargetDir()
  const project = loadPulumiProject(targetDir)

  if (!project) {
    return { targetDir, project: null, providers: [] }
  }

  const entries = await Promise.all(
    project.packages.map((ref) => resolveProviderSchema(project.root, ref)),
  )

  const providers: ProviderSummary[] = entries.map((entry) => ({
    name: entry.ref.name,
    source: entry.ref.source,
    version: entry.ref.version,
    parameters: entry.ref.parameters,
    resourceCount: Object.keys(entry.schema?.resources ?? {}).length,
    functionCount: Object.keys(entry.schema?.functions ?? {}).length,
    origin: entry.origin,
    error: entry.error,
  }))

  return {
    targetDir,
    project: {
      root: project.root,
      name: project.name,
      runtime: project.runtime,
    },
    providers,
  }
}

/** The fully resolved schema for one local provider, or null if the project or provider isn't found. */
export async function loadProviderDetail(
  name: string,
): Promise<ProviderDetail | null> {
  const targetDir = getTargetDir()
  const project = loadPulumiProject(targetDir)
  if (!project) return null

  const ref = project.packages.find((p) => p.name === name)
  if (!ref) return null

  const entry = await resolveProviderSchema(project.root, ref)
  return { ...entry, runtime: project.runtime }
}
