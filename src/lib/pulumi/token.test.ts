import { describe, expect, it } from 'vitest'

import { tokenDisplayName } from '@/lib/pulumi/token'

describe('tokenDisplayName', () => {
  it('returns the segment after the last colon for a resource token', () => {
    expect(tokenDisplayName('random:index/randomString:RandomString')).toBe(
      'RandomString',
    )
  })

  it('returns the segment after the last colon for a function token', () => {
    expect(
      tokenDisplayName('random:index/randomInteger:getRandomInteger'),
    ).toBe('getRandomInteger')
  })

  it('returns the token unchanged when it has no colon', () => {
    expect(tokenDisplayName('plainName')).toBe('plainName')
  })
})
