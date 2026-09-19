import { describe, expect, it } from 'vitest'

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
