import type { ProviderId } from '@cherrystudio/ai-core/provider'
import { getSupportedProviders } from '@cherrystudio/ai-core/provider'
import type { Key } from 'ink'
import { useApp, useInput } from 'ink'
import { useCallback, useMemo, useRef, useState } from 'react'

import AnimationContainer from './components/AnimationContainer'
import type { Message, StatusBarController } from './components/ChatInterface'
import { useCommandRegistry } from './hooks/useCommandRegistry'
import { useProviderState } from './hooks/useProviderState'
import type { AIConfig } from './services/aiService'
import type { AppLifecycleState, ViewMode } from './types/app'
import { getRandomAsciiLogo } from './ui/AsciiArt'
import { GOODBYE_MESSAGES } from './utils/constants'
import { randomChoice } from './utils/helpers'
import { ChatView, type RegisterClearHandler, type RegisterMessagesGetter, type RegisterProviderSwitcher, type RegisterStatusBarController } from './views/ChatView'

export const App = () => {
  const { exit } = useApp()
  const supportedProviders = useMemo(() => getSupportedProviders(), [])
  const {
    configs: providerConfigs,
    statuses,
    selectedIndex,
    selectNext,
    selectPrevious,
    refreshTimestamp,
    updateProviders,
    currentProviderId,
    initializedCount,
    supportedCount,
    lastUpdated
  } = useProviderState(supportedProviders)

  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [showProviderDashboard, setShowProviderDashboard] = useState(false)
  const [showAboutView, setShowAboutView] = useState(false)
  const [appState, setAppState] = useState<AppLifecycleState>('startup')
  const [goodbyeMessage, setGoodbyeMessage] = useState('')
  const [ctrlCPressed, setCtrlCPressed] = useState(false)
  const [isAIResponding, setIsAIResponding] = useState(false)
  const clearChatRef = useRef<(() => void) | null>(null)
  const providerSwitcherRef = useRef<((providerId: ProviderId) => boolean) | null>(null)
  const messagesGetterRef = useRef<(() => Message[]) | null>(null)
  const statusBarControllerRef = useRef<StatusBarController | null>(null)
  const modelSwitcherRef = useRef<((modelName?: string) => void) | null>(null)
  const cdHandlerRef = useRef<((directory?: string) => void) | null>(null)
  const randomAsciiLogo = useMemo(() => getRandomAsciiLogo(), [])

  const requestExit = useCallback((message?: string) => {
    setGoodbyeMessage(prev => {
      if (message) {
        return message
      }
      return prev || randomChoice(GOODBYE_MESSAGES)
    })
    setAppState('shutdown')
  }, [])

  const handleGoodbyeMessage = useCallback((message: string) => {
    setGoodbyeMessage(message)
  }, [])

  const registerClearHandler = useCallback<RegisterClearHandler>((handler) => {
    clearChatRef.current = handler ?? null
  }, [])

  const registerProviderSwitcher = useCallback<RegisterProviderSwitcher>((handler) => {
    providerSwitcherRef.current = handler ?? null
  }, [])

  const registerMessagesGetter = useCallback<RegisterMessagesGetter>((handler) => {
    messagesGetterRef.current = handler ?? null
  }, [])

  const registerStatusBarController = useCallback<RegisterStatusBarController>((controller) => {
    statusBarControllerRef.current = controller ?? null
  }, [])

  const registerModelSwitcher = useCallback((handler: ((modelName?: string) => void) | null) => {
    modelSwitcherRef.current = handler ?? null
  }, [])

  const registerCdHandler = useCallback((handler: ((directory?: string) => void) | null) => {
    cdHandlerRef.current = handler ?? null
  }, [])

  const getClearHandler = useCallback(() => clearChatRef.current ?? undefined, [])

  const getMessagesHandler = useCallback(() => messagesGetterRef.current ?? undefined, [])

  const getStatusBarController = useCallback(() => statusBarControllerRef.current ?? undefined, [])

  const getModelSwitcher = useCallback(() => modelSwitcherRef.current ?? undefined, [])

  const getCdHandler = useCallback(() => cdHandlerRef.current ?? undefined, [])

  const commandRegistry = useCommandRegistry({
    onShowProviders: () => setShowProviderDashboard(true),
    onShowAbout: () => setShowAboutView(true),
    onRequestExit: () => requestExit(),
    onShowGoodbyeMessage: handleGoodbyeMessage,
    getClearHandler,
    getMessagesHandler,
    getStatusBarController,
    getModelSwitcher,
    getCdHandler
  })

  const handleProviderSwitch = useCallback((providerId: ProviderId, configs: AIConfig[]) => {
    updateProviders(providerId, configs)
  }, [updateProviders])

  const handleStartupComplete = useCallback(() => {
    setAppState('running')
  }, [])

  const handleShutdownComplete = useCallback(() => {
    exit()
  }, [exit])

  useInput((input: string, key: Key) => {
    if (appState !== 'running') {
      return
    }

    if (key.ctrl && input === 'c') {
      // If AI is responding, let ChatSession handle it (don't trigger exit logic)
      if (isAIResponding) {
        return
      }
      
      if (ctrlCPressed) {
        requestExit()
      } else {
        setCtrlCPressed(true)
      }
      return
    }

    // Any other key press clears the Ctrl+C warning
    if (ctrlCPressed) {
      setCtrlCPressed(false)
    }

    // Provider dashboard input is handled by ProviderDashboard component itself
    // No need to handle input here anymore
  })
  // 显示启动动画
  if (appState === 'startup') {
    return (
      <AnimationContainer
        type="startup"
        onComplete={handleStartupComplete}
      />
    )
  }

  // 显示关闭动画
  if (appState === 'shutdown') {
    return (
      <AnimationContainer
        type="shutdown"
        onComplete={handleShutdownComplete}
        goodbyeMessage={goodbyeMessage}
      />
    )
  }

  // Always render ChatView, with provider dashboard as overlay
  return (
    <ChatView
      commandRegistry={commandRegistry}
      ctrlCPressed={ctrlCPressed}
      onProviderSwitch={handleProviderSwitch}
      registerClearHandler={registerClearHandler}
      registerProviderSwitcher={registerProviderSwitcher}
      registerMessagesGetter={registerMessagesGetter}
      registerStatusBarController={registerStatusBarController}
      registerModelSwitcher={registerModelSwitcher}
      registerCdHandler={registerCdHandler}
      onLoadingChange={setIsAIResponding}
      showProviderDashboard={showProviderDashboard}
      providerStatuses={statuses}
      selectedProviderIndex={selectedIndex}
      initializedCount={initializedCount}
      supportedCount={supportedCount}
      currentProviderId={currentProviderId}
      onCloseProviderDashboard={() => setShowProviderDashboard(false)}
      onSelectPreviousProvider={selectPrevious}
      onSelectNextProvider={selectNext}
      onSwitchToProvider={(index) => {
        const targetConfig = providerConfigs[index]
        if (targetConfig && providerSwitcherRef.current?.(targetConfig.providerId)) {
          setShowProviderDashboard(false)
        }
      }}
    />
  )
}

export default App
