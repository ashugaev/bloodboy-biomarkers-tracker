import { StrictMode } from 'react'

import '@ant-design/v5-patch-for-react-19'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { preloadBiomarkerConfigs } from './db/models/biomarkerConfig'
import { preloadUnits } from './db/models/unit'
import { getCurrentUserId } from './db/models/user'

import './index.css'

const rootElement = document.getElementById('root')

if (rootElement) {
    getCurrentUserId()
        .then(() => preloadUnits())
        .then(() => preloadBiomarkerConfigs())
        .then(() => {
            createRoot(rootElement).render(
                <StrictMode>
                    <App/>
                </StrictMode>,
            )
        })
        .catch((error: Error) => {
            console.error('Failed to initialize:', error)
        })
}
