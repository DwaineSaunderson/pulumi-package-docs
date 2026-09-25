import { describe, expect, it } from 'vitest'

import { resolveDescription } from '@/lib/pulumi/description'
import {
  extractExamples,
  pickExample,
  stripExamples,
  summarizeDescription,
} from '@/lib/pulumi/examples'

const DESCRIPTION = `Generates random bytes.

## Example Usage

\`\`\`typescript
const bytes = new random.RandomBytes("bytes", {length: 32});
\`\`\`
\`\`\`python
bytes = random.RandomBytes("bytes", length=32)
\`\`\`
\`\`\`go
bytes, err := random.NewRandomBytes(ctx, "bytes", &random.RandomBytesArgs{Length: 32})
\`\`\`
`

describe('extractExamples', () => {
  it('returns an empty list for no description', () => {
    expect(extractExamples(undefined)).toEqual([])
  })

  it('returns an empty list when there are no fenced code blocks', () => {
    expect(extractExamples('just some prose')).toEqual([])
  })

  it('extracts each labeled code block', () => {
    expect(extractExamples(DESCRIPTION)).toEqual([
      {
        language: 'typescript',
        code: 'const bytes = new random.RandomBytes("bytes", {length: 32});',
      },
      {
        language: 'python',
        code: 'bytes = random.RandomBytes("bytes", length=32)',
      },
      {
        language: 'go',
        code: 'bytes, err := random.NewRandomBytes(ctx, "bytes", &random.RandomBytesArgs{Length: 32})',
      },
    ])
  })
})

describe('stripExamples', () => {
  it('removes fenced code blocks, leaving the prose', () => {
    expect(stripExamples(DESCRIPTION)).toBe(
      'Generates random bytes.\n\n## Example Usage',
    )
  })

  it('returns undefined when nothing but code blocks remain', () => {
    expect(stripExamples('```typescript\ncode\n```')).toBeUndefined()
  })
})

describe('summarizeDescription', () => {
  it('returns the first paragraph, examples excluded', () => {
    expect(summarizeDescription(DESCRIPTION)).toBe('Generates random bytes.')
  })

  it('returns undefined for an empty description', () => {
    expect(summarizeDescription(undefined)).toBeUndefined()
  })
})

describe('pickExample', () => {
  const examples = extractExamples(DESCRIPTION)

  it('picks the example matching the runtime', () => {
    expect(pickExample(examples, 'python')?.language).toBe('python')
    expect(pickExample(examples, 'go')?.language).toBe('go')
  })

  it('maps nodejs to typescript', () => {
    expect(pickExample(examples, 'nodejs')?.language).toBe('typescript')
  })

  it('falls back to the first example when the runtime has none', () => {
    expect(pickExample(examples, 'dotnet')?.language).toBe('typescript')
  })

  it('falls back to the first example when no runtime is given', () => {
    expect(pickExample(examples)?.language).toBe('typescript')
  })

  it('returns undefined for an empty example list', () => {
    expect(pickExample([], 'python')).toBeUndefined()
  })
})

describe('extractExamples after resolveDescription', () => {
  // The schema writes these fences as ```sh<break>, which the fence pattern
  // can't match — so the block used to leak into the prose as raw markdown.
  it('finds a fenced block whose language tag carried a <break>', () => {
    const raw =
      'Import it:\n\n```sh<break>\n$ pulumi import foo bar\n<break>```'

    expect(extractExamples(raw)).toHaveLength(0)

    const examples = extractExamples(resolveDescription(raw))
    expect(examples).toHaveLength(1)
    expect(examples[0].language).toBe('sh')
    expect(examples[0].code).toBe('$ pulumi import foo bar')
    expect(stripExamples(resolveDescription(raw))).toBe('Import it:')
  })
})

describe('stripExamples tidying', () => {
  it('drops a fence left unpaired by the schema', () => {
    // pulumi-random's RandomPassword description ships an odd number of them.
    const text = 'Intro\n\n```ts\ncode()\n```\n\nOutro\n\n```'
    expect(stripExamples(text)).toBe('Intro\n\nOutro')
  })

  it('collapses the blank run a removed block leaves behind', () => {
    const text = 'Before\n\n```ts\ncode()\n```\n\nAfter'
    expect(stripExamples(text)).toBe('Before\n\nAfter')
  })

  it('returns undefined when only fences remain', () => {
    expect(stripExamples('```ts\ncode()\n```')).toBeUndefined()
  })
})
