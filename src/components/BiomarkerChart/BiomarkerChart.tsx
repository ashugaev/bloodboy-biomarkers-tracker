import { useMemo } from 'react'

import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { COLORS } from '@/constants/colors'
import { useBiomarkerRecords } from '@/db/hooks/useBiomarkerRecords'
import { useDocuments } from '@/db/hooks/useDocuments'

import { BiomarkerChartProps } from './BiomarkerChart.types'

interface ChartDataPoint {
    date: string
    value: number
    timestamp: number
}

export const BiomarkerChart = (props: BiomarkerChartProps) => {
    const { biomarkerId, biomarkerName, normalRange, targetRange, className } = props
    const { records } = useBiomarkerRecords(biomarkerId)
    const { documents } = useDocuments()

    const chartData = useMemo(() => {
        const approvedRecords = records.filter(r => r.approved && r.value !== undefined)
        const data: ChartDataPoint[] = approvedRecords.map(record => {
            const document = documents.find(d => d.id === record.documentId)
            const date = document?.testDate ?? record.createdAt
            return {
                date: new Date(date).toLocaleDateString(),
                value: record.value!,
                timestamp: new Date(date).getTime(),
            }
        })

        data.sort((a, b) => a.timestamp - b.timestamp)
        return data
    }, [records, documents])

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

        const padding = (rangeMax - rangeMin) * 0.1
        return [
            Math.floor(rangeMin - padding),
            Math.ceil(rangeMax + padding),
        ]
    }, [chartData, normalRange, targetRange])

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm flex flex-col ${className ?? ''}`}>
            <div className='mb-4'>
                <h3 className='text-lg font-medium'>{biomarkerName} Records ({chartData.length})</h3>
                <p className='text-sm text-gray-600'>Visualize trends over time</p>
            </div>

            <div className='mb-4 flex gap-6'>
                {normalRange && (normalRange.min !== undefined || normalRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div
                            className='w-4 h-4 rounded'
                            style={{ backgroundColor: COLORS.OUT_OF_NORMAL_BG }}
                        />
                        <span className='text-sm text-gray-700'>
                            Normal Range: {normalRange.min ?? '—'} - {normalRange.max ?? '—'}
                        </span>
                    </div>
                )}
                {targetRange && (targetRange.min !== undefined || targetRange.max !== undefined) && (
                    <div className='flex items-center gap-2'>
                        <div
                            className='w-4 h-4 rounded'
                            style={{ backgroundColor: COLORS.OUT_OF_TARGET_BG }}
                        />
                        <span className='text-sm text-gray-700'>
                            Target Range: {targetRange.min ?? '—'} - {targetRange.max ?? '—'}
                        </span>
                    </div>
                )}
            </div>

            <div className='flex-1 min-h-[400px]'>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray='3 3'/>
                        <XAxis
                            dataKey='date'
                            angle={-45}
                            textAnchor='end'
                            height={80}
                        />
                        <YAxis domain={yDomain}/>
                        <Tooltip/>

                        {normalRange?.min !== undefined && normalRange.max !== undefined && (
                            <ReferenceArea
                                y1={normalRange.min}
                                y2={normalRange.max}
                                fill={COLORS.OUT_OF_NORMAL_BG}
                                fillOpacity={0.5}
                            />
                        )}

                        {targetRange?.min !== undefined && targetRange.max !== undefined && (
                            <ReferenceArea
                                y1={targetRange.min}
                                y2={targetRange.max}
                                fill={COLORS.OUT_OF_TARGET_BG}
                                fillOpacity={0.5}
                            />
                        )}

                        <Bar dataKey='value' fill={COLORS.PRIMARY}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
