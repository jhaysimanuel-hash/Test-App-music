import { Song, EventSetlist, UserProfile, UserRole, ProjectorSettings, PendingMember, Workspace, UserPreferences, TeamNoteMessage } from '../types';
import { SEED_SONGS, INITIAL_SETLISTS } from '../data/seedSongs';
import { supabase } from '../firebase';

const STORAGE_KEYS = {
  WORKSPACES: 'worshipflow_workspaces_v1',
  ACTIVE_WORKSPACE_ID: 'worshipflow_active_workspace_id_v1',
  CURRENT_USER: 'worshipflow_current_user_v1',
  PROJECTOR_SETTINGS: 'worshipflow_projector_settings_v1'
};

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

export const DEFAULT_TEAM_MEMBERS: UserProfile[] = [];

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

// Map a Supabase workspaces row to the Workspace shape used by the app.
function mapWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    churchName: row.church_name,
    passcode: row.passcode,
    createdById: row.created_by_id || '',
    createdByName: row.created_by_name || '',
    createdAt: row.created_at,
    churchBannerUrl: row.church_banner_url,
    churchLogoText: row.church_logo_text,
    churchLogoUrl: row.church_logo_url,
  };
}

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    workspaceId: row.workspace_id || undefined,
    avatarUrl: row.avatar_url,
    instrument: row.instrument,
  };
}

function mapSong(row: any): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist || '',
    defaultKey: row.default_key || '',
    tempo: row.tempo,
    timeSignature: row.time_signature,
    categories: row.categories || [],
    lyricsWithChords: row.lyrics_with_chords || '',
    ccli: row.ccli,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSetlist(row: any): EventSetlist {
  return {
    id: row.id,
    title: row.title,
    date: row.date || '',
    time: row.time,
    leaderId: row.leader_id || '',
    leaderName: row.leader_name || '',
    theme: row.theme,
    notes: row.notes,
    items: row.items || [],
    createdAt: row.created_at,
  };
}

// WORKSPACE API
export async function getWorkspaces(): Promise<Workspace[]> {
  try {
    const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map(mapWorkspace);
  } catch (error) {
    console.warn('Unable to load workspaces:', error);
    return [];
  }
}

export function getActiveWorkspaceId(): string {
  return getStored<string>(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, '');
}

export function setActiveWorkspaceId(id: string): void {
  setStored(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, id);
}

export async function findWorkspaceByPasscode(passcode: string): Promise<Workspace | undefined> {
  const clean = passcode.trim().toUpperCase();
  try {
    const { data, error } = await supabase.from('workspaces').select('*').eq('passcode', clean).maybeSingle();
    if (error) throw error;
    return data ? mapWorkspace(data) : undefined;
  } catch (error) {
    console.warn('findWorkspaceByPasscode error:', error);
    return undefined;
  }
}

export async function createWorkspace(churchName: string, creator: UserProfile, customPasscode?: string): Promise<Workspace> {
  const prefix = churchName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'CHURCH';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const passcode = customPasscode?.trim().toUpperCase() || `${prefix}-${randomNum}`;

  const id = `ws-${Date.now()}`;
  const { data: session } = await supabase.auth.getSession();
  const authUid = session.session?.user.id;

  const insertRow = {
    id,
    name: `${churchName} Workspace`,
    church_name: churchName,
    passcode,
    created_by_id: authUid || creator.id,
    created_by_name: creator.name,
  };

  try {
    const { error: wsErr } = await supabase.from('workspaces').insert(insertRow);
    if (wsErr) throw wsErr;
    setActiveWorkspaceId(id);

    // Ensure creator profile points to the new workspace as head-leader.
    const role: UserRole = creator.role === 'admin' ? 'admin' : 'head-leader';
    await supabase.from('profiles').upsert({
      id: authUid || creator.id,
      name: creator.name,
      email: creator.email,
      role,
      workspace_id: id,
      instrument: creator.instrument || 'Worship Head Leader',
    });

    // Seed default songs.
    for (const song of SEED_SONGS) {
      await supabase.from('songs').insert({
        id: song.id,
        workspace_id: id,
        title: song.title,
        artist: song.artist,
        default_key: song.defaultKey,
        tempo: song.tempo,
        time_signature: song.timeSignature,
        categories: song.categories,
        lyrics_with_chords: song.lyricsWithChords,
        ccli: song.ccli,
        notes: song.notes,
        created_at: song.createdAt,
        updated_at: song.updatedAt,
      });
    }

    // Seed default setlists.
    for (const setlist of INITIAL_SETLISTS) {
      await supabase.from('setlists').insert({
        id: setlist.id,
        workspace_id: id,
        title: setlist.title,
        date: setlist.date,
        time: setlist.time,
        leader_id: setlist.leaderId,
        leader_name: setlist.leaderName,
        theme: setlist.theme,
        notes: setlist.notes,
        items: setlist.items,
        created_at: setlist.createdAt,
      });
    }

    return mapWorkspace(insertRow);
  } catch (error) {
    console.error('createWorkspace error:', error);
    throw error;
  }
}

