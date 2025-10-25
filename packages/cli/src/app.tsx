import { Box, Text, useApp, useInput } from 'ink'
import type { Key } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
  getInitializedProviders,
  getSupportedProviders
} from '@cherrystudio/ai-core/provider'
import { standardAsciiLogo } from './ui/AsciiArt'

const REFRESH_INTERVAL_MS = 2000

type SupportedProvider = ReturnType<typeof getSupportedProviders>[number]
type ProviderStatus = {
  id: string
  name: string
  active: boolean
}

export const App = () => {
  const { exit } = useApp()
  const supported = useMemo(() => getSupportedProviders(), [])
  const [initialized, setInitialized] = useState<string[]>(() => getInitializedProviders())
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString())

  useEffect(() => {
    const interval = setInterval(() => {
      setInitialized(getInitializedProviders())
      setLastUpdated(new Date().toISOString())
    }, REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [])

  useInput((input: string, key: Key) => {
    if (key.escape || key.return || key.ctrl && input === 'c' || input.toLowerCase() === 'q') {
      exit()
    }

    if (input.toLowerCase() === 'r') {
      setInitialized(getInitializedProviders())
      setLastUpdated(new Date().toISOString())
    }
  })

  const statuses: ProviderStatus[] = useMemo(() => {
    const active = new Set(initialized)
  return supported.map((provider: SupportedProvider) => ({
      id: provider.id,
      name: provider.name,
      active: active.has(provider.id)
    }))
  }, [supported, initialized])

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text color="cyan">{standardAsciiLogo}</Text>
        <Text color="gray">Providers overview powered by @cherrystudio/ai-core</Text>
      </Box>

      <Box flexDirection="column">
        <Text>Initialized providers: {initialized.length}{supported.length ? ` / ${supported.length}` : ''}</Text>
        {initialized.length === 0 && (
          <Text color="yellow">No providers registered yet. Add provider configurations to ai-core to get started.</Text>
        )}
        {statuses.map((provider) => (
          <Text key={provider.id} color={provider.active ? 'green' : 'yellow'}>
            [{provider.active ? 'x' : ' '}] {provider.name} ({provider.id})
          </Text>
        ))}
      </Box>

      <Box flexDirection="column">
        <Text color="gray">Press R to refresh, Q to exit, Ctrl+C or Enter also close.</Text>
        <Text color="gray">Last updated: {lastUpdated}</Text>
      </Box>
    </Box>
  )
}

export default App
