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
  filteredCommands: any[]
  selectedCommandIndex: number
  setSelectedCommandIndex: (index: number | ((prev: number) => number)) => void
  isLoading: boolean
  commandRegistry?: CommandRegistry
  onSendMessage: (message: string, showGoodbyeMessage?: string) => void
}

export function useInputHandler({
  inputValue,
  setInputValue,
  cursorPosition,
  setCursorPosition,
  showCommandList,
  setShowCommandList,
  filteredCommands,
  selectedCommandIndex,
  setSelectedCommandIndex,
  isLoading,
  commandRegistry,
  onSendMessage
}: UseInputHandlerProps) {
  return useCallback((input: string, key: Key) => {
    // Command list navigation
    if (showCommandList && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        return
      }
      
      if (key.downArrow) {
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        return
      }
      
      // Tab key autocomplete
      if (key.tab) {
        const selectedCommand = filteredCommands[selectedCommandIndex]
        if (selectedCommand) {
          const newValue = `/${selectedCommand.name} `
          setInputValue(newValue)
          setCursorPosition(StringHelper.getLength(newValue))
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
        
        // Check if it's a command
        if (trimmedInput.startsWith('/') && commandRegistry) {
          const { command: commandName } = parseCommand(trimmedInput)
          const command = commandRegistry.getCommand(commandName)
          
          if (command) {
            commandRegistry.executeCommand(trimmedInput)
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
      const newValue = StringHelper.insertAt(inputValue, cursorPosition, input)
      setInputValue(newValue)
      setCursorPosition(cursorPosition + StringHelper.getLength(input))
    }
  }, [
    inputValue,
    cursorPosition,
    showCommandList,
    filteredCommands,
    selectedCommandIndex,
    isLoading,
    commandRegistry,
    onSendMessage,
    setInputValue,
    setCursorPosition,
    setShowCommandList,
    setSelectedCommandIndex
  ])
}
