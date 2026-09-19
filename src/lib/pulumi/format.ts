import type { SchemaProperty } from '@/lib/pulumi/types'

export function formatType(prop?: SchemaProperty): string {
  if (!prop) return 'any'
  if (prop.$ref) {
    const short = prop.$ref.split('/').pop() ?? prop.$ref
    return decodeURIComponent(short)
  }
  if (prop.type === 'array' && prop.items) return `${formatType(prop.items)}[]`
  return prop.type ?? 'any'
}
