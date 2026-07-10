import { useMemo, useState } from 'react'

import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { FormulaBuilderModal } from '@/components/FormulaBuilderModal'
import { FormulaChart } from '@/components/FormulaChart'
import { Header } from '@/components/Header'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { computeFormulaSeries, FormulaSeriesPoint, renderReadableExpression, useFormula } from '@/db/models/formula'
import { ViewMode } from '@/types/viewMode.types'

import { FormulaDetailPageProps } from './FormulaDetailPage.types'

const { Text } = Typography

const formatNumber = (value?: number): string => {
    if (value === undefined) return '—'
    if (Number.isInteger(value)) return value.toString()
    return Number(value.toFixed(4)).toString()
}

export const FormulaDetailPage = (props: FormulaDetailPageProps) => {
    const { className } = props
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { data: formula } = useFormula(id)
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: configs } = useBiomarkerConfigs()
    const [viewMode, setViewMode] = useState<ViewMode>(
        (location.state as { viewMode?: ViewMode })?.viewMode ?? 'table',
    )
    const [editOpen, setEditOpen] = useState(false)

    const nameByBiomarkerId = useMemo(() => {
        const map = new Map<string, string>()
        configs.forEach(config => { map.set(config.id, config.name) })
        return (biomarkerId: string) => map.get(biomarkerId) ?? 'Unknown'
    }, [configs])

    const series = useMemo<FormulaSeriesPoint[]>(
        () => formula != null ? computeFormulaSeries(formula, records, documents) : [],
        [formula, records, documents],
    )

    const tableColumns = useMemo<ColumnsType<FormulaSeriesPoint>>(() => {
        if (formula == null) return []
        const variableColumns: ColumnsType<FormulaSeriesPoint> = formula.variables.map(variable => ({
            title: nameByBiomarkerId(variable.biomarkerId),
            key: variable.key,
            render: (_value, point) => formatNumber(point.inputs[variable.biomarkerId]),
        }))
        return [
            {
                title: 'Test Date',
                key: 'date',
                render: (_value, point) => point.date,
            },
            ...variableColumns,
            {
                title: `Result${formula.unitLabel != null ? ` (${formula.unitLabel})` : ''}`,
                key: 'value',
                render: (_value, point) => <span className='font-semibold'>{formatNumber(point.value)}</span>,
            },
        ]
    }, [formula, nameByBiomarkerId])

    if (formula == null) {
        return (
            <div className={className}>
                <Header/>
                <div className='h-screen bg-gray-50 pt-16 flex items-center justify-center'>
                    <div className='text-center'>
                        <h2 className='text-2xl font-bold mb-4'>Formula not found</h2>
                        <Button onClick={() => { void navigate('/data') }}>Back to Data</Button>
                    </div>
                </div>
            </div>
        )
    }

    const readable = renderReadableExpression(formula, nameByBiomarkerId)

    return (
        <div className={className}>
            <Header/>
            <div className='h-screen bg-gray-50 pt-16 flex flex-col overflow-hidden'>
                <div className='flex flex-col flex-1 p-4 gap-4 overflow-hidden'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button size='small' icon={<ArrowLeftOutlined/>} onClick={() => { void navigate('/data') }}>
                                Back
                            </Button>
                            <div className='flex flex-col'>
                                <h1 className='text-lg font-medium leading-tight'>{formula.name} ({series.length})</h1>
                                <Tooltip title={readable}>
                                    <span className='font-mono text-xs text-gray-400 truncate max-w-[420px]'>{readable}</span>
                                </Tooltip>
                            </div>
                        </div>
                        <Button icon={<EditOutlined/>} onClick={() => { setEditOpen(true) }}>Edit</Button>
                    </div>

                    {formula.description != null && (
                        <Text type='secondary'>{formula.description}</Text>
                    )}

                    <div className='bg-white px-6 pb-6 rounded border border-gray-100 flex flex-col flex-1 min-h-0'>
                        <Tabs
                            activeKey={viewMode}
                            onChange={(key) => { setViewMode(key as ViewMode) }}
                            centered
                            items={[
                                {
                                    key: 'table',
                                    label: 'Table',
                                },
                                {
                                    key: 'chart',
                                    label: 'Chart',
                                },
                            ]}
                            className='flex-shrink-0'
                        />
                        <div className='flex-1 min-h-0 mt-4 overflow-auto'>
                            {viewMode === 'table' && (
                                series.length > 0 ? (
                                    <Table<FormulaSeriesPoint>
                                        rowKey={(point) => String(point.timestamp)}
                                        columns={tableColumns}
                                        dataSource={[...series].reverse()}
                                        pagination={false}
                                        size='middle'
                                    />
                                ) : (
                                    <div className='flex flex-col items-center justify-center h-full text-center text-gray-400'>
                                        <div className='text-lg mb-2'>No computed values yet</div>
                                        <div className='text-sm max-w-md'>
                                            This formula uses: {formula.variables.map(v => (
                                                <Tag key={v.key}>{nameByBiomarkerId(v.biomarkerId)}</Tag>
                                            ))}
                                            <div className='mt-2'>A value is computed for each date where all of these biomarkers have a measurement.</div>
                                        </div>
                                    </div>
                                )
                            )}
                            {viewMode === 'chart' && <FormulaChart formula={formula} className='h-full'/>}
                        </div>
                    </div>
                </div>
            </div>

            <FormulaBuilderModal
                open={editOpen}
                formula={formula}
                onClose={() => { setEditOpen(false) }}
            />
        </div>
    )
}
