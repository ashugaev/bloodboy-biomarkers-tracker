import { useBiomarkerConfigs, useBiomarkerRecords, addBiomarkerConfig, addBiomarkerRecord, updateBiomarkerConfig, deleteBiomarkerConfig, deleteBiomarkerRecord } from '@/db/hooks'
import { BiomarkerType, Unit } from '@/db/types'
import { createBiomarkerConfig, createBiomarkerRecord } from '@/db/utils'

export const BiomarkerExample = () => {
    const { configs, loading: configsLoading } = useBiomarkerConfigs()
    const { records, loading: recordsLoading } = useBiomarkerRecords()

    const handleAddConfig = () => {
        const newConfig = createBiomarkerConfig({
            type: BiomarkerType.GLUCOSE,
            name: 'Blood Glucose',
            unit: Unit.MG_DL,
            normalRange: {
                min: 70,
                max: 100,
            },
            criticalRange: {
                min: 40,
                max: 400,
            },
            description: 'Fasting blood glucose level',
        })
        void addBiomarkerConfig(newConfig)
    }

    const handleAddRecord = (biomarkerId: string) => {
        const newRecord = createBiomarkerRecord({
            biomarkerId,
            value: 95,
            unit: Unit.MG_DL,
            testDate: new Date(),
            notes: 'Morning test, fasting',
            lab: 'Lab Corp',
        })
        void addBiomarkerRecord(newRecord)
    }

    const handleUpdateConfig = (configId: string) => {
        void updateBiomarkerConfig(configId, {
            name: `Updated Config ${Date.now()}`,
        })
    }

    if (configsLoading || recordsLoading) {
        return <div className='p-4'>Loading...</div>
    }

    return (
        <div className='p-4 space-y-6'>
            <div>
                <h2 className='text-2xl font-bold mb-4'>Biomarker Configs</h2>
                <button
                    onClick={handleAddConfig}
                    className='mb-4 px-4 py-2 bg-primary text-white rounded hover:opacity-80'
                >
                    Add New Config
                </button>

                <div className='space-y-2'>
                    {configs.map(config => (
                        <div
                            key={config.id}
                            className='border rounded p-4 flex justify-between items-start'
                        >
                            <div>
                                <h3 className='font-semibold'>{config.name}</h3>
                                <p className='text-sm text-gray-600'>
                                    Type: {config.type}
                                </p>
                                <p className='text-sm text-gray-600'>
                                    Normal Range: {config.normalRange.min} - {config.normalRange.max} {config.unit}
                                </p>
                                {config.criticalRange && (
                                    <p className='text-sm text-error'>
                                        Critical: {config.criticalRange.min} - {config.criticalRange.max}
                                    </p>
                                )}
                                {config.description && (
                                    <p className='text-sm mt-2'>{config.description}</p>
                                )}
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => {
                                        handleAddRecord(config.id)
                                    }}
                                    className='px-3 py-1 bg-success text-white rounded text-sm hover:opacity-80'
                                >
                                    Add Record
                                </button>
                                <button
                                    onClick={() => {
                                        handleUpdateConfig(config.id)
                                    }}
                                    className='px-3 py-1 bg-warning text-white rounded text-sm hover:opacity-80'
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => { void deleteBiomarkerConfig(config.id) }}
                                    className='px-3 py-1 bg-error text-white rounded text-sm hover:opacity-80'
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className='text-2xl font-bold mb-4'>
                    Records ({records.length})
                </h2>
                <div className='space-y-2'>
                    {records.map(record => {
                        const config = configs.find(c => c.id === record.biomarkerId)
                        return (
                            <div
                                key={record.id}
                                className='border rounded p-3 flex justify-between items-center'
                            >
                                <div>
                                    <span className='font-semibold'>
                                        {config?.name ?? 'Unknown'}
                                    </span>
                                    <span className='mx-2'>-</span>
                                    <span className='text-lg'>
                                        {record.value} {record.unit}
                                    </span>
                                    <span className='text-sm text-gray-600 ml-2'>
                                        {record.testDate.toLocaleDateString()}
                                    </span>
                                    {record.notes && (
                                        <p className='text-sm text-gray-500 mt-1'>
                                            {record.notes}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => { void deleteBiomarkerRecord(record.id) }}
                                    className='px-3 py-1 bg-error text-white rounded text-sm hover:opacity-80'
                                >
                                    Delete
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
