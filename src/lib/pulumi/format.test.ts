import { describe, expect, it } from 'vitest'

import { formatType } from '@/lib/pulumi/format'

describe('formatType', () => {
  it('returns "any" for an undefined property', () => {
    expect(formatType(undefined)).toBe('any')
  })

  it('returns "any" for a property with neither a type nor a $ref', () => {
    expect(formatType({})).toBe('any')
  })

  it('returns the plain type for a scalar property', () => {
    expect(formatType({ type: 'string' })).toBe('string')
    expect(formatType({ type: 'boolean' })).toBe('boolean')
  })

  it('shortens a $ref to its last path segment', () => {
    expect(
      formatType({ $ref: '#/types/random:index/randomString:RandomString' }),
    ).toBe('randomString:RandomString')
  })

  it('url-decodes the shortened $ref', () => {
    expect(
      formatType({
        $ref: '#/resources/pulumi:providers:random%2FterraformConfig',
      }),
    ).toBe('pulumi:providers:random/terraformConfig')
  })

  it('formats an array of a scalar type', () => {
    expect(formatType({ type: 'array', items: { type: 'string' } })).toBe(
      'string[]',
    )
  })

  it('formats an array of $ref items', () => {
    expect(
      formatType({
        type: 'array',
        items: { $ref: '#/types/random:index/randomString:RandomString' },
      }),
    ).toBe('randomString:RandomString[]')
  })

  it('falls back to "any" for an array with no items', () => {
    expect(formatType({ type: 'array' })).toBe('array')
  })
})
