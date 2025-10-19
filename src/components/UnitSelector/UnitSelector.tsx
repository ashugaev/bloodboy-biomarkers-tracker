import { Unit } from '@/db/types'
import { getAvailableUnits, convertUnit } from '@/db/utils'

import { UnitSelectorProps } from './UnitSelector.types'

export const UnitSelector = (props: UnitSelectorProps) => {
    const { biomarkerType, currentUnit, value, onChange, className } = props

    const availableUnits = getAvailableUnits(biomarkerType)

    const handleUnitChange = (newUnit: Unit) => {
        if (value !== undefined && currentUnit) {
            const convertedValue = convertUnit(value, currentUnit, newUnit, biomarkerType)
            if (convertedValue !== null) {
                onChange?.(newUnit, convertedValue)
                return
            }
        }
        onChange?.(newUnit)
    }

    return (
        <div className={className}>
            <select
                value={currentUnit}
                onChange={e => {
                    handleUnitChange(e.target.value as Unit)
                }}
                className='px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary'
            >
                {availableUnits.map(unit => (
                    <option
                        key={unit}
                        value={unit}
                    >
                        {unit}
                    </option>
                ))}
            </select>
        </div>
    )
}
