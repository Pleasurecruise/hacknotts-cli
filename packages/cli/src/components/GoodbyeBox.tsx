import { Box, Text } from 'ink'
import { memo } from 'react'

type GoodbyeBoxProps = {
  message: string
}

export const GoodbyeBox = memo(({ message }: GoodbyeBoxProps) => {
  return (
    <Box 
      flexDirection="column" 
      borderStyle="double" 
      borderColor="magenta"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="magenta">✨ HackNotts CLI ✨</Text>
      </Box>
      
      <Box justifyContent="center" marginBottom={1}>
        <Text color="cyan">{message}</Text>
      </Box>
      
      <Box justifyContent="center">
        <Text color="gray" dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
      </Box>
      
      <Box justifyContent="center">
        <Text color="yellow">🎓 University of Nottingham</Text>
      </Box>
      
      <Box justifyContent="center">
        <Text color="green">🚀 Keep Building Amazing Things!</Text>
      </Box>
    </Box>
  )
})

GoodbyeBox.displayName = 'GoodbyeBox'

export default GoodbyeBox
