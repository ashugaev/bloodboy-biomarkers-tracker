import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { AddNewButtonProps } from './AddNewButton.types'

export const AddNewButton = (props: AddNewButtonProps) => {
    const { onClick, className, label } = props
    return (
        <Button className={className} type='primary' icon={<PlusOutlined/>} onClick={onClick} style={{ width: 'fit-content' }}>
            {label ?? 'Add New'}
        </Button>
    )
}
