declare module '@lhncbc/ucum-lhc' {
    interface UcumUnit {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        csCode_?: string
        // eslint-disable-next-line @typescript-eslint/naming-convention
        name_?: string
        // eslint-disable-next-line @typescript-eslint/naming-convention
        printSymbol_?: string
        csCode?: string
    }

    export class UcumLhcUtils {
        static getInstance (): UcumLhcUtils
        validateUnitString (code: string, suggest?: boolean): { status: string, unit?: unknown[] }
        convertUnitTo (
            fromUnitCode: string,
            fromVal: number,
            toUnitCode: string,
            options?: { suggest?: boolean, molecularWeight?: number, charge?: number }
        ): { status: string, toVal?: number, msg?: string[] }
        getSpecifiedUnit (code: string, system?: string): { unit?: UcumUnit, status: string }
        commensurablesList (code: string): string[]
        getCommensurables (code: string): UcumUnit[]
    }
}
