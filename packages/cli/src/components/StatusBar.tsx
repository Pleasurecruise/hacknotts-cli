import { Box, Text, useInput } from 'ink'

import type { StatusBarMessage } from '../hooks/useStatusBar'

type StatusBarProps = {
    statusMessage: StatusBarMessage | null
    onDismiss: () => void
    provider?: string
    model?: string
}

const getStatusColor = (type: 'info' | 'warning' | 'error' | 'success'): string => {
    switch (type) {
        case 'error':
            return 'red'
        case 'warning':
            return 'yellow'
        case 'success':
            return 'green'
        case 'info':
            return 'cyan'
        default:
            return 'gray'
    }
}

const getStatusIcon = (type: 'info' | 'warning' | 'error' | 'success'): string => {
    switch (type) {
        case 'error':
            return '✖'
        case 'warning':
            return '⚠'
        case 'success':
            return '✓'
        case 'info':
            return 'ℹ'
        default:
            return '•'
    }
}

export const StatusBar = ({ statusMessage, onDismiss, provider, model }: StatusBarProps) => {
    // Handle ESC key to dismiss status message (only when there's a message)
    useInput((input, key) => {
        if (key.escape && statusMessage) {
            // Stop event propagation by handling it here
            onDismiss()
            return
        }
    }, { isActive: !!statusMessage })

    if (statusMessage) {
        const color = getStatusColor(statusMessage.type)
        const icon = getStatusIcon(statusMessage.type)
        const showDismissHint = !statusMessage.autoDismiss

        return (
            <Box marginTop={1} width="100%" justifyContent="space-between" backgroundColor={color}>
                <Text bold>
                    {' '}{icon}{' '}{statusMessage.content}
                </Text>
                {showDismissHint && (
                    <Text bold italic>(Press ESC to dismiss)</Text>
                )}
            </Box>
        )
    }

    // Default status bar showing working directory and provider info
    return (
        <Box marginTop={1} justifyContent="space-between" width="100%">
            <Text color="gray">
                Working Directory: <Text color="cyan">{process.cwd()}</Text>
            </Text>
            {provider && model && (
                <Text color="gray">
                    Provider: <Text color="magenta">{provider}</Text> • Model: <Text color="green">{model}</Text>
                </Text>
            )}
        </Box>
    )
}

export default StatusBar
