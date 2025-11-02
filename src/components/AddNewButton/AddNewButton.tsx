import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { captureEvent } from '@/utils'

import { AddNewButtonProps } from './AddNewButton.types'

export const AddNewButton = (props: AddNewButtonProps) => {
    const { onClick, className, label } = props
    const posthog = usePostHog()

    const handleClick = () => {
        captureEvent(posthog, 'add_new_button_clicked', {
            label: label ?? 'Add New',
        })
        onClick?.()
    }

    return (
        <Button className={className} size='small' type='primary' icon={<PlusOutlined/>} onClick={handleClick} style={{ width: 'fit-content' }}>
            {label ?? 'Add New'}
        </Button>
    )
}
