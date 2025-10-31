import { useState } from 'react'

import { DeleteOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'

import { COLORS, DB_NAME } from '@/constants'

import { ResetDbButtonProps } from './ResetDbButton.types'

export const ResetDbButton = (props: ResetDbButtonProps) => {
    const { className } = props
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const handleReset = () => {
        setIsResetting(true)
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME)

        deleteRequest.onsuccess = () => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
        }

        deleteRequest.onerror = (error) => {
            console.error('Failed to reset database:', error)
            setIsResetting(false)
        }

        deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked. Closing connections...')
            window.location.reload()
        }
    }

    return (
        <>
            <Button
                size='small'
                icon={<DeleteOutlined/>}
                onClick={() => { setIsModalVisible(true) }}
                danger
                className={className}
            >
                Clear DB
            </Button>
            <Modal
                title='Clear All Data'
                open={isModalVisible}
                onOk={handleReset}
                onCancel={() => { setIsModalVisible(false) }}
                okText='Yes, Delete Everything'
                cancelText='Cancel'
                okButtonProps={{
                    danger: true,
                    loading: isResetting,
                    style: { backgroundColor: COLORS.ERROR },
                }}
                closable={!isResetting}
                maskClosable={!isResetting}
            >
                <p>Are you sure you want to delete all your data?</p>
                <p>This will permanently remove:</p>
                <ul
                    style={{
                        marginLeft: '20px',
                        marginTop: '8px',
                        marginBottom: '12px',
                    }}
                >
                    <li>🩸 All biomarker records</li>
                    <li>📄 All uploaded documents</li>
                    <li>⚙️ All custom configurations</li>
                </ul>
            </Modal>
        </>
    )
}