export async function deleteWorkspace(wsId: string): Promise<void> {
  try {
    // Clear the active workspace if it's the one being deleted.
    if (getActiveWorkspaceId() === wsId) setActiveWorkspaceId('');
    const { error } = await supabase.from('workspaces').delete().eq('id', wsId);
    if (error) throw error;
  } catch (error) {
    console.warn('deleteWorkspace error:', error);
    throw error;
  }
}

export async function updateWorkspacePasscode(workspaceId: string, newPasscode: string): Promise<void> {
  const cleanPasscode = newPasscode.trim().toUpperCase();
  try {
    const { error } = await supabase.from('workspaces').update({ passcode: cleanPasscode }).eq('id', workspaceId);
    if (error) throw error;
  } catch (error) {
    console.warn('updateWorkspacePasscode error:', error);
  }
}

export async function updateWorkspaceBannerAndName(wsId: string, churchName: string, bannerUrl?: string, logoText?: string, logoUrl?: string): Promise<void> {
  try {
    const updates: any = {
      church_name: churchName.trim(),
      name: `${churchName.trim()} Workspace`,
    };
    if (bannerUrl !== undefined) updates.church_banner_url = bannerUrl.trim();
    if (logoText !== undefined) updates.church_logo_text = logoText.trim();
    if (logoUrl !== undefined) updates.church_logo_url = logoUrl.trim();
    const { error } = await supabase.from('workspaces').update(updates).eq('id', wsId);
    if (error) throw error;
  } catch (error) {
    console.warn('updateWorkspaceBannerAndName error:', error);
  }
}

// SONGS API
export async function getSongs(wsId: string = getActiveWorkspaceId(), noDefault: boolean = false): Promise<Song[]> {
  if (!wsId) return SEED_SONGS;
  try {
    const { data, error } = await supabase.from('songs').select('*').eq('workspace_id', wsId).order('title', { ascending: true });
    if (error) throw error;
    const songs = (data || []).map(mapSong);
    if (songs.length === 0 && !noDefault) return SEED_SONGS;
    return songs;
  } catch (error) {
    console.warn('getSongs error:', error);
    return noDefault ? [] : SEED_SONGS;
  }
}

export async function saveSong(song: Song, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { error } = await supabase.from('songs').upsert({
      id: song.id,
      workspace_id: wsId,
      title: song.title,
      artist: song.artist,
      default_key: song.defaultKey,
      tempo: song.tempo,
      time_signature: song.timeSignature,
      categories: song.categories,
      lyrics_with_chords: song.lyricsWithChords,
      ccli: song.ccli,
      notes: song.notes,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (error) {
    console.warn('saveSong error:', error);
  }
}

export async function deleteSong(songId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { error } = await supabase.from('songs').delete().eq('id', songId).eq('workspace_id', wsId);
    if (error) throw error;
  } catch (error) {
    console.warn('deleteSong error:', error);
  }
}

// SETLISTS API
export async function getSetlists(wsId: string = getActiveWorkspaceId(), noDefault: boolean = false): Promise<EventSetlist[]> {
  if (!wsId) return INITIAL_SETLISTS;
  try {
    const { data, error } = await supabase.from('setlists').select('*').eq('workspace_id', wsId).order('date', { ascending: false });
    if (error) throw error;
    const setlists = (data || []).map(mapSetlist);
    if (setlists.length === 0 && !noDefault) return INITIAL_SETLISTS;
    return setlists;
  } catch (error) {
    console.warn('getSetlists error:', error);
    return noDefault ? [] : INITIAL_SETLISTS;
  }
}

export async function saveSetlist(setlist: EventSetlist, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { error } = await supabase.from('setlists').upsert({
      id: setlist.id,
      workspace_id: wsId,
      title: setlist.title,
      date: setlist.date,
      time: setlist.time,
      leader_id: setlist.leaderId,
      leader_name: setlist.leaderName,
      theme: setlist.theme,
      notes: setlist.notes,
      items: setlist.items,
      created_at: setlist.createdAt,
    });
    if (error) throw error;
  } catch (error) {
    console.warn('saveSetlist error:', error);
  }
}

