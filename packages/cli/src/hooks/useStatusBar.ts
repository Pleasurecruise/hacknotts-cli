import { useState, useCallback } from 'react'

export type StatusBarMessageType = 'info' | 'warning' | 'error'

export type StatusBarMessage = {
  id: string
  type: StatusBarMessageType
  content: string
  timestamp: Date
}

let statusBarMessageIdCounter = 0

export const useStatusBar = () => {
  const [statusMessage, setStatusMessage] = useState<StatusBarMessage | null>(null)

  const showStatus = useCallback((type: StatusBarMessageType, content: string) => {
    const id = `status-${Date.now()}-${statusBarMessageIdCounter++}`
    setStatusMessage({
      id,
      type,
      content,
      timestamp: new Date()
    })
  }, [])

  const clearStatus = useCallback(() => {
    setStatusMessage(null)
  }, [])

  const showInfo = useCallback((content: string) => {
    showStatus('info', content)
  }, [showStatus])

  const showWarning = useCallback((content: string) => {
    showStatus('warning', content)
  }, [showStatus])

  const showError = useCallback((content: string) => {
    showStatus('error', content)
  }, [showStatus])

  return {
    statusMessage,
    showStatus,
    clearStatus,
    showInfo,
    showWarning,
    showError
  }
}
