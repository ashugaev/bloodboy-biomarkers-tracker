export interface Profile {
    id: string
    name: string
    createdAt: string
}

export interface ProfileRegistry {
    activeProfileId: string
    profiles: Profile[]
}

export interface ProfileSeed {
    profileId: string
    openaiApiKey?: string
    googleDriveEnabled?: boolean
}