export async function deleteSetlist(setlistId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { error } = await supabase.from('setlists').delete().eq('id', setlistId).eq('workspace_id', wsId);
    if (error) throw error;
  } catch (error) {
    console.warn('deleteSetlist error:', error);
  }
}

// AUTH & RBAC API
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) throw error;
    if (data) return mapProfile(data);

    // Self-heal: auth user exists but no profile row yet. Create one from auth metadata
    // so the user is never stuck on the login screen.
    const authUser = session.session?.user;
    const nameFromMeta = (authUser?.user_metadata as any)?.name || (authUser?.email ? authUser.email.split('@')[0] : 'Member');
    const { data: inserted, error: insErr } = await supabase.from('profiles').upsert({
      id: uid,
      name: nameFromMeta,
      email: authUser?.email || '',
      role: 'viewer',
    }).select('*').maybeSingle();
    if (insErr) throw insErr;
    return inserted ? mapProfile(inserted) : null;
  } catch (error: any) {
    console.warn('getCurrentUserProfile deferred:', error?.message || error);
    return null;
  }
}

export function getCurrentUser(): UserProfile {
  return getStored<UserProfile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_TEAM_MEMBERS[0] || {
    id: '', name: 'Guest', email: '', role: 'viewer', instrument: ''
  });
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
  if (!wsId) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('workspace_id', wsId);
    if (error) throw error;
    const members = (data || []).map(mapProfile);
    return includeAdmin ? members : members.filter(m => m.role !== 'admin');
  } catch (error) {
    console.warn('getTeamMembers error:', error);
    return [];
  }
}

export async function updateMemberRole(userId: string, newRole: UserRole, wsId: string = getActiveWorkspaceId()): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;
  } catch (error) {
    console.warn('updateMemberRole error:', error);
  }
}

export async function addTeamMember(member: UserProfile, wsId: string = getActiveWorkspaceId()): Promise<void> {
  try {
    await supabase.from('profiles').upsert({ ...member, workspace_id: wsId });
  } catch (error) {
    console.warn('addTeamMember error:', error);
  }
}

