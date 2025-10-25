import { Box, Text, useApp, useInput } from 'ink'
import type { Key } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
  getInitializedProviders,
  getSupportedProviders
} from '@cherrystudio/ai-core/provider'
import { standardAsciiLogo } from './ui/AsciiArt'
import ChatDemo from './components/ChatDemo'
import { createCommandRegistry } from './commands/CommandRegistry'
import { createProviderCommand, createHelpCommand, createClearCommand } from './commands/builtInCommands'

type SupportedProvider = ReturnType<typeof getSupportedProviders>[number]
type ProviderStatus = {
  id: string
  name: string
  active: boolean
}

type ViewMode = 'providers' | 'chat'

export const App = () => {
  const { exit } = useApp()
  const supported = useMemo(() => getSupportedProviders(), [])
  const [initialized, setInitialized] = useState<string[]>(() => getInitializedProviders())
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString())
  const [viewMode, setViewMode] = useState<ViewMode>('chat')

  // 创建命令注册表
  const commandRegistry = useMemo(() => {
    const registry = createCommandRegistry()
    
    // 注册 provider 命令
    registry.registerCommand(
      createProviderCommand(() => {
        setViewMode('providers')
      })
    )
    
    // 注册 help 命令 (会在 ChatInterface 中特殊处理)
    registry.registerCommand(
      createHelpCommand(() => registry.getAllCommands())
    )
    
    // 注册 clear 命令 (会在 ChatDemo 中处理,通过回调传递清除函数)
    registry.registerCommand(
      createClearCommand(() => {
        // 这个回调会在 ChatDemo 中被覆盖
      })
    )
    
    return registry
  }, [])

  useInput((input: string, key: Key) => {
    // 只在 providers 视图处理这些快捷键
    if (viewMode === 'providers') {
      if (key.ctrl && input === 'c' || input.toLowerCase() === 'q') {
        exit()
      }
      
      // 按 C 返回 Chat 视图
      if (input.toLowerCase() === 'c') {
        setViewMode('chat')
      }
    }

    // ESC 退出（在任何视图都可用）
    if (key.escape) {
      exit()
    }
  }, { isActive: viewMode === 'providers' })

  const statuses: ProviderStatus[] = useMemo(() => {
    const active = new Set(initialized)
  return supported.map((provider: SupportedProvider) => ({
      id: provider.id,
      name: provider.name,
      active: active.has(provider.id)
    }))
  }, [supported, initialized])

  // Chat View
  if (viewMode === 'chat') {
    return (
      <Box flexDirection="column">
        {/* View Switch Hint */}
        <Box paddingX={1} paddingTop={1}>
          <Text color="gray" dimColor>Type /provider to view providers | ESC to exit</Text>
        </Box>
        <ChatDemo commandRegistry={commandRegistry} />
      </Box>
    )
  }

  // Providers View
  return (
    <Box flexDirection="column" gap={1} padding={1}>
      {/* Header Section */}
      <Box flexDirection="column">
        <Text color="cyan">{standardAsciiLogo}</Text>
        <Text color="gray">Providers overview powered by @cherrystudio/ai-core</Text>
      </Box>

      {/* Main Content Box with Border */}
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="cyan"
        padding={1}
        gap={1}
      >
        {/* Provider Status Section */}
        <Box flexDirection="column">
          <Text bold color="green">Initialized providers: {initialized.length}{supported.length ? ` / ${supported.length}` : ''}</Text>
          {initialized.length === 0 && (
            <Text color="yellow">No providers registered yet. Add provider configurations to ai-core to get started.</Text>
          )}
        </Box>

        {/* Provider List */}
        <Box flexDirection="column">
          {statuses.map((provider) => (
            <Text key={provider.id} color={provider.active ? 'green' : 'yellow'}>
              [{provider.active ? '✓' : ' '}] {provider.name} ({provider.id})
            </Text>
          ))}
        </Box>
      </Box>

      {/* Footer Section */}
      <Box flexDirection="column">
        <Text color="gray">Press C to return to Chat | R to refresh | Q/ESC to exit</Text>
        <Text color="gray">Last updated: {lastUpdated}</Text>
      </Box>
    </Box>
  )
}

export default App
