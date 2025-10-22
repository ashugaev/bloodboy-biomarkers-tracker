import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../services/db.service'
import { UploadedDocument, DocumentType } from '../types'

export const useDocuments = (type?: DocumentType) => {
    const documents = useLiveQuery(
        async () => {
            const results = await db.uploadedFiles
                .toCollection()
                .reverse()
                .sortBy('uploadDate')

            if (type) {
                return results.filter(doc => doc.type === type)
            }

            return results
        },
        [type],
    )

    return {
        documents: documents ?? [],
        loading: documents === undefined,
    }
}

export const useDocument = (id?: string) => {
    const document = useLiveQuery(
        async () => {
            if (!id) return null
            return await db.uploadedFiles.get(id) ?? null
        },
        [id],
    )

    return {
        document,
        loading: document === undefined,
    }
}

export const addDocument = async (document: UploadedDocument): Promise<string> => {
    return await db.uploadedFiles.add(document)
}

export const updateDocument = async (id: string, updates: Partial<UploadedDocument>): Promise<void> => {
    await db.uploadedFiles.update(id, {
        ...updates,
        updatedAt: new Date(),
    })
}

export const deleteDocument = async (id: string): Promise<void> => {
    await db.uploadedFiles.delete(id)
}
