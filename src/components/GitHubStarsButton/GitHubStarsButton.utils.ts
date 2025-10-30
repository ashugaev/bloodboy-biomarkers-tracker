export const formatStarsNumber = (num: number, formatted: boolean): string => {
    if (!formatted) {
        return num.toLocaleString('en-US')
    }
    if (num < 1000) {
        return num.toString()
    }
    const units = ['k', 'M', 'B', 'T']
    let unitIndex = 0
    let n = num
    while (n >= 1000 && unitIndex < units.length) {
        n /= 1000
        unitIndex++
    }
    return `${Math.floor(n)}${units[unitIndex - 1] ?? ''}`
}

