import { useCallback, useEffect, useState } from 'react'

import {
    CheckOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    PlusOutlined,
    SettingOutlined,
    SwapOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Input, MenuProps, Modal, Tag, message } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { COLORS, DEFAULT_PROFILE_ID, PROFILES_CHANGED_EVENT } from '@/constants'
import {
    createProfile,
    deleteProfile,
    downloadProfileBackup,
    getLoadedProfile,
    readProfileRegistry,
    recoverOrphanProfiles,
    renameProfile,
    switchProfile,
    validateProfileName,
} from '@/profiles'
import { captureEvent, captureException } from '@/utils'

import { ProfileSwitcherProps } from './ProfileSwitcher.types'

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)))

export const ProfileSwitcher = (props: ProfileSwitcherProps) => {
    const { className } = props
    const posthog = usePostHog()
    const [registry, setRegistry] = useState(readProfileRegistry)
    const [loadedProfile, setLoadedProfile] = useState(getLoadedProfile)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [newProfileName, setNewProfileName] = useState('')
    const [copySettings, setCopySettings] = useState(true)
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null)
    const [isBackupDownloaded, setIsBackupDownloaded] = useState(false)
    const [busyProfileId, setBusyProfileId] = useState<string | null>(null)

    const newProfileNameError = newProfileName ? validateProfileName(newProfileName) : null
    const editingNameError = editingProfileId ? validateProfileName(editingName, editingProfileId) : null

    const refresh = useCallback(() => {
        setRegistry(readProfileRegistry())
        setLoadedProfile(getLoadedProfile())
    }, [])

    useEffect(() => {
        recoverOrphanProfiles()
            .then((recovered) => {
                if (recovered) refresh()
            })
            .catch((error) => {
                console.error('Failed to recover profiles:', error)
            })

        window.addEventListener('storage', refresh)
        window.addEventListener(PROFILES_CHANGED_EVENT, refresh)
        return () => {
            window.removeEventListener('storage', refresh)
            window.removeEventListener(PROFILES_CHANGED_EVENT, refresh)
        }
    }, [refresh])

    const handleSwitch = (profileId: string) => {
        try {
            switchProfile(profileId)
            captureEvent(posthog, 'profile_switched', {
                isMainProfile: profileId === DEFAULT_PROFILE_ID,
                profilesCount: registry.profiles.length,
            })
        } catch (error) {
            void message.error('This profile no longer exists')
            captureException(posthog, toError(error), { action: 'profile_switch' })
            refresh()
        }
    }

    const handleCreate = async () => {
        if (!newProfileName.trim() || newProfileNameError) return

        try {
            const profile = await createProfile(newProfileName, copySettings)
            captureEvent(posthog, 'profile_created', {
                copySettings,
                profilesCount: registry.profiles.length + 1,
            })
            switchProfile(profile.id)
        } catch (error) {
            void message.error(toError(error).message)
            captureException(posthog, toError(error), { action: 'profile_create' })
        }
    }

    const handleRenameStart = (profileId: string, name: string) => {
        setEditingProfileId(profileId)
        setEditingName(name)
        captureEvent(posthog, 'profile_rename_started')
    }

    const handleRenameCancel = () => {
        setEditingProfileId(null)
        captureEvent(posthog, 'profile_rename_cancelled')
    }

    const handleRename = (profileId: string) => {
        if (editingNameError) return

        try {
            renameProfile(profileId, editingName)
            captureEvent(posthog, 'profile_renamed')
            setEditingProfileId(null)
            refresh()
        } catch (error) {
            void message.error(toError(error).message)
            captureException(posthog, toError(error), { action: 'profile_rename' })
        }
    }

    const handleDeleteStart = (profileId: string) => {
        setDeletingProfileId(profileId)
        setIsBackupDownloaded(false)
        captureEvent(posthog, 'profile_delete_started')
    }

    const handleDeleteCancel = () => {
        setDeletingProfileId(null)
        captureEvent(posthog, 'profile_delete_cancelled')
    }

    const handleBackupDownload = async (profileId: string) => {
        setBusyProfileId(profileId)
        try {
            await downloadProfileBackup(profileId)
            setIsBackupDownloaded(true)
            captureEvent(posthog, 'profile_backup_downloaded')
        } catch (error) {
            void message.error('Failed to download profile backup')
            captureException(posthog, toError(error), { action: 'profile_backup_download' })
        } finally {
            setBusyProfileId(null)
        }
    }

    const handleDelete = async (profileId: string) => {
        setBusyProfileId(profileId)
        try {
            await deleteProfile(profileId)
            captureEvent(posthog, 'profile_deleted', {
                profilesCount: registry.profiles.length - 1,
            })
            void message.success('Profile deleted')
            setDeletingProfileId(null)
            refresh()
        } catch (error) {
            void message.error(toError(error).message)
            captureException(posthog, toError(error), { action: 'profile_delete' })
        } finally {
            setBusyProfileId(null)
        }
    }

    const handleModalClose = () => {
        setIsModalVisible(false)
        setDeletingProfileId(null)
        setEditingProfileId(null)
        captureEvent(posthog, 'profiles_modal_closed')
    }

    const items: MenuProps['items'] = [
        ...registry.profiles.map(profile => ({
            key: profile.id,
            label: profile.name,
            icon: profile.id === loadedProfile.id ? <CheckOutlined/> : <UserOutlined/>,
            onClick: () => {
                if (profile.id !== loadedProfile.id) handleSwitch(profile.id)
            },
        })),
        {
            type: 'divider',
        },
        {
            key: 'manage',
            label: 'Manage profiles',
            icon: <SettingOutlined/>,
            onClick: () => {
                captureEvent(posthog, 'profiles_modal_opened')
                refresh()
                setIsModalVisible(true)
            },
        },
    ]

    return (
        <>
            <Dropdown menu={{ items }} trigger={['click']}>
                <Button
                    size='small'
                    icon={<UserOutlined/>}
                    className={className}
                    aria-label='Profile'
                >
                    <span className='max-w-[140px] truncate'>{loadedProfile.name}</span>
                </Button>
            </Dropdown>
            <Modal
                title='Profiles'
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
            >
                <p className='mb-3'>Each profile keeps its own data, settings and backups.</p>
                <div className='flex flex-col gap-2 mb-4'>
                    {registry.profiles.map(profile => {
                        const isLoaded = profile.id === loadedProfile.id
                        const isEditing = editingProfileId === profile.id
                        const isDeleting = deletingProfileId === profile.id
                        const isBusy = busyProfileId === profile.id

                        return (
                            <div key={profile.id} className='flex flex-col gap-1'>
                                <div className='flex items-center justify-between gap-2'>
                                    {isEditing ? (
                                        <Input
                                            size='small'
                                            value={editingName}
                                            autoFocus
                                            maxLength={60}
                                            status={editingNameError ? 'error' : undefined}
                                            onChange={(event) => { setEditingName(event.target.value) }}
                                            onPressEnter={() => { handleRename(profile.id) }}
                                        />
                                    ) : (
                                        <span className='truncate'>
                                            {profile.name}
                                            {isLoaded && <Tag className='ml-2'>current</Tag>}
                                        </span>
                                    )}
                                    <div className='flex shrink-0 gap-1'>
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size='small'
                                                    type='primary'
                                                    disabled={!!editingNameError}
                                                    onClick={() => { handleRename(profile.id) }}
                                                >
                                                    Save
                                                </Button>
                                                <Button size='small' onClick={handleRenameCancel}>
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {!isLoaded && (
                                                    <Button size='small' icon={<SwapOutlined/>} onClick={() => { handleSwitch(profile.id) }}>
                                                        Switch
                                                    </Button>
                                                )}
                                                <Button
                                                    size='small'
                                                    icon={<EditOutlined/>}
                                                    aria-label={`Rename ${profile.name}`}
                                                    onClick={() => { handleRenameStart(profile.id, profile.name) }}
                                                />
                                                {!isLoaded && profile.id !== DEFAULT_PROFILE_ID && (
                                                    <Button
                                                        size='small'
                                                        danger
                                                        icon={<DeleteOutlined/>}
                                                        aria-label={`Delete ${profile.name}`}
                                                        disabled={isDeleting}
                                                        onClick={() => { handleDeleteStart(profile.id) }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {isEditing && editingNameError && (
                                    <span className='text-xs' style={{ color: COLORS.ERROR }}>{editingNameError}</span>
                                )}
                                {isDeleting && (
                                    <div className='flex flex-wrap items-center gap-2 rounded border p-2' style={{ borderColor: COLORS.ERROR }}>
                                        <span className='text-sm'>
                                            {isBackupDownloaded
                                                ? 'Make sure the backup file is saved, then delete.'
                                                : 'Download a backup of this profile first.'}
                                        </span>
                                        <Button
                                            size='small'
                                            icon={<DownloadOutlined/>}
                                            loading={isBusy && !isBackupDownloaded}
                                            onClick={() => { void handleBackupDownload(profile.id) }}
                                        >
                                            {isBackupDownloaded ? 'Download again' : 'Download backup'}
                                        </Button>
                                        <Button
                                            size='small'
                                            danger
                                            type='primary'
                                            disabled={!isBackupDownloaded}
                                            loading={isBusy && isBackupDownloaded}
                                            onClick={() => { void handleDelete(profile.id) }}
                                        >
                                            Backup saved, delete
                                        </Button>
                                        <Button size='small' onClick={handleDeleteCancel}>
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className='flex flex-col gap-2'>
                    <Input
                        placeholder='New profile name'
                        value={newProfileName}
                        maxLength={60}
                        status={newProfileNameError ? 'error' : undefined}
                        onChange={(event) => { setNewProfileName(event.target.value) }}
                        onPressEnter={() => { void handleCreate() }}
                    />
                    {newProfileNameError && (
                        <span className='text-xs' style={{ color: COLORS.ERROR }}>{newProfileNameError}</span>
                    )}
                    <Checkbox
                        checked={copySettings}
                        onChange={(event) => { setCopySettings(event.target.checked) }}
                    >
                        Copy OpenAI API key
                    </Checkbox>
                    <Button
                        type='primary'
                        icon={<PlusOutlined/>}
                        disabled={!newProfileName.trim() || !!newProfileNameError}
                        onClick={() => { void handleCreate() }}
                    >
                        Create and switch
                    </Button>
                </div>
            </Modal>
        </>
    )
}
