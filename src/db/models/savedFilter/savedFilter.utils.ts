import { TagColor } from './savedFilter.types'

const TAG_COLORS: TagColor[] = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple']

export const getRandomTagColor = (): TagColor => {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}
