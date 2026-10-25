# Security Specification - WorshipFlow Cloud

## Data Invariants
1. A **User Profile** must correspond to the authenticated user's UID and have a valid role.
2. A **Workspace** can only be created by an authenticated user, who is automatically assigned as the `createdById`.
3. **Songs**, **Setlists**, and other sub-resources belong to a Workspace. Access is restricted to members of that Workspace.
4. **Roles** (head-leader, leader, editor, viewer) determine the level of access within a Workspace.
5. **Passcodes** are required to find and request to join a Workspace.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a workspace with a different `createdById`.
2. **Role Escalation**: A `viewer` attempting to update a song.
3. **Cross-Tenant Access**: User in Workspace A attempting to read songs from Workspace B.
4. **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile update.
5. **ID Poisoning**: Creating a workspace with a 10KB string as the ID.
6. **Passcode Brute Force**: Listing all workspaces to see their passcodes.
7. **Unverified Access**: Attempting to write data with an unverified email (if restricted).
8. **Orphaned Song**: Creating a song in a workspace that doesn't exist.
9. **Immutable Violation**: Attempting to change the `createdAt` timestamp of a song.
10. **PII Leak**: A non-admin user listing all user emails in the system.
11. **Malicious Payload**: Sending a 1MB string for a song title.
12. **System Field Tampering**: User attempting to modify `updatedAt` to a past date (must be server timestamp).

## Rule Implementation Plan
- Implement `isValidId` for all path variables.
- Implement `isValid[Entity]` for all writes with strict key and size checks.
- Use `get()` to verify workspace membership for sub-collection access.
- Prevent blanket reads by requiring filters on `list` operations where applicable.
- Enforce immutability for `createdAt` and `id` fields.
- Use server timestamps for `updatedAt` validation.
