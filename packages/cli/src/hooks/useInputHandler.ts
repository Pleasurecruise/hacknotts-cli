/**
 * Input Handler Hook
 * Encapsulates complex input logic
 */
import { useCallback } from 'react'
import type { Key } from 'ink'
import { StringHelper, parseCommand } from '../utils/helpers'
import type { CommandRegistry } from '../commands/types'

interface UseInputHandlerProps {
  inputValue: string
  setInputValue: (value: string) => void
  cursorPosition: number
  setCursorPosition: (position: number) => void
  showCommandList: boolean
  setShowCommandList: (show: boolean) => void
  showHelpView: boolean
  setShowHelpView: (show: boolean) => void
  filteredCommands: any[]
  selectedCommandIndex: number
  setSelectedCommandIndex: (index: number | ((prev: number) => number)) => void
  scrollOffset: number
  setScrollOffset: (offset: number | ((prev: number) => number)) => void
  isLoading: boolean
  commandRegistry?: CommandRegistry
  onSendMessage: (message: string) => void
  // 输入历史相关
  onNavigateHistory?: (direction: 'up' | 'down', currentInput: string) => string | null
  onResetHistoryNavigation?: () => void
  onMessageSent?: (message: string) => void
}

export function useInputHandler({
  inputValue,
  setInputValue,
  cursorPosition,
  setCursorPosition,
  showCommandList,
  setShowCommandList,
  showHelpView,
  setShowHelpView,
  filteredCommands,
  selectedCommandIndex,
  setSelectedCommandIndex,
  scrollOffset,
  setScrollOffset,
  isLoading,
  commandRegistry,
  onSendMessage,
  onNavigateHistory,
  onResetHistoryNavigation,
  onMessageSent
}: UseInputHandlerProps) {
  return useCallback((input: string, key: Key) => {
    // 如果 help view 显示，不处理输入（help view 会自己处理）
    if (showHelpView) {
      return
    }
    
    // 计算可见区域的高度
    const terminalHeight = process.stdout.rows || 24
    const availableHeight = terminalHeight - 12
    const boxHeight = Math.max(5, Math.min(availableHeight, 15))
    const maxScroll = Math.max(0, filteredCommands.length - boxHeight)

    // Command list navigation
    if (showCommandList && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSelectedCommandIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : filteredCommands.length - 1
          
          // 自动滚动以确保选中项可见
          if (newIndex < scrollOffset) {
            setScrollOffset(newIndex)
          } else if (newIndex >= scrollOffset + boxHeight) {
            setScrollOffset(Math.max(0, newIndex - boxHeight + 1))
          }
          
          return newIndex
        })
        return
      }
      
      if (key.downArrow) {
        setSelectedCommandIndex(prev => {
          const newIndex = prev < filteredCommands.length - 1 ? prev + 1 : 0
          
          // 自动滚动以确保选中项可见
          if (newIndex < scrollOffset) {
            setScrollOffset(newIndex)
          } else if (newIndex >= scrollOffset + boxHeight) {
            setScrollOffset(Math.max(0, newIndex - boxHeight + 1))
          }
          
          return newIndex
        })
        return
      }

      // Page Up - 向上翻页
      if (key.pageUp) {
        const newScroll = Math.max(0, scrollOffset - boxHeight)
        setScrollOffset(newScroll)
        setSelectedCommandIndex(newScroll)
        return
      }

      // Page Down - 向下翻页
      if (key.pageDown) {
        const newScroll = Math.min(maxScroll, scrollOffset + boxHeight)
        setScrollOffset(newScroll)
        setSelectedCommandIndex(Math.min(filteredCommands.length - 1, newScroll))
        return
      }
      
      // Tab key autocomplete
      if (key.tab) {
        const selectedCommand = filteredCommands[selectedCommandIndex]
        if (selectedCommand) {
          const newValue = `/${selectedCommand.name}`
          setInputValue(newValue)
          setCursorPosition(StringHelper.getLength(newValue))
        }
        return
      }
    }

    // 输入历史导航（仅当命令列表未显示时）
    if (!showCommandList && onNavigateHistory) {
      if (key.upArrow) {
        const historyItem = onNavigateHistory('up', inputValue)
        if (historyItem !== null) {
          setInputValue(historyItem)
          setCursorPosition(StringHelper.getLength(historyItem))
        }
        return
      }
      
      if (key.downArrow) {
        const historyItem = onNavigateHistory('down', inputValue)
        if (historyItem !== null) {
          setInputValue(historyItem)
          setCursorPosition(StringHelper.getLength(historyItem))
        }
        return
      }
    }

    // Backspace key
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = StringHelper.deleteAt(inputValue, cursorPosition)
        setInputValue(newValue)
        setCursorPosition(cursorPosition - 1)
      }
      return
    }

    // Left/Right arrows (only when command list is not shown)
    if (key.leftArrow && !showCommandList) {
      setCursorPosition(Math.max(0, cursorPosition - 1))
      return
    }

    if (key.rightArrow && !showCommandList) {
      setCursorPosition(Math.min(StringHelper.getLength(inputValue), cursorPosition + 1))
      return
    }

    // Home/End keys
    if (key.meta && input === 'a') {
      setCursorPosition(0)
      return
    }

    if (key.meta && input === 'e') {
      setCursorPosition(StringHelper.getLength(inputValue))
      return
    }

    // Enter key - send message or execute command
    if (key.return) {
      if (inputValue.trim() && !isLoading) {
        const trimmedInput = inputValue.trim()
        
        // 添加到历史记录
        if (onMessageSent) {
          onMessageSent(trimmedInput)
        }
        
        // Check if it's a command
        if (trimmedInput.startsWith('/') && commandRegistry) {
          const { command: commandName } = parseCommand(trimmedInput)
          const command = commandRegistry.getCommand(commandName)
          
          if (command) {
            // 特殊处理 help 命令
            if (commandName === 'help' || commandName === 'h' || commandName === '?') {
              setShowHelpView(true)
            } else {
              commandRegistry.executeCommand(trimmedInput)
            }
          } else {
            onSendMessage(trimmedInput)
          }
        } else {
          // Regular message
          onSendMessage(trimmedInput)
        }
        
        setInputValue('')
        setCursorPosition(0)
        setShowCommandList(false)
      }
      return
    }

    // Regular character input
    if (!key.return && !key.escape && !key.ctrl && !key.meta && !key.tab && input) {
      // 当用户开始输入新内容时，重置历史导航
      if (onResetHistoryNavigation) {
        onResetHistoryNavigation()
      }
      
      const newValue = StringHelper.insertAt(inputValue, cursorPosition, input)
      setInputValue(newValue)
      setCursorPosition(cursorPosition + StringHelper.getLength(input))
    }
  }, [
    inputValue,
    cursorPosition,
    showCommandList,
    showHelpView,
    filteredCommands,
    selectedCommandIndex,
    scrollOffset,
    isLoading,
    commandRegistry,
    onSendMessage,
    setInputValue,
    setCursorPosition,
    setShowCommandList,
    setShowHelpView,
    setSelectedCommandIndex,
    setScrollOffset,
    onNavigateHistory,
    onResetHistoryNavigation,
    onMessageSent
  ])
}
