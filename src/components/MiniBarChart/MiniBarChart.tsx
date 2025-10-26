import { memo } from 'react'

import { Tooltip } from 'antd'

import { COLORS } from '@/constants/colors'
import { Range } from '@/db/types/range.types'

interface DataPoint {
    value: number
    date: string
}

interface MiniBarChartProps {
    data: DataPoint[]
    normalRange?: Range
    targetRange?: Range
    onClick?: () => void
}

export const MiniBarChart = memo((props: MiniBarChartProps) => {
    const { data, normalRange, targetRange, onClick } = props

    if (data.length === 0) {
        return <div className='h-full'/>
    }

    const values = data.map(d => d.value)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue

    const getBarColor = (value: number) => {
        if (normalRange?.min !== undefined && normalRange?.max !== undefined) {
            if (value < normalRange.min || value > normalRange.max) {
                return COLORS.ERROR
            }
        }

        if (targetRange?.min !== undefined && targetRange?.max !== undefined) {
            if (value < targetRange.min || value > targetRange.max) {
                return COLORS.WARNING
            }
        }

        return COLORS.SUCCESS
    }

    const getBarHeight = (value: number) => {
        if (range === 0) {
            return 50
        }
        return ((value - minValue) / range) * 100
    }

    const barWidth = data.length > 10 ? 'flex-1' : '16px'
    const justifyContent = data.length > 10 ? 'flex-start' : 'center'

    return (
        <div
            className='flex items-end gap-1 h-full px-2 py-1 cursor-pointer hover:bg-gray-50'
            onClick={onClick}
            style={{ justifyContent }}
        >
            {data.map((item, index) => {
                const height = getBarHeight(item.value)
                const color = getBarColor(item.value)

                return (
                    <Tooltip
                        key={index}
                        title={(
                            <div>
                                <div>{item.value.toFixed(2)}</div>
                                <div className='text-gray-300'>{item.date}</div>
                            </div>
                        )}
                    >
                        <div
                            className='rounded-t transition-all hover:opacity-80'
                            style={{
                                width: barWidth,
                                minWidth: barWidth === 'flex-1' ? '0' : barWidth,
                                flex: barWidth === 'flex-1' ? '1' : 'none',
                                height: `${height}%`,
                                backgroundColor: color,
                                minHeight: '10px',
                            }}
                        />
                    </Tooltip>
                )
            })}
        </div>
    )
})

MiniBarChart.displayName = 'MiniBarChart'
