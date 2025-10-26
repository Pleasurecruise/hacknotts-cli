import { Box, Text } from 'ink'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import type { ProviderStatus } from '../types/app'

type ProviderDashboardProps = {
  statuses: ProviderStatus[]
  selectedIndex: number
  initializedCount: number
  supportedCount: number
  lastUpdated: string
  currentProviderId: ProviderId | null
  robotMascotArt: string
  asciiLogo: string
}

export const ProviderDashboard = ({
  statuses,
  selectedIndex,
  initializedCount,
  supportedCount,
  lastUpdated,
  currentProviderId,
  robotMascotArt,
  asciiLogo
}: ProviderDashboardProps) => {
  const hasProviders = statuses.length > 0

  return (
    <Box flexDirection="column" gap={1} padding={1}>
      <Box>
        <Text color="cyan">{robotMascotArt}</Text>
      </Box>

      <Box flexDirection="column">
        <Text color="cyan">{asciiLogo}</Text>
        <Text color="magenta" bold>🔌 AI Provider Configuration Dashboard</Text>
        <Text color="gray">Powered by @cherrystudio/ai-core • HackNotts 2025</Text>
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        padding={1}
        gap={1}
      >
        <Box flexDirection="column">
          <Text bold color="green">📊 Initialized providers: {initializedCount}{supportedCount ? ` / ${supportedCount}` : ''}</Text>
          {initializedCount === 0 ? (
            <Box flexDirection="column" paddingY={1}>
              <Text color="yellow">⚠️  No providers configured yet!</Text>
              <Text color="gray">💡 Tip: Add provider API keys to .env file to get started</Text>
              <Text color="gray">   Supported: OpenAI, Anthropic, DeepSeek, Google Gemini</Text>
            </Box>
          ) : (
            <Text color="gray">🎉 Great! Your AI providers are ready to help you build amazing things!</Text>
          )}
        </Box>

        <Box flexDirection="column" paddingY={1}>
          <Text color="cyan" bold>📋 Available Providers:</Text>
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

      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        <Text color="yellow" bold>⌨️  Keyboard Shortcuts:</Text>
        <Text color="gray">  <Text color="green">↑/↓</Text> - Navigate   <Text color="green">Enter</Text> - Switch Provider   <Text color="green">C</Text> - Return to Chat</Text>
        <Text color="gray">  <Text color="green">R</Text> - Refresh   <Text color="green">Q/ESC</Text> - Exit</Text>
        <Text color="gray" dimColor>Last updated: {new Date(lastUpdated).toLocaleString()}</Text>
        {currentProviderId && (
          <Text color="green" dimColor>Current provider: {currentProviderId}</Text>
        )}
      </Box>
    </Box>
  )
}

export default ProviderDashboard
