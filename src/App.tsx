import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { themeConfig } from '@/constants'
import { useCurrentUser } from '@/db'
import { HomePage, DataPage, BiomarkerRecordsPage } from '@/pages'

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
])

export const App = () => {
    useCurrentUser()

    return (
        <ConfigProvider theme={themeConfig}>
            <AntApp>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                    <Routes>
                        <Route path='/' element={<HomePage/>}/>
                        <Route path='/data' element={<DataPage/>}/>
                        <Route path='/biomarker/:id' element={<BiomarkerRecordsPage/>}/>
                    </Routes>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    )
}
