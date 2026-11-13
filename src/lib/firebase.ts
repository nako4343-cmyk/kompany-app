import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, EventItem, EventApplication, ChatMessage } from '../types/index.ts';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sanitize ID to match ^[a-zA-Z0-9_\-]+$ and length 1..128
export function sanitizeValidId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || 'doc_1';
}

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
}

export async function signOutCloudUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

/**
 * Syncs a user's public profile and isolated private PII to Cloud Firestore
 * strictly adhering to firebase-blueprint.json & firestore.rules.
 */
export async function syncUserProfileToCloud(profile: UserProfile): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = sanitizeValidId(currentUser.uid);
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  const safeInterests = (profile.interests || [])
    .filter(x => typeof x === 'string' && x.trim().length > 0)
    .slice(0, 10)
    .map(x => x.trim().slice(0, 60));

  const safeAge = Math.min(99, Math.max(18, Math.round(Number(profile.age) || 26)));
  const safeGender: 'female' | 'male' = profile.gender === 'male' ? 'male' : 'female';
  const safeScore = Math.min(5, Math.max(1, Number(profile.reliability?.score) || 5.0));

  try {
    const existingSnap = await getDoc(doc(db, 'users', uid));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        ownerId: uid,
        name: (profile.name || currentUser.displayName || 'Участник Kompa').slice(0, 80),
        age: safeAge,
        gender: safeGender,
        city: (profile.city || 'Москва').slice(0, 60),
        occupation: (profile.occupation || 'Участник сообщества').slice(0, 100),
        avatarUrl: (
          profile.avatarUrl ||
          currentUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        ).slice(0, 500),
        bio: (profile.bio || 'Открыт(а) к интересным встречам и хорошей компании в городе.').slice(0, 600),
        interests: safeInterests.length > 0 ? safeInterests : ['Настольные игры', 'Рестораны / Бары'],
        openToInvites: Boolean(profile.openToInvites ?? true),
        openToInvitesNote: (
          profile.openToInvitesNote || 'Жду приглашений на настольные игры, ужины и концерты!'
        ).slice(0, 300),
        reliabilityScore: safeScore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid), {
        name: (profile.name || currentUser.displayName || 'Участник Kompa').slice(0, 80),
        age: safeAge,
        gender: safeGender,
        city: (profile.city || 'Москва').slice(0, 60),
        occupation: (profile.occupation || 'Участник сообщества').slice(0, 100),
        avatarUrl: (
          profile.avatarUrl ||
          currentUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        ).slice(0, 500),
        bio: (profile.bio || 'Открыт(а) к интересным встречам и хорошей компании в городе.').slice(0, 600),
        interests: safeInterests.length > 0 ? safeInterests : ['Настольные игры', 'Рестораны / Бары'],
        openToInvites: Boolean(profile.openToInvites ?? true),
        openToInvitesNote: (
          profile.openToInvitesNote || 'Жду приглашений на настольные игры, ужины и концерты!'
        ).slice(0, 300),
        reliabilityScore: safeScore,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  // Sync isolated private PII
  try {
    const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    const safeEmail = (profile.email || currentUser.email || 'user@kompa.app').slice(0, 150);
    const safePhone = (profile.phoneNumber || '+7 (999) 000-00-00').slice(0, 40);
    if (!privSnap.exists()) {
      await setDoc(doc(db, 'users', uid, 'private', 'info'), {
        ownerId: uid,
        email: safeEmail,
        phoneNumber: safePhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
        email: safeEmail,
        phoneNumber: safePhone,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function fetchCloudUserProfile(uid: string): Promise<Partial<UserProfile> | null> {
  if (!auth.currentUser) return null;
  const cleanUid = sanitizeValidId(uid);
  const publicPath = `users/${cleanUid}`;
  try {
    const pubSnap = await getDoc(doc(db, 'users', cleanUid));
    if (!pubSnap.exists()) return null;
    const data = pubSnap.data();

    let email = auth.currentUser.email || '';
    let phoneNumber = '';
    if (auth.currentUser.uid === cleanUid) {
      try {
        const privSnap = await getDoc(doc(db, 'users', cleanUid, 'private', 'info'));
        if (privSnap.exists()) {
          email = privSnap.data().email || email;
          phoneNumber = privSnap.data().phoneNumber || '';
        }
      } catch {
        // ignore private read if not yet created
      }
    }

    return {
      id: cleanUid,
      name: data.name,
      age: data.age,
      gender: data.gender,
      city: data.city,
      occupation: data.occupation,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      interests: Array.isArray(data.interests) ? data.interests : ['Настольные игры'],
      openToInvites: Boolean(data.openToInvites),
      openToInvitesNote: data.openToInvitesNote || '',
      email,
      phoneNumber,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }
}

export async function syncEventToCloud(event: EventItem, secret?: any): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = sanitizeValidId(currentUser.uid);
  const eventId = sanitizeValidId(event.id);
  const eventPath = `events/${eventId}`;

  // Ensure organizer user doc exists first (required by Global Consistency Invariant in rules)
  await syncUserProfileToCloud({
    id: uid,
    name: event.organizer.name,
    age: event.organizer.age,
    gender: 'female',
    city: event.city,
    avatarUrl: event.organizer.avatarUrl,
    bio: 'Организатор встреч в Kompa',
    interests: [event.category],
    openToInvites: true,
    reliability: event.organizer.reliability,
    isPhoneVerified: true,
    isEmailVerified: true,
    isIdentityVerified: true,
    email: currentUser.email || 'user@kompa.app',
    role: 'user',
    status: 'active',
  });

  const safeStatus = (['open', 'full', 'completed', 'cancelled'].includes(event.status)
    ? event.status
    : 'open') as 'open' | 'full' | 'completed' | 'cancelled';

  const safeTotalSpots = Math.min(200, Math.max(2, Math.round(Number(event.totalSpots) || 6)));
  const safeOccupiedSpots = Math.min(safeTotalSpots, Math.max(1, Math.round(Number(event.occupiedSpots) || 1)));
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(event.date)
    ? event.date
    : new Date().toISOString().split('T')[0];

  try {
    const existing = await getDoc(doc(db, 'events', eventId));
    if (!existing.exists()) {
      await setDoc(doc(db, 'events', eventId), {
        id: eventId,
        organizerId: uid,
        organizerName: (event.organizer.name || currentUser.displayName || 'Организатор').slice(0, 80),
        organizerAge: Math.min(99, Math.max(18, Math.round(Number(event.organizer.age) || 26))),
        organizerAvatar: (event.organizer.avatarUrl || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80').slice(0, 500),
        title: (event.title || 'Новая встреча в компании').slice(0, 140),
        category: (event.category || 'Ресторан / Бар').slice(0, 60),
        description: (event.description || 'Дружеская встреча').slice(0, 1500),
        date: safeDate,
        time: (event.time || '19:00').slice(0, 10),
        totalSpots: safeTotalSpots,
        occupiedSpots: safeOccupiedSpots,
        budget: (event.budget || '1 000–3 000 ₽').slice(0, 60),
        city: (event.city || 'Москва').slice(0, 60),
        approximateArea: (event.approximateArea || 'Центр, ~1.5 км').slice(0, 160),
        imageUrl: (event.imageUrl || './assets/images/hero_community_event_1794332913246.jpg').slice(0, 500),
        status: safeStatus,
        groupChatInitialized: Boolean(event.groupChatInitialized ?? true),
        groupChatTitle: (event.groupChatTitle || `Групповой чат · ${event.title}`).slice(0, 140),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (existing.data().organizerId === uid) {
      await updateDoc(doc(db, 'events', eventId), {
        title: (event.title || 'Новая встреча в компании').slice(0, 140),
        description: (event.description || 'Дружеская встреча').slice(0, 1500),
        date: safeDate,
        time: (event.time || '19:00').slice(0, 10),
        totalSpots: safeTotalSpots,
        occupiedSpots: safeOccupiedSpots,
        budget: (event.budget || '1 000–3 000 ₽').slice(0, 60),
        approximateArea: (event.approximateArea || 'Центр, ~1.5 км').slice(0, 160),
        imageUrl: (event.imageUrl || './assets/images/hero_community_event_1794332913246.jpg').slice(0, 500),
        status: safeStatus,
        groupChatInitialized: Boolean(event.groupChatInitialized ?? true),
        groupChatTitle: (event.groupChatTitle || `Групповой чат · ${event.title}`).slice(0, 140),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, eventPath);
  }

  if (secret) {
    const secretPath = `events/${eventId}/secrets/main`;
    try {
      const existingSec = await getDoc(doc(db, 'events', eventId, 'secrets', 'main'));
      if (!existingSec.exists()) {
        await setDoc(doc(db, 'events', eventId, 'secrets', 'main'), {
          eventId,
          organizerId: uid,
          exactVenue: (secret.exactVenue || 'Место встречи').slice(0, 160),
          exactAddress: (secret.exactAddress || event.approximateArea || 'Москва').slice(0, 200),
          yandexMapsUrl: (secret.yandexMapsUrl || 'https://yandex.ru/maps').slice(0, 500),
          organizerPhone: (secret.organizerPhone || '+7 (999) 000-00-00').slice(0, 40),
          privateInstructions: (secret.privateInstructions || 'Подробности в групповом чате').slice(0, 500),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, secretPath);
    }
  }
}

export async function syncChatMessageToCloud(eventId: string, msg: ChatMessage): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const cleanEventId = sanitizeValidId(eventId);
  const cleanMsgId = sanitizeValidId(msg.id);
  const uid = sanitizeValidId(currentUser.uid);
  const msgPath = `events/${cleanEventId}/messages/${cleanMsgId}`;

  try {
    const parentEvent = await getDoc(doc(db, 'events', cleanEventId));
    if (!parentEvent.exists()) return; // Only sync to Firestore if parent event exists in Firestore

    const existingMsg = await getDoc(doc(db, 'events', cleanEventId, 'messages', cleanMsgId));
    if (!existingMsg.exists()) {
      await setDoc(doc(db, 'events', cleanEventId, 'messages', cleanMsgId), {
        id: cleanMsgId,
        eventId: cleanEventId,
        senderId: uid,
        senderName: (msg.senderName || currentUser.displayName || 'Участник').slice(0, 80),
        senderAvatar: (msg.senderAvatar || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80').slice(0, 500),
        text: (msg.text || '...').slice(0, 1000),
        timestamp: (msg.timestamp || '19:00').slice(0, 20),
        isPinned: Boolean(msg.isPinned),
        pinnedBy: (msg.pinnedBy || '').slice(0, 80),
        pinnedLabel: (msg.pinnedLabel || '').slice(0, 60),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'events', cleanEventId, 'messages', cleanMsgId), {
        isPinned: Boolean(msg.isPinned),
        pinnedBy: (msg.pinnedBy || '').slice(0, 80),
        pinnedLabel: (msg.pinnedLabel || '').slice(0, 60),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

export async function fetchCloudSeekers(): Promise<UserProfile[]> {
  if (!auth.currentUser) return [];
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), where('openToInvites', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: data.id,
        name: data.name,
        age: data.age,
        gender: data.gender || 'female',
        city: data.city || 'Москва',
        occupation: data.occupation || 'Участник Kompa',
        avatarUrl: data.avatarUrl,
        bio: data.bio || '',
        interests: Array.isArray(data.interests) ? data.interests : ['Настольные игры'],
        openToInvites: Boolean(data.openToInvites),
        openToInvitesNote: data.openToInvitesNote || '',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: Number(data.reliabilityScore) || 5.0,
          eventsAttended: 5,
          eventsOrganized: 1,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 5,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: '',
        role: 'user',
        status: 'active',
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchCloudOpenEvents(): Promise<Partial<EventItem>[]> {
  if (!auth.currentUser) return [];
  const path = 'events';
  try {
    const q = query(collection(db, 'events'), where('status', '==', 'open'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: data.id,
        title: data.title,
        category: data.category,
        description: data.description,
        date: data.date,
        time: data.time,
        totalSpots: data.totalSpots,
        occupiedSpots: data.occupiedSpots,
        budget: data.budget,
        city: data.city,
        approximateArea: data.approximateArea,
        imageUrl: data.imageUrl,
        organizerId: data.organizerId,
        organizer: {
          id: data.organizerId,
          name: data.organizerName,
          age: data.organizerAge,
          avatarUrl: data.organizerAvatar,
          reliability: {
            score: 4.98,
            eventsAttended: 10,
            eventsOrganized: 3,
            cancellations: 0,
            noShows: 0,
            attendanceRate: 100,
            positiveReviewsCount: 9,
          },
          isPhoneVerified: true,
          isEmailVerified: true,
        },
        status: data.status,
        groupChatInitialized: Boolean(data.groupChatInitialized),
        groupChatTitle: data.groupChatTitle,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
