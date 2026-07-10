import { Formula } from '@/db/models/formula'

export interface FormulasTableProps {
    className?: string
    onEdit: (formula: Formula) => void
    onCreate: () => void
}
