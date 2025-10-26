import type { ProviderId } from '@cherrystudio/ai-core/provider'

export type AppLifecycleState = 'startup' | 'running' | 'shutdown'

export type ViewMode = 'chat' | 'providers'

export type ProviderStatus = {
  id: ProviderId
  name: string
  active: boolean
  model?: string
  isCurrent?: boolean
}
