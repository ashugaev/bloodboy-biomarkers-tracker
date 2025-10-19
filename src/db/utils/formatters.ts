import { Unit } from '../types/biomarker.types'

export const formatValue = (value: number, unit: Unit): string => {
    const formatted = value.toFixed(2)
    return `${formatted} ${unit}`
}

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date)
}

export const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

export const formatRange = (min: number, max: number, unit: Unit): string => {
    return `${min} - ${max} ${unit}`
}
