import { useState } from 'react'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Segmented } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { BiomarkerChart } from '@/components/BiomarkerChart'
import { BiomarkerRecordsTable } from '@/components/BiomarkerRecordsTable'
import { Header } from '@/components/Header'
import { useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { ViewMode } from '@/types/viewMode.types'

import { BiomarkerRecordsPageProps } from './BiomarkerRecordsPage.types'

export const BiomarkerRecordsPage = (props: BiomarkerRecordsPageProps) => {
    const { className } = props
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { data: configs } = useBiomarkerConfigs({ filter: (c) => c.approved })
    const [viewMode, setViewMode] = useState<ViewMode>(
        (location.state as { viewMode?: ViewMode })?.viewMode ?? 'table',
    )

    const biomarker = configs.find(c => c.id === id)

    if (!biomarker) {
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
                                icon={<ArrowLeftOutlined/>}
                                onClick={() => { void navigate('/data') }}
                            >
                                Back
                            </Button>
                            <h1 className='text-2xl font-bold'>{biomarker.name}</h1>
                        </div>

                        <Segmented
                            options={[
                                {
                                    label: 'Table',
                                    value: 'table',
                                },
                                {
                                    label: 'Chart',
                                    value: 'chart',
                                },
                            ]}
                            value={viewMode}
                            onChange={(value) => { setViewMode(value as ViewMode) }}
                        />
                    </div>

                    {viewMode === 'table' && (
                        <BiomarkerRecordsTable
                            biomarkerId={biomarker.id}
                            biomarkerName={biomarker.name}
                            normalRange={biomarker.normalRange}
                            targetRange={biomarker.targetRange}
                            className='flex-1 overflow-auto'
                        />
                    )}

                    {viewMode === 'chart' && (
                        <BiomarkerChart
                            biomarkerId={biomarker.id}
                            biomarkerName={biomarker.name}
                            normalRange={biomarker.normalRange}
                            targetRange={biomarker.targetRange}
                            className='flex-1 overflow-auto'
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
