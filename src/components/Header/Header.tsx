import { Link } from 'react-router-dom'

import { ExportButton } from '@/components/ExportButton'
import { ImportButton } from '@/components/ImportButton'

import { HeaderProps } from './Header.types'

export const Header = (props: HeaderProps) => {
    const { className } = props

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 ${className ?? ''}`}>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-16'>
                    <Link to='/' className='flex items-center gap-2'>
                        <img src='/favicon.svg' alt='Bloodboy' className='w-5 h-5'/>
                        <span className='text-lg font-semibold text-gray-800'>Bloodboy</span>
                    </Link>
                    <div className='flex gap-2'>
                        <ImportButton/>
                        <ExportButton/>
                    </div>
                </div>
            </div>
        </header>
    )
}
