import { describe, expect, it } from 'vitest'

import { GoogleDriveSyncState } from './googleDriveBackup.types'
import { getGoogleDriveSyncPlan } from './googleDriveSync.utils'

const synced: GoogleDriveSyncState = {
    localFingerprint: 'local-a',
    localVersionAt: new Date('2026-03-01T00:00:00Z'),
    remoteVersion: '2026-03-01T00:00:05.000Z',
    remoteVersionAt: new Date('2026-03-01T00:00:00Z'),
    syncedLocalFingerprint: 'local-a',
    syncedRemoteVersion: '2026-03-01T00:00:05.000Z',
    lastBackupAt: new Date('2026-03-01T00:00:00Z'),
}

describe('getGoogleDriveSyncPlan', () => {
    it('downloads Drive data into a fresh browser', () => {
        expect(getGoogleDriveSyncPlan({
            localFingerprint: null,
            localVersionAt: null,
            remoteVersion: '2026-03-01T00:00:05.000Z',
            remoteVersionAt: new Date('2026-03-01T00:00:00Z'),
        })).toBe('download')
    })

    it('uploads the first backup when Drive is empty', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            remoteVersion: null,
            remoteVersionAt: null,
            syncedLocalFingerprint: undefined,
            syncedRemoteVersion: undefined,
            lastBackupAt: undefined,
        })).toBe('upload')
    })

    it('does nothing for an empty browser with nothing on Drive', () => {
        expect(getGoogleDriveSyncPlan({
            localFingerprint: null,
            localVersionAt: null,
            remoteVersion: null,
            remoteVersionAt: null,
        })).toBe('none')
    })

    it('keeps the state when nothing changed', () => {
        expect(getGoogleDriveSyncPlan(synced)).toBe('in-sync')
    })

    it('uploads local changes', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            localFingerprint: 'local-b',
        })).toBe('upload')
    })

    it('uploads deletions that do not move the latest timestamp', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            localFingerprint: 'local-a-minus-one-record',
            localVersionAt: new Date('2026-02-01T00:00:00Z'),
        })).toBe('upload')
    })

    it('downloads changes made on another device', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            remoteVersion: '2026-03-05T00:00:00.000Z',
            remoteVersionAt: new Date('2026-03-05T00:00:00Z'),
        })).toBe('download')
    })

    it('downloads another device change even when this device clock is ahead', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            localVersionAt: new Date('2027-01-01T00:00:00Z'),
            remoteVersion: '2026-03-05T00:00:00.000Z',
            remoteVersionAt: new Date('2026-03-05T00:00:00Z'),
        })).toBe('download')
    })

    it('reports a conflict when both sides changed since the last sync', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            localFingerprint: 'local-b',
            remoteVersion: '2026-03-05T00:00:00.000Z',
            remoteVersionAt: new Date('2026-03-05T00:00:00Z'),
        })).toBe('conflict')
    })

    it('reports a conflict when a browser with its own data connects to a used Drive', () => {
        expect(getGoogleDriveSyncPlan({
            localFingerprint: 'local-b',
            localVersionAt: new Date('2026-04-01T00:00:00Z'),
            remoteVersion: '2026-03-05T00:00:00.000Z',
            remoteVersionAt: new Date('2026-03-05T00:00:00Z'),
            remoteFingerprint: 'remote-a',
        })).toBe('conflict')
    })

    it('treats identical data on both sides as synced', () => {
        expect(getGoogleDriveSyncPlan({
            localFingerprint: 'same',
            localVersionAt: new Date('2026-04-01T00:00:00Z'),
            remoteVersion: '2026-03-05T00:00:00.000Z',
            remoteVersionAt: new Date('2026-03-05T00:00:00Z'),
            remoteFingerprint: 'same',
        })).toBe('in-sync')
    })

    it('does not refill a cleared profile or upload an empty one', () => {
        expect(getGoogleDriveSyncPlan({
            ...synced,
            localFingerprint: null,
            localVersionAt: null,
        })).toBe('none')
    })

    it('keeps the timestamp rules for settings saved by older versions', () => {
        const legacy = {
            localFingerprint: 'local-a',
            localVersionAt: new Date('2026-03-01T00:00:00Z'),
            remoteVersion: '2026-03-01T00:00:05.000Z',
            remoteVersionAt: new Date('2026-03-01T00:00:00Z'),
            lastBackupAt: new Date('2026-03-01T00:00:00Z'),
        }

        expect(getGoogleDriveSyncPlan(legacy)).toBe('in-sync')
        expect(getGoogleDriveSyncPlan({
            ...legacy,
            localVersionAt: new Date('2026-03-02T00:00:00Z'),
        })).toBe('upload')
        expect(getGoogleDriveSyncPlan({
            ...legacy,
            remoteVersionAt: new Date('2026-03-02T00:00:00Z'),
        })).toBe('download')
    })
})
