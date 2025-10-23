import { ValidationWarningProps } from './ValidationWarning.types'

export const ValidationWarning = (props: ValidationWarningProps) => {
    const { message } = props

    return (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm'>
            {message}
        </div>
    )
}
