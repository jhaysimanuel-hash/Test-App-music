import { Song, EventSetlist, UserProfile, UserRole, ProjectorSettings, PendingMember, Workspace, UserPreferences, TeamNoteMessage } from '../types';
import { SEED_SONGS, INITIAL_SETLISTS } from '../data/seedSongs';
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocFromServer,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  limit,
  arrayUnion
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const STORAGE_KEYS = {
  WORKSPACES: 'worshipflow_workspaces_v1',
  ACTIVE_WORKSPACE_ID: 'worshipflow_active_workspace_id_v1',
  CURRENT_USER: 'worshipflow_current_user_v1',
  PROJECTOR_SETTINGS: 'worshipflow_projector_settings_v1'
};

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-church-1',
    name: 'Grace Community Church Workspace',
    churchName: 'Grace Community Church (Church 1)',
    passcode: 'GRACE-1001',
    createdById: 'user-head-leader',
    createdByName: 'Michael Head Leader',
    createdAt: new Date().toISOString(),
    churchBannerUrl: '/src/assets/images/worship_hero_banner_1792855953344.jpg',
    churchLogoUrl: '/src/assets/images/worship_flow_logo_1792855953074.jpg',
    churchLogoText: 'GRACE COMMUNITY CHURCH'
  },
  {
    id: 'ws-church-2',
    name: 'Victory Chapel Workspace',
    churchName: 'Victory Chapel (Church 2)',
    passcode: 'VICTORY-2002',
    createdById: 'user-head-leader-2',
    createdByName: 'Head Leader Victory',
    createdAt: new Date().toISOString(),
    churchBannerUrl: '/src/assets/images/worship_hero_banner_1792855953344.jpg',
    churchLogoUrl: '/src/assets/images/worship_flow_logo_1792855953074.jpg',
    churchLogoText: 'VICTORY CHAPEL'
  }
];

export const DEFAULT_TEAM_MEMBERS: UserProfile[] = [
  // STEALTH DEVELOPER ADMIN - HIDDEN FROM PUBLIC WORKSPACE LISTS
  {
    id: 'user-admin',
    name: 'David Pastor (Developer Admin)',
    email: 'pastor.david@church.org',
    role: 'admin',
    workspaceId: 'ws-church-1',
    instrument: 'Acoustic Guitar & Developer'
  },
  {
    id: 'user-head-leader',
    name: 'Michael Head Leader',
    email: 'michael.headleader@church.org',
    role: 'head-leader',
    workspaceId: 'ws-church-1',
    instrument: 'Acoustic Guitar & Leadership'
  },
  {
    id: 'user-leader',
    name: 'Sarah Worship Leader',
    email: 'sarah.leader@church.org',
    role: 'leader',
    workspaceId: 'ws-church-1',
    instrument: 'Lead Vocals & Keys'
  },
  {
    id: 'user-editor',
    name: 'Mark Media Editor',
    email: 'mark.editor@church.org',
    role: 'editor',
    workspaceId: 'ws-church-1',
    instrument: 'Electric Guitar'
  },
  {
    id: 'user-viewer',
    name: 'Jonathan Musician / Vocalist',
    email: 'jonathan.team@church.org',
    role: 'viewer',
    workspaceId: 'ws-church-1',
    instrument: 'Bass Guitar'
  }
];

export const DEFAULT_PROJECTOR_SETTINGS: ProjectorSettings = {
  fontSize: 48,
  fontFamily: 'Outfit',
  textColor: '#ffffff',
  bgColor: '#000000',
  accentColor: '#f59e0b',
  alignment: 'center',
  verticalPosition: 'center',
  lineSpacing: 'relaxed',
  showSongTitleBanner: true,
  churchLogoText: 'PRAISE & WORSHIP'
};

