# Kompa Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All write operations require `isSignedIn()` and `request.auth.token.email_verified == true`.
3. **PII Split Isolation**: User emails and phone numbers live exclusively in `/users/{userId}/private/{docId}` and are readable/writable strictly by `request.auth.uid == userId`. Public profiles in `/users/{userId}` never expose PII.
4. **Master Gate for Event Secrets & Group Chat**:
   - `/events/{eventId}/secrets/{secretId}` and `/events/{eventId}/messages/{messageId}` require that the parent `/events/{eventId}` exists and the caller is either the event's `organizerId` or an accepted participant in `/events/{eventId}/participants/$(request.auth.uid)` with `status == 'accepted'`.
5. **Terminal State Locking**: Once an event reaches `status == 'completed'` or `status == 'cancelled'`, further non-admin updates to the event document are blocked.
6. **Strict Temporal Integrity & Immutable Ownership**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`, and owner/organizer IDs (`ownerId`, `organizerId`, `senderId`) are immutable.
7. **Query Enforcer on `allow list`**:
   - `/users`: `resource.data.openToInvites == true`
   - `/events`: `resource.data.status == 'open' || resource.data.organizerId == request.auth.uid`
   - `/events/{eventId}/participants`: `resource.data.userId == request.auth.uid || resource.data.organizerId == request.auth.uid || resource.data.status == 'accepted'`
   - `/events/{eventId}/messages`: `resource.data.eventId == eventId` (combined with Master Gate on parent event)

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/users/{uid}`. -> `PERMISSION_DENIED`
2. **Identity Spoofing on Profile**: User `uid_A` attempting to create `/users/uid_B` or set `ownerId: 'uid_B'`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Event**: Creating `/events/ev_1` with an undeclared field `isFeatured: true`. -> `PERMISSION_DENIED`
4. **PII Cross-Read**: User `uid_B` attempting `get` on `/users/uid_A/private/info`. -> `PERMISSION_DENIED`
5. **ID Poisoning**: Creating a document with a 200-character or special-character ID failing `isValidId()`. -> `PERMISSION_DENIED`
6. **Value Poisoning on Update**: Updating `occupiedSpots` on `/events/ev_1` with a string `"100"` instead of an integer. -> `PERMISSION_DENIED`
7. **Unauthorized Event Secret Read**: Unapproved user `uid_C` attempting `get` on `/events/ev_1/secrets/main`. -> `PERMISSION_DENIED`
8. **Orphaned Subcollection Write**: Creating `/events/non_existent_ev/messages/msg_1` where parent event does not exist. -> `PERMISSION_DENIED`
9. **Client Timestamp Forgery**: Creating `/events/ev_1` with a past/future `createdAt` not equal to `request.time`. -> `PERMISSION_DENIED`
10. **Immutable Field Mutation**: Organizer attempting to change `organizerId` or `createdAt` during an `update` on `/events/ev_1`. -> `PERMISSION_DENIED`
11. **Terminal State Bypass**: Organizer attempting to update `title` on an event whose `existing().status == 'completed'`. -> `PERMISSION_DENIED`
12. **Unbounded Array / Type Injection**: Creating `/users/{uid}` with `interests` containing 25 items (exceeding max 10) or non-string first element. -> `PERMISSION_DENIED`
