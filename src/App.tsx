import React, { useState, useEffect } from 'react';
import { 
  Song, 
  EventSetlist, 
  UserProfile, 
  UserRole, 
  LiveSessionState, 
  ProjectorSettings,
  Workspace,
  UserPreferences 
} from './types';
import { 
  getSongs, 
  saveSong, 
  deleteSong, 
  resetSongsToDefault,
  getSetlists,
  saveSetlist,
  deleteSetlist,
  getCurrentUser,
  setCurrentUser,
  getTeamMembers,
  updateMemberRole,
  getProjectorSettings,
  saveProjectorSettings,
  getWorkspaces,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  createWorkspace,
  getUserPreferences,
  saveUserPreferences,
  updateWorkspaceBannerAndName,
  updateUserProfile,
  getCurrentUserProfile,
  getCachedUserProfile,
  saveGalleryImage,
  subscribeToSongs,
  subscribeToSetlists,
  subscribeToProjectorSettings,
  subscribeToUserProfile,
  subscribeToWorkspaceMetadata,
  DEFAULT_USER_PREFERENCES
} from './utils/storage';
import { supabase } from './firebase';
import { PALETTES, INSTALLED_FONTS } from './utils/themeHelper';
import { syncEngine } from './utils/syncEngine';
import { parseSongLyrics } from './utils/songParser';
import { Server } from 'lucide-react';

// Components
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { LiveStageView } from './components/LiveStageView';
import { SongLibrary } from './components/SongLibrary';
import { SetlistBuilder } from './components/SetlistBuilder';
import { ProjectorCastView } from './components/ProjectorCastView';
import { AndroidFirebaseGuideView } from './components/AndroidFirebaseGuideView';
import { TeamChatPanel } from './components/TeamChatPanel';

