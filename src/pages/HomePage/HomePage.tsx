import { useState } from 'react'

import { Tooltip } from 'antd'
import { Link } from 'react-router-dom'

import { HomePageProps } from './HomePage.types'

export const HomePage = (props: HomePageProps) => {
    const { className } = props
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [openFaq, setOpenFaq] = useState<string | null>('1')

    return (
        <div className={className}>
            <header className='sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full text-sm'>
                <nav className='mt-4 relative max-w-2xl w-full bg-white border border-gray-200 rounded-[24px] mx-2 flex flex-wrap md:flex-nowrap items-center justify-between p-1 ps-4 md:py-0 sm:mx-auto'>
                    <div className='flex items-center'>
                        <Link className='flex items-center gap-2 rounded-md focus:outline-none focus:opacity-80' to='/' aria-label='Blood Test Tracker'>
                            <img src='/favicon.svg' alt='Blood Test Tracker' className='w-4 h-4'/>
                            <span className='text-xl font-semibold text-gray-800'>Tracker</span>
                        </Link>
                    </div>

                    <div className='flex items-center gap-1 md:order-4 md:ms-4'>
                        <Link to='/data' className='w-full sm:w-auto whitespace-nowrap py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700'>
                            Get Started
                        </Link>

                        <div className='md:hidden'>
                            <button type='button' onClick={() => { setIsMenuOpen(!isMenuOpen) }} className='flex justify-center items-center size-9.5 border border-gray-200 text-gray-500 rounded-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200' aria-label='Toggle navigation'>
                                {!isMenuOpen ? (
                                    <svg className='shrink-0 size-3.5' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <line x1='3' x2='21' y1='6' y2='6'/>
                                        <line x1='3' x2='21' y1='12' y2='12'/>
                                        <line x1='3' x2='21' y1='18' y2='18'/>
                                    </svg>
                                ) : (
                                    <svg className='shrink-0 size-4' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M18 6 6 18'/>
                                        <path d='m6 6 12 12'/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={`${isMenuOpen ? 'block' : 'hidden'} overflow-hidden transition-all duration-300 basis-full grow md:block`}>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3 mt-3 md:mt-0 py-2 md:py-0 md:ps-7'>
                            <a className='py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-gray-800 font-medium text-gray-800 hover:text-gray-800 focus:outline-none' href='#' aria-current='page'>
                                Home
                            </a>
                            <a className='py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none' href='#features'>
                                Features
                            </a>
                            <a className='py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none' href='#pricing'>
                                Pricing
                            </a>
                            <a className='py-0.5 md:py-3 px-4 md:px-1 border-s-2 md:border-s-0 md:border-b-2 border-transparent text-gray-500 hover:text-gray-800 focus:outline-none' href='#faq'>
                                FAQ
                            </a>
                        </div>
                    </div>
                </nav>
            </header>

            <section className='bg-white lg:grid lg:min-h-screen lg:place-content-center'>
                <div className='mx-auto w-screen max-w-screen-xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32'>
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
                                className='inline-block rounded border border-indigo-600 bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700'
                                to='/data'
                            >
                                Get Started
                            </Link>

                            <a
                                className='inline-block rounded border border-gray-200 px-5 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900'
                                href='#'
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section id='features' className='bg-white py-10 sm:py-14'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto'>
                    <div className='max-w-2xl mx-auto text-center mb-10 lg:mb-14'>
                        <h2 className='text-2xl font-bold md:text-4xl md:leading-tight'>Features</h2>
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
                                            Upload your blood test PDFs and automatically extract biomarker data with our intelligent parser.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <line x1='12' y1='1' x2='12' y2='23'/>
                                        <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Track Changes
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Monitor how your biomarkers change over time with visual charts and historical comparisons.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Health Insights
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Get instant insights into your health metrics and understand what your test results mean.
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
                                            Secure Storage
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Your health data is stored securely in your browser. No cloud uploads, complete privacy.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <circle cx='12' cy='12' r='10'/>
                                        <polyline points='12 6 12 12 16 14'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Historical Data
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            Keep all your blood test results in one place and easily compare them across different time periods.
                                        </p>
                                    </div>
                                </div>

                                <div className='flex gap-x-5 sm:gap-x-8'>
                                    <svg className='shrink-0 mt-2 size-8 text-gray-800' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/>
                                    </svg>
                                    <div className='grow'>
                                        <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                                            Free to Use
                                        </h3>
                                        <p className='mt-1 text-gray-600'>
                                            All features are completely free. No subscriptions, no hidden costs, just your health data at your fingertips.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className='bg-gray-50 py-16'>
                <div className='container mx-auto px-4'>
                    <h2 className='text-3xl font-bold text-center text-gray-900 mb-12'>
                        What Our Users Say
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex space-x-4'>
                                    <div>
                                        <img
                                            src='https://source.unsplash.com/100x100/?portrait,1'
                                            alt=''
                                            className='object-cover w-12 h-12 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Sarah Johnson</h4>
                                        <span className='text-xs text-gray-600'>2 days ago</span>
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
                                <p>This app has completely changed how I track my health. Easy to upload results and the insights are incredibly helpful.</p>
                            </div>
                        </div>

                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex space-x-4'>
                                    <div>
                                        <img
                                            src='https://source.unsplash.com/100x100/?portrait,2'
                                            alt=''
                                            className='object-cover w-12 h-12 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Michael Chen</h4>
                                        <span className='text-xs text-gray-600'>5 days ago</span>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 text-yellow-500'>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' className='w-5 h-5 fill-current'>
                                        <path d='M494,198.671a40.536,40.536,0,0,0-32.174-27.592L345.917,152.242,292.185,47.828a40.7,40.7,0,0,0-72.37,0L166.083,152.242,50.176,171.079a40.7,40.7,0,0,0-22.364,68.827l82.7,83.368-17.9,116.055a40.672,40.672,0,0,0,58.548,42.538L256,428.977l104.843,52.89a40.69,40.69,0,0,0,58.548-42.538l-17.9-116.055,82.7-83.368A40.538,40.538,0,0,0,494,198.671Zm-32.53,18.7L367.4,312.2l20.364,132.01a8.671,8.671,0,0,1-12.509,9.088L256,393.136,136.744,453.3a8.671,8.671,0,0,1-12.509-9.088L144.6,312.2,50.531,217.37a8.7,8.7,0,0,1,4.778-14.706L187.15,181.238,248.269,62.471a8.694,8.694,0,0,1,15.462,0L324.85,181.238l131.841,21.426A8.7,8.7,0,0,1,461.469,217.37Z'/>
                                    </svg>
                                    <span className='text-xl font-bold'>4.8</span>
                                </div>
                            </div>
                            <div className='p-4 space-y-2 text-sm text-gray-600'>
                                <p>Great tool for monitoring my biomarkers over time. The PDF upload feature works flawlessly and saves me so much time.</p>
                            </div>
                        </div>

                        <div className='flex flex-col w-full p-6 divide-y rounded-md bg-white border border-gray-200'>
                            <div className='flex justify-between p-4'>
                                <div className='flex space-x-4'>
                                    <div>
                                        <img
                                            src='https://source.unsplash.com/100x100/?portrait,3'
                                            alt=''
                                            className='object-cover w-12 h-12 rounded-full bg-gray-500'
                                        />
                                    </div>
                                    <div>
                                        <h4 className='font-bold'>Emma Wilson</h4>
                                        <span className='text-xs text-gray-600'>1 week ago</span>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 text-yellow-500'>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' className='w-5 h-5 fill-current'>
                                        <path d='M494,198.671a40.536,40.536,0,0,0-32.174-27.592L345.917,152.242,292.185,47.828a40.7,40.7,0,0,0-72.37,0L166.083,152.242,50.176,171.079a40.7,40.7,0,0,0-22.364,68.827l82.7,83.368-17.9,116.055a40.672,40.672,0,0,0,58.548,42.538L256,428.977l104.843,52.89a40.69,40.69,0,0,0,58.548-42.538l-17.9-116.055,82.7-83.368A40.538,40.538,0,0,0,494,198.671Zm-32.53,18.7L367.4,312.2l20.364,132.01a8.671,8.671,0,0,1-12.509,9.088L256,393.136,136.744,453.3a8.671,8.671,0,0,1-12.509-9.088L144.6,312.2,50.531,217.37a8.7,8.7,0,0,1,4.778-14.706L187.15,181.238,248.269,62.471a8.694,8.694,0,0,1,15.462,0L324.85,181.238l131.841,21.426A8.7,8.7,0,0,1,461.469,217.37Z'/>
                                    </svg>
                                    <span className='text-xl font-bold'>4.9</span>
                                </div>
                            </div>
                            <div className='p-4 space-y-2 text-sm text-gray-600'>
                                <p>Finally, a simple way to keep track of all my blood work. The interface is intuitive and the data visualization is excellent.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id='pricing' className='bg-gray-50 py-10 sm:py-14'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 lg:py-14 mx-auto'>
                    <div className='max-w-2xl mx-auto text-center mb-10 lg:mb-14'>
                        <h2 className='text-2xl font-bold md:text-4xl md:leading-tight'>Pricing</h2>
                        <p className='mt-1 text-gray-600'>All features are completely free, forever.</p>
                    </div>

                    <div className='flex justify-center'>
                        <div className='flex flex-col border border-gray-200 text-center rounded-xl p-8 bg-white max-w-sm w-full'>
                            <h4 className='font-medium text-lg text-gray-800'>Free</h4>
                            <span className='mt-7 font-bold text-5xl text-gray-800'>Free</span>
                            <p className='mt-2 text-sm text-gray-500'>Forever free</p>

                            <ul className='mt-7 space-y-2.5 text-sm'>
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

                            <Link to='/data' className='mt-5 py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700'>
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section id='faq' className='bg-white py-10 sm:py-14'>
                <div className='max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto'>
                    <div className='grid md:grid-cols-5 gap-10'>
                        <div className='md:col-span-2'>
                            <div className='max-w-xs'>
                                <h2 className='text-2xl font-bold md:text-4xl md:leading-tight'>
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
                                        onClick={() => { setOpenFaq(openFaq === '1' ? null : '1') }}
                                    >
                                        Is my health data secure?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '1' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '1' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Yes, absolutely. All your health data is stored locally in your browser using IndexedDB. We never upload your data to any cloud servers, ensuring complete privacy and security.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => { setOpenFaq(openFaq === '2' ? null : '2') }}
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
                                        onClick={() => { setOpenFaq(openFaq === '3' ? null : '3') }}
                                    >
                                        Is this service free?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '3' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '3' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Yes, Blood Test Tracker is completely free to use. There are no subscriptions, no hidden costs, and no premium tiers. All features are available to everyone.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => { setOpenFaq(openFaq === '4' ? null : '4') }}
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
                                        onClick={() => { setOpenFaq(openFaq === '5' ? null : '5') }}
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

                                <div className='pt-6 pb-3'>
                                    <button
                                        className='group pb-3 inline-flex items-center justify-between gap-x-3 w-full md:text-lg font-semibold text-start text-gray-800 rounded-lg transition hover:text-gray-500 focus:outline-none focus:text-gray-500'
                                        onClick={() => { setOpenFaq(openFaq === '6' ? null : '6') }}
                                    >
                                        What browsers are supported?
                                        <svg className={`shrink-0 size-5 text-gray-600 ${openFaq === '6' ? 'rotate-180' : ''} transition-transform`} xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='m6 9 6 6 6-6'/>
                                        </svg>
                                    </button>
                                    {openFaq === '6' && (
                                        <div className='w-full overflow-hidden transition-all duration-300'>
                                            <p className='text-gray-600'>
                                                Blood Test Tracker works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.
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
                                © 2025 Blood Test Tracker
                            </p>
                        </div>

                        <ul className='flex flex-wrap items-center'>
                            <li className='inline-block relative pe-4 text-xs last:pe-0 last-of-type:before:hidden before:absolute before:top-1/2 before:end-1.5 before:-translate-y-1/2 before:size-[3px] before:rounded-full before:bg-gray-400'>
                                <a className='text-xs text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none focus:decoration-2' href='#'>
                                    Privacy
                                </a>
                            </li>
                            <li className='inline-block relative pe-4 text-xs last:pe-0 last-of-type:before:hidden before:absolute before:top-1/2 before:end-1.5 before:-translate-y-1/2 before:size-[3px] before:rounded-full before:bg-gray-400'>
                                <a className='text-xs text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none focus:decoration-2' href='#'>
                                    Terms
                                </a>
                            </li>
                            <li className='inline-block pe-4 text-xs'>
                                <a className='text-xs text-gray-500 underline hover:text-gray-800 hover:decoration-2 focus:outline-none focus:decoration-2' href='https://github.com' target='_blank' rel='noopener noreferrer'>
                                    Github
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    )
}
