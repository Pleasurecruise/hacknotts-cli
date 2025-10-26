import Gradient from 'ink-gradient'
import { useEffect,useState } from 'react'

type AnimatedGradientProps = {
    children: React.ReactNode
    speed?: number // 切换速度（毫秒），默认 300ms
    colors?: string[][] // 自定义颜色数组，如果不提供则使用默认的蓝绿渐变
}

// 默认的平滑渐变颜色序列：蓝色 -> 青色 -> 绿色 -> 黄绿 -> 绿色 -> 青色 -> 蓝色
const defaultGradientColors = [
    ['#0080FF', '#0088ffff'], // 蓝色 -> 亮青色
    ['#0088FF', '#00D4FF'], // 蓝色 -> 亮青色
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
    ['#0088FF', '#0080FF']  // 亮青色 -> 蓝色
]

/**
 * AnimatedGradient - 平滑渐变动画组件
 * 
 * 提供自动循环的平滑颜色渐变效果
 * 
 * @param children - 要应用渐变效果的子元素
 * @param speed - 颜色切换速度（毫秒），默认 300ms
 * @param colors - 自定义渐变颜色数组，每项为 [startColor, endColor] 格式
 * 
 * @example
 * ```tsx
 * <AnimatedGradient>
 *   <Text>Hello World</Text>
 * </AnimatedGradient>
 * 
 * // 自定义速度
 * <AnimatedGradient speed={500}>
 *   <Text>Slower animation</Text>
 * </AnimatedGradient>
 * 
 * // 自定义颜色
 * <AnimatedGradient colors={[['#FF0000', '#00FF00'], ['#00FF00', '#0000FF']]}>
 *   <Text>Custom colors</Text>
 * </AnimatedGradient>
 * ```
 */
export const AnimatedGradient = ({ 
    children, 
    speed = 300, 
    colors = defaultGradientColors 
}: AnimatedGradientProps) => {
    const [colorIndex, setColorIndex] = useState(0)

    useEffect(() => {
        const colorInterval = setInterval(() => {
            setColorIndex((prev) => (prev + 1) % colors.length)
        }, speed)

        return () => {
            clearInterval(colorInterval)
        }
    }, [speed, colors.length])

    return (
        <Gradient colors={colors[colorIndex]}>
            {children}
        </Gradient>
    )
}

export default AnimatedGradient
