import { Formula } from '@/db/models/formula'

export interface FormulaBuilderModalProps {
    open: boolean
    formula?: Formula | null
    onClose: () => void
    onSaved?: (id: string) => void
}
