import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Schema descriptions are markdown, and a lot of it: fenced blocks, links to
 * the upstream provider's docs, `**NOTE**` callouts, blockquotes. Rendering
 * them as plain text leaves all of that as source on the page.
 *
 * Raw HTML in a description is deliberately *not* rendered — react-markdown
 * drops it without `rehype-raw`, and a provider schema is not markup we want
 * to inject into the page.
 */

/**
 * A description's own headings sit underneath the page's `<h1>` and the
 * section `<h2>`s around them, so they start at `<h3>` however deep the
 * schema author went.
 */
const HEADINGS: Components = {
  h1: 'h3',
  h2: 'h3',
  h3: 'h4',
  h4: 'h5',
  h5: 'h6',
  h6: 'h6',
}

const BLOCK_COMPONENTS: Components = {
  ...HEADINGS,
  a({ node: _node, ...props }) {
    return <a {...props} target="_blank" rel="noreferrer noopener" />
  },
}

/**
 * Inside a table cell there is no room for block layout, so paragraphs render
 * as plain inline runs and anything structural is flattened away.
 */
const INLINE_COMPONENTS: Components = {
  ...BLOCK_COMPONENTS,
  p({ children }) {
    return <>{children}</>
  },
  pre({ children }) {
    return <>{children}</>
  },
}

export function Markdown({
  children,
  inline = false,
}: {
  children?: string
  inline?: boolean
}) {
  if (!children?.trim()) return null

  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={inline ? INLINE_COMPONENTS : BLOCK_COMPONENTS}
    >
      {children}
    </ReactMarkdown>
  )

  // A table cell's description has to stay inline-level; a standalone one is
  // block content and gets the prose spacing.
  return inline ? (
    <span className="markdown markdown-inline">{markdown}</span>
  ) : (
    <div className="markdown">{markdown}</div>
  )
}
