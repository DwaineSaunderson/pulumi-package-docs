import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { PulumiLogo } from '@/components/PulumiLogo'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Local Provider Docs',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: 'https://brand.pulumi.com/media/images/logos/icon-rounded-64w.png',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link to="/" className="site-brand">
            <PulumiLogo height={22} />
            <span className="site-brand-divider" aria-hidden="true" />
            <span className="site-brand-name">Local Provider Docs</span>
          </Link>
        </header>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
