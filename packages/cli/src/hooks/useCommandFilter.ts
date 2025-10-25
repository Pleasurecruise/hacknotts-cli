/**
 * Command Filter Hook
 * Handles command search and filtering logic
 */
import { useEffect } from 'react'
import type { CommandRegistry } from '../commands/types'
import type { Command } from '../commands/types'

interface UseCommandFilterProps {
  inputValue: string
  commandRegistry?: CommandRegistry
  setFilteredCommands: (commands: Command[]) => void
  setSelectedCommandIndex: (index: number) => void
  setShowCommandList: (show: boolean) => void
}

export function useCommandFilter({
  inputValue,
  commandRegistry,
  setFilteredCommands,
  setSelectedCommandIndex,
  setShowCommandList
}: UseCommandFilterProps) {
  useEffect(() => {
    if (inputValue.startsWith('/') && commandRegistry) {
      const searchQuery = inputValue.slice(1).toLowerCase()
      const allCommands = commandRegistry.getAllCommands()
      
      if (searchQuery === '') {
        // Only entered /, show all commands
        setFilteredCommands(allCommands)
      } else {
        // Filter matching commands
        const filtered = allCommands.filter(cmd => {
          const nameMatch = cmd.name.toLowerCase().includes(searchQuery)
          const aliasMatch = cmd.aliases?.some(alias => alias.toLowerCase().includes(searchQuery))
          const descMatch = cmd.description.toLowerCase().includes(searchQuery)
          return nameMatch || aliasMatch || descMatch
        })
        
        // Sort by relevance
        filtered.sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(searchQuery)
          const bStartsWith = b.name.toLowerCase().startsWith(searchQuery)
          if (aStartsWith && !bStartsWith) return -1
          if (!aStartsWith && bStartsWith) return 1
          return a.name.localeCompare(b.name)
        })
        
        setFilteredCommands(filtered)
      }
      
      setSelectedCommandIndex(0)
      setShowCommandList(true)
    } else {
      setShowCommandList(false)
      setFilteredCommands([])
    }
  }, [inputValue, commandRegistry, setFilteredCommands, setSelectedCommandIndex, setShowCommandList])
}
