import { Box, Text } from 'ink'
import type { Command } from '../commands/types'

type CommandListProps = {
  commands: Command[]
  onClose: () => void
  selectedIndex?: number
  searchQuery?: string
}

export const CommandList = ({ commands, selectedIndex = 0, searchQuery = '' }: CommandListProps) => {
  if (commands.length === 0) {
    return (
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="yellow"
        padding={1}
        marginY={1}
      >
        <Box marginBottom={1}>
          <Text bold color="yellow">📋 Available Commands</Text>
        </Box>
        <Box>
          <Text color="gray" dimColor>No matching commands found</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="yellow"
      padding={1}
      marginY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">📋 Available Commands</Text>
        {searchQuery && (
          <Text color="gray" dimColor> (searching: "{searchQuery}")</Text>
        )}
      </Box>
      
      {commands.map((command, index) => {
        const isSelected = index === selectedIndex
        
        return (
          <Box key={command.name} flexDirection="column" marginBottom={1}>
            <Box>
              {isSelected && <Text color="green">▶ </Text>}
              {!isSelected && <Text>  </Text>}
              <Text 
                color={isSelected ? "green" : "cyan"} 
                bold={isSelected}
                inverse={isSelected}
              >
                /{command.name}
              </Text>
              {command.aliases && command.aliases.length > 0 && (
                <Text color="gray" dimColor> (aliases: {command.aliases.map(a => `/${a}`).join(', ')})</Text>
              )}
            </Box>
            <Box paddingLeft={4}>
              <Text color={isSelected ? "white" : "gray"}>{command.description}</Text>
            </Box>
          </Box>
        )
      })}
      
      <Box marginTop={1} borderStyle="single" borderTop paddingTop={1}>
        <Text color="gray" dimColor>💡 ↑↓ to navigate | Tab to complete | Enter to execute</Text>
      </Box>
    </Box>
  )
}

export default CommandList
