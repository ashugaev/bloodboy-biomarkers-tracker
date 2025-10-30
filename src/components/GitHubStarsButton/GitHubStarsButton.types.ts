import { HTMLProps } from 'react'

export interface GitHubStarsButtonProps extends Omit<HTMLProps<HTMLAnchorElement>, 'ref'> {
    username: string
    repo: string
    formatted?: boolean
    className?: string
}
