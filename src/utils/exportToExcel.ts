import * as XLSX from 'xlsx'

import { BiomarkerConfig } from '@/db/models/biomarkerConfig'
import { BiomarkerRecord } from '@/db/models/biomarkerRecord'
import { UploadedDocument } from '@/db/models/document'
import { Unit } from '@/db/models/unit'

interface ExportData {
    configs: BiomarkerConfig[]
    records: BiomarkerRecord[]
    documents: UploadedDocument[]
    units: Unit[]
}

export const exportToExcel = (data: ExportData) => {
    const workbook = XLSX.utils.book_new()

    const configsData = data.configs.map(config => ({
        id: config.id,
        userId: config.userId,
        name: config.name,
        originalName: config.originalName ?? '',
        description: config.description ?? '',
        ucumCode: config.ucumCode ?? '',
        normalRangeMin: config.normalRange?.min ?? '',
        normalRangeMax: config.normalRange?.max ?? '',
        targetRangeMin: config.targetRange?.min ?? '',
        targetRangeMax: config.targetRange?.max ?? '',
        approved: config.approved,
        order: config.order ?? '',
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
    }))

    const recordsData = data.records.map(record => ({
        id: record.id,
        userId: record.userId,
        biomarkerId: record.biomarkerId,
        documentId: record.documentId ?? '',
        value: record.value ?? '',
        ucumCode: record.ucumCode,
        originalName: record.originalName ?? '',
        notes: record.notes ?? '',
        doctorNotes: record.doctorNotes ?? '',
        approved: record.approved,
        latest: record.latest,
        order: record.order ?? '',
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    }))

    const documentsData = data.documents.map(doc => ({
        id: doc.id,
        userId: doc.userId,
        fileName: doc.fileName,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        lab: doc.lab ?? '',
        testDate: doc.testDate?.toISOString() ?? '',
        doctorName: doc.doctorName ?? '',
        notes: doc.notes ?? '',
        type: doc.type,
        approved: doc.approved,
        uploadDate: doc.uploadDate.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    }))

    const unitsData = data.units.map(unit => ({
        id: unit.id as string,
        userId: unit.userId as string,
        title: unit.title,
        ucumCode: unit.ucumCode,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
    }))

    const configsSheet = XLSX.utils.json_to_sheet(configsData)
    const recordsSheet = XLSX.utils.json_to_sheet(recordsData)
    const documentsSheet = XLSX.utils.json_to_sheet(documentsData)
    const unitsSheet = XLSX.utils.json_to_sheet(unitsData)

    XLSX.utils.book_append_sheet(workbook, configsSheet, 'Biomarker Configs')
    XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Test Records')
    XLSX.utils.book_append_sheet(workbook, documentsSheet, 'Documents')
    XLSX.utils.book_append_sheet(workbook, unitsSheet, 'Units')

    const fileName = `blood_test_data_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
}
