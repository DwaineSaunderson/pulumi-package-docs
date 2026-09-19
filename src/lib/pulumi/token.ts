/**
 * Schema tokens look like `random:index/randomString:RandomString` (resources)
 * or `random:index/randomInteger:randomInteger` (functions). The segment after
 * the last colon is the name every generated SDK exports for that member, and
 * is unique within the provider, so it makes a readable display name.
 */
export function tokenDisplayName(token: string): string {
  const short = token.split(':').pop()
  return short && short.length > 0 ? short : token
}
