import * as pdfjsLib from 'pdfjs-dist'

export const renderPageToBase64 = async (page: pdfjsLib.PDFPageProxy, scale = 2.0): Promise<string> => {
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) throw new Error('Cannot get canvas context')

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
        canvasContext: context,
        viewport,
        canvas,
    }).promise

    return canvas.toDataURL('image/png')
}
