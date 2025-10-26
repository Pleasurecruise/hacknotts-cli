import { Box, Text } from 'ink'
import { useState, useEffect } from 'react'
import Gradient from 'ink-gradient'

type LoadingSpinnerProps = {
    text?: string
}

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const dots = ['', '.', '..', '...']

// 定义多组渐变颜色，创建平滑的连续过渡效果
// 颜色从蓝色系 -> 青色系 -> 绿色系 -> 青色系 -> 蓝色系，形成循环
const gradientColors = [
    ['#0080FF', '#00D4FF'], // 蓝色 -> 亮青色
    ['#00B8FF', '#00FFE0'], // 天蓝 -> 青绿
    ['#00E0FF', '#00FFC0'], // 青色 -> 青绿
    ['#00FFF0', '#00FFA0'], // 亮青 -> 浅绿
    ['#00FFD0', '#20FF80'], // 青绿 -> 春绿
    ['#00FFB0', '#40FF60'], // 浅绿 -> 绿色
    ['#20FF90', '#60FF40'], // 春绿 -> 黄绿
    ['#40FF70', '#80FF20'], // 绿色 -> 黄绿
    ['#60FF50', '#A0FF00'], // 亮绿 -> 黄绿
    ['#80FF30', '#80FF20'], // 黄绿 -> 黄绿（峰值）
    ['#80FF40', '#60FF40'], // 黄绿 -> 绿色（回程）
    ['#70FF50', '#40FF60'], // 绿色 -> 春绿
    ['#60FF70', '#20FF80'], // 春绿 -> 浅绿
    ['#40FF90', '#00FFA0'], // 浅绿 -> 青绿
    ['#20FFB0', '#00FFC0'], // 青绿 -> 青色
    ['#00FFD0', '#00FFE0'], // 亮青 -> 青绿
    ['#00E0FF', '#00D4FF'], // 青色 -> 天蓝
    ['#00B8FF', '#00A8FF'], // 天蓝 -> 蓝色
]

export const LoadingSpinner = ({ text = 'AI is thinking' }: LoadingSpinnerProps) => {
    const [frame, setFrame] = useState(0)
    const [dotFrame, setDotFrame] = useState(0)
    const [colorIndex, setColorIndex] = useState(0)

    useEffect(() => {
        const spinnerInterval = setInterval(() => {
            setFrame((prev) => (prev + 1) % spinnerFrames.length)
        }, 80)

        const dotInterval = setInterval(() => {
            setDotFrame((prev) => (prev + 1) % dots.length)
        }, 400)

        // 每300ms切换一次渐变颜色，让过渡更平滑
        const colorInterval = setInterval(() => {
            setColorIndex((prev) => (prev + 1) % gradientColors.length)
        }, 300)

        return () => {
            clearInterval(spinnerInterval)
            clearInterval(dotInterval)
            clearInterval(colorInterval)
        }
    }, [])

    return (
        <Box flexDirection="row" gap={1}>
            <Text>{spinnerFrames[frame]}</Text>
            <Gradient colors={gradientColors[colorIndex]}>
                <Text>{text}</Text>
            </Gradient>
            <Text>{dots[dotFrame]}</Text>
            <Text color="yellow" dimColor>(Press Ctrl+C to cancel)</Text>
        </Box>
    )
}

export default LoadingSpinner
