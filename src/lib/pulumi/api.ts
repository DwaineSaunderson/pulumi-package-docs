import { createServerFn } from '@tanstack/react-start'

import {
  loadProjectSummary,
  loadProviderDetail,
} from '@/lib/pulumi/providers.server'
import type {
  ProjectSummary,
  ProviderDetail,
} from '@/lib/pulumi/providers.server'

export type {
  ProjectSummary,
  ProviderDetail,
  ProviderSummary,
} from '@/lib/pulumi/providers.server'

export const listProviders = createServerFn({ method: 'GET' }).handler(
  (): Promise<ProjectSummary> => loadProjectSummary(),
)

export const getProvider = createServerFn({ method: 'GET' })
  .validator((name: string) => name)
  .handler(({ data: name }): Promise<ProviderDetail | null> =>
    loadProviderDetail(name),
  )