export default function App() {
  const isDedicatedProjector = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('view') === 'projector';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'home' | 'live' | 'library' | 'setlists' | 'projector' | 'docs'>('home');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Multi-Tenant Workspaces State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>(getActiveWorkspaceId());

  const activeWorkspace: Workspace = workspaces.find(w => w.id === activeWorkspaceId) || {
    id: activeWorkspaceId || 'ws-church-1',
    name: 'WorshipFlow Workspace',
    churchName: 'Church',
    passcode: 'WAITING',
    createdById: '',
    createdByName: '',
    createdAt: new Date().toISOString()
  };

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<EventSetlist[]>([]);
  const [liveState, setLiveState] = useState<LiveSessionState>(syncEngine.getState());
  const [projectorSettings, setProjectorSettingsState] = useState<ProjectorSettings | null>(null);
  
  // Theme, fonts, gallery & Android Filesystem permission state
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [customFont, setCustomFont] = useState<string>('');
  const [storagePermissionGranted, setStoragePermissionGranted] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  ]);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Supabase Auth Listener with real-time subscriptions & safety timeout
  useEffect(() => {
    let unsubscribeWs: (() => void) | null = null;
    let unsubscribeUserProf: (() => void) | null = null;
    let authStateReceived = false;

    const loadingSafetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authStateReceived = true;
        setAuthLoading(false);
        setConnectionError(null);
        const user = session?.user;
        if (user) {
          const profile = !navigator.onLine
            ? getCachedUserProfile(user.id)
            : (await getCurrentUserProfile().catch(() => null)) || getCachedUserProfile(user.id);
          setCurrentUserState(profile);
          if (profile) setCurrentUser(profile);
          setIsAuthenticated(!!profile);
          setConnectionError(null);
          if (profile) {
            getWorkspaces().then(setWorkspaces).catch(err => console.warn(err));
            getUserPreferences(user.id).then(setUserPreferences).catch(err => console.warn(err));
            const wsId = profile.workspaceId || getActiveWorkspaceId();
            if (wsId) {
              syncEngine.initWorkspace(wsId);
              if (unsubscribeWs) unsubscribeWs();
              unsubscribeWs = subscribeToWorkspaceMetadata(wsId, (updatedWs) => {
                if (updatedWs) {
                  setWorkspaces(prev => {
                    const index = prev.findIndex(w => w.id === wsId);
                    if (index === -1) return [...prev, updatedWs];
                    const next = [...prev];
                    next[index] = updatedWs;
                    return next;
                  });
                }
              });
              if (unsubscribeUserProf) unsubscribeUserProf();
              unsubscribeUserProf = subscribeToUserProfile(user.id, (updatedProfile) => {
                if (updatedProfile) setCurrentUserState(updatedProfile);
              });
            }
          }
        } else {
          setCurrentUserState(null);
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        console.error("Auth state processing error:", err);
        setConnectionError('Could not load your account. Check your connection and try again.');
      } finally {
        clearTimeout(loadingSafetyTimeout);
        setAuthLoading(false);
      }
    };
    loadSession();

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          setCurrentUserState(null);
          setIsAuthenticated(false);
          setAuthLoading(false);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadSession();
        }
      })();
    });

    return () => {
      clearTimeout(loadingSafetyTimeout);
      authSub.subscription.unsubscribe();
      if (unsubscribeWs) unsubscribeWs();
      if (unsubscribeUserProf) unsubscribeUserProf();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      getUserPreferences(currentUser.id).then(setUserPreferences).catch(err => console.warn(err));
    }
  }, [currentUser?.id]);


  // Dynamic UI Font Effect - Applies selected font (Outfit, Plus Jakarta Sans, Playfair Display, Space Grotesk, Inter) to all DOM elements
  useEffect(() => {
    const targetFont = INSTALLED_FONTS.find(f => f.name === userPreferences.userFont);
    const fontFamily = targetFont ? targetFont.family : customFont ? `'${customFont}', sans-serif` : "'Outfit', sans-serif";

    let dynamicStyleEl = document.getElementById('worshipflow-dynamic-font');
    if (!dynamicStyleEl) {
      dynamicStyleEl = document.createElement('style');
      dynamicStyleEl.id = 'worshipflow-dynamic-font';
      document.head.appendChild(dynamicStyleEl);
    }
    dynamicStyleEl.innerHTML = `
      body, #root, button, input, select, textarea, h1, h2, h3, h4, h5, h6, span, p, div, label {
        font-family: ${fontFamily} !important;
      }
    `;
  }, [userPreferences.userFont, customFont]);

  // Dynamic UI Color Palette Effect - Recolors all accent buttons, active tabs, badges & highlights dynamically (Red, Sapphire Blue, Emerald Green, Golden Amber, Royal Purple, Ocean Teal, Velvet Rose)
  useEffect(() => {
    const p = PALETTES[userPreferences.uiColor] || PALETTES.red;
    
    let dynamicColorEl = document.getElementById('worshipflow-dynamic-color');
    if (!dynamicColorEl) {
      dynamicColorEl = document.createElement('style');
      dynamicColorEl.id = 'worshipflow-dynamic-color';
      document.head.appendChild(dynamicColorEl);
    }

    dynamicColorEl.innerHTML = `
      .bg-red-500, .bg-red-600 { background-color: ${p.swatchHex} !important; }
      .hover\\:bg-red-400:hover, .hover\\:bg-red-500:hover { background-color: ${p.swatchHex}dd !important; }
      .text-red-500, .text-red-400, .text-red-600 { color: ${p.swatchHex} !important; }
      .border-red-500, .border-red-600 { border-color: ${p.swatchHex} !important; }
      .border-red-500\\/30, .border-red-500\\/20, .border-red-500\\/40, .border-red-200 { border-color: ${p.swatchHex}4d !important; }
      .bg-red-500\\/15, .bg-red-500\\/20, .bg-red-500\\/10, .bg-red-50\\/95, .bg-red-100 { background-color: ${p.swatchHex}26 !important; }
      .ring-red-500 { --tw-ring-color: ${p.swatchHex} !important; border-color: ${p.swatchHex} !important; }
    `;
  }, [userPreferences.uiColor]);

  // Real-time live sync for songs, setlists, and projector settings when workspace changes
  useEffect(() => {
    if (activeWorkspaceId && isAuthenticated) {
      syncEngine.initWorkspace(activeWorkspaceId);

      const unsubSongs = subscribeToSongs(activeWorkspaceId, setSongs);
      const unsubSetlists = subscribeToSetlists(activeWorkspaceId, setSetlists);
      const unsubProjector = subscribeToProjectorSettings(activeWorkspaceId, setProjectorSettingsState);

      return () => {
        unsubSongs();
        unsubSetlists();
        unsubProjector();
      };
    }
  }, [activeWorkspaceId, isAuthenticated]);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState) => {
      setLiveState(newState);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleJumpSection = (e: any) => {
      const { sectionId, label, content } = e.detail;
      if (currentUser) {
        syncEngine.broadcastUpdate({
          activeSectionId: sectionId,
          activeSectionLabel: label,
          activeSectionContent: content
        }, currentUser.name);
        showToast(`Jumped to section: ${label}`);
      }
    };
    window.addEventListener('worshipflow-jump-section' as any, handleJumpSection);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('worshipflow-jump-section' as any, handleJumpSection);
    };
  }, [currentUser?.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async (user: UserProfile, wsId: string) => {
    setActiveWorkspaceIdState(wsId);
    setActiveWorkspaceId(wsId);
    setCurrentUserState(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Entered ${activeWorkspace.churchName} as ${user.role.toUpperCase()}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUserState(null);
    showToast('Signed out of workspace');
  };

  const handleSwitchWorkspace = (wsId: string) => {
    setActiveWorkspaceIdState(wsId);
    setActiveWorkspaceId(wsId);
    const targetWs = workspaces.find(w => w.id === wsId);
    showToast(`Switched server database to: ${targetWs?.churchName}`);
  };

  const handleCreateNewWorkspace = async (churchName: string) => {
    if (!currentUser) return;
    const newWs = await createWorkspace(churchName, currentUser);
    const wsList = await getWorkspaces();
    setWorkspaces(wsList);
    setActiveWorkspaceIdState(newWs.id);
    showToast(`Created new workspace database for: ${churchName}`);
  };

  // Android Capacitor Filesystem Permission Request Flow Simulation
  const handleRequestStoragePermission = () => {
    const confirmed = window.confirm(
      "[Android Capacitor Filesystem] WorshipFlow requests read/write access to your external storage and photo gallery. Do you allow this application to read storage and media files?"
    );
    if (confirmed) {
      setStoragePermissionGranted(true);
      showToast("Storage & Gallery permissions granted! Media access is now active.");
    } else {
      setStoragePermissionGranted(false);
      showToast("Storage permission denied.");
    }
  };

  const handleSwitchUser = (user: UserProfile) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'jhaysimanuel@gmail.com';
    if (!isAdmin) {
      showToast('Account switching is restricted to Admin users.');
      return;
    }
    setCurrentUserState(user);
    setCurrentUser(user);
    showToast(`Switched account to ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleUpdatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!currentUser) return;
    const updated = await saveUserPreferences(currentUser.id, prefs);
    setUserPreferences(updated);
    if (prefs.userFont) {
      const target = INSTALLED_FONTS.find(f => f.name === prefs.userFont);
      if (target) document.body.style.fontFamily = target.family;
    }
    showToast('Updated personal UI preferences!');
  };

  const handleUpdateWorkspaceBannerAndNameHandler = async (wsId: string, churchName: string, bannerUrl?: string, logoText?: string, logoUrl?: string) => {
    await updateWorkspaceBannerAndName(wsId, churchName, bannerUrl, logoText, logoUrl);
    const wsList = await getWorkspaces();
    setWorkspaces(wsList);
    showToast('Updated Church Workspace Banner & Name!');
  };

  const handleUpdateUserName = async (newName: string) => {
    if (!newName.trim() || !currentUser) return;
    const updated = await updateUserProfile(currentUser.id, { name: newName.trim() });
    if (updated) {
      setCurrentUserState({ ...updated });
      showToast(`Display name updated to: ${newName.trim()}`);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: UserRole) => {
    await updateMemberRole(userId, newRole, activeWorkspaceId);
    if (currentUser && currentUser.id === userId) {
      const profile = await getCurrentUserProfile();
      if (profile) setCurrentUserState(profile);
    }
    showToast(`Updated member role to: ${newRole.toUpperCase()}`);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark Mode' : 'Light Red Mode'}`);
  };

  const handleUploadFont = (fontFamilyName: string, cssUrl?: string) => {
    setCustomFont(fontFamilyName);
    if (cssUrl) {
      const link = document.createElement('link');
      link.href = cssUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = `'${fontFamilyName}', sans-serif`;
    showToast(`Successfully applied font: ${fontFamilyName}`);
  };

  const handleUploadGalleryImage = async (imageUrl: string, targetMemberId?: string) => {
    await saveGalleryImage(activeWorkspaceId, imageUrl, targetMemberId);
    if (!targetMemberId || targetMemberId === currentUser?.id) {
      setGalleryImages(prev => [imageUrl, ...prev]);
    }
    showToast('Successfully uploaded background image to server!');
  };

  const handleSaveSong = async (song: Song) => {
    await saveSong(song, activeWorkspaceId);
    const songList = await getSongs(activeWorkspaceId);
    setSongs(songList);
    showToast(`Saved "${song.title}"`);
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await deleteSong(songId, activeWorkspaceId);
      const songList = await getSongs(activeWorkspaceId, true);
      setSongs(songList);
      showToast('Deleted song');
    } catch (err) {
      console.error("Failed to delete song:", err);
      showToast('Error deleting song');
    }
  };

  const handleResetSongs = async () => {
    await resetSongsToDefault(activeWorkspaceId);
    const songList = await getSongs(activeWorkspaceId);
    setSongs(songList);
    showToast('Reset songs to default');
  };

  const handleSaveSetlist = async (setlist: EventSetlist) => {
    await saveSetlist(setlist, activeWorkspaceId);
    const setlistData = await getSetlists(activeWorkspaceId);
    setSetlists(setlistData);
    showToast(`Updated setlist "${setlist.title}"`);
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    try {
      await deleteSetlist(setlistId, activeWorkspaceId);
      const setlistData = await getSetlists(activeWorkspaceId, true);
      setSetlists(setlistData);
      showToast('Deleted setlist');
    } catch (err) {
      console.error("Failed to delete setlist:", err);
      showToast('Error deleting setlist');
    }
  };

  const handleLaunchLive = async (setlistId: string) => {
    if (!currentUser) return;
    const setlistsData = await getSetlists(activeWorkspaceId);
    const setlist = setlistsData.find(s => s.id === setlistId) || setlistsData[0];
    if (!setlist || setlist.items.length === 0) return;
    const firstItem = setlist.items[0];
    const songsData = await getSongs(activeWorkspaceId);
    const song = songsData.find(s => s.id === firstItem.songId) || songsData[0];
    const firstSection = parseSongLyrics(song.lyricsWithChords)[0];

    syncEngine.broadcastUpdate({
      activeEventId: setlist.id,
      activeSongId: song.id,
      activeSongTitle: song.title,
      activeArtist: song.artist,
      currentKey: firstItem.keyOverride || song.defaultKey,
      activeSectionId: firstSection?.id || 'section-1',
      activeSectionLabel: firstSection?.label || 'Verse 1',
      activeSectionContent: firstSection?.plainLyrics || ''
    }, currentUser.name);

    setActiveTab('live');
    showToast(`Started live session for "${setlist.title}"`);
  };

  const handleSelectSongForLive = async (songId: string) => {
    if (!currentUser) return;
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    const firstSection = parseSongLyrics(song.lyricsWithChords)[0];

    syncEngine.broadcastUpdate({
      activeSongId: song.id,
      activeSongTitle: song.title,
      activeArtist: song.artist,
      currentKey: song.defaultKey,
      activeSectionId: firstSection?.id || 'section-1',
      activeSectionLabel: firstSection?.label || 'Verse 1',
      activeSectionContent: firstSection?.plainLyrics || ''
    }, currentUser.name);

    setActiveTab('live');
    showToast(`Live stage loaded: "${song.title}"`);
  };

  const handleAddSongToSetlist = async (songId: string, setlistId: string) => {
    if (!currentUser) return;
    const setlist = setlists.find(s => s.id === setlistId);
    const song = songs.find(s => s.id === songId);
    if (!setlist || !song) return;

    const newItem = {
      id: `item-${Date.now()}`,
      songId: song.id,
      songTitle: song.title,
      artist: song.artist,
      keyOverride: song.defaultKey,
      leadSinger: currentUser.name
    };

    const updated = {
      ...setlist,
      items: [...setlist.items, newItem]
    };
    await saveSetlist(updated, activeWorkspaceId);
    const setlistData = await getSetlists(activeWorkspaceId);
    setSetlists(setlistData);
    showToast(`Added "${song.title}" to setlist`);
  };

  const handleOpenProjectorWindow = () => {
    const projectorUrl = `${window.location.origin}${window.location.pathname}?view=projector`;
    window.open(projectorUrl, 'WorshipFlow_Projector', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  };

  if (authLoading || connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          {connectionError ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-500">
                <Server className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-white font-display">System Activation in Progress</h1>
                <p className="text-slate-400 text-sm leading-relaxed">{connectionError}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xl transition-all"
              >
                Refresh Page
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold text-sm">Initializing Cloud Sync...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isDedicatedProjector) {
    return (
      <ProjectorCastView
        songs={songs}
        liveState={liveState}
        settings={projectorSettings || {
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
        }}
        theme={theme}
        galleryImages={galleryImages}
        storagePermissionGranted={storagePermissionGranted}
        onRequestStoragePermission={handleRequestStoragePermission}
        onUpdateSettings={setProjectorSettingsState}
        isStandalone={true}
        currentUser={{ role: 'viewer', id: 'guest', name: 'Guest', email: '', instrument: '' }}
        onUploadGalleryImage={() => {}}
      />
    );
  }

  // Render Login Screen if not authenticated or profile not loaded
  if (!isAuthenticated || !currentUser) {
    return <LoginView onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors overflow-x-hidden w-full max-w-full ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
    }`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        onSwitchWorkspace={handleSwitchWorkspace}
        onCreateNewWorkspace={handleCreateNewWorkspace}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        customFont={customFont}
        onUploadFont={handleUploadFont}
        onOpenProjectorWindow={handleOpenProjectorWindow}
        galleryImages={galleryImages}
        onUploadGalleryImage={handleUploadGalleryImage}
        storagePermissionGranted={storagePermissionGranted}
        onRequestStoragePermission={handleRequestStoragePermission}
        onUpdateMemberRole={handleUpdateMemberRole}
        userPreferences={userPreferences}
        onUpdatePreferences={handleUpdatePreferences}
        onUpdateWorkspaceBannerAndName={handleUpdateWorkspaceBannerAndNameHandler}
        onUpdateUserName={handleUpdateUserName}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Right Side Team Chat & Notes Panel */}
      <TeamChatPanel
        currentUser={currentUser}
        workspaceId={activeWorkspaceId}
        theme={theme}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {!isOnline && currentUser && (
        <div className="fixed top-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs font-bold text-amber-300 shadow-lg backdrop-blur">
          Offline mode: your saved account is open. Changes will sync when connection returns.
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeDashboard
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            songs={songs}
            setlists={setlists}
            theme={theme}
            onLaunchLive={handleLaunchLive}
            activeWorkspace={activeWorkspace}
            userPreferences={userPreferences}
          />
        )}

        {activeTab === 'live' && (
          <div className="space-y-3">
            {/* Exit Live Performance Button */}
            <div className="max-w-7xl mx-auto px-4 pt-4 flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>🔒 Sign Out ({currentUser.name})</span>
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>✕ Exit Live Performance</span>
              </button>
            </div>
            <LiveStageView
              currentUser={currentUser}
              songs={songs}
              setlists={setlists}
              liveState={liveState}
              theme={theme}
              onOpenProjector={() => setActiveTab('projector')}
            />
          </div>
        )}

        {activeTab === 'library' && (
          <SongLibrary
            songs={songs}
            currentUser={currentUser}
            setlists={setlists}
            theme={theme}
            onSaveSong={handleSaveSong}
            onDeleteSong={handleDeleteSong}
            onResetSongs={handleResetSongs}
            onSelectSongForLive={handleSelectSongForLive}
            onAddToSetlist={handleAddSongToSetlist}
          />
        )}

        {activeTab === 'setlists' && (
          <SetlistBuilder
            setlists={setlists}
            songs={songs}
            currentUser={currentUser}
            activeWorkspace={activeWorkspace}
            activeSetlistId={liveState.activeEventId}
            theme={theme}
            onSaveSetlist={handleSaveSetlist}
            onDeleteSetlist={handleDeleteSetlist}
            onLaunchLiveSetlist={(setlist) => handleLaunchLive(setlist.id)}
          />
        )}

        {activeTab === 'projector' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <ProjectorCastView
              songs={songs}
              liveState={liveState}
              settings={projectorSettings || {
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
              }}
              theme={theme}
              galleryImages={galleryImages}
              storagePermissionGranted={storagePermissionGranted}
              onRequestStoragePermission={handleRequestStoragePermission}
              onUpdateSettings={setProjectorSettingsState}
              isStandalone={false}
              currentUser={currentUser}
              onUploadGalleryImage={handleUploadGalleryImage}
            />
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <AndroidFirebaseGuideView />
          </div>
        )}
      </main>
    </div>
  );
}