export async function removeTeamMember(userId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  try {
    await supabase.from('profiles').update({ workspace_id: null, role: 'viewer' }).eq('id', userId);
  } catch (error) {
    console.warn('removeTeamMember error:', error);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
  try {
    const updateRow: any = {};
    if (updates.name !== undefined) updateRow.name = updates.name;
    if (updates.role !== undefined) updateRow.role = updates.role;
    if (updates.workspaceId !== undefined) updateRow.workspace_id = updates.workspaceId;
    if (updates.avatarUrl !== undefined) updateRow.avatar_url = updates.avatarUrl;
    if (updates.instrument !== undefined) updateRow.instrument = updates.instrument;
    const { error } = await supabase.from('profiles').update(updateRow).eq('id', userId);
    if (error) throw error;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data ? mapProfile(data) : undefined;
  } catch (error) {
    console.warn('updateUserProfile error:', error);
    return undefined;
  }
}

export async function checkAndElevateAdmin(userId: string): Promise<void> {
  // Reserved for developer admin elevation logic; no-op by default in Supabase (RLS handles admin).
}

// PENDING APPROVALS API
export async function getPendingMembers(wsId: string = getActiveWorkspaceId()): Promise<PendingMember[]> {
  if (!wsId) return [];
  try {
    const { data, error } = await supabase.from('pending_members').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      workspaceId: row.workspace_id,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn('getPendingMembers error:', error);
    return [];
  }
}

export async function addPendingMember(member: { id: string; name: string; email: string; workspaceId: string }): Promise<void> {
  try {
    await supabase.from('pending_members').upsert({
      id: member.id,
      workspace_id: member.workspaceId,
      name: member.name,
      email: member.email,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('addPendingMember error:', error);
  }
}

export async function approvePendingMember(pendingId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { data: pending, error: pErr } = await supabase.from('pending_members').select('*').eq('id', pendingId).maybeSingle();
    if (pErr) throw pErr;
    if (pending) {
      await supabase.from('profiles').upsert({
        id: pending.id,
        name: pending.name,
        email: pending.email,
        role: 'viewer',
        workspace_id: wsId,
        instrument: 'Worship Team Member',
      });
      await supabase.from('pending_members').delete().eq('id', pendingId);
    }
  } catch (error) {
    console.warn('approvePendingMember error:', error);
  }
}

export async function denyPendingMember(pendingId: string, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    await supabase.from('pending_members').delete().eq('id', pendingId);
  } catch (error) {
    console.warn('denyPendingMember error:', error);
  }
}

// PROJECTOR SETTINGS API
export async function getProjectorSettings(wsId: string = getActiveWorkspaceId()): Promise<ProjectorSettings> {
  if (!wsId) return DEFAULT_PROJECTOR_SETTINGS;
  try {
    const { data, error } = await supabase.from('projector_settings').select('settings').eq('workspace_id', wsId).maybeSingle();
    if (error) throw error;
    return data?.settings ? { ...DEFAULT_PROJECTOR_SETTINGS, ...data.settings } : DEFAULT_PROJECTOR_SETTINGS;
  } catch (error) {
    console.warn('getProjectorSettings error:', error);
    return DEFAULT_PROJECTOR_SETTINGS;
  }
}

export async function saveProjectorSettings(settings: ProjectorSettings, wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    const { error } = await supabase.from('projector_settings').upsert({ workspace_id: wsId, settings });
    if (error) throw error;
  } catch (error) {
    console.warn('saveProjectorSettings error:', error);
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
  try {
    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_USER_PREFERENCES;
    return {
      uiColor: (data.ui_color as any) || 'red',
      userFont: (data.user_font as any) || 'Outfit',
      homeBgUrl: data.home_bg_url || '',
      avatarUrl: data.avatar_url || '',
    };
  } catch (error) {
    console.warn('getUserPreferences error:', error);
    return DEFAULT_USER_PREFERENCES;
  }
}

export async function saveUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  if (!userId) return DEFAULT_USER_PREFERENCES;
  try {
    const current = await getUserPreferences(userId);
    const updated = { ...current, ...prefs };
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      ui_color: updated.uiColor,
      user_font: updated.userFont,
      home_bg_url: updated.homeBgUrl || null,
      avatar_url: updated.avatarUrl || null,
    });
    if (error) throw error;
    return updated;
  } catch (error) {
    console.warn('saveUserPreferences error:', error);
    return DEFAULT_USER_PREFERENCES;
  }
}

export async function resetWorkspaceData(wsId: string = getActiveWorkspaceId()): Promise<void> {
  if (!wsId) return;
  try {
    await supabase.from('songs').delete().eq('workspace_id', wsId);
    await supabase.from('setlists').delete().eq('workspace_id', wsId);
  } catch (error) {
    console.warn('resetWorkspaceData error:', error);
  }
}

export async function getMemberGallery(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('gallery_images').select('image_url').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => r.image_url);
  } catch (error) {
    console.warn('getMemberGallery error:', error);
    return [];
  }
}