// Helper for local storage safe read/write
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// WORKSPACE API
export async function getWorkspaces(): Promise<Workspace[]> {
  const path = 'workspaces';
  if (!auth.currentUser) {
    // If not signed in, we can't query the cloud yet.
    // Return empty but don't throw an error to the user during initial mount.
    return [];
  }
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const workspaces = snapshot.docs.map((doc: any) => doc.data() as Workspace);
    
    return workspaces;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function getActiveWorkspaceId(): string {
  // Active workspace preference can stay in localStorage as it is device-specific
  return getStored<string>(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, '');
}

export function setActiveWorkspaceId(id: string): void {
  setStored(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, id);
}

export async function findWorkspaceByPasscode(passcode: string): Promise<Workspace | undefined> {
  const path = 'workspaces';
  const clean = passcode.trim().toUpperCase();
  try {
    const q = query(collection(db, path), where('passcode', '==', clean), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Workspace;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return undefined;
  }
}

export async function createWorkspace(churchName: string, creator: UserProfile, customPasscode?: string): Promise<Workspace> {
  const path = 'workspaces';
  
  const prefix = churchName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'CHURCH';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const passcode = customPasscode?.trim().toUpperCase() || `${prefix}-${randomNum}`;

  const id = `ws-${Date.now()}`;
  const newWorkspace: Workspace = {
    id: id,
    name: `${churchName} Workspace`,
    churchName: churchName,
    passcode: passcode,
    createdById: creator.id,
    createdByName: creator.name,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, path, id), newWorkspace);
    setActiveWorkspaceId(id);

    // Initialize creator profile in Firestore
    const userPath = `users/${creator.id}`;
    const initialMember: UserProfile = {
      ...creator,
      workspaceId: id,
      role: creator.role === 'admin' ? 'admin' : 'head-leader'
    };
    await setDoc(doc(db, 'users', creator.id), initialMember);

    // Seed default songs for the new workspace in Firestore
    const songsPath = `workspaces/${id}/songs`;
    for (const song of SEED_SONGS) {
      await setDoc(doc(db, songsPath, song.id), song);
    }

    const setlistsPath = `workspaces/${id}/setlists`;
    for (const setlist of INITIAL_SETLISTS) {
      await setDoc(doc(db, setlistsPath, setlist.id), setlist);
    }

    return newWorkspace;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateWorkspacePasscode(workspaceId: string, newPasscode: string): Promise<void> {
  const path = `workspaces/${workspaceId}`;
  const cleanPasscode = newPasscode.trim().toUpperCase();
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId), { passcode: cleanPasscode });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// SONGS API (Per Workspace)
export async function getSongs(wsId: string = getActiveWorkspaceId(), noDefault: boolean = false): Promise<Song[]> {
  if (!wsId) return SEED_SONGS;
  const path = `workspaces/${wsId}/songs`;
  try {
    const q = query(collection(db, path), orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    const songs = snapshot.docs.map((doc: any) => doc.data() as Song);
    if (songs.length === 0 && !noDefault) return SEED_SONGS;
    return songs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return noDefault ? [] : SEED_SONGS;
  }
}

export async function saveSong(song: Song, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/songs/${song.id}`;
  try {
    const updatedSong = { 
      ...song, 
      updatedAt: new Date().toISOString() 
    };
    await setDoc(doc(db, `workspaces/${wsId}/songs`, song.id), updatedSong);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSong(songId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/songs/${songId}`;
  try {
    console.log("Attempting to delete song:", path);
    await deleteDoc(doc(db, `workspaces/${wsId}/songs`, songId));
    console.log("Successfully deleted song");
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
// SETLISTS API (Per Workspace)
export async function getSetlists(wsId: string = getActiveWorkspaceId(), noDefault: boolean = false): Promise<EventSetlist[]> {
  if (!wsId) return INITIAL_SETLISTS;
  const path = `workspaces/${wsId}/setlists`;
  try {
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const setlists = snapshot.docs.map((doc: any) => doc.data() as EventSetlist);
    if (setlists.length === 0 && !noDefault) return INITIAL_SETLISTS;
    return setlists;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return noDefault ? [] : INITIAL_SETLISTS;
  }
}

export async function saveSetlist(setlist: EventSetlist, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/setlists/${setlist.id}`;
  try {
    await setDoc(doc(db, `workspaces/${wsId}/setlists`, setlist.id), setlist);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSetlist(setlistId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/setlists/${setlistId}`;
  try {
    console.log("Attempting to delete setlist:", path);
    await deleteDoc(doc(db, `workspaces/${wsId}/setlists`, setlistId));
    console.log("Successfully deleted setlist");
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// AUTH & RBAC API (Per Workspace)
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (!auth.currentUser) return null;
  const path = `users/${auth.currentUser.uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    // If it's a connection or token issue, return null so UI doesn't crash but shows login/error
    if (error?.message?.includes('permission-denied') || error?.message?.includes('offline') || error?.message?.includes('auth/token-service')) {
       console.warn("Current user profile fetch deferred:", error.message);
       return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function getCurrentUser(): UserProfile {
  return getStored<UserProfile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_TEAM_MEMBERS[1]);
}

export function getCachedUserProfile(userId: string): UserProfile | null {
  const cached = getStored<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
  return cached?.id === userId ? cached : null;
}

export function setCurrentUser(user: UserProfile): void {
  setStored(STORAGE_KEYS.CURRENT_USER, user);
}

// TEAM MEMBERS API
export async function getTeamMembers(wsId: string = getActiveWorkspaceId(), includeAdmin: boolean = false): Promise<UserProfile[]> {
  if (!wsId) return DEFAULT_TEAM_MEMBERS;
  const path = 'users';
  try {
    const q = query(collection(db, path), where('workspaceId', '==', wsId));
    const snapshot = await getDocs(q);
    const members = snapshot.docs.map((doc: any) => doc.data() as UserProfile);
    
    if (members.length === 0) {
       return includeAdmin ? DEFAULT_TEAM_MEMBERS : DEFAULT_TEAM_MEMBERS.filter((m: any) => m.role !== 'admin');
    }
    
    return includeAdmin ? members : members.filter(m => m.role !== 'admin');
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function updateMemberRole(userId: string, newRole: UserRole, wsId: string = getActiveWorkspaceId()): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addTeamMember(member: UserProfile, wsId: string = getActiveWorkspaceId()): Promise<void> {
  const path = `users/${member.id}`;
  try {
    await setDoc(doc(db, 'users', member.id), { ...member, workspaceId: wsId });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeTeamMember(userId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), { workspaceId: null, role: 'viewer' });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), updates);
    const updatedSnap = await getDoc(doc(db, 'users', userId));
    return updatedSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return undefined;
  }
}

export async function checkAndElevateAdmin(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    // Use getDocFromServer to verify connection if possible, otherwise fallback to getDoc
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      if (profile.role !== 'admin') {
        await updateDoc(docRef, { role: 'admin' });
      }
    }
  } catch (error: any) {
    // If it's just a permission error or offline error during initial boot, we log it but don't crash
    if (error?.message?.includes('permission-denied') || error?.message?.includes('offline')) {
      console.warn("Initial admin check failed (likely offline or permission):", error.message);
    } else {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}


// PENDING APPROVALS API (Per Workspace)
export async function getPendingMembers(wsId: string = getActiveWorkspaceId()): Promise<PendingMember[]> {
  if (!wsId) return [];
  const path = `workspaces/${wsId}/pending_members`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => doc.data() as PendingMember);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addPendingMember(member: { id: string; name: string; email: string; workspaceId: string }): Promise<void> {
  const path = `workspaces/${member.workspaceId}/pending_members/${member.id}`;
  try {
    await setDoc(doc(db, `workspaces/${member.workspaceId}/pending_members`, member.id), {
      ...member,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function approvePendingMember(pendingId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/pending_members/${pendingId}`;
  try {
    const docSnap = await getDoc(doc(db, `workspaces/${wsId}/pending_members`, pendingId));
    if (docSnap.exists()) {
      const target = docSnap.data() as PendingMember;
      const newMember: UserProfile = {
        id: target.id,
        name: target.name,
        email: target.email,
        role: 'viewer',
        workspaceId: wsId,
        instrument: 'Worship Team Member'
      };
      await addTeamMember(newMember, wsId);
      await deleteDoc(doc(db, `workspaces/${wsId}/pending_members`, pendingId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function denyPendingMember(pendingId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/pending_members/${pendingId}`;
  try {
    await deleteDoc(doc(db, `workspaces/${wsId}/pending_members`, pendingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// PROJECTOR SETTINGS API
export async function getProjectorSettings(wsId: string = getActiveWorkspaceId()): Promise<ProjectorSettings> {
  if (!wsId) return DEFAULT_PROJECTOR_SETTINGS;
  const path = `workspaces/${wsId}/settings/projector`;
  try {
    const docSnap = await getDoc(doc(db, 'workspaces', wsId, 'settings', 'projector'));
    if (docSnap.exists()) {
      return docSnap.data() as ProjectorSettings;
    }
    return DEFAULT_PROJECTOR_SETTINGS;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return DEFAULT_PROJECTOR_SETTINGS;
  }
}

export async function saveProjectorSettings(settings: ProjectorSettings, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  const path = `workspaces/${wsId}/settings/projector`;
  try {
    await setDoc(doc(db, 'workspaces', wsId, 'settings', 'projector'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// MEMBER PREFERENCES
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  uiColor: 'red',
  userFont: 'Outfit',
  homeBgUrl: ''
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  if (!userId) return DEFAULT_USER_PREFERENCES;
  const currentUid = auth.currentUser?.uid;
  const isAdminUser = auth.currentUser?.email === 'jhaysimanuel@gmail.com';

  // Safeguard: do not query preferences for other users if caller is not signed in or not the owner/admin
  if (currentUid && userId !== currentUid && !isAdminUser) {
    return DEFAULT_USER_PREFERENCES;
  }

  const path = `users/${userId}/preferences/main`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'preferences', 'main'));
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    return DEFAULT_USER_PREFERENCES;
  } catch (error: any) {
    if (error?.message?.includes('permission-denied') || error?.code === 'permission-denied') {
      console.warn(`User preferences read permission-denied for ${path}, returning defaults.`);
      return DEFAULT_USER_PREFERENCES;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return DEFAULT_USER_PREFERENCES;
  }
}

export async function saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const targetId = auth.currentUser?.uid || userId;
  if (!targetId) return DEFAULT_USER_PREFERENCES;

  const path = `users/${targetId}/preferences/main`;
  try {
    const current = await getUserPreferences(targetId);
    const updated = { ...current, ...prefs };
    await setDoc(doc(db, 'users', targetId, 'preferences', 'main'), updated);
    return updated;
  } catch (error: any) {
    if (error?.message?.includes('permission-denied') || error?.code === 'permission-denied') {
      console.warn(`User preferences write permission-denied for ${path}.`);
      return DEFAULT_USER_PREFERENCES;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
    return DEFAULT_USER_PREFERENCES;
  }
}


export async function updateWorkspaceBannerAndName(wsId: string, churchName: string, bannerUrl?: string, logoText?: string, logoUrl?: string): Promise<void> {
  const path = `workspaces/${wsId}`;
  try {
    const updates: any = {
      churchName: churchName.trim(),
      name: `${churchName.trim()} Workspace`
    };
    if (bannerUrl !== undefined) updates.churchBannerUrl = bannerUrl.trim();
    if (logoText !== undefined) updates.churchLogoText = logoText.trim();
    if (logoUrl !== undefined) updates.churchLogoUrl = logoUrl.trim();
    
    await updateDoc(doc(db, 'workspaces', wsId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function resetWorkspaceData(wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const songsSnapshot = await getDocs(collection(db, `workspaces/${wsId}/songs`));
    for (const docSnap of songsSnapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    const setlistsSnapshot = await getDocs(collection(db, `workspaces/${wsId}/setlists`));
    for (const docSnap of setlistsSnapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch (error) {
    console.error("Error resetting workspace data:", error);
  }
}

export async function getMemberGallery(userId: string): Promise<string[]> {
  const path = `users/${userId}/assets/gallery`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'assets', 'gallery'));
    if (docSnap.exists()) {
      return docSnap.data().images || [];
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function saveGalleryImage(wsId: string = getActiveWorkspaceId(), imageUrl: string, userId?: string): Promise<void> {
  // If userId is provided, save to member's personal gallery, otherwise workspace gallery
  const path = userId 
    ? `users/${userId}/assets/gallery`
    : `workspaces/${wsId}/assets/gallery`;
  
  const docRef = userId
    ? doc(db, 'users', userId, 'assets', 'gallery')
    : doc(db, 'workspaces', wsId, 'assets', 'gallery');

  try {
    await updateDoc(docRef, {
      images: arrayUnion(imageUrl)
    });
  } catch (error) {
    // If it doesn't exist, create it
    try {
      await setDoc(docRef, {
        images: [imageUrl]
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
}

export async function resetSongsToDefault(wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  for (const song of SEED_SONGS) {
    await saveSong(song, wsId);
  }
}

// TEAM NOTES & CHAT MESSAGES API
export async function getWorkspaceChatMessages(wsId: string): Promise<TeamNoteMessage[]> {
  if (!wsId) return [];
  const path = `workspaces/${wsId}/chat`;
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => doc.data() as TeamNoteMessage);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addWorkspaceChatMessage(wsId: string, message: { senderId: string; senderName: string; senderRole: UserRole; content: string }): Promise<TeamNoteMessage[]> {
  const path = `workspaces/${wsId}/chat`;
  try {
    const id = `msg-${Date.now()}`;
    const newMsg: TeamNoteMessage = {
      id: id,
      workspaceId: wsId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      content: message.content,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, path, id), newMsg);
    return await getWorkspaceChatMessages(wsId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return [];
  }
}

export async function deleteWorkspaceChatMessage(wsId: string, msgId: string): Promise<TeamNoteMessage[]> {
  const path = `workspaces/${wsId}/chat/${msgId}`;
  try {
    await deleteDoc(doc(db, `workspaces/${wsId}/chat`, msgId));
    return await getWorkspaceChatMessages(wsId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return [];
  }
}

// REAL-TIME FIRESTORE SUBSCRIBERS (LIVE NO-REFRESH SYNC)
export function subscribeToWorkspaceChat(wsId: string, callback: (messages: TeamNoteMessage[]) => void): () => void {
  if (!wsId) return () => {};
  const path = `workspaces/${wsId}/chat`;
  const q = query(collection(db, path), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc: any) => doc.data() as TeamNoteMessage);
    callback(messages);
  }, (error) => {
    console.warn("Realtime chat sync error:", error);
  });
}

export function subscribeToSongs(wsId: string, callback: (songs: Song[]) => void): () => void {
  if (!wsId) return () => {};
  const path = `workspaces/${wsId}/songs`;
  const q = query(collection(db, path), orderBy('title', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const songs = snapshot.docs.map((doc: any) => doc.data() as Song);
    if (songs.length === 0) {
      callback(SEED_SONGS);
    } else {
      callback(songs);
    }
  }, (error) => {
    console.warn("Realtime songs sync error:", error);
  });
}

export function subscribeToSetlists(wsId: string, callback: (setlists: EventSetlist[]) => void): () => void {
  if (!wsId) return () => {};
  const path = `workspaces/${wsId}/setlists`;
  const q = query(collection(db, path), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const setlists = snapshot.docs.map((doc: any) => doc.data() as EventSetlist);
    if (setlists.length === 0) {
      callback(INITIAL_SETLISTS);
    } else {
      callback(setlists);
    }
  }, (error) => {
    console.warn("Realtime setlists sync error:", error);
  });
}

export function subscribeToTeamMembers(wsId: string, includeAdmin: boolean, callback: (members: UserProfile[]) => void): () => void {
  if (!wsId) return () => {};
  const path = 'users';
  const q = query(collection(db, path), where('workspaceId', '==', wsId));
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc: any) => doc.data() as UserProfile);
    if (members.length === 0) {
      callback(includeAdmin ? DEFAULT_TEAM_MEMBERS : DEFAULT_TEAM_MEMBERS.filter(m => m.role !== 'admin'));
    } else {
      callback(includeAdmin ? members : members.filter(m => m.role !== 'admin'));
    }
  }, (error) => {
    console.warn("Realtime team members sync error:", error);
  });
}

export function subscribeToPendingMembers(wsId: string, callback: (pending: PendingMember[]) => void): () => void {
  if (!wsId) return () => {};
  const path = `workspaces/${wsId}/pending_members`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const pending = snapshot.docs.map((doc: any) => doc.data() as PendingMember);
    callback(pending);
  }, (error) => {
    console.warn("Realtime pending members sync error:", error);
  });
}

export function subscribeToProjectorSettings(wsId: string, callback: (settings: ProjectorSettings) => void): () => void {
  if (!wsId) return () => {};
  const docRef = doc(db, 'workspaces', wsId, 'settings', 'projector');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as ProjectorSettings);
    } else {
      callback(DEFAULT_PROJECTOR_SETTINGS);
    }
  }, (error) => {
    console.warn("Realtime projector settings sync error:", error);
  });
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
  if (!userId) return () => {};
  const docRef = doc(db, 'users', userId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.warn("Realtime user profile sync error:", error);
  });
}

