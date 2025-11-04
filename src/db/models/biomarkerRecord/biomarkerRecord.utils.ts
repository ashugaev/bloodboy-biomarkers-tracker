import { BiomarkerRecord } from '@/db/models/biomarkerRecord/biomarkerRecord.types'

interface PageOrderSortable {
    page?: number
    order?: number
}

const compareValues = (a?: number, b?: number) => {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return 1
    if (b === undefined) return -1
    return a - b
}

export const comparePageAndOrder = (a: PageOrderSortable, b: PageOrderSortable) => {
    const aEmpty = !a.page
    const bEmpty = !b.page
    if (aEmpty && !bEmpty) return -1
    if (!aEmpty && bEmpty) return 1

    const pageComparison = compareValues(a.page, b.page)
    if (pageComparison !== 0) {
        return pageComparison
    }

    return compareValues(a.order, b.order)
}

export const compareBiomarkerRecords = (a: BiomarkerRecord, b: BiomarkerRecord) => {
    return comparePageAndOrder(a, b)
}
