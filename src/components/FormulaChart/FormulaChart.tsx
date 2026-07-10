import { useMemo } from 'react'

import cn from 'classnames'
import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { COLORS } from '@/constants/colors'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { computeFormulaSeries } from '@/db/models/formula'

import { FormulaChartProps } from './FormulaChart.types'

interface RoundedBarProps {
    fill: string
    x: number
    y: number
    width: number
    height: number
}

const RoundedBar = (props: RoundedBarProps) => {
    const { fill, x, y, width, height } = props
    const radius = 8

    return (
        <path
            d={`
                M ${x},${y + height}
                L ${x},${y + radius}
                Q ${x},${y} ${x + radius},${y}
                L ${x + width - radius},${y}
                Q ${x + width},${y} ${x + width},${y + radius}
                L ${x + width},${y + height}
                Z
            `}
            fill={fill}
        />
    )
}

export const FormulaChart = (props: FormulaChartProps) => {
    const { formula, className } = props
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()

    const { normalRange, targetRange } = formula

    const chartData = useMemo(
        () => computeFormulaSeries(formula, records, documents),
        [formula, records, documents],
    )

    const yDomain = useMemo(() => {
        if (chartData.length === 0) return [0, 100]

        const values = chartData.map(d => d.value)
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)

        const rangeMin = Math.min(
            normalRange?.min ?? Infinity,
            targetRange?.min ?? Infinity,
            minValue,
        )
        const rangeMax = Math.max(
            normalRange?.max ?? -Infinity,
            targetRange?.max ?? -Infinity,
            maxValue,
        )

        const padding = (rangeMax - rangeMin) * 0.1 || 1
        return [rangeMin - padding, rangeMax + padding]
    }, [chartData, normalRange, targetRange])

    if (chartData.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center min-h-[400px]', className)}>
                <div className='text-center text-gray-400'>
                    <div className='text-lg mb-2'>Not enough data to compute this formula</div>
                    <div className='text-sm'>Add measurements for every referenced biomarker on the same test date</div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('flex flex-col', className)}>
            <div className='mb-4 flex gap-6'>
                {normalRange != null && (normalRange.min !== undefined || normalRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded' style={{ backgroundColor: COLORS.CHART_NORMAL_ZONE }}/>
                        <span className='text-sm text-gray-700'>
                            Normal Range: {normalRange.min ?? '—'} - {normalRange.max ?? '—'}
                        </span>
                    </div>
                )}
                {targetRange != null && (targetRange.min !== undefined || targetRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded' style={{ backgroundColor: COLORS.CHART_TARGET_ZONE }}/>
                        <span className='text-sm text-gray-700'>
                            Target Range: {targetRange.min ?? '—'} - {targetRange.max ?? '—'}
                        </span>
                    </div>
                )}
            </div>

            <div className='flex-1 min-h-[400px]'>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={chartData} maxBarSize={40} barGap={40} barCategoryGap={40}>
                        <CartesianGrid strokeDasharray='3 3'/>
                        <XAxis dataKey='date' angle={-45} textAnchor='end' height={80}/>
                        <YAxis domain={yDomain}/>
                        <Tooltip/>

                        {normalRange?.min !== undefined && normalRange.max !== undefined && (
                            <ReferenceArea y1={normalRange.min} y2={normalRange.max} fill={COLORS.CHART_NORMAL_ZONE} fillOpacity={0.5}/>
                        )}
                        {targetRange?.min !== undefined && targetRange.max !== undefined && (
                            <ReferenceArea y1={targetRange.min} y2={targetRange.max} fill={COLORS.CHART_TARGET_ZONE} fillOpacity={0.5}/>
                        )}

                        <Bar dataKey='value' fill={COLORS.CHART_BAR} maxBarSize={40} shape={RoundedBar as never}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
