import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { AddNewButtonProps } from './AddNewButton.types'

export const AddNewButton = (props: AddNewButtonProps) => {
    const { onClick, className, label } = props
    return (
        <Button className={className} icon={<PlusOutlined/>} onClick={onClick}>
            {label ?? 'Add New'}
        </Button>
    )
}
