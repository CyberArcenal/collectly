# Changelog

## [8.0.0] - 2026-08-05

### Added
- Full sync system: All entities synced in a single atomic request
- Sync snapshots: Local tracking of entity states with change detection
- Per-user sync metadata: Server tracks sync state per user
- Task-based progress: Real-time progress polling via task IDs
- Change indicators: UI shows "X new" badges for entities with local changes
- `SyncSnapshotService`: New service for managing local sync state
- `docs/SYNC.md`: Comprehensive sync documentation

### Changed
- Simplified sync architecture: Removed per-entity sync, conflicts, queue
- Updated `SyncService`: Only handles full sync operations
- Updated UI components: Removed conflicts, queue, and per-entity sync actions
- Simplified context: Removed `conflicts`, `queueItems`, `activeTasks` state
- Updated API client: Removed 15+ deprecated methods
- Database migration: Dropped `sync_metadata`, `sync_conflicts`, `sync_queue`; added `sync_snapshots`

### Removed
- SyncMetadata entity and service (replaced by UserSyncMetadata on server + SyncSnapshot on client)
- SyncConflict entity and service (no longer needed)
- SyncQueue entity and service (no longer needed)
- Per-entity sync endpoints and IPC handlers
- Conflict resolution UI and logic
- Queue management UI and logic
- `SyncStateStore.ts` (local storage state, replaced by SyncSnapshot)
- Duplicate `SyncContext.tsx` in `pages/sync/hooks/`

### Fixed
- Concurrent sync prevention
- Transaction atomicity for full sync
- Change detection via hash comparison

### Security
- User isolation: Sync metadata is per-user, not global