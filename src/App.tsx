import { useEffect } from 'react'

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { App as AntApp, ConfigProvider } from 'antd'
import { usePostHog } from 'posthog-js/react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

import { config } from '@/config'
import { themeConfig } from '@/constants'
import { useCurrentUser } from '@/db'
import { useGoogleDriveAutoBackup } from '@/googleDrive'
import { HomePage, DataPage, BiomarkerRecordsPage, FormulaDetailPage } from '@/pages'

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
])

const PageViewTracker = () => {
    const location = useLocation()
    const posthog = usePostHog()

    useEffect(() => {
        if (posthog) {
            posthog.capture('$pageview', {
                path: location.pathname,
            })
        }
    }, [location.pathname, posthog])

    return null
}

const GoogleDriveAutoBackup = () => {
    useGoogleDriveAutoBackup()

    return null
}

const AppGoogleDriveAutoBackup = () => {
    const location = useLocation()

    if (location.pathname === '/') {
        return null
    }

    return <GoogleDriveAutoBackup/>
}

export const App = () => {
    useCurrentUser()

    return (
        <ConfigProvider theme={themeConfig}>
            <AntApp>
                <BrowserRouter basename={config.baseUrl}>
                    <PageViewTracker/>
                    <AppGoogleDriveAutoBackup/>
                    <Routes>
                        <Route path='/' element={<HomePage/>}/>
                        <Route path='/data' element={<DataPage/>}/>
                        <Route path='/biomarker/:id' element={<BiomarkerRecordsPage/>}/>
                        <Route path='/formula/:id' element={<FormulaDetailPage/>}/>
                    </Routes>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    )
}
