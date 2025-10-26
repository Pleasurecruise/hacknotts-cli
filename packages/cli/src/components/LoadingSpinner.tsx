import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'
import AnimatedGradient from './AnimatedGradient'

type LoadingSpinnerProps = {
    text?: string
}

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const dots = ['', '.', '..', '...']

export const LoadingSpinner = ({ text = 'AI is thinking' }: LoadingSpinnerProps) => {
    const [frame, setFrame] = useState(0)
    const [dotFrame, setDotFrame] = useState(0)

    useEffect(() => {
        const spinnerInterval = setInterval(() => {
            setFrame((prev) => (prev + 1) % spinnerFrames.length)
        }, 80)

        const dotInterval = setInterval(() => {
            setDotFrame((prev) => (prev + 1) % dots.length)
        }, 400)

        return () => {
            clearInterval(spinnerInterval)
            clearInterval(dotInterval)
        }
    }, [])

    return (
        <Box flexDirection="row" gap={1}>
            <Text>{spinnerFrames[frame]}</Text>
            <AnimatedGradient>
                <Text>{text}</Text>
            </AnimatedGradient>
            <Text>{dots[dotFrame]}</Text>
            <Text color="yellow" dimColor>(Press Ctrl+C to cancel)</Text>
        </Box>
    )
}

export default LoadingSpinner
