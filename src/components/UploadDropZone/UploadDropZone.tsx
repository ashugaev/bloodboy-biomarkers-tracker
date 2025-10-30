import { UploadOutlined } from '@ant-design/icons'
import { Button, Flex, Typography, Upload, message } from 'antd'
import Dragger from 'antd/es/upload/Dragger'
import { RcFile } from 'antd/es/upload/interface'
import { UploadRequestOption } from 'rc-upload/lib/interface'

import { FileFormat, UploadDropZoneProps } from './UploadDropZone.types'

const fileTypes: Record<FileFormat, string> = {
    pdf: 'application/pdf',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    csv: 'text/csv',
}

export const UploadDropZone = (props: UploadDropZoneProps) => {
    const {
        formats = ['pdf'],
        sizeMb = 30,
        icon,
        title,
        button = false,
        customRequest,
        ...restProps
    } = props

    const handleBeforeUpload = (file: RcFile) => {
        const isFormatValid = formats.some(format => {
            const fileType = fileTypes[format]
            return fileType === file.type
        })

        if (!isFormatValid) {
            void message.error(`${file.name} is not a ${formats.join(',')} file`)
        }

        if (file.size > sizeMb * 1024 * 1024) {
            void message.error(`Please upload a file less than ${sizeMb} MB`)
        }

        return isFormatValid || Upload.LIST_IGNORE
    }

    const draggerCustomRequest = (data: UploadRequestOption) => {
        if (!data.file || !data.onError || !data.onSuccess || !data.onProgress) {
            void message.error('File upload failed')
            return
        }

        void (async () => {
            try {
                await customRequest(data)
            } catch (error) {
                void message.error('File upload failed')
            }
        })()
    }

    return (
        <Dragger
            multiple={false}
            maxCount={1}
            style={{
                flexDirection: 'row',
                backgroundColor: 'white',
                borderRadius: '4px',
            }}
            beforeUpload={handleBeforeUpload}
            customRequest={draggerCustomRequest}
            {...restProps}
        >
            <Flex align='center' vertical justify='center' gap={8}>
                {icon}
                {title && (
                    <Typography.Title level={5}>
                        {title}
                    </Typography.Title>
                )}
                <Flex
                    align='center'
                    justify='center'
                    gap={4}
                    style={{
                        flexDirection: 'column',
                        color: 'gray',
                    }}
                >
                    <Flex className='ant-upload-hint'>
                        {`Drag and Drop a File (${formats.map(el => el.toUpperCase()).join(', ')}, up to ${sizeMb} MB)`}
                    </Flex>
                    <Flex className='ant-upload-hint'>
                        or
                    </Flex>
                </Flex>
                {button && (
                    <Button type='primary' size='small' disabled={props.disabled} icon={<UploadOutlined/>}>
                        Select File
                    </Button>
                )}
            </Flex>
        </Dragger>
    )
}
