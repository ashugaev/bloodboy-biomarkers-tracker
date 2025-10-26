import { useEffect } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'

import { createModelHooks } from '@/db/hooks/modelHooks.utils'
import { setCurrentUserId, db } from '@/db/services/db.service'

import { User } from './user.types'

export const {
    useItems: useUsers,
    useItem: useUserById,
    addItem: addUser,
    updateItem: updateUser,
    removeItem: deleteUser,
} = createModelHooks(db.users)

const getOrCreateUser = async (): Promise<User> => {
    const users = await db.users.toArray()
    if (users.length > 0) {
        return users[0]
    }

    const newUser: User = {
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    await db.users.add(newUser)
    return newUser
}

export const getCurrentUserId = async (): Promise<string> => {
    const user = await getOrCreateUser()
    return user.id
}

export const useCurrentUser = () => {
    const user = useLiveQuery(async () => getOrCreateUser())

    useEffect(() => {
        if (user?.id) {
            setCurrentUserId(user.id)
        }
    }, [user?.id])

    return user
}