export async function saveGalleryImage(wsId: string = getActiveWorkspaceId(), imageUrl: string, userId?: string): Promise<void> {
  try {
    await supabase.from('gallery_images').insert({
      id: `img-${Date.now()}`,
      workspace_id: userId ? null : wsId,
      user_id: userId || null,
      image_url: imageUrl,
    });
  } catch (error) {
    console.warn('saveGalleryImage error:', error);
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
  try {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('workspace_id', wsId).order('timestamp', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderRole: row.sender_role as UserRole,
      content: row.content,
      timestamp: row.timestamp,
      isPinned: row.is_pinned,
    }));
  } catch (error) {
    console.warn('getWorkspaceChatMessages error:', error);
    return [];
  }
}

export async function addWorkspaceChatMessage(wsId: string, message: { senderId: string; senderName: string; senderRole: UserRole; content: string }): Promise<TeamNoteMessage[]> {
  try {
    const id = `msg-${Date.now()}`;
    const { error } = await supabase.from('chat_messages').insert({
      id,
      workspace_id: wsId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      sender_role: message.senderRole,
      content: message.content,
    });
    if (error) throw error;
    return await getWorkspaceChatMessages(wsId);
  } catch (error) {
    console.warn('addWorkspaceChatMessage error:', error);
    return [];
  }
}

export async function deleteWorkspaceChatMessage(wsId: string, msgId: string): Promise<TeamNoteMessage[]> {
  try {
    const { error } = await supabase.from('chat_messages').delete().eq('id', msgId).eq('workspace_id', wsId);
    if (error) throw error;
    return await getWorkspaceChatMessages(wsId);
  } catch (error) {
    console.warn('deleteWorkspaceChatMessage error:', error);
    return [];
  }
}

// REAL-TIME SUBSCRIBERS (Supabase Realtime)
export function subscribeToWorkspaceChat(wsId: string, callback: (messages: TeamNoteMessage[]) => void): () => void {
  if (!wsId) return () => {};
  getWorkspaceChatMessages(wsId).then(callback);
  const channel = supabase.channel(`chat-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `workspace_id=eq.${wsId}` }, () => {
      getWorkspaceChatMessages(wsId).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToSongs(wsId: string, callback: (songs: Song[]) => void): () => void {
  if (!wsId) return () => {};
  getSongs(wsId).then(callback);
  const channel = supabase.channel(`songs-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `workspace_id=eq.${wsId}` }, () => {
      getSongs(wsId).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToSetlists(wsId: string, callback: (setlists: EventSetlist[]) => void): () => void {
  if (!wsId) return () => {};
  getSetlists(wsId).then(callback);
  const channel = supabase.channel(`setlists-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'setlists', filter: `workspace_id=eq.${wsId}` }, () => {
      getSetlists(wsId).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToTeamMembers(wsId: string, includeAdmin: boolean, callback: (members: UserProfile[]) => void): () => void {
  if (!wsId) return () => {};
  getTeamMembers(wsId, includeAdmin).then(callback);
  const channel = supabase.channel(`members-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `workspace_id=eq.${wsId}` }, () => {
      getTeamMembers(wsId, includeAdmin).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToPendingMembers(wsId: string, callback: (pending: PendingMember[]) => void): () => void {
  if (!wsId) return () => {};
  getPendingMembers(wsId).then(callback);
  const channel = supabase.channel(`pending-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_members', filter: `workspace_id=eq.${wsId}` }, () => {
      getPendingMembers(wsId).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToProjectorSettings(wsId: string, callback: (settings: ProjectorSettings) => void): () => void {
  if (!wsId) return () => {};
  getProjectorSettings(wsId).then(callback);
  const channel = supabase.channel(`proj-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projector_settings', filter: `workspace_id=eq.${wsId}` }, () => {
      getProjectorSettings(wsId).then(callback);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToWorkspaceMetadata(wsId: string, callback: (workspace: Workspace | null) => void): () => void {
  if (!wsId) return () => {};
  const fetchWs = async () => {
    const { data, error } = await supabase.from('workspaces').select('*').eq('id', wsId).maybeSingle();
    if (!error) callback(data ? mapWorkspace(data) : null);
  };
  fetchWs();
  const channel = supabase.channel(`ws-${wsId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: `id=eq.${wsId}` }, () => {
      fetchWs();
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
  if (!userId) return () => {};
  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error) callback(data ? mapProfile(data) : null);
  };
  fetchProfile();
  const channel = supabase.channel(`profile-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
      fetchProfile();
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
