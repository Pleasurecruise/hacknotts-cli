import { Box, Text, useInput } from 'ink'
import { memo } from 'react'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import type { ProviderStatus } from '../types/app'

type ProviderViewProps = {
  statuses: ProviderStatus[]
  selectedIndex: number
  initializedCount: number
  supportedCount: number
  currentProviderId: ProviderId | null
  robotMascotArt: string
  onClose: () => void
  onSelectPrevious: () => void
  onSelectNext: () => void
  onSwitchProvider: (index: number) => void
}

export const ProviderView = memo(({
  statuses,
  selectedIndex,
  initializedCount,
  supportedCount,
  currentProviderId,
  robotMascotArt,
  onClose,
  onSelectPrevious,
  onSelectNext,
  onSwitchProvider
}: ProviderViewProps) => {
  const hasProviders = statuses.length > 0

  // 处理键盘输入
  useInput((input, key) => {
    // Esc 或 q 关闭视图
    if (key.escape || input === 'q' || input === 'Q') {
      onClose()
      return
    }

    if (key.upArrow) {
      onSelectPrevious()
      return
    }

    if (key.downArrow) {
      onSelectNext()
      return
    }

    if (key.return && hasProviders) {
      onSwitchProvider(selectedIndex)
      return
    }
  })

  return (
    <Box flexDirection="column" width="100%">
      {/* 主内容区域 */}
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="cyan"
        paddingX={1}
        paddingY={0}
      >
        {/* 标题和Logo */}
        <Box flexDirection="column" marginBottom={1}>
          <Box marginTop={1}>
            <Text color="cyan" bold>🔌 AI Provider Configuration</Text>
          </Box>
        </Box>

        {/* 统计信息 */}
        <Box 
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          marginBottom={1}
        >
          <Text bold color="green">📊 Initialized: {initializedCount} / {supportedCount}</Text>
          {initializedCount === 0 ? (
            <Box flexDirection="column" paddingY={1}>
              <Text color="yellow">⚠️  No providers configured yet!</Text>
              <Text color="gray">💡 Add API keys to .env file to get started</Text>
              <Text color="gray">   Supported: OpenAI, Anthropic, DeepSeek, Google</Text>
            </Box>
          ) : (
            <Text color="gray">🎉 Your AI providers are ready!</Text>
          )}
        </Box>

        {/* 提供商列表 */}
        <Box 
          flexDirection="column" 
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Text color="cyan" bold>Available Providers:</Text>
          {!hasProviders ? (
            <Text color="gray" dimColor>  No providers initialized yet</Text>
          ) : (
            statuses.map((provider, index) => {
              const isSelected = index === selectedIndex
              const isCurrent = provider.isCurrent

              return (
                <Box key={provider.id} paddingX={1}>
                  <Text
                    color={isCurrent ? 'green' : isSelected ? 'yellow' : 'white'}
                    bold={Boolean(isCurrent || isSelected)}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {isCurrent ? '⚡' : '✓'} {provider.name}
                    <Text dimColor> ({provider.id})</Text>
                    {provider.model && (
                      <Text color="cyan" dimColor> • {provider.model}</Text>
                    )}
                    {isCurrent && <Text color="green"> [ACTIVE]</Text>}
                  </Text>
                </Box>
              )
            })
          )}
        </Box>
      </Box>

      {/* 快捷键区域 */}
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="magenta"
        paddingX={1}
        paddingY={0}
        marginTop={1}
      >
        <Box>
          <Text bold color="magenta">⌨️  Keyboard Shortcuts</Text>
        </Box>
        
        <Box flexDirection="column" paddingLeft={1}>
          <Box>
            <Text color="yellow" bold>{'↑ ↓'.padEnd(12)}</Text>
            <Text color="white">Navigate providers</Text>
          </Box>
          <Box>
            <Text color="yellow" bold>{'Enter'.padEnd(12)}</Text>
            <Text color="white">Switch to selected provider</Text>
          </Box>
          <Box>
            <Text color="yellow" bold>{'Esc / q'.padEnd(12)}</Text>
            <Text color="white">Close provider view</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            💡 Press Esc or q to return to chat
          </Text>
        </Box>
      </Box>
    </Box>
  )
})

ProviderView.displayName = 'ProviderView'

export default ProviderView
