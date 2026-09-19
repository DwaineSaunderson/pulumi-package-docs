import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { getProvider } from '@/lib/pulumi/api'
import { formatType } from '@/lib/pulumi/format'
import { formatPropertyName } from '@/lib/pulumi/naming'
import type {
  SchemaFunction,
  SchemaProperty,
  SchemaResource,
} from '@/lib/pulumi/types'

export const Route = createFileRoute('/providers/$name')({
  loader: async ({ params }) => {
    const entry = await getProvider({ data: params.name })
    if (!entry) throw notFound()
    return entry
  },
  component: ProviderDetail,
  notFoundComponent: () => (
    <main>
      <p>
        No local provider with that name was found.{' '}
        <Link to="/">Back to all providers.</Link>
      </p>
    </main>
  ),
})

function PropertyTable({
  properties,
  required,
  runtime,
}: {
  properties?: Record<string, SchemaProperty>
  required?: string[]
  runtime?: string
}) {
  const names = Object.keys(properties ?? {})
  if (names.length === 0) return <p className="empty-state">None</p>

  const requiredSet = new Set(required ?? [])

  return (
    <table className="props-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {names.map((name) => {
          const prop = properties![name]
          return (
            <tr key={name}>
              <td>
                <code>{formatPropertyName(name, runtime)}</code>
              </td>
              <td>
                <code>{formatType(prop)}</code>
              </td>
              <td>{requiredSet.has(name) ? 'yes' : 'no'}</td>
              <td>{prop.description ?? ''}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ResourceSection({
  token,
  resource,
  runtime,
}: {
  token: string
  resource: SchemaResource
  runtime?: string
}) {
  return (
    <section className="doc-entry">
      <h3>{token}</h3>
      {resource.description && <p>{resource.description}</p>}
      {resource.deprecationMessage && (
        <p className="deprecated">Deprecated: {resource.deprecationMessage}</p>
      )}
      <h4>Inputs</h4>
      <PropertyTable
        properties={resource.inputProperties}
        required={resource.requiredInputs}
        runtime={runtime}
      />
      <h4>Outputs</h4>
      <PropertyTable
        properties={resource.properties}
        required={resource.required}
        runtime={runtime}
      />
    </section>
  )
}

function FunctionSection({
  token,
  fn,
  runtime,
}: {
  token: string
  fn: SchemaFunction
  runtime?: string
}) {
  return (
    <section className="doc-entry">
      <h3>{token}</h3>
      {fn.description && <p>{fn.description}</p>}
      <h4>Inputs</h4>
      <PropertyTable
        properties={fn.inputs?.properties}
        required={fn.inputs?.required}
        runtime={runtime}
      />
      <h4>Outputs</h4>
      <PropertyTable
        properties={fn.outputs?.properties}
        required={fn.outputs?.required}
        runtime={runtime}
      />
    </section>
  )
}

function ProviderDetail() {
  const entry = Route.useLoaderData()
  const { ref, schema, origin, error, runtime } = entry

  return (
    <main className="provider-detail">
      <Link to="/" className="back-link">
        &larr; All providers
      </Link>
      <h1>{ref.name}</h1>
      <p className="subtitle">
        {ref.source}
        {ref.version ? ` @ ${ref.version}` : ''}
        {ref.parameters?.length ? ` (${ref.parameters.join(' ')})` : ''}
      </p>

      {origin === 'error' || !schema ? (
        <p className="provider-error">
          Failed to load schema: {error ?? 'unknown error'}
        </p>
      ) : (
        <>
          {origin === 'cache' && (
            <p className="provider-stats">
              Showing a cached schema (the <code>pulumi</code> CLI call failed
              on this load).
            </p>
          )}
          {schema.description && <p>{schema.description}</p>}

          <h2>Resources</h2>
          {Object.keys(schema.resources ?? {}).length === 0 ? (
            <p className="empty-state">No resources.</p>
          ) : (
            Object.entries(schema.resources!).map(([token, resource]) => (
              <ResourceSection
                key={token}
                token={token}
                resource={resource}
                runtime={runtime}
              />
            ))
          )}

          <h2>Functions</h2>
          {Object.keys(schema.functions ?? {}).length === 0 ? (
            <p className="empty-state">No functions.</p>
          ) : (
            Object.entries(schema.functions!).map(([token, fn]) => (
              <FunctionSection
                key={token}
                token={token}
                fn={fn}
                runtime={runtime}
              />
            ))
          )}
        </>
      )}
    </main>
  )
}
