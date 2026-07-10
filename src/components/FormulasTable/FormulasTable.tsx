import { useMemo } from 'react'

import { DeleteOutlined, EditOutlined, FunctionOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Empty, message, Popconfirm, Table, Tooltip, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

import { MiniBarChart } from '@/components/MiniBarChart'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import { computeFormulaSeries, deleteFormula, Formula, FormulaSeriesPoint, renderReadableExpression, useFormulas } from '@/db/models/formula'

import { FormulasTableProps } from './FormulasTable.types'

const { Text } = Typography

interface FormulaRow {
    formula: Formula
    series: FormulaSeriesPoint[]
    last?: number
    min?: number
    max?: number
    readable: string
}

const formatNumber = (value?: number): string => {
    if (value === undefined) return '—'
    if (Number.isInteger(value)) return value.toString()
    return Number(value.toFixed(3)).toString()
}

export const FormulasTable = (props: FormulasTableProps) => {
    const { className, onEdit, onCreate } = props
    const navigate = useNavigate()
    const { data: formulas } = useFormulas()
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: configs } = useBiomarkerConfigs()

    const nameByBiomarkerId = useMemo(() => {
        const map = new Map<string, string>()
        configs.forEach(config => { map.set(config.id, config.name) })
        return (id: string) => map.get(id) ?? 'Unknown'
    }, [configs])

    const rows = useMemo<FormulaRow[]>(() => {
        return formulas.map(formula => {
            const series = computeFormulaSeries(formula, records, documents)
            const values = series.map(p => p.value)
            return {
                formula,
                series,
                last: values.length > 0 ? values[values.length - 1] : undefined,
                min: values.length > 0 ? Math.min(...values) : undefined,
                max: values.length > 0 ? Math.max(...values) : undefined,
                readable: renderReadableExpression(formula, nameByBiomarkerId),
            }
        })
    }, [formulas, records, documents, nameByBiomarkerId])

    const handleDelete = async (id: string) => {
        try {
            await deleteFormula(id)
            void message.success('Formula deleted')
        } catch (error) {
            console.error('Failed to delete formula:', error)
            void message.error('Failed to delete formula')
        }
    }

    const columns: ColumnsType<FormulaRow> = [
        {
            title: 'Formula',
            dataIndex: 'name',
            key: 'name',
            render: (_value, row) => (
                <div className='flex flex-col'>
                    <span className='font-medium flex items-center gap-1'>
                        <FunctionOutlined className='text-indigo-400'/>
                        {row.formula.name}
                    </span>
                    <Tooltip title={row.readable}>
                        <span className='font-mono text-xs text-gray-400 truncate max-w-[280px]'>{row.readable}</span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: 'Unit',
            key: 'unit',
            width: 90,
            render: (_value, row) => row.formula.unitLabel ?? '—',
        },
        {
            title: 'Last',
            key: 'last',
            width: 90,
            render: (_value, row) => formatNumber(row.last),
        },
        {
            title: 'Min',
            key: 'min',
            width: 80,
            render: (_value, row) => formatNumber(row.min),
        },
        {
            title: 'Max',
            key: 'max',
            width: 80,
            render: (_value, row) => formatNumber(row.max),
        },
        {
            title: 'History',
            key: 'history',
            width: 160,
            render: (_value, row) => (
                <div className='h-10'>
                    <MiniBarChart
                        data={row.series.slice(-5).map(p => ({
                            value: p.value,
                            date: p.date,
                        }))}
                        normalRange={row.formula.normalRange}
                        targetRange={row.formula.targetRange}
                        onClick={() => { void navigate(`/formula/${row.formula.id}`, { state: { viewMode: 'chart' } }) }}
                    />
                </div>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: 130,
            render: (_value, row) => (
                <div className='flex items-center gap-1' onClick={(e) => { e.stopPropagation() }}>
                    <Tooltip title='View'>
                        <Button size='small' type='text' icon={<RightOutlined/>} onClick={() => { void navigate(`/formula/${row.formula.id}`) }}/>
                    </Tooltip>
                    <Tooltip title='Edit'>
                        <Button size='small' type='text' icon={<EditOutlined/>} onClick={() => { onEdit(row.formula) }}/>
                    </Tooltip>
                    <Popconfirm
                        title='Delete this formula?'
                        okText='Delete'
                        okButtonProps={{ danger: true }}
                        onConfirm={() => { void handleDelete(row.formula.id) }}
                    >
                        <Button size='small' type='text' danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
                </div>
            ),
        },
    ]

    if (formulas.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full ${className ?? ''}`}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={(
                        <div className='max-w-sm text-center'>
                            <div className='font-medium text-gray-700 mb-1'>No formulas yet</div>
                            <Text type='secondary' className='text-sm'>
                                Create a formula to compute a derived value (like a ratio or index) from your existing biomarkers.
                            </Text>
                        </div>
                    )}
                >
                    <Button type='primary' icon={<FunctionOutlined/>} onClick={onCreate}>
                        Create your first formula
                    </Button>
                </Empty>
            </div>
        )
    }

    return (
        <div className={`h-full overflow-auto ${className ?? ''}`}>
            <Table<FormulaRow>
                rowKey={(row) => row.formula.id}
                columns={columns}
                dataSource={rows}
                pagination={false}
                size='middle'
                onRow={(row) => ({
                    onClick: () => { void navigate(`/formula/${row.formula.id}`) },
                    style: { cursor: 'pointer' },
                })}
            />
        </div>
    )
}
