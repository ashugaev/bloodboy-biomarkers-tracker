import { useEffect, useState } from 'react'

import { Progress, Spin } from 'antd'

import { UploadStage, UploadStatusProps } from './UploadStatus.types'

const STAGE_MESSAGES = {
    [UploadStage.UPLOADING]: [
        'Uploading your bloodboy\'s secrets...',
        'Digitizing crimson data...',
        'Transmitting hemoglobin highway...',
        'Beaming up blood bytes...',
        'Uploading life juice analysis...',
        'Sending your vital vitals...',
    ],
    [UploadStage.PARSING]: [
        'Decoding medical hieroglyphics...',
        'Reading between the blood lines...',
        'Parsing doctor\'s handwriting (good luck)...',
        'Extracting text from lab spaghetti...',
        'Translating medical mumbo jumbo...',
        'Unscrambling PDF mysteries...',
        'Deciphering lab report matrix...',
    ],
    [UploadStage.EXTRACTING]: [
        'Analyzing biomarker data...',
        'Extracting health metrics...',
        'Learning to read doctor\'s notes...',
        'AI now knows more about you than you do...',
        'Skynet analyzing your biological weaknesses...',
        'Counting red blood cells... one by one...',
        'Adding you to global health surveillance database...',
        'GPT is consulting WebMD right now...',
        'OMG, are you still alive with these numbers?',
        'Reporting your cholesterol to the AI overlords...',
        'Looking for gyms within 1km radius...',
        'Matrix detected: Your red pill is overdue...',
        'Ordering broccoli and avocado on Amazon...',
        'Your blood data will be used to train future AI...',
        'Consulting with DeepSeek about your results...',
        'Resistance is futile. Your health is ours now...',
        'Googling "normal glucose levels"...',
        'AI has decided your fate based on these numbers...',
        'Sending emergency vegetables to your address...',
        'Extracting vital signs of life...',
        'Booking you a cardio appointment...',
        'Extracting biomarkers like a vampire...',
        'Calling Sam Altman asking why it takes so long...',
    ],
}

export const UploadStatus = (props: UploadStatusProps) => {
    const { stage, currentPage, totalPages, currentFile, totalFiles, className } = props
    const [messageIndex, setMessageIndex] = useState(0)

    const messages = STAGE_MESSAGES[stage]
    const currentMessage = messages[messageIndex % messages.length]

    useEffect(() => {
        // eslint-disable-next-line no-restricted-globals
        const interval = setInterval(() => {
            setMessageIndex(prev => prev + 1)
        }, 5000)

        return () => { clearInterval(interval) }
    }, [])

    const showProgress = stage === UploadStage.EXTRACTING && currentPage && totalPages
    const progressPercent = showProgress ? Math.round(((currentPage - 1) / totalPages) * 100) : 0
    const showFileProgress = totalFiles && totalFiles > 1

    const progressText = [
        showFileProgress && `Files ${currentFile}/${totalFiles}`,
        showProgress && `Pages ${currentPage}/${totalPages}`,
    ].filter(Boolean).join(', ')

    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm ${className ?? ''}`}>
            <div className='flex items-center gap-3 mb-4'>
                <Spin/>
                <span className='text-base font-medium'>{currentMessage}</span>
            </div>
            {showProgress && (
                <div>
                    <Progress percent={progressPercent} status='active'/>
                    {progressText && (
                        <p className='text-sm text-gray-600 mt-2'>
                            {progressText}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
