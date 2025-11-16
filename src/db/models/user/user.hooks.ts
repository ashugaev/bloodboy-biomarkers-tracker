import { useEffect } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'

import { createModelHooks } from '@/db/hooks/modelHooks.utils'
// eslint-disable-next-line no-restricted-imports
import { setCurrentUserId, db, getIsImporting } from '@/db/services/db.service'

import { User } from './user.types'

export const {
    useItems: useUsers,
    useItem: useUserById,
    addItem: addUser,
    updateItem: updateUser,
    removeItem: deleteUser,
} = createModelHooks(db.users)

const getOrCreateUser = async (): Promise<User | null> => {
    if (getIsImporting()) {
        return null
    }

    return await db.transaction('rw', db.users, async () => {
        const existingUser = await db.users.limit(1).first()
        if (existingUser) {
            return existingUser
        }

        const newUser: User = {
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        await db.users.add(newUser)
        return newUser
    })
}

export const getCurrentUserId = async (): Promise<string> => {
    const user = await getOrCreateUser()
    if (!user) {
        throw new Error('Cannot get user ID during import')
    }
    return user.id
}

export const useCurrentUser = () => {
    const user = useLiveQuery(async () => {
        const users = await db.users.toArray()
        return users[0] || null
    })

    useEffect(() => {
        if (!user && !getIsImporting()) {
            getOrCreateUser().then((createdUser) => {
                if (createdUser?.id) {
                    setCurrentUserId(createdUser.id)
                }
            }).catch((error) => {
                console.error('Failed to get or create user:', error)
            })
        } else if (user?.id) {
            setCurrentUserId(user.id)
        }
    }, [user])

    return user
}
