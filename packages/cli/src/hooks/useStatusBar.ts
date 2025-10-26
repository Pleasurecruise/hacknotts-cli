import { useCallback, useEffect,useRef, useState } from 'react'

export type StatusBarMessageType = 'info' | 'warning' | 'error' | 'success'

export type StatusBarMessage = {
  id: string
  type: StatusBarMessageType
  content: string
  timestamp: Date
  autoDismiss?: number // 自动消失时间（毫秒），undefined 表示不自动消失
}

let statusBarMessageIdCounter = 0

export const useStatusBar = () => {
  const [statusMessage, setStatusMessage] = useState<StatusBarMessage | null>(null)
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清理计时器
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  // 当状态消息改变时，设置自动消失计时器
  useEffect(() => {
    // 清除之前的计时器
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
      dismissTimeoutRef.current = null
    }

    // 如果有自动消失时间，设置新的计时器
    if (statusMessage?.autoDismiss) {
      dismissTimeoutRef.current = setTimeout(() => {
        setStatusMessage(null)
        dismissTimeoutRef.current = null
      }, statusMessage.autoDismiss)
    }
  }, [statusMessage])

  const showStatus = useCallback((
    type: StatusBarMessageType, 
    content: string, 
    autoDismiss?: number
  ) => {
    const id = `status-${Date.now()}-${statusBarMessageIdCounter++}`
    setStatusMessage({
      id,
      type,
      content,
      timestamp: new Date(),
      autoDismiss
    })
  }, [])

  const clearStatus = useCallback(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
      dismissTimeoutRef.current = null
    }
    setStatusMessage(null)
  }, [])

  const showInfo = useCallback((content: string, autoDismiss?: number) => {
    showStatus('info', content, autoDismiss)
  }, [showStatus])

  const showWarning = useCallback((content: string, autoDismiss?: number) => {
    showStatus('warning', content, autoDismiss)
  }, [showStatus])

  const showError = useCallback((content: string, autoDismiss?: number) => {
    showStatus('error', content, autoDismiss)
  }, [showStatus])

  const showSuccess = useCallback((content: string, autoDismiss: number = 3000) => {
    showStatus('success', content, autoDismiss)
  }, [showStatus])

  return {
    statusMessage,
    showStatus,
    clearStatus,
    showInfo,
    showWarning,
    showError,
    showSuccess
  }
}
