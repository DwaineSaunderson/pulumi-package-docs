/**
 * Pulumi schema property names are always camelCase; each language's generated
 * SDK renders them in that language's own convention. This approximates that
 * per-runtime rendering for display purposes (it doesn't reproduce Pulumi's
 * codegen exactly, e.g. its acronym handling, but matches the common case).
 */
function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

function toPascalCase(name: string): string {
  if (name.length === 0) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Renders a schema property name the way it would appear in the given Pulumi runtime's generated SDK. */
export function formatPropertyName(name: string, runtime?: string): string {
  switch (runtime) {
    case 'python':
      return toSnakeCase(name)
    case 'go':
    case 'dotnet':
      return toPascalCase(name)
    // nodejs, java, and yaml all use the schema's camelCase names as-is.
    default:
      return name
  }
}
