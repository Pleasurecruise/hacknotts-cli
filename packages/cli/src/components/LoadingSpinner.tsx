import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'

type LoadingSpinnerProps = {
  text?: string
}

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const dots = ['', '.', '..', '...']
// Color gradient from cyan to green
const colorGradient = ['cyan', 'blueBright', 'cyanBright', 'greenBright', 'green', 'greenBright', 'cyanBright', 'blueBright'] as const

export const LoadingSpinner = ({ text = 'AI is thinking' }: LoadingSpinnerProps) => {
  const [frame, setFrame] = useState(0)
  const [dotFrame, setDotFrame] = useState(0)
  const [colorFrame, setColorFrame] = useState(0)

  useEffect(() => {
    const spinnerInterval = setInterval(() => {
      setFrame((prev) => (prev + 1) % spinnerFrames.length)
    }, 80)

    const dotInterval = setInterval(() => {
      setDotFrame((prev) => (prev + 1) % dots.length)
    }, 400)

    const colorInterval = setInterval(() => {
      setColorFrame((prev) => (prev + 1) % colorGradient.length)
    }, 200)

    return () => {
      clearInterval(spinnerInterval)
      clearInterval(dotInterval)
      clearInterval(colorInterval)
    }
  }, [])

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={colorGradient[colorFrame]}>{spinnerFrames[frame]}</Text>
      <Text color={colorGradient[colorFrame]}>{text}{dots[dotFrame]}</Text>
      <Text color="yellow" dimColor>(Press Ctrl+C to cancel)</Text>
    </Box>
  )
}

export default LoadingSpinner
