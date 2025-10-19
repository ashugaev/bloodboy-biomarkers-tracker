import { Progress, Spin } from 'antd'

import { UploadStage, UploadStatusProps } from './UploadStatus.types'

const STAGE_LABELS = {
    [UploadStage.UPLOADING]: 'Uploading file...',
    [UploadStage.PARSING]: 'Parsing PDF...',
    [UploadStage.EXTRACTING]: 'Extracting biomarkers...',
}

export const UploadStatus = (props: UploadStatusProps) => {
    const { stage, currentPage, totalPages, className } = props

    const showProgress = stage === UploadStage.EXTRACTING && currentPage && totalPages
    const progressPercent = showProgress ? Math.round(((currentPage - 1) / totalPages) * 100) : 0

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm ${className ?? ''}`}>
            <div className='flex items-center gap-3 mb-4'>
                <Spin/>
                <span className='text-base font-medium'>{STAGE_LABELS[stage]}</span>
            </div>
            {showProgress && (
                <div>
                    <Progress percent={progressPercent} status='active'/>
                    <p className='text-sm text-gray-600 mt-2'>
                        Page {currentPage} of {totalPages}
                    </p>
                </div>
            )}
        </div>
    )
}
