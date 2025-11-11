import { useState, useEffect } from 'react'

import { Tooltip } from 'antd'
import { usePostHog } from 'posthog-js/react'
import { Link } from 'react-router-dom'

import { GitHubStarsButton } from '@/components/GitHubStarsButton'
import { getPublicPath, captureEvent } from '@/utils'

import { HomePageProps } from './HomePage.types'
import user1Img from './img/user-1.png'
import user2Img from './img/user-2.png'
import user3Img from './img/user-3.png'

export const HomePage = (props: HomePageProps) => {
    const { className } = props
    const posthog = usePostHog()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [openFaq, setOpenFaq] = useState<string | null>('1')
    const [activeSection, setActiveSection] = useState('home')

    useEffect(() => {
        const sections = ['home', 'features', 'pricing', 'faq']
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0,
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id || 'home')
                }
            })
        }, observerOptions)

        // Observe all sections
        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId)
            if (element) {
                observer.observe(element)
            }
        })

        // Special handling for home section (top of page)
        const handleScroll = () => {
            if (window.scrollY < 100) {
                setActiveSection('home')
            }
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            observer.disconnect()
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const scrollToSection = (sectionId: string) => {
        captureEvent(posthog, 'homepage_navigation_clicked', {
            section: sectionId,
        })
        if (sectionId === 'home') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            })
        } else {
            const element = document.getElementById(sectionId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        }
        setIsMenuOpen(false) // Close mobile menu after navigation
    }

    return (
        <div className={className}>
            <header className='sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full text-sm'>
                <nav className='mt-4 relative max-w-2xl w-full bg-white border border-gray-200 rounded-[24px] mx-2 flex flex-wrap md:flex-nowrap items-center justify-between p-1 ps-4 md:py-0 sm:mx-auto'>
                    <div className='flex items-center'>
                        <Link
                            className='flex items-center gap-2 rounded-md focus:outline-none focus:opacity-80'
                            to='/'
                            aria-label='Bloodboy'
                            onClick={() => {
                                captureEvent(posthog, 'homepage_logo_clicked')
                            }}
                        >
                            <img src={getPublicPath('favicon.svg')} alt='Bloodboy' className='w-4 h-4'/>
                            <span className='text-xl font-semibold text-gray-800'>Bloodboy</span>
                        </Link>
                    </div>

                    <div className='flex items-center gap-1 md:order-4 md:ms-4'>
                        {/* Desktop button */}
                        <Link
                            to='/data'
                            className='hidden md:w-full md:inline-flex whitespace-nowrap py-2 px-3 justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:outline-none focus:bg-indigo-700 transition-all hover:scale-105 active:scale-95'
                            onClick={() => {
                                captureEvent(posthog, 'homepage_get_started_clicked', {
                                    location: 'header_desktop',
                                })
                            }}
                        >
                            Get Started
                        </Link>

                        {/* Mobile menu button */}
                        <div className='md:hidden'>
                            <button
                                type='button'
                                onClick={() => {
                                    captureEvent(posthog, 'homepage_mobile_menu_toggled', {
                                        isOpen: !isMenuOpen,
                                    })
                                    setIsMenuOpen(!isMenuOpen)
                                }}
                                className='flex justify-center items-center size-9 border rounded-full border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all hover:scale-105 active:scale-95'
                                aria-label='Toggle navigation'
                            >
                                {!isMenuOpen ? (
                                    <svg className='size-4' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <line x1='3' x2='21' y1='6' y2='6'/>
                                        <line x1='3' x2='21' y1='12' y2='12'/>
                                        <line x1='3' x2='21' y1='18' y2='18'/>
                                    </svg>
                                ) : (
                                    <svg className='size-4' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M18 6 6 18'/>
                                        <path d='m6 6 12 12'/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={`${isMenuOpen ? 'block' : 'hidden'} overflow-hidden transition-all duration-300 basis-full grow md:block ml-5 mr-8`}>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3 mt-3 md:mt-0 py-2 md:py-0 md:ps-7'>
                            <button
                                className={`py-0.5 md:py-3 px-4 md:px-1 md:border-b-2 font-medium focus:outline-none transition-colors ${
                                    activeSection === 'home'
                                        ? 'md:border-gray-800 md:text-gray-800 text-gray-800'
                                        : 'md:border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                                onClick={() => { scrollToSection('home') }}
                                aria-current={activeSection === 'home' ? 'page' : undefined}
                            >
                                Home
                            </button>
                            <button
                                className={`py-0.5 md:py-3 px-4 md:px-1 md:border-b-2 font-medium focus:outline-none transition-colors ${
                                    activeSection === 'features'
                                        ? 'md:border-gray-800 md:text-gray-800 text-gray-800'
                                        : 'md:border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                                onClick={() => { scrollToSection('features') }}
                                aria-current={activeSection === 'features' ? 'page' : undefined}
                            >
                                Features
                            </button>
                            <button
                                className={`py-0.5 md:py-3 px-4 md:px-1 md:border-b-2 font-medium focus:outline-none transition-colors ${
                                    activeSection === 'pricing'
                                        ? 'md:border-gray-800 md:text-gray-800 text-gray-800'
                                        : 'md:border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                                onClick={() => { scrollToSection('pricing') }}
                                aria-current={activeSection === 'pricing' ? 'page' : undefined}
                            >
                                Pricing
                            </button>
                            <button
                                className={`py-0.5 md:py-3 px-4 md:px-1 md:border-b-2 font-medium focus:outline-none transition-colors ${
                                    activeSection === 'faq'
                                        ? 'md:border-gray-800 md:text-gray-800 text-gray-800'
                                        : 'md:border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                                onClick={() => { scrollToSection('faq') }}
                                aria-current={activeSection === 'faq' ? 'page' : undefined}
                            >
                                FAQ
                            </button>

                            {/* Mobile CTA button */}
                            <Link
                                to='/data'
                                className='md:hidden w-full mt-3 inline-flex justify-center items-center gap-x-2 py-3 px-4 text-sm font-medium rounded-full border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700 transition-colors'
                                onClick={() => {
                                    captureEvent(posthog, 'homepage_get_started_clicked', {
                                        location: 'header_mobile',
                                    })
                                    setIsMenuOpen(false)
                                }}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            <section id='home' className='bg-white lg:grid lg:min-h-screen lg:place-content-center'>
                <div className='mx-auto w-screen max-w-screen-xl px-4 py-32 sm:px-6 sm:py-48 lg:px-8 lg:py-64'>
                    <div className='mx-auto max-w-prose text-center'>
                        <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl'>
                            Track <Tooltip title="or your bloodboy's"><span className='underline decoration-dashed underline-offset-4 cursor-help'>your</span></Tooltip> <strong className='text-indigo-600'>biomarkers</strong> and understand <strong className='text-indigo-600'>health</strong>
                        </h1>

                        <p className='mt-4 text-base text-pretty text-gray-700 sm:text-lg/relaxed'>
                            Upload your blood test results and get instant insights into your health metrics.
                            Monitor trends, track changes, and make informed decisions about your wellness.
                        </p>

                        <div className='mt-4 flex justify-center gap-4 sm:mt-6'>
                            <Link
                                className='inline-block rounded border border-indigo-600 bg-indigo-600 py-3 px-4 font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:text-white hover:scale-105 active:scale-95'
                                to='/data'
                                onClick={() => {
                                    captureEvent(posthog, 'homepage_get_started_clicked', {
                                        location: 'hero',
                                    })
                                }}
                            >
                                Get Started
                            </Link>

                            <GitHubStarsButton
                                username='ashugaev'
                                repo='bloodboy-biomarkers-tracker'
                                formatted
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section id='features' className='bg-gray-50 py-20 sm:py-28'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto'>
                    <div className='max-w-2xl mx-auto text-center mb-10 lg:mb-14'>
                        <h2 className='text-3xl font-bold sm:text-4xl'>Features</h2>
                        <p className='mt-1 text-gray-600'>Everything you need to track and understand your blood test results.</p>
                    </div>

                    <div className='max-w-4xl mx-auto'>
                        <div className='grid md:grid-cols-2 gap-6 lg:gap-12'>
                            <div className='space-y-6 lg:space-y-10'>
                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/>
                                        <polyline points='14 2 14 8 20 8'/>
                                        <line x1='16' y1='13' x2='8' y2='13'/>
                                        <line x1='16' y1='17' x2='8' y2='17'/>
                                        <polyline points='10 9 9 9 8 9'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            PDF Upload
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Upload blood test results, including scans. An intelligent parser automatically extracts biomarker data without needing OCR software.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z'/>
                                        <line x1='12' y1='10' x2='12' y2='16'/>
                                        <line x1='9' y1='13' x2='15' y2='13'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            File Organization
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Organize your files and keep them in one place near to extracted values. All your documents are stored together with their extracted biomarker data for easy reference.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <line x1='18' y1='20' x2='18' y2='10'/>
                                        <line x1='12' y1='20' x2='12' y2='4'/>
                                        <line x1='6' y1='20' x2='6' y2='14'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Interactive Visualization
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Explore your health data through interactive charts. Each biomarker gets a dedicated graph, helping you visualize trends and patterns clearly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-6 lg:space-y-10'>
                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <rect x='3' y='11' width='18' height='11' rx='2' ry='2'/>
                                        <path d='M7 11V7a5 5 0 0 1 10 0v4'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            You Control Your Data
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Your health data is yours, stored locally, and never sent to servers. You control storage and can easily export everything to Excel.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='17 1 21 5 17 9'/>
                                        <path d='M3 11V9a4 4 0 0 1 4-4h14'/>
                                        <polyline points='7 23 3 19 7 15'/>
                                        <path d='M21 13v2a4 4 0 0 1-4 4H3'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Automatic Units Conversion
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Automatically convert and standardize biomarker units across all your test reports. This allows
                                            for seamless comparison of values from different labs and countries.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Free with Your API Key
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            The core application is free. For optional PDF data extraction, simply connect your personal OpenAI API key for processing.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className='bg-white py-32'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='max-w-2xl mx-auto text-center mb-10 lg:mb-14'>
                        <h2 className='text-2xl font-bold sm:text-4xl text-gray-900'>
                            What Our Users Say
                        </h2>
                        <p className='mt-1 text-gray-600'>
                            Stories from <Tooltip title='Assuming infinite multiverse exists, making all stories technically real'><span className='underline decoration-dashed underline-offset-4 cursor-help text-indigo-600'>real</span></Tooltip> people
                        </p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[85rem] mx-auto'>
                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex items-center space-x-4'>
                                    <div>
                                        <img
                                            src={user1Img}
                                            alt='Count V. Drake'
                                            className='object-cover w-14 h-14 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Count V. Drake</h4>
                                        <span className='text-xs text-gray-600'>2 nights ago</span>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 text-yellow-500'>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' className='w-5 h-5 fill-current'>
                                        <path d='M494,198.671a40.536,40.536,0,0,0-32.174-27.592L345.917,152.242,292.185,47.828a40.7,40.7,0,0,0-72.37,0L166.083,152.242,50.176,171.079a40.7,40.7,0,0,0-22.364,68.827l82.7,83.368-17.9,116.055a40.672,40.672,0,0,0,58.548,42.538L256,428.977l104.843,52.89a40.69,40.69,0,0,0,58.548-42.538l-17.9-116.055,82.7-83.368A40.538,40.538,0,0,0,494,198.671Zm-32.53,18.7L367.4,312.2l20.364,132.01a8.671,8.671,0,0,1-12.509,9.088L256,393.136,136.744,453.3a8.671,8.671,0,0,1-12.509-9.088L144.6,312.2,50.531,217.37a8.7,8.7,0,0,1,4.778-14.706L187.15,181.238,248.269,62.471a8.694,8.694,0,0,1,15.462,0L324.85,181.238l131.841,21.426A8.7,8.7,0,0,1,461.469,217.37Z'/>
                                    </svg>
                                    <span className='text-xl font-bold'>5.0</span>
                                </div>
                            </div>
                            <div className='p-4 space-y-2 text-sm text-gray-600'>
                                <p>As a connoisseur of fine cuisine for centuries, I appreciate quality control in my dietary sources. Perfect for monitoring my... personal staff's wellness. After all, you are what you eat.</p>
                            </div>
                        </div>

                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex items-center space-x-4'>
                                    <div>
                                        <img
                                            src={user2Img}
                                            alt='Rajan Joshi'
                                            className='object-cover w-14 h-14 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Rajan Joshi</h4>
                                        <span className='text-xs text-gray-600'>5 days ago</span>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 text-yellow-500'>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' className='w-5 h-5 fill-current'>
                                        <path d='M494,198.671a40.536,40.536,0,0,0-32.174-27.592L345.917,152.242,292.185,47.828a40.7,40.7,0,0,0-72.37,0L166.083,152.242,50.176,171.079a40.7,40.7,0,0,0-22.364,68.827l82.7,83.368-17.9,116.055a40.672,40.672,0,0,0,58.548,42.538L256,428.977l104.843,52.89a40.69,40.69,0,0,0,58.548-42.538l-17.9-116.055,82.7-83.368A40.538,40.538,0,0,0,494,198.671Zm-32.53,18.7L367.4,312.2l20.364,132.01a8.671,8.671,0,0,1-12.509,9.088L256,393.136,136.744,453.3a8.671,8.671,0,0,1-12.509-9.088L144.6,312.2,50.531,217.37a8.7,8.7,0,0,1,4.778-14.706L187.15,181.238,248.269,62.471a8.694,8.694,0,0,1,15.462,0L324.85,181.238l131.841,21.426A8.7,8.7,0,0,1,461.469,217.37Z'/>
                                    </svg>
                                    <span className='text-xl font-bold'>4.5</span>
                                </div>
                            </div>
                            <div className='p-4 space-y-2 text-sm text-gray-600'>
                                <p>As a biohacker optimizing my biology to live forever, I love that there's no annual subscription. By 2140, that would add up significantly. Perfect for tracking my Bluedrink protocol.</p>
                            </div>
                        </div>

                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex items-center space-x-4'>
                                    <div>
                                        <img
                                            src={user3Img}
                                            alt='Dr. Elizabeth'
                                            className='object-cover w-14 h-14 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Dr. Elizabeth</h4>
                                        <span className='text-xs text-gray-600'>1 week ago</span>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 text-red-500'>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' className='w-5 h-5 fill-current'>
                                        <path d='M494,198.671a40.536,40.536,0,0,0-32.174-27.592L345.917,152.242,292.185,47.828a40.7,40.7,0,0,0-72.37,0L166.083,152.242,50.176,171.079a40.7,40.7,0,0,0-22.364,68.827l82.7,83.368-17.9,116.055a40.672,40.672,0,0,0,58.548,42.538L256,428.977l104.843,52.89a40.69,40.69,0,0,0,58.548-42.538l-17.9-116.055,82.7-83.368A40.538,40.538,0,0,0,494,198.671Zm-32.53,18.7L367.4,312.2l20.364,132.01a8.671,8.671,0,0,1-12.509,9.088L256,393.136,136.744,453.3a8.671,8.671,0,0,1-12.509-9.088L144.6,312.2,50.531,217.37a8.7,8.7,0,0,1,4.778-14.706L187.15,181.238,248.269,62.471a8.694,8.694,0,0,1,15.462,0L324.85,181.238l131.841,21.426A8.7,8.7,0,0,1,461.469,217.37Z'/>
                                    </svg>
                                    <span className='text-xl font-bold'>1.0</span>
                                </div>
                            </div>
                            <div className='p-4 space-y-2 text-sm text-gray-600'>
                                <p>Recommended to my elderly patients, but most couldn't figure out how to get an OpenAI API key. Waiting for AGI agents to handle this step for us.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id='pricing' className='bg-gray-50 py-20 sm:py-28'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto'>
                    <div className='max-w-2xl mx-auto text-center mb-10 lg:mb-14'>
                        <h2 className='text-2xl font-bold sm:text-4xl'>Pricing</h2>
                        <p className='mt-1 text-gray-600'>Pay only for OpenAI tokens using your own API key</p>
                    </div>

                    <div className='flex justify-center'>
                        <div className='flex flex-col border border-gray-200 text-center rounded-xl p-8 bg-white max-w-sm w-full'>
                            <span className='font-bold text-5xl text-gray-800'>Free</span>

                            <ul className='mt-7 mb-7 space-y-2.5 text-sm'>
                                <li className='flex gap-x-2'>
                                    <svg className='shrink-0 mt-0.5 size-4 text-indigo-600' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='20 6 9 17 4 12'/>
                                    </svg>
                                    <span className='text-gray-800'>
                                        Unlimited blood test uploads
                                    </span>
                                </li>

                                <li className='flex gap-x-2'>
                                    <svg className='shrink-0 mt-0.5 size-4 text-indigo-600' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='20 6 9 17 4 12'/>
                                    </svg>
                                    <span className='text-gray-800'>
                                        PDF parsing and data extraction
                                    </span>
                                </li>

                                <li className='flex gap-x-2'>
                                    <svg className='shrink-0 mt-0.5 size-4 text-indigo-600' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='20 6 9 17 4 12'/>
                                    </svg>
                                    <span className='text-gray-800'>
                                        Historical data tracking
                                    </span>
                                </li>

                                <li className='flex gap-x-2'>
                                    <svg className='shrink-0 mt-0.5 size-4 text-indigo-600' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='20 6 9 17 4 12'/>
                                    </svg>
                                    <span className='text-gray-800'>
                                        Local browser storage
                                    </span>
                                </li>

                                <li className='flex gap-x-2'>
                                    <svg className='shrink-0 mt-0.5 size-4 text-indigo-600' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='20 6 9 17 4 12'/>
                                    </svg>
                                    <span className='text-gray-800'>
                                        Complete privacy
                                    </span>
                                </li>
                            </ul>

                            <Link
                                to='/data'
                                className='mt-3 inline-block rounded border border-indigo-600 bg-indigo-600 py-3 px-4 font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:text-white hover:scale-105 active:scale-95'
                                onClick={() => {
                                    captureEvent(posthog, 'homepage_get_started_clicked', {
                                        location: 'pricing',
                                    })
                                }}
                            >
                                Get Started
                            </Link>
                            <p className='mt-4 text-xs text-gray-500'>
                                Enjoying the free app?{' '}
                                <a
                                    className='inline-flex items-center gap-1 underline hover:text-gray-700 focus:outline-none transition-colors'
                                    href='https://github.com/ashugaev/bloodboy-biomarkers-tracker'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    onClick={() => {
                                        captureEvent(posthog, 'homepage_github_star_link_clicked', {
                                            location: 'pricing',
                                        })
                                    }}
                                >
                                    Leave a star <span>⭐</span>
                                </a>
                                {' '}on GitHub
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id='faq' className='bg-white py-20 sm:py-28'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto'>
                    <div className='grid md:grid-cols-5 gap-10'>
                        <div className='md:col-span-2'>
                            <div className='max-w-xs'>
                                <h2 className='text-2xl font-bold sm:text-4xl'>
                                    Frequently<br/>asked questions
                                </h2>
                                <p className='mt-1 hidden md:block text-gray-600'>
                                    Answers to the most frequently asked questions.
                                </p>
                            </div>
                        </div>

                        <div className='md:col-span-3'>
                            <div className='divide-y divide-gray-200'>
                                <div className='pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => {
                                            captureEvent(posthog, 'homepage_faq_toggled', {
                                                faqId: '1',
                                                isOpen: openFaq !== '1',
                                            })
                                            setOpenFaq(openFaq === '1' ? null : '1')
                                        }}
                                    >
                                        Is my health data secure?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '1' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '1' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                You are in complete control of your data. All information is processed and stored locally in your browser, and nothing is ever sent to our servers. After your documents are processed, you can download the normalized results. You are solely responsible for the storage and security of your downloaded data.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => {
                                            captureEvent(posthog, 'homepage_faq_toggled', {
                                                faqId: '2',
                                                isOpen: openFaq !== '2',
                                            })
                                            setOpenFaq(openFaq === '2' ? null : '2')
                                        }}
                                    >
                                        What file formats are supported?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '2' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '2' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Currently, we support PDF files for blood test results. Our intelligent parser can extract biomarker data from most standard laboratory report formats.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => {
                                            captureEvent(posthog, 'homepage_faq_toggled', {
                                                faqId: '3',
                                                isOpen: openFaq !== '3',
                                            })
                                            setOpenFaq(openFaq === '3' ? null : '3')
                                        }}
                                    >
                                        Is this service free?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '3' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '3' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Yes, the application is completely free to use. However, for
                                                the automated data extraction feature from PDF files, you will need to provide
                                                your own OpenAI API key. This means you are responsible for the costs associated
                                                with the OpenAI API usage, but the application itself has no fees,
                                                subscriptions, or hidden costs.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => {
                                            captureEvent(posthog, 'homepage_faq_toggled', {
                                                faqId: '4',
                                                isOpen: openFaq !== '4',
                                            })
                                            setOpenFaq(openFaq === '4' ? null : '4')
                                        }}
                                    >
                                        Can I export my data?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '4' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '4' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Yes, you can export your data at any time. Since all data is stored locally in your browser, you have complete control over your information.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => {
                                            captureEvent(posthog, 'homepage_faq_toggled', {
                                                faqId: '5',
                                                isOpen: openFaq !== '5',
                                            })
                                            setOpenFaq(openFaq === '5' ? null : '5')
                                        }}
                                    >
                                        How far back can I track my results?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '5' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '5' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                You can track your blood test results as far back as you want. There are no limitations on the amount of historical data you can store and analyze.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className='w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='py-6 border-t border-gray-200'>
                    <div className='flex flex-wrap justify-between items-center gap-2'>
                        <div>
                            <p className='text-xs text-gray-600'>
                                © 2025 Bloodboy
                            </p>
                        </div>

                        <div className='flex items-center gap-2'>
                            <a
                                href='https://github.com/ashugaev/bloodboy-biomarkers-tracker'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-xs text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1'
                                onClick={() => {
                                    captureEvent(posthog, 'homepage_github_star_link_clicked', {
                                        location: 'footer',
                                    })
                                }}
                            >
                                <svg role='img' viewBox='0 0 24 24' fill='currentColor' className='w-3.5 h-3.5'>
                                    <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/>
                                </svg>
                                <span>Star on GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
