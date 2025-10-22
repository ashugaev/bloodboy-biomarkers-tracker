import { StrictMode } from 'react'

import '@ant-design/v5-patch-for-react-19'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { ensureUser } from './db/hooks'

import './index.css'

const rootElement = document.getElementById('root')

if (rootElement) {
    ensureUser().then(() => {
        createRoot(rootElement).render(
            <StrictMode>
                <App/>
            </StrictMode>,
        )
    }).catch((error) => {
        console.error('Failed to initialize user:', error)
    })
}
