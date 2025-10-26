import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp, useInput } from 'ink'
import type { Key } from 'ink'
import type { ProviderId } from '@cherrystudio/ai-core/provider'
import { getSupportedProviders } from '@cherrystudio/ai-core/provider'
import { getRandomAsciiLogo, robotMascot } from './ui/AsciiArt'
import AnimationContainer from './components/AnimationContainer'
import type { AIConfig } from './services/aiService'
import { useProviderState } from './hooks/useProviderState'
import { useCommandRegistry } from './hooks/useCommandRegistry'
import { ChatView, type RegisterClearHandler, type RegisterProviderSwitcher } from './views/ChatView'
import { ProviderDashboard } from './views/ProviderDashboard'
import { GOODBYE_MESSAGES } from './utils/constants'
import { randomChoice } from './utils/helpers'
import type { AppLifecycleState, ViewMode } from './types/app'

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
  const [appState, setAppState] = useState<AppLifecycleState>('startup')
  const [goodbyeMessage, setGoodbyeMessage] = useState('')
  const [ctrlCPressed, setCtrlCPressed] = useState(false)
  const [isAIResponding, setIsAIResponding] = useState(false)
  const ctrlCResetTimeout = useRef<NodeJS.Timeout | null>(null)
  const clearChatRef = useRef<(() => void) | null>(null)
  const providerSwitcherRef = useRef<((providerId: ProviderId) => boolean) | null>(null)
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

  const getClearHandler = useCallback(() => clearChatRef.current ?? undefined, [])

  const commandRegistry = useCommandRegistry({
    onShowProviders: () => setViewMode('providers'),
    onRequestExit: () => requestExit(),
    onShowGoodbyeMessage: handleGoodbyeMessage,
    getClearHandler
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

  useEffect(() => {
    return () => {
      if (ctrlCResetTimeout.current) {
        clearTimeout(ctrlCResetTimeout.current)
      }
    }
  }, [])

  useInput((input: string, key: Key) => {
    if (appState !== 'running') {
      return
    }

    if (key.escape) {
      requestExit()
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
        if (ctrlCResetTimeout.current) {
          clearTimeout(ctrlCResetTimeout.current)
        }
        ctrlCResetTimeout.current = setTimeout(() => {
          setCtrlCPressed(false)
          ctrlCResetTimeout.current = null
        }, 3000)
      }
      return
    }

    // Any other key press clears the Ctrl+C warning
    if (ctrlCPressed) {
      setCtrlCPressed(false)
      if (ctrlCResetTimeout.current) {
        clearTimeout(ctrlCResetTimeout.current)
        ctrlCResetTimeout.current = null
      }
    }

    if (viewMode === 'providers') {
      if (key.upArrow) {
        selectPrevious()
        return
      }

      if (key.downArrow) {
        selectNext()
        return
      }

      if (key.return && providerConfigs.length > 0) {
        const targetConfig = providerConfigs[selectedIndex]
        if (targetConfig && providerSwitcherRef.current?.(targetConfig.providerId)) {
          setViewMode('chat')
        }
        return
      }

      const normalizedInput = input?.toLowerCase?.() ?? ''

      if (normalizedInput === 'r') {
        refreshTimestamp()
        return
      }

      if (normalizedInput === 'c') {
        setViewMode('chat')
        return
      }

      if (normalizedInput === 'q') {
        requestExit()
        return
      }
    }
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

  if (viewMode === 'providers') {
    return (
      <ProviderDashboard
        statuses={statuses}
        selectedIndex={selectedIndex}
        initializedCount={initializedCount}
        supportedCount={supportedCount}
        lastUpdated={lastUpdated}
        currentProviderId={currentProviderId}
        robotMascotArt={robotMascot}
        asciiLogo={randomAsciiLogo}
      />
    )
  }

  return (
    <ChatView
      commandRegistry={commandRegistry}
      ctrlCPressed={ctrlCPressed}
      onProviderSwitch={handleProviderSwitch}
      registerClearHandler={registerClearHandler}
      registerProviderSwitcher={registerProviderSwitcher}
      onLoadingChange={setIsAIResponding}
    />
  )
}

export default App
