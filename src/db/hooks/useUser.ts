import { useEffect } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'

import { db, setCurrentUserId } from '../services/db.service'
import { User } from '../types'

export const useCurrentUser = () => {
    const user = useLiveQuery(
        async () => {
            const users = await db.users.toArray()
            return users[0] ?? null
        },
        [],
    )

    useEffect(() => {
        if (user?.id) {
            setCurrentUserId(user.id)
        }
    }, [user?.id])

    return {
        user,
        loading: user === undefined,
    }
}

export const ensureUser = async (): Promise<User> => {
    const existingUsers = await db.users.toArray()

    if (existingUsers.length > 0) {
        return existingUsers[0]
    }

    const now = new Date()
    const newUser: User = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    }

    await db.users.add(newUser)
    return newUser
}

export const getCurrentUserId = async (): Promise<string> => {
    const user = await ensureUser()
    return user.id
}
