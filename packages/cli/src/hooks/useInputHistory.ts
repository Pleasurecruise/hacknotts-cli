/**
 * Input History Hook
 * Manages command/message history with up/down arrow navigation
 */
import { useCallback, useRef,useState } from 'react'

interface UseInputHistoryOptions {
  maxHistorySize?: number
}

interface UseInputHistoryResult {
  addToHistory: (input: string) => void
  navigateHistory: (direction: 'up' | 'down') => string | null
  resetNavigation: () => void
  currentIndex: number
  historySize: number
}

export function useInputHistory(options: UseInputHistoryOptions = {}): UseInputHistoryResult {
  const { maxHistorySize = 50 } = options
  
  // 历史记录数组（最新的在前面）
  const [history, setHistory] = useState<string[]>([])
  
  // 当前导航位置：-1 表示不在历史记录中（输入新内容），0+ 表示历史记录索引
  const [navigationIndex, setNavigationIndex] = useState(-1)
  
  // 临时保存当前正在输入的内容（当用户开始浏览历史时）
  const currentInputRef = useRef<string>('')

  /**
   * 添加新的输入到历史记录
   */
  const addToHistory = useCallback((input: string) => {
    const trimmedInput = input.trim()
    
    // 忽略空输入
    if (!trimmedInput) {
      return
    }
    
    setHistory(prev => {
      // 如果与最近的一条相同，不重复添加
      if (prev[0] === trimmedInput) {
        return prev
      }
      
      // 移除历史记录中的重复项（如果存在）
      const filtered = prev.filter(item => item !== trimmedInput)
      
      // 添加到最前面
      const newHistory = [trimmedInput, ...filtered]
      
      // 限制历史记录大小
      return newHistory.slice(0, maxHistorySize)
    })
    
    // 重置导航状态
    setNavigationIndex(-1)
    currentInputRef.current = ''
  }, [maxHistorySize])

  /**
   * 导航历史记录
   * @param direction 'up' 向上（更旧的记录）或 'down' 向下（更新的记录）
   * @returns 历史记录中的输入，如果没有则返回 null
   */
  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput?: string): string | null => {
    if (history.length === 0) {
      return null
    }
    
    // 如果是第一次开始导航，保存当前输入
    if (navigationIndex === -1 && currentInput !== undefined) {
      currentInputRef.current = currentInput
    }
    
    let newIndex = navigationIndex
    
    if (direction === 'up') {
      // 向上：查看更旧的历史记录
      if (navigationIndex < history.length - 1) {
        newIndex = navigationIndex + 1
      } else {
        // 已经在最旧的记录了
        return null
      }
    } else {
      // 向下：查看更新的历史记录
      if (navigationIndex > 0) {
        newIndex = navigationIndex - 1
      } else if (navigationIndex === 0) {
        // 回到当前输入
        setNavigationIndex(-1)
        return currentInputRef.current
      } else {
        // 已经在当前输入了
        return null
      }
    }
    
    setNavigationIndex(newIndex)
    return history[newIndex]
  }, [history, navigationIndex])

  /**
   * 重置导航状态（通常在用户开始输入新内容时调用）
   */
  const resetNavigation = useCallback(() => {
    setNavigationIndex(-1)
    currentInputRef.current = ''
  }, [])

  return {
    addToHistory,
    navigateHistory,
    resetNavigation,
    currentIndex: navigationIndex,
    historySize: history.length
  }
}
