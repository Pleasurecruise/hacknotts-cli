import { Box, Text } from 'ink'
import { useState } from 'react'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import ChatSession from '../components/ChatSession'
import type { AIConfig } from '../services/aiService'
import type { CommandRegistry } from '../commands'
import type { Message, StatusBarController } from '../components/ChatInterface'
import type { ProviderStatus } from '../types/app'
import { robotMascot } from '../ui/AsciiArt'

export type RegisterClearHandler = (handler: (() => void) | null) => void
export type RegisterProviderSwitcher = (handler: ((providerId: ProviderId) => boolean) | null) => void
export type RegisterMessagesGetter = (handler: (() => Message[]) | null) => void
export type RegisterStatusBarController = (controller: StatusBarController | null) => void

type ChatViewProps = {
  commandRegistry: CommandRegistry
  ctrlCPressed: boolean
  onProviderSwitch: (providerId: ProviderId, configs: AIConfig[]) => void
  registerClearHandler: RegisterClearHandler
  registerProviderSwitcher: RegisterProviderSwitcher
  registerMessagesGetter: RegisterMessagesGetter
  registerStatusBarController: RegisterStatusBarController
  onLoadingChange?: (isLoading: boolean) => void
  // Provider dashboard props
  showProviderDashboard?: boolean
  providerStatuses?: ProviderStatus[]
  selectedProviderIndex?: number
  initializedCount?: number
  supportedCount?: number
  currentProviderId?: ProviderId | null
  onCloseProviderDashboard?: () => void
  onSelectPreviousProvider?: () => void
  onSelectNextProvider?: () => void
  onSwitchToProvider?: (index: number) => void
}

export const ChatView = ({
  commandRegistry,
  ctrlCPressed,
  onProviderSwitch,
  registerClearHandler,
  registerProviderSwitcher,
  registerMessagesGetter,
  registerStatusBarController,
  onLoadingChange,
  showProviderDashboard = false,
  providerStatuses = [],
  selectedProviderIndex = 0,
  initializedCount = 0,
  supportedCount = 0,
  currentProviderId = null,
  onCloseProviderDashboard,
  onSelectPreviousProvider,
  onSelectNextProvider,
  onSwitchToProvider
}: ChatViewProps) => {
  const [hasMessages, setHasMessages] = useState(false)
  const mascot = robotMascot

  return (
    <Box flexDirection="column">
      {hasMessages && (
        <Box paddingX={1} paddingTop={1}>
          <Text color="cyan">{mascot}</Text>
        </Box>
      )}

      <ChatSession
        commandRegistry={commandRegistry}
        onHasMessages={setHasMessages}
        onProviderSwitch={onProviderSwitch}
        onRegisterClear={registerClearHandler}
        onRegisterProviderSwitcher={registerProviderSwitcher}
        onRegisterMessagesGetter={registerMessagesGetter}
        onRegisterStatusBarController={registerStatusBarController}
        ctrlCPressed={ctrlCPressed}
        onLoadingChange={onLoadingChange}
        showProviderView={showProviderDashboard}
        providerStatuses={providerStatuses}
        selectedProviderIndex={selectedProviderIndex}
        initializedCount={initializedCount}
        supportedCount={supportedCount}
        currentProviderId={currentProviderId}
        onCloseProviderView={onCloseProviderDashboard}
        onSelectPreviousProvider={onSelectPreviousProvider}
        onSelectNextProvider={onSelectNextProvider}
        onSwitchToProvider={onSwitchToProvider}
      />
    </Box>
  )
}

export default ChatView
