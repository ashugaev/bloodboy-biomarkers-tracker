import { useCallback, useState } from 'react'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Tabs } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { AddNewButton } from '@/components/AddNewButton'
import { BiomarkerChart } from '@/components/BiomarkerChart'
import { BiomarkerRecordsTable } from '@/components/BiomarkerRecordsTable'
import { Header } from '@/components/Header'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { createBiomarkerRecords, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { ViewMode } from '@/types/viewMode.types'

import { BiomarkerRecordsPageProps } from './BiomarkerRecordsPage.types'

export const BiomarkerRecordsPage = (props: BiomarkerRecordsPageProps) => {
    const { className } = props
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const { data: records } = useBiomarkerRecords({
        filter: (item) => item.biomarkerId === id && item.approved && (item.value !== undefined || item.textValue !== undefined),
    })
    const [viewMode, setViewMode] = useState<ViewMode>(
        (location.state as { viewMode?: ViewMode })?.viewMode ?? 'table',
    )

    const biomarkerConfig = configs.find(c => c.id === id)

    const handleAddNew = useCallback(async () => {
        if (!id) return
        const defaultUcumCode = biomarkerConfig?.ucumCode

        await createBiomarkerRecords([{
            biomarkerId: id,
            ucumCode: defaultUcumCode ?? '',
            approved: true,
            latest: true,
        }])
        setViewMode('table')
    }, [id, biomarkerConfig?.ucumCode])

    if (!biomarkerConfig) {
        return (
            <div className={className}>
                <Header/>
                <div className='h-screen bg-gray-50 pt-16 flex items-center justify-center'>
                    <div className='text-center'>
                        <h2 className='text-2xl font-bold mb-4'>Biomarker not found</h2>
                        <Button onClick={() => { void navigate('/data') }}>
                            Back to Data
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <Header/>
            <div className='h-screen bg-gray-50 pt-16 flex flex-col overflow-hidden'>
                <div className='flex flex-col flex-1 p-4 gap-4 overflow-hidden'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button
                                size='small'
                                icon={<ArrowLeftOutlined/>}
                                onClick={() => { void navigate('/data') }}
                            >
                                Back
                            </Button>
                            <h1 className='text-lg font-medium'>{biomarkerConfig.name} ({records.length})</h1>
                        </div>
                        <AddNewButton onClick={() => { void handleAddNew() }} label='Add Record'/>
                    </div>

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
                        <div className='flex-1 min-h-0 mt-4'>
                            {viewMode === 'table' && (
                                <BiomarkerRecordsTable
                                    biomarkerId={biomarkerConfig.id}
                                    biomarkerName={biomarkerConfig.name}
                                    normalRange={biomarkerConfig.normalRange}
                                    targetRange={biomarkerConfig.targetRange}
                                    className='h-full'
                                />
                            )}

                            {viewMode === 'chart' && (
                                <BiomarkerChart
                                    biomarkerId={biomarkerConfig.id}
                                    biomarkerName={biomarkerConfig.name}
                                    normalRange={biomarkerConfig.normalRange}
                                    targetRange={biomarkerConfig.targetRange}
                                    className='h-full'
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
