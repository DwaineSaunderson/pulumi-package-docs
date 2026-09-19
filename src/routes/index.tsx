import { Link, createFileRoute } from '@tanstack/react-router'

import { listProviders } from '@/lib/pulumi/api'

export const Route = createFileRoute('/')({
  loader: () => listProviders(),
  component: Home,
})

function Home() {
  const { targetDir, project, providers } = Route.useLoaderData()

  if (!project) {
    return (
      <main>
        <h1>Pulumi Package Docs</h1>
        <p className="empty-state">
          No Pulumi project was found at <code>{targetDir}</code> (or any parent
          directory). Run this from inside a Pulumi project directory, or with{' '}
          <code>--dir &lt;path&gt;</code> pointing at one.
        </p>
      </main>
    )
  }

  return (
    <main>
      <h1>Pulumi Package Docs</h1>
      <p className="subtitle">
        {project.name ?? 'Pulumi project'} &middot; <code>{project.root}</code>
      </p>

      {providers.length === 0 ? (
        <p className="empty-state">
          This project's <code>Pulumi.yaml</code> has no <code>packages</code>{' '}
          section, so there are no local or parameterized providers to show docs
          for yet. Add one with <code>pulumi package add</code>.
        </p>
      ) : (
        <ul className="provider-list">
          {providers.map((provider) => (
            <li key={provider.name} className="provider-card">
              <Link to="/providers/$name" params={{ name: provider.name }}>
                <span className="provider-name">{provider.name}</span>
                <span className="provider-source">
                  {provider.source}
                  {provider.version ? ` @ ${provider.version}` : ''}
                  {provider.parameters?.length
                    ? ` (${provider.parameters.join(' ')})`
                    : ''}
                </span>
              </Link>
              {provider.origin === 'error' ? (
                <p className="banner banner-failure">
                  Failed to load schema: {provider.error}
                </p>
              ) : (
                <p className="provider-stats">
                  {provider.resourceCount} resource
                  {provider.resourceCount === 1 ? '' : 's'}
                  {' · '}
                  {provider.functionCount} function
                  {provider.functionCount === 1 ? '' : 's'}
                  {provider.origin === 'cache' && (
                    <>
                      {' · '}
                      <span className="badge badge-info">from cache</span>
                    </>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
