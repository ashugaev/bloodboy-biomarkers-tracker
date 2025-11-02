import { useEffect } from 'react'

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { App as AntApp, ConfigProvider } from 'antd'
import { usePostHog } from 'posthog-js/react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

import { themeConfig } from '@/constants'
import { useCurrentUser } from '@/db'
import { HomePage, DataPage, BiomarkerRecordsPage } from '@/pages'

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

export const App = () => {
    useCurrentUser()

    return (
        <ConfigProvider theme={themeConfig}>
            <AntApp>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                    <PageViewTracker/>
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
