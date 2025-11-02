import { useEffect, useState } from 'react'

import cn from 'classnames'
import { usePostHog } from 'posthog-js/react'

import { captureEvent } from '@/utils'

import { GitHubStarsButtonProps } from './GitHubStarsButton.types'
import { formatStarsNumber } from './GitHubStarsButton.utils'

export const GitHubStarsButton = (props: GitHubStarsButtonProps) => {
    const { username, repo, formatted = false, className, onClick, ...restProps } = props
    const posthog = usePostHog()
    const [stars, setStars] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)

    const repoUrl = `https://github.com/${username}/${repo}`

    useEffect(() => {
        fetch(`https://api.github.com/repos/${username}/${repo}`)
            .then((response) => response.json())
            .then((data: { stargazers_count?: number }) => {
                if (data && typeof data.stargazers_count === 'number') {
                    setStars(data.stargazers_count)
                }
            })
            .catch(console.error)
            .finally(() => { setIsLoading(false) })
    }, [username, repo])

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        captureEvent(posthog, 'github_stars_button_clicked', {
            username,
            repo,
            stars,
        })
        if (onClick) {
            onClick(e)
        }
        if (!e.defaultPrevented) {
            window.open(repoUrl, '_blank')
        }
    }

    return (
        <a
            href={repoUrl}
            rel='noopener noreferrer'
            target='_blank'
            onClick={handleClick}
            className={cn(
                'inline-flex items-center gap-2 rounded border border-gray-200 py-3 px-4',
                'font-medium text-gray-700 shadow-sm transition-all',
                'hover:bg-gray-50 hover:text-gray-900 hover:scale-105',
                'active:scale-95',
                className,
            )}
            {...restProps}
        >
            <svg role='img' viewBox='0 0 24 24' fill='currentColor' className='w-5 h-5'>
                <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/>
            </svg>
            <span>Star</span>
            <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4 text-yellow-500'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/>
            </svg>
            {!isLoading && stars > 0 && (
                <>

                    <span className='font-semibold'>{formatStarsNumber(stars, formatted)}</span>
                </>
            )}
        </a>
    )
}
