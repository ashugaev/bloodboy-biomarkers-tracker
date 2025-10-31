import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Button, Modal, Typography } from 'antd'

import { COLORS } from '@/constants/colors'

import { ExtractionErrorModalProps } from './ExtractionErrorModal.types'

const { Text } = Typography

export const ExtractionErrorModal = (props: ExtractionErrorModalProps) => {
    const { open, failedPages, onRetry, onCancel, retrying } = props

    const pageNumbers = failedPages.map(index => index + 1).join(', ')

    return (
        <Modal
            open={open}
            title={(
                <span>
                    <ExclamationCircleOutlined
                        style={{
                            color: COLORS.WARNING,
                            marginRight: 8,
                        }}
                    />
                    Extraction Failed
                </span>
            )}
            onCancel={onCancel}
            footer={[
                <Button key='cancel' onClick={onCancel} disabled={retrying}>
                    Skip Failed Pages
                </Button>,
                <Button key='retry' type='primary' onClick={onRetry} loading={retrying}>
                    Retry
                </Button>,
            ]}
            closable={!retrying}
            maskClosable={!retrying}
        >
            <div>
                <Text>
                    {failedPages.length === 1
                        ? `Page ${pageNumbers} failed to extract through AI provider.`
                        : `Pages ${pageNumbers} failed to extract through AI provider.`}
                </Text>
                <br/>
                <br/>
                <Text>
                    Would you like to retry extraction for these pages?
                </Text>
            </div>
        </Modal>
    )
}
