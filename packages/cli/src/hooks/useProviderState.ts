import type { ProviderId } from '@cherrystudio/ai-core/provider'
import { type Dispatch, type SetStateAction,useCallback, useMemo, useState } from 'react'

import type { AIConfig } from '../services/aiService'
import type { ProviderStatus } from '../types/app'

type SupportedProvider = {
  id: ProviderId
  name: string
}

type UseProviderStateResult = {
  configs: AIConfig[]
  statuses: ProviderStatus[]
  selectedIndex: number
  setSelectedIndex: Dispatch<SetStateAction<number>>
  selectNext: () => void
  selectPrevious: () => void
  refreshTimestamp: () => void
  updateProviders: (providerId: ProviderId, configs: AIConfig[]) => void
  currentProviderId: ProviderId | null
  initializedIds: string[]
  initializedCount: number
  supportedCount: number
  lastUpdated: string
}

export const useProviderState = (supportedProviders: SupportedProvider[]): UseProviderStateResult => {
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [currentProviderId, setCurrentProviderId] = useState<ProviderId | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString())

  const initializedIds = useMemo(() => configs.map(config => config.providerId), [configs])

  const statuses = useMemo<ProviderStatus[]>(() => {
    return configs.map((config) => {
      const supported = supportedProviders.find(provider => provider.id === config.providerId)
      return {
        id: config.providerId,
        name: supported?.name ?? config.providerId,
        active: true,
        model: config.model,
        isCurrent: config.providerId === currentProviderId
      }
    })
  }, [configs, currentProviderId, supportedProviders])

  const updateProviders = useCallback((providerId: ProviderId, nextConfigs: AIConfig[]) => {
    setConfigs(nextConfigs)
    setCurrentProviderId(providerId)
    setSelectedIndex(() => {
      const nextIndex = nextConfigs.findIndex(config => config.providerId === providerId)
      return nextIndex >= 0 ? nextIndex : 0
    })
    setLastUpdated(new Date().toISOString())
  }, [])

  const selectNext = useCallback(() => {
    setSelectedIndex(prevIndex => {
      if (configs.length === 0) {
        return prevIndex
      }
      return prevIndex < configs.length - 1 ? prevIndex + 1 : 0
    })
  }, [configs.length])

  const selectPrevious = useCallback(() => {
    setSelectedIndex(prevIndex => {
      if (configs.length === 0) {
        return prevIndex
      }
      return prevIndex > 0 ? prevIndex - 1 : configs.length - 1
    })
  }, [configs.length])

  const refreshTimestamp = useCallback(() => {
    setLastUpdated(new Date().toISOString())
  }, [])

  return {
    configs,
    statuses,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    refreshTimestamp,
    updateProviders,
    currentProviderId,
    initializedIds,
    initializedCount: configs.length,
    supportedCount: supportedProviders.length,
    lastUpdated
  }
}
