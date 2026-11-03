import { useCallback, useEffect, useState } from 'react'

import {
    CheckOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    SettingOutlined,
    SwapOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Input, MenuProps, Modal, Popconfirm, Tag, message } from 'antd'
import { usePostHog } from 'posthog-js/react'

import { DEFAULT_PROFILE_ID } from '@/constants'
import {
    createProfile,
    deleteProfile,
    getLoadedProfile,
    readProfileRegistry,
    recoverOrphanProfiles,
    renameProfile,
    switchProfile,
} from '@/profiles'
import { captureEvent } from '@/utils'

import { ProfileSwitcherProps } from './ProfileSwitcher.types'

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
        return () => {
            window.removeEventListener('storage', refresh)
        }
    }, [refresh])

    const handleSwitch = (profileId: string) => {
        captureEvent(posthog, 'profile_switched', {
            isMainProfile: profileId === DEFAULT_PROFILE_ID,
            profilesCount: registry.profiles.length,
        })
        switchProfile(profileId)
    }

    const handleCreate = async () => {
        const name = newProfileName.trim()
        if (!name) return

        const profile = await createProfile(name, copySettings)
        captureEvent(posthog, 'profile_created', {
            copySettings,
            profilesCount: registry.profiles.length + 1,
        })
        switchProfile(profile.id)
    }

    const handleRename = (profileId: string) => {
        const name = editingName.trim()
        if (!name) return

        renameProfile(profileId, name)
        captureEvent(posthog, 'profile_renamed')
        setEditingProfileId(null)
        refresh()
    }

    const handleDelete = async (profileId: string) => {
        setDeletingProfileId(profileId)
        try {
            await deleteProfile(profileId)
            captureEvent(posthog, 'profile_deleted', {
                profilesCount: registry.profiles.length - 1,
            })
            void message.success('Profile deleted. Its backup was downloaded.')
            refresh()
        } catch (error) {
            console.error('Failed to delete profile:', error)
            void message.error(error instanceof Error ? error.message : 'Failed to delete profile')
        } finally {
            setDeletingProfileId(null)
        }
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
                onCancel={() => { setIsModalVisible(false) }}
                footer={null}
            >
                <p className='mb-3'>Each profile keeps its own data, settings, exports and Google Drive backups.</p>
                <div className='flex flex-col gap-2 mb-4'>
                    {registry.profiles.map(profile => {
                        const isLoaded = profile.id === loadedProfile.id
                        const isEditing = editingProfileId === profile.id

                        return (
                            <div key={profile.id} className='flex items-center justify-between gap-2'>
                                {isEditing ? (
                                    <Input
                                        size='small'
                                        value={editingName}
                                        autoFocus
                                        maxLength={60}
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
                                            <Button size='small' type='primary' onClick={() => { handleRename(profile.id) }}>
                                                Save
                                            </Button>
                                            <Button size='small' onClick={() => { setEditingProfileId(null) }}>
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
                                                onClick={() => {
                                                    setEditingProfileId(profile.id)
                                                    setEditingName(profile.name)
                                                }}
                                            />
                                            {!isLoaded && profile.id !== DEFAULT_PROFILE_ID && (
                                                <Popconfirm
                                                    title='Delete profile?'
                                                    description='A JSON backup of this profile will be downloaded first.'
                                                    okText='Download backup and delete'
                                                    okButtonProps={{ danger: true }}
                                                    onConfirm={() => { void handleDelete(profile.id) }}
                                                >
                                                    <Button
                                                        size='small'
                                                        danger
                                                        icon={<DeleteOutlined/>}
                                                        aria-label={`Delete ${profile.name}`}
                                                        loading={deletingProfileId === profile.id}
                                                    />
                                                </Popconfirm>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className='flex flex-col gap-2'>
                    <Input
                        placeholder='New profile name'
                        value={newProfileName}
                        maxLength={60}
                        onChange={(event) => { setNewProfileName(event.target.value) }}
                        onPressEnter={() => { void handleCreate() }}
                    />
                    <Checkbox
                        checked={copySettings}
                        onChange={(event) => { setCopySettings(event.target.checked) }}
                    >
                        Copy OpenAI API key and Google Drive sync setting
                    </Checkbox>
                    <Button
                        type='primary'
                        icon={<PlusOutlined/>}
                        disabled={!newProfileName.trim()}
                        onClick={() => { void handleCreate() }}
                    >
                        Create and switch
                    </Button>
                </div>
            </Modal>
        </>
    )
}
