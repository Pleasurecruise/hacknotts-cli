import { Box, Text } from 'ink'
import type { Command } from '../commands/types'

type CommandListProps = {
  commands: Command[]
  onClose: () => void
}

export const CommandList = ({ commands }: CommandListProps) => {
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
      
      {commands.map((command) => (
        <Box key={command.name} flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="cyan">/{command.name}</Text>
            {command.aliases && command.aliases.length > 0 && (
              <Text color="gray" dimColor> (aliases: {command.aliases.map(a => `/${a}`).join(', ')})</Text>
            )}
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray">{command.description}</Text>
          </Box>
        </Box>
      ))}
      
      <Box marginTop={1} borderStyle="single" borderTop paddingTop={1}>
        <Text color="gray" dimColor>💡 Type / to see commands | Type a command and press Enter to execute</Text>
      </Box>
    </Box>
  )
}

export default CommandList
