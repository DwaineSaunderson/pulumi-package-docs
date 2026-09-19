import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import { getProvider, listProviders } from '@/lib/pulumi/api'
import type { ProviderDetail } from '@/lib/pulumi/api'
import { resolveDescription } from '@/lib/pulumi/description'
import { getTargetDir, loadPulumiProject } from '@/lib/pulumi/discovery.server'
import {
  extractExamples,
  pickExample,
  stripExamples,
  summarizeDescription,
} from '@/lib/pulumi/examples'
import { formatType } from '@/lib/pulumi/format'
import { formatPropertyName } from '@/lib/pulumi/naming'
import { resolveProviderSchema } from '@/lib/pulumi/schema.server'
import { tokenDisplayName } from '@/lib/pulumi/token'
import type {
  SchemaFunction,
  SchemaProperty,
  SchemaResource,
} from '@/lib/pulumi/types'

function textResult(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

/** Loads a local provider's resolved schema, throwing a descriptive error a tool call can surface to the client. */
async function requireProvider(
  providerName: string,
): Promise<ProviderDetail & { schema: NonNullable<ProviderDetail['schema']> }> {
  const detail = await getProvider({ data: providerName })
  if (!detail) {
    throw new Error(
      `No local provider named "${providerName}" was found. Call list_providers to see the providers declared in this project's Pulumi.yaml.`,
    )
  }
  if (!detail.schema) {
    throw new Error(
      `Failed to load the schema for provider "${providerName}": ${detail.error ?? 'unknown error'}`,
    )
  }
  return { ...detail, schema: detail.schema }
}

function summarizeMember(
  token: string,
  member: SchemaResource | SchemaFunction,
  runtime?: string,
) {
  return {
    token,
    name: tokenDisplayName(token),
    deprecated: Boolean(
      'deprecationMessage' in member && member.deprecationMessage,
    ),
    summary: summarizeDescription(
      resolveDescription(member.description, runtime),
    ),
  }
}

function formatProperties(
  properties: Record<string, SchemaProperty> | undefined,
  required: string[] | undefined,
  runtime: string | undefined,
) {
  const requiredSet = new Set(required ?? [])
  return Object.entries(properties ?? {}).map(([name, prop]) => ({
    name: formatPropertyName(name, runtime),
    type: formatType(prop),
    required: requiredSet.has(name),
    description: resolveDescription(prop.description, runtime),
  }))
}

function memberDetail(
  provider: string,
  token: string,
  description: string | undefined,
  runtime: string | undefined,
  inputs: ReturnType<typeof formatProperties>,
  outputs: ReturnType<typeof formatProperties>,
  deprecationMessage?: string,
) {
  const resolved = resolveDescription(description, runtime)
  const example = pickExample(extractExamples(resolved), runtime)

  return {
    provider,
    token,
    name: tokenDisplayName(token),
    deprecationMessage,
    description: stripExamples(resolved),
    example: example ?? null,
    inputs,
    outputs,
  }
}

/**
 * Builds a fresh MCP server with the local-provider-docs tools registered. Called once
 * per HTTP request (see `src/routes/mcp.ts`) so concurrent requests never share state.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'pulumi-package-docs',
    version: '0.1.0',
  })

  server.registerTool(
    'list_providers',
    {
      title: 'List local providers',
      description:
        "List the local/parameterized Pulumi providers declared in this project's Pulumi.yaml (added with `pulumi package add`), with their source, version, and resource/function counts.",
    },
    async () => textResult(await listProviders()),
  )

  server.registerTool(
    'list_resources',
    {
      title: 'List a provider’s resources',
      description:
        'List the resource tokens for a local provider, each with a display name, a one-line summary, and whether it is deprecated. Use get_resource for full details (inputs/outputs/example) on one of them.',
      inputSchema: {
        provider: z
          .string()
          .describe(
            'The provider name as it appears in Pulumi.yaml and list_providers, e.g. "random".',
          ),
      },
    },
    async ({ provider }) => {
      const detail = await requireProvider(provider)
      const resources = Object.entries(detail.schema.resources ?? {}).map(
        ([token, resource]) => summarizeMember(token, resource, detail.runtime),
      )
      return textResult({
        provider,
        resourceCount: resources.length,
        resources,
      })
    },
  )

  server.registerTool(
    'list_functions',
    {
      title: 'List a provider’s functions',
      description:
        'List the function (data source) tokens for a local provider, each with a display name, a one-line summary, and whether it is deprecated. Use get_function for full details (inputs/outputs/example) on one of them.',
      inputSchema: {
        provider: z
          .string()
          .describe(
            'The provider name as it appears in Pulumi.yaml and list_providers, e.g. "random".',
          ),
      },
    },
    async ({ provider }) => {
      const detail = await requireProvider(provider)
      const functions = Object.entries(detail.schema.functions ?? {}).map(
        ([token, fn]) => summarizeMember(token, fn, detail.runtime),
      )
      return textResult({
        provider,
        functionCount: functions.length,
        functions,
      })
    },
  )

  server.registerTool(
    'get_resource',
    {
      title: 'Get resource details',
      description:
        'Get the full documentation for one resource of a local provider: its description, a usage example (in the Pulumi project’s own language), and its input and output properties (name, type, required, description). Get the exact token from list_resources first.',
      inputSchema: {
        provider: z.string().describe('The provider name, e.g. "random".'),
        token: z
          .string()
          .describe(
            'The resource’s full schema token from list_resources, e.g. "random:index/randomString:RandomString".',
          ),
      },
    },
    async ({ provider, token }) => {
      const detail = await requireProvider(provider)
      const resource = detail.schema.resources?.[token]
      if (!resource) {
        throw new Error(
          `No resource with token "${token}" in provider "${provider}". Call list_resources to find the exact token.`,
        )
      }
      return textResult(
        memberDetail(
          provider,
          token,
          resource.description,
          detail.runtime,
          formatProperties(
            resource.inputProperties,
            resource.requiredInputs,
            detail.runtime,
          ),
          formatProperties(
            resource.properties,
            resource.required,
            detail.runtime,
          ),
          resource.deprecationMessage,
        ),
      )
    },
  )

  server.registerTool(
    'get_function',
    {
      title: 'Get function details',
      description:
        'Get the full documentation for one function (data source) of a local provider: its description, a usage example (in the Pulumi project’s own language), and its input and output properties. Get the exact token from list_functions first.',
      inputSchema: {
        provider: z.string().describe('The provider name, e.g. "random".'),
        token: z
          .string()
          .describe(
            'The function’s full schema token from list_functions, e.g. "random:index/randomInteger:getRandomInteger".',
          ),
      },
    },
    async ({ provider, token }) => {
      const detail = await requireProvider(provider)
      const fn = detail.schema.functions?.[token]
      if (!fn) {
        throw new Error(
          `No function with token "${token}" in provider "${provider}". Call list_functions to find the exact token.`,
        )
      }
      return textResult(
        memberDetail(
          provider,
          token,
          fn.description,
          detail.runtime,
          formatProperties(
            fn.inputs?.properties,
            fn.inputs?.required,
            detail.runtime,
          ),
          formatProperties(
            fn.outputs?.properties,
            fn.outputs?.required,
            detail.runtime,
          ),
        ),
      )
    },
  )

  server.registerTool(
    'search_members',
    {
      title: 'Search resources and functions',
      description:
        'Search resource and function tokens/descriptions across one or all local providers for a keyword. Use this instead of list_resources/list_functions when a provider is large or you only know roughly what you’re looking for (e.g. "bucket", "random string").',
      inputSchema: {
        query: z.string().describe('Case-insensitive text to search for.'),
        provider: z
          .string()
          .optional()
          .describe(
            'Limit the search to this provider name. Omit to search all local providers.',
          ),
      },
    },
    async ({ query, provider }) => {
      const targetDir = getTargetDir()
      const project = loadPulumiProject(targetDir)
      if (!project) return textResult({ query, matchCount: 0, matches: [] })

      const refs = provider
        ? project.packages.filter((p) => p.name === provider)
        : project.packages
      if (provider && refs.length === 0) {
        throw new Error(
          `No local provider named "${provider}" was found. Call list_providers to see the providers declared in this project's Pulumi.yaml.`,
        )
      }

      const needle = query.toLowerCase()
      const matches: Array<{
        provider: string
        kind: 'resource' | 'function'
        token: string
        name: string
        summary?: string
      }> = []

      for (const ref of refs) {
        const entry = await resolveProviderSchema(project.root, ref)
        if (!entry.schema) continue

        const groups: Array<
          [
            kind: 'resource' | 'function',
            members:
              | Record<string, SchemaResource | SchemaFunction>
              | undefined,
          ]
        > = [
          ['resource', entry.schema.resources],
          ['function', entry.schema.functions],
        ]

        for (const [kind, members] of groups) {
          for (const [token, member] of Object.entries(members ?? {})) {
            const name = tokenDisplayName(token)
            const summary = summarizeDescription(
              resolveDescription(member.description, project.runtime),
            )
            const haystack = `${name} ${token} ${summary ?? ''}`.toLowerCase()
            if (haystack.includes(needle)) {
              matches.push({ provider: ref.name, kind, token, name, summary })
            }
          }
        }
      }

      return textResult({
        query,
        matchCount: matches.length,
        matches: matches.slice(0, 50),
      })
    },
  )

  return server
}
