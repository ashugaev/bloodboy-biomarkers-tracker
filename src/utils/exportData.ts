import { message } from 'antd'
import { exportDB } from 'dexie-export-import'

import { db } from '@/db/services/db.service'
import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'

interface ExportDataParams {
    configs: BiomarkerConfig[]
    records: BiomarkerRecord[]
    documents: UploadedDocument[]
}

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const exportToCSV = (data: ExportDataParams) => {
    const { configs, records, documents } = data
    
    const configsMap = new Map(configs.map(c => [c.id, c]))
    const documentsMap = new Map(documents.map(d => [d.id, d]))
    
    const csvRows = [
        ['Test Date', 'Biomarker', 'Value', 'Unit', 'Normal Range Min', 'Normal Range Max', 'Target Range Min', 'Target Range Max'].join(',')
    ]
    
    records
        .filter(r => r.approved && r.value !== undefined)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach(record => {
            const config = configsMap.get(record.biomarkerId)
            const doc = record.documentId ? documentsMap.get(record.documentId) : null
            
            const testDate = doc?.testDate ? doc.testDate.toLocaleDateString() : record.createdAt.toLocaleDateString()
            const name = config?.name || record.originalName || 'Unknown'
            const value = record.value?.toString() || ''
            const unit = record.ucumCode || ''
            const normalRangeMin = config?.normalRange?.min?.toString() || ''
            const normalRangeMax = config?.normalRange?.max?.toString() || ''
            const targetRangeMin = config?.targetRange?.min?.toString() || ''
            const targetRangeMax = config?.targetRange?.max?.toString() || ''
            
            csvRows.push([testDate, name, value, unit, normalRangeMin, normalRangeMax, targetRangeMin, targetRangeMax].join(','))
        })
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const date = new Date().toISOString().split('T')[0]
    downloadBlob(blob, `bloodboy_results_${date}.csv`)
}

export const exportData = async (data: ExportDataParams) => {
    try {
        const date = new Date().toISOString().split('T')[0]
        
        const jsonBlob = await exportDB(db, {
            filter: (table, value) => {
                if (table === 'appSettings' && value.openaiApiKey) {
                    return { ...value, openaiApiKey: '' }
                }
                return value
            }
        })
        downloadBlob(jsonBlob, `bloodboy_db_backup_${date}.json`)
        
        exportToCSV(data)
        
        void message.success('Data exported successfully: JSON backup and CSV file created')
    } catch (error) {
        console.error('Export error:', error)
        void message.error('Failed to export data')
    }
}

