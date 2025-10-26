import { message } from 'antd'
import * as XLSX from 'xlsx'

import { addBiomarkerConfig, useBiomarkerConfigs } from '@/db/models/biomarkerConfig'
import { addBiomarkerRecord, useBiomarkerRecords } from '@/db/models/biomarkerRecord'
import { addDocument, useDocuments, DocumentType } from '@/db/models/document'
import { addUnit, useUnits } from '@/db/models/unit'

export const importFromExcel = async (file: File, existingIds: {
    configIds: Set<string>
    recordIds: Set<string>
    documentIds: Set<string>
    unitIds: Set<string>
}) => {
    try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })

        let configsAdded = 0
        let recordsAdded = 0
        let documentsAdded = 0
        let unitsAdded = 0
        let skipped = 0

        const configsSheet = workbook.Sheets['Biomarker Configs']
        if (configsSheet) {
            const configs = XLSX.utils.sheet_to_json(configsSheet)
            for (const row of configs) {
                const config = row as Record<string, unknown>
                if (existingIds.configIds.has(config.id as string)) {
                    skipped++
                    continue
                }

                await addBiomarkerConfig({
                    id: config.id as string,
                    userId: config.userId as string,
                    name: config.name as string,
                    originalName: config.originalName ? config.originalName as string : undefined,
                    description: config.description ? config.description as string : undefined,
                    ucumCode: config.ucumCode ? config.ucumCode as string : undefined,
                    normalRange: (config.normalRangeMin || config.normalRangeMax) ? {
                        min: config.normalRangeMin ? Number(config.normalRangeMin) : undefined,
                        max: config.normalRangeMax ? Number(config.normalRangeMax) : undefined,
                    } : undefined,
                    targetRange: (config.targetRangeMin || config.targetRangeMax) ? {
                        min: config.targetRangeMin ? Number(config.targetRangeMin) : undefined,
                        max: config.targetRangeMax ? Number(config.targetRangeMax) : undefined,
                    } : undefined,
                    approved: config.approved as boolean,
                    order: config.order ? Number(config.order) : undefined,
                    createdAt: new Date(config.createdAt as string),
                    updatedAt: new Date(config.updatedAt as string),
                })
                configsAdded++
            }
        }

        const recordsSheet = workbook.Sheets['Test Records']
        if (recordsSheet) {
            const records = XLSX.utils.sheet_to_json(recordsSheet)
            for (const row of records) {
                const record = row as Record<string, unknown>
                if (existingIds.recordIds.has(record.id as string)) {
                    skipped++
                    continue
                }

                await addBiomarkerRecord({
                    id: record.id as string,
                    userId: record.userId as string,
                    biomarkerId: record.biomarkerId as string,
                    documentId: record.documentId ? record.documentId as string : undefined,
                    value: record.value ? Number(record.value) : undefined,
                    ucumCode: record.ucumCode as string,
                    originalName: record.originalName ? record.originalName as string : undefined,
                    notes: record.notes ? record.notes as string : undefined,
                    doctorNotes: record.doctorNotes ? record.doctorNotes as string : undefined,
                    approved: record.approved as boolean,
                    latest: record.latest as boolean,
                    order: record.order ? Number(record.order) : undefined,
                    createdAt: new Date(record.createdAt as string),
                    updatedAt: new Date(record.updatedAt as string),
                })
                recordsAdded++
            }
        }

        const documentsSheet = workbook.Sheets.Documents
        if (documentsSheet) {
            const documents = XLSX.utils.sheet_to_json(documentsSheet)
            for (const row of documents) {
                const doc = row as Record<string, unknown>
                if (existingIds.documentIds.has(doc.id as string)) {
                    skipped++
                    continue
                }

                await addDocument({
                    id: doc.id as string,
                    userId: doc.userId as string,
                    fileName: doc.fileName as string,
                    originalName: doc.originalName as string,
                    fileSize: Number(doc.fileSize),
                    mimeType: doc.mimeType as string,
                    lab: doc.lab ? doc.lab as string : undefined,
                    testDate: doc.testDate ? new Date(doc.testDate as string) : undefined,
                    doctorName: doc.doctorName ? doc.doctorName as string : undefined,
                    notes: doc.notes ? doc.notes as string : undefined,
                    type: doc.type as DocumentType,
                    approved: doc.approved as boolean,
                    uploadDate: new Date(doc.uploadDate as string),
                    createdAt: new Date(doc.createdAt as string),
                    updatedAt: new Date(doc.updatedAt as string),
                })
                documentsAdded++
            }
        }

        const unitsSheet = workbook.Sheets.Units
        if (unitsSheet) {
            const units = XLSX.utils.sheet_to_json(unitsSheet)
            for (const row of units) {
                const unit = row as Record<string, unknown>
                if (existingIds.unitIds.has(unit.id as string)) {
                    skipped++
                    continue
                }

                await addUnit({
                    id: unit.id as string,
                    userId: unit.userId as string,
                    title: unit.title as string,
                    ucumCode: unit.ucumCode as string,
                    createdAt: new Date(unit.createdAt as string),
                    updatedAt: new Date(unit.updatedAt as string),
                })
                unitsAdded++
            }
        }

        void message.success(
            `Import completed: ${configsAdded} configs, ${recordsAdded} records, ${documentsAdded} documents, ${unitsAdded} units added. ${skipped} duplicates skipped.`,
        )
    } catch (error) {
        console.error('Import error:', error)
        void message.error('Failed to import data')
    }
}

export const useImportData = () => {
    const { data: configs } = useBiomarkerConfigs()
    const { data: records } = useBiomarkerRecords()
    const { data: documents } = useDocuments()
    const { data: units } = useUnits()

    const existingIds = {
        configIds: new Set(configs.map(c => c.id)),
        recordIds: new Set(records.map(r => r.id)),
        documentIds: new Set(documents.map(d => d.id)),
        unitIds: new Set(units.map(u => u.id as string)),
    }

    return {
        existingIds,
        importFromExcel: (file: File, ids: typeof existingIds) => importFromExcel(file, ids),
    }
}
