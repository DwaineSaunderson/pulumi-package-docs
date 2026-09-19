/** A locally-added package entry from a project's Pulumi.yaml `packages` section. */
export interface LocalPackageRef {
  /** The local alias the project uses for this package, e.g. "random". */
  name: string
  /** The base provider/plugin this package resolves through, e.g. "terraform-provider". */
  source: string
  version?: string
  /** Parameterization arguments, e.g. ["hashicorp/random"] for a bridged Terraform provider. */
  parameters?: string[]
}

export interface PulumiProject {
  root: string
  name?: string
  runtime?: string
  packages: LocalPackageRef[]
}

export interface SchemaProperty {
  type?: string
  $ref?: string
  description?: string
  items?: SchemaProperty
}

export interface SchemaResource {
  description?: string
  properties?: Record<string, SchemaProperty>
  required?: string[]
  inputProperties?: Record<string, SchemaProperty>
  requiredInputs?: string[]
  deprecationMessage?: string
}

export interface SchemaFunction {
  description?: string
  inputs?: {
    properties?: Record<string, SchemaProperty>
    required?: string[]
  }
  outputs?: {
    properties?: Record<string, SchemaProperty>
    required?: string[]
  }
}

export interface PulumiSchema {
  name: string
  version?: string
  description?: string
  resources?: Record<string, SchemaResource>
  functions?: Record<string, SchemaFunction>
}

export type SchemaOrigin = 'cli' | 'cache'

export interface ProviderEntry {
  ref: LocalPackageRef
  schema: PulumiSchema | null
  origin: SchemaOrigin | 'error'
  error?: string
}
