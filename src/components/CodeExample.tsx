import type { SchemaExample } from '@/lib/pulumi/examples'

export function CodeExample({ example }: { example?: SchemaExample }) {
  if (!example) return <p className="empty-state">No examples in the schema.</p>

  return (
    <div className="code-example">
      <span className="code-example-lang">{example.language}</span>
      <pre>
        <code>{example.code}</code>
      </pre>
    </div>
  )
}
