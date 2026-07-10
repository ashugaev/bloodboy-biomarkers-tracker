import { useEffect, useMemo, useRef, useState } from 'react'

import { CloseOutlined, FunctionOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Collapse, Divider, Input, InputNumber, message, Modal, Select, Tag, Tooltip, Typography } from 'antd'

import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { useDocuments } from '@/db/models/document'
import {
    addFormula,
    extractVariableKeys,
    FORMULA_FUNCTION_NAMES,
    FormulaVariable,
    generateVariableKey,
    getLatestBiomarkerValue,
    previewFormula,
    updateFormula,
    validateExpressionSyntax,
} from '@/db/models/formula'
import { getNameByUcum, useUnits } from '@/db/models/unit'

import { FormulaBuilderModalProps } from './FormulaBuilderModal.types'

const { Text } = Typography

const OPERATOR_BUTTONS = ['+', '−', '×', '÷', '^', '(', ')']

const formatNumber = (value: number): string => {
    if (Number.isInteger(value)) return value.toString()
    return Number(value.toFixed(4)).toString()
}

export const FormulaBuilderModal = (props: FormulaBuilderModalProps) => {
    const { open, formula, onClose, onSaved } = props
    const isEditing = formula != null

    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: records } = useBiomarkerRecords({ filter: (r) => r.approved })
    const { data: documents } = useDocuments()
    const { data: units } = useUnits()

    const [name, setName] = useState('')
    const [unitLabel, setUnitLabel] = useState('')
    const [description, setDescription] = useState('')
    const [expression, setExpression] = useState('')
    const [variables, setVariables] = useState<FormulaVariable[]>([])
    const [normalMin, setNormalMin] = useState<number | null>(null)
    const [normalMax, setNormalMax] = useState<number | null>(null)
    const [targetMin, setTargetMin] = useState<number | null>(null)
    const [targetMax, setTargetMax] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const caretRef = useRef<number>(0)

    useEffect(() => {
        if (!open) return
        setName(formula?.name ?? '')
        setUnitLabel(formula?.unitLabel ?? '')
        setDescription(formula?.description ?? '')
        setExpression(formula?.expression ?? '')
        setVariables(formula?.variables ?? [])
        setNormalMin(formula?.normalRange?.min ?? null)
        setNormalMax(formula?.normalRange?.max ?? null)
        setTargetMin(formula?.targetRange?.min ?? null)
        setTargetMax(formula?.targetRange?.max ?? null)
        caretRef.current = formula?.expression?.length ?? 0
    }, [open, formula])

    const configById = useMemo(() => {
        const map = new Map<string, string>()
        configs.forEach(config => {
            const unitTitle = getNameByUcum(units, config.ucumCode)
            map.set(config.id, unitTitle.length > 0 ? `${config.name} (${unitTitle})` : config.name)
        })
        return map
    }, [configs, units])

    const biomarkerOptions = useMemo(() => {
        return configs
            .map(config => ({
                value: config.id,
                label: configById.get(config.id) ?? config.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [configs, configById])

    const insertAtCaret = (text: string) => {
        const el = textareaRef.current
        const caret = el != null ? el.selectionStart : caretRef.current
        const next = expression.slice(0, caret) + text + expression.slice(el != null ? el.selectionEnd : caret)
        setExpression(next)
        const pos = caret + text.length
        caretRef.current = pos
        requestAnimationFrame(() => {
            if (textareaRef.current != null) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(pos, pos)
            }
        })
    }

    const handleInsertBiomarker = (biomarkerId: string) => {
        const existing = variables.find(v => v.biomarkerId === biomarkerId)
        if (existing != null) {
            insertAtCaret(`{${existing.key}}`)
            return
        }
        const config = configs.find(c => c.id === biomarkerId)
        if (config == null) return
        const key = generateVariableKey(config.name, variables.map(v => v.key))
        setVariables(prev => [...prev, {
            key,
            biomarkerId,
        }])
        insertAtCaret(`{${key}}`)
    }

    const handleInsertOperator = (op: string) => {
        const normalized = op === '−' ? '-' : op === '×' ? '*' : op === '÷' ? '/' : op
        insertAtCaret(normalized)
    }

    const handleRemoveVariable = (key: string) => {
        setVariables(prev => prev.filter(v => v.key !== key))
    }

    const referencedKeys = useMemo(() => extractVariableKeys(expression), [expression])

    const usedVariables = useMemo(
        () => variables.filter(v => referencedKeys.includes(v.key)),
        [variables, referencedKeys],
    )

    const unknownKeys = useMemo(
        () => referencedKeys.filter(key => !variables.some(v => v.key === key)),
        [referencedKeys, variables],
    )

    const preview = useMemo(() => {
        if (expression.trim().length === 0) return null
        return previewFormula(expression, usedVariables, records, documents)
    }, [expression, usedVariables, records, documents])

    const latestInputs = useMemo(() => {
        return usedVariables.map(v => ({
            key: v.key,
            label: configById.get(v.biomarkerId) ?? v.biomarkerId,
            value: getLatestBiomarkerValue(v.biomarkerId, records, documents),
        }))
    }, [usedVariables, configById, records, documents])

    const handleSave = async () => {
        if (name.trim().length === 0) {
            void message.error('Please enter a formula name')
            return
        }
        if (expression.trim().length === 0) {
            void message.error('Please enter an expression')
            return
        }
        if (unknownKeys.length > 0) {
            void message.error(`Unmapped variable(s): ${unknownKeys.map(k => `{${k}}`).join(', ')}. Insert a biomarker for each.`)
            return
        }
        if (usedVariables.length === 0) {
            void message.error('Reference at least one biomarker in the expression')
            return
        }
        const syntax = validateExpressionSyntax(expression, usedVariables.map(v => v.key))
        if (!syntax.valid) {
            void message.error(`Invalid expression: ${syntax.error ?? 'syntax error'}`)
            return
        }

        const normalRange = normalMin != null || normalMax != null
            ? {
                min: normalMin ?? undefined,
                max: normalMax ?? undefined,
            }
            : undefined
        const targetRange = targetMin != null || targetMax != null
            ? {
                min: targetMin ?? undefined,
                max: targetMax ?? undefined,
            }
            : undefined

        const payload = {
            name: name.trim(),
            description: description.trim().length > 0 ? description.trim() : undefined,
            expression: expression.trim(),
            variables: usedVariables,
            unitLabel: unitLabel.trim().length > 0 ? unitLabel.trim() : undefined,
            normalRange,
            targetRange,
        }

        setSaving(true)
        try {
            if (isEditing && formula != null) {
                await updateFormula(formula.id, payload)
                void message.success('Formula updated')
                onSaved?.(formula.id)
            } else {
                const id = await addFormula(payload)
                void message.success('Formula created')
                onSaved?.(id)
            }
            onClose()
        } catch (error) {
            console.error('Failed to save formula:', error)
            void message.error('Failed to save formula')
        } finally {
            setSaving(false)
        }
    }

    const renderPreview = () => {
        if (preview == null) {
            return <Text type='secondary'>Build an expression to see a live preview.</Text>
        }
        if (unknownKeys.length > 0) {
            return (
                <Text type='warning'>
                    Unmapped variable(s): {unknownKeys.map(k => `{${k}}`).join(', ')} — insert a biomarker.
                </Text>
            )
        }
        if (preview.missing.length > 0) {
            const missingLabels = preview.missing.map(key => {
                const variable = usedVariables.find(v => v.key === key)
                return variable != null ? (configById.get(variable.biomarkerId) ?? key) : key
            })
            return (
                <Text type='warning'>
                    No recent value for: {missingLabels.join(', ')}. The formula will still compute for dates where data exists.
                </Text>
            )
        }
        if (preview.error != null) {
            return <Text type='danger'>{preview.error}</Text>
        }
        return (
            <div>
                <div className='text-2xl font-semibold text-indigo-600'>
                    {preview.value != null ? formatNumber(preview.value) : '—'}
                    {unitLabel.trim().length > 0 && <span className='text-base text-gray-400 ml-1'>{unitLabel.trim()}</span>}
                </div>
                <Text type='secondary' className='text-xs'>
                    Using latest values — {latestInputs.map(i => `${i.label.split(' (')[0]}=${i.value != null ? formatNumber(i.value) : '—'}`).join(', ')}
                </Text>
            </div>
        )
    }

    return (
        <Modal
            title={isEditing ? 'Edit Formula' : 'Create Formula'}
            open={open}
            onCancel={onClose}
            width={640}
            okText={isEditing ? 'Save' : 'Create'}
            confirmLoading={saving}
            onOk={() => { void handleSave() }}
        >
            <div className='flex flex-col gap-4 pt-2'>
                <div className='flex gap-3'>
                    <div className='flex-1'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                        <Input
                            value={name}
                            onChange={(e) => { setName(e.target.value) }}
                            placeholder='e.g., AIP, HOMA-IR, LDL/HDL ratio'
                            maxLength={100}
                        />
                    </div>
                    <div style={{ width: 160 }}>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Unit label</label>
                        <Input
                            value={unitLabel}
                            onChange={(e) => { setUnitLabel(e.target.value) }}
                            placeholder='ratio, mg/dL…'
                            maxLength={50}
                        />
                    </div>
                </div>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Expression</label>
                    <div className='flex flex-wrap gap-2 mb-2'>
                        <Select
                            showSearch
                            value={null}
                            placeholder='+ Insert biomarker'
                            style={{ minWidth: 200 }}
                            size='small'
                            suffixIcon={<PlusOutlined/>}
                            options={biomarkerOptions}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(value: string) => { handleInsertBiomarker(value) }}
                            notFoundContent='No biomarkers yet'
                        />
                        <div className='flex gap-1'>
                            {OPERATOR_BUTTONS.map(op => (
                                <Button key={op} size='small' onClick={() => { handleInsertOperator(op) }}>
                                    {op}
                                </Button>
                            ))}
                        </div>
                        <Select
                            value={null}
                            placeholder='ƒ'
                            size='small'
                            style={{ width: 90 }}
                            suffixIcon={<FunctionOutlined/>}
                            options={FORMULA_FUNCTION_NAMES.map(fn => ({
                                value: fn,
                                label: fn,
                            }))}
                            onChange={(value: string) => { insertAtCaret(`${value}(`) }}
                        />
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={expression}
                        onChange={(e) => { setExpression(e.target.value) }}
                        onSelect={(e) => { caretRef.current = e.currentTarget.selectionStart }}
                        placeholder='e.g. log({triglycerides} / {hdl})'
                        rows={2}
                        className='w-full font-mono text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500'
                        spellCheck={false}
                    />

                    {variables.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-2'>
                            {variables.map(variable => {
                                const used = referencedKeys.includes(variable.key)
                                return (
                                    <Tooltip key={variable.key} title={configById.get(variable.biomarkerId)}>
                                        <Tag
                                            color={used ? 'geekblue' : 'default'}
                                            closable
                                            closeIcon={<CloseOutlined/>}
                                            onClose={() => { handleRemoveVariable(variable.key) }}
                                        >
                                            <span className='font-mono'>{`{${variable.key}}`}</span>
                                            <span className='text-gray-500'> = {(configById.get(variable.biomarkerId) ?? '').split(' (')[0]}</span>
                                        </Tag>
                                    </Tooltip>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className='bg-gray-50 rounded px-4 py-3 min-h-[64px] flex flex-col justify-center'>
                    <Text type='secondary' className='text-xs uppercase tracking-wide mb-1'>Live preview</Text>
                    {renderPreview()}
                </div>

                <Collapse
                    ghost
                    size='small'
                    items={[
                        {
                            key: 'advanced',
                            label: 'Reference ranges & description (optional)',
                            children: (
                                <div className='flex flex-col gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Normal range</label>
                                        <div className='flex items-center gap-2'>
                                            <InputNumber value={normalMin} onChange={setNormalMin} placeholder='min' style={{ width: 120 }}/>
                                            <span className='text-gray-400'>–</span>
                                            <InputNumber value={normalMax} onChange={setNormalMax} placeholder='max' style={{ width: 120 }}/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Target range</label>
                                        <div className='flex items-center gap-2'>
                                            <InputNumber value={targetMin} onChange={setTargetMin} placeholder='min' style={{ width: 120 }}/>
                                            <span className='text-gray-400'>–</span>
                                            <InputNumber value={targetMax} onChange={setTargetMax} placeholder='max' style={{ width: 120 }}/>
                                        </div>
                                    </div>
                                    <Divider className='my-0'/>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                                        <Input.TextArea
                                            value={description}
                                            onChange={(e) => { setDescription(e.target.value) }}
                                            placeholder='What does this formula represent?'
                                            rows={2}
                                            maxLength={500}
                                        />
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                />

                {isEditing && (
                    <Alert
                        type='info'
                        showIcon
                        message='Editing recalculates every historical value for this formula.'
                    />
                )}
            </div>
        </Modal>
    )
}
