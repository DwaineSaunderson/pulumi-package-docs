/**
 * The Pulumi package schema has no dedicated "examples" field — usage
 * examples live as fenced, language-tagged code blocks embedded directly in
 * a resource/function's markdown `description` (e.g. a "## Example Usage"
 * section with one ```typescript/```python/```go/... block per language).
 */
export interface SchemaExample {
  language: string
  code: string
}

const CODE_FENCE_RE = /```([a-zA-Z0-9+#-]+)\n([\s\S]*?)```/g

export function extractExamples(text?: string): SchemaExample[] {
  if (!text) return []
  return [...text.matchAll(CODE_FENCE_RE)].map((match) => ({
    language: match[1].toLowerCase(),
    code: match[2].trimEnd(),
  }))
}

/**
 * A fence left without its partner — some schema descriptions ship an odd
 * number of them — renders as an empty code block once the pairs around it
 * have been taken out, so drop any that survive.
 */
const STRAY_FENCE_RE = /^[ \t]*```[a-zA-Z0-9+#-]*[ \t]*$/gm

/** The description text with any fenced code examples removed. */
export function stripExamples(text?: string): string | undefined {
  if (!text) return text
  const stripped = text
    .replace(CODE_FENCE_RE, '')
    .replace(STRAY_FENCE_RE, '')
    // Removing a block mid-prose leaves a run of blank lines behind it.
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return stripped || undefined
}

/** A short summary for list views: the first prose paragraph, examples excluded. */
export function summarizeDescription(text?: string): string | undefined {
  const stripped = stripExamples(text)
  if (!stripped) return undefined
  return stripped.split(/\n{2,}/)[0]?.trim() || undefined
}

const RUNTIME_LANGUAGES: Record<string, string[]> = {
  nodejs: ['typescript', 'javascript'],
  python: ['python'],
  go: ['go', 'golang'],
  dotnet: ['csharp'],
  java: ['java'],
  yaml: ['yaml'],
}

/** Picks the example matching the project's runtime, falling back to the first available one. */
export function pickExample(
  examples: SchemaExample[],
  runtime?: string,
): SchemaExample | undefined {
  const languages = runtime ? RUNTIME_LANGUAGES[runtime] : undefined
  const match = languages
    ? examples.find((example) => languages.includes(example.language))
    : undefined
  return match ?? examples[0]
}
