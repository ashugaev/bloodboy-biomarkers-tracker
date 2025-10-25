export const dateComparator = (valueA: unknown, valueB: unknown): number => {
    const a = valueA ? new Date(valueA as string | number | Date).getTime() : 0
    const b = valueB ? new Date(valueB as string | number | Date).getTime() : 0
    return a - b
}
