import { Modal } from 'antd'

import { PdfViewer } from '@/components/PdfViewer'

import { DocumentViewerModalProps } from './DocumentViewerModal.types'

export const DocumentViewerModal = (props: DocumentViewerModalProps) => {
    const { document, onClose } = props

    return (
        <Modal
            open={!!document}
            onCancel={onClose}
            footer={null}
            width='90vw'
            style={{ top: 20 }}
            styles={{
                body: {
                    height: 'calc(100vh - 100px)',
                    padding: 0,
                },
            }}
            title={document?.originalName}
        >
            {document?.fileData && (
                <PdfViewer
                    fileData={document.fileData}
                    fileName={document.originalName}
                />
            )}
        </Modal>
    )
}
