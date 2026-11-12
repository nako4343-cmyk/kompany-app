/**
 * Phase 0 TDD Security Test Runner Specification for Kompa Firestore Rules
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unverified Email Write',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: false },
    payload: {
      id: 'user_1',
      ownerId: 'user_1',
      name: 'Anna',
      age: 26,
      gender: 'female',
      city: 'Москва',
      avatarUrl: 'https://example.com/a.jpg',
      bio: 'Hello',
      interests: ['Настольные игры'],
      openToInvites: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Identity Spoofing on User Profile',
    operation: 'create',
    path: '/users/user_2',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      id: 'user_2',
      ownerId: 'user_2',
      name: 'Spoofed',
      age: 26,
      gender: 'female',
      city: 'Москва',
      avatarUrl: 'https://example.com/a.jpg',
      bio: 'Hello',
      interests: ['Настольные игры'],
      openToInvites: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Event',
    operation: 'create',
    path: '/events/ev_100',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      id: 'ev_100',
      organizerId: 'user_1',
      isShadowAdminField: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Cross-Read on Private User Subcollection',
    operation: 'get',
    path: '/users/user_1/private/info',
    auth: { uid: 'user_2', email: 'other@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning with Special Characters',
    operation: 'create',
    path: '/events/invalid$id!@#',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Value Poisoning on Event Update',
    operation: 'update',
    path: '/events/ev_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      occupiedSpots: 'NOT_A_NUMBER',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unauthorized Event Secret Read by Non-Participant',
    operation: 'get',
    path: '/events/ev_1/secrets/main',
    auth: { uid: 'stranger_uid', email: 'stranger@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Orphaned Subcollection Write on Non-Existent Event',
    operation: 'create',
    path: '/events/non_existent_event/messages/msg_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      id: 'msg_1',
      eventId: 'non_existent_event',
      senderId: 'user_1',
      senderName: 'Anna',
      senderAvatar: 'https://example.com/a.jpg',
      text: 'Hello',
      timestamp: '19:00',
      isPinned: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      createdAt: '2099-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable OrganizerId Mutation on Event Update',
    operation: 'update',
    path: '/events/ev_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      organizerId: 'user_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass on Completed Event',
    operation: 'update',
    path: '/events/ev_completed',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      title: 'Mutated After Completion',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unbounded Array Injection on User Interests',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'test@example.com', email_verified: true },
    payload: {
      interests: new Array(25).fill('Настольные игры'),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
