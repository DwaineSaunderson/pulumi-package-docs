import { describe, expect, it } from 'vitest'

import { resolveDescription } from '@/lib/pulumi/description'

describe('resolveDescription', () => {
  it('passes through undefined and plain text unchanged', () => {
    expect(resolveDescription(undefined)).toBeUndefined()
    expect(resolveDescription('a plain description')).toBe(
      'a plain description',
    )
  })

  it('resolves a lang span to the matching runtime attribute', () => {
    const text =
      'The length of the encoded string is exactly twice the ' +
      '<span pulumi-lang-nodejs="`length`" pulumi-lang-dotnet="`Length`" ' +
      'pulumi-lang-go="`length`" pulumi-lang-python="`length`" ' +
      'pulumi-lang-yaml="`length`" pulumi-lang-java="`length`" ' +
      'pulumi-lang-hcl="`length`">`length`</span> parameter.'

    expect(resolveDescription(text, 'dotnet')).toBe(
      'The length of the encoded string is exactly twice the `Length` parameter.',
    )
    expect(resolveDescription(text, 'python')).toBe(
      'The length of the encoded string is exactly twice the `length` parameter.',
    )
  })

  it('falls back to the span contents when no runtime is given', () => {
    const text =
      '<span pulumi-lang-nodejs="`bcryptHash`" pulumi-lang-python="`bcrypt_hash`">`bcryptHash`</span>'
    expect(resolveDescription(text)).toBe('`bcryptHash`')
  })

  it('falls back to the span contents when the runtime has no matching attribute', () => {
    const text =
      '<span pulumi-lang-nodejs="`bcryptHash`" pulumi-lang-python="`bcrypt_hash`">`bcryptHash`</span>'
    expect(resolveDescription(text, 'go')).toBe('`bcryptHash`')
  })

  it('leaves no HTML markup behind', () => {
    const text =
      '<span pulumi-lang-nodejs="`x`" pulumi-lang-python="`x`">`x`</span>'
    expect(resolveDescription(text, 'python')).not.toContain('<span')
    expect(resolveDescription(text, 'python')).not.toContain('</span>')
  })

  it('resolves multiple spans in the same description', () => {
    const text =
      '<span pulumi-lang-nodejs="a" pulumi-lang-python="A">a</span> and ' +
      '<span pulumi-lang-nodejs="b" pulumi-lang-python="B">b</span>'
    expect(resolveDescription(text, 'python')).toBe('A and B')
  })
})
