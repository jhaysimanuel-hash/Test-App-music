import React, { useState } from 'react';
import { 
  Radio, 
  BookOpen, 
  ListMusic, 
  Cast, 
  Smartphone, 
  Home, 
  Sun, 
  Moon, 
  Users, 
  Settings, 
  Upload, 
  X, 
  Check, 
  Wifi, 
  WifiOff,
  Image as ImageIcon,
  FolderOpen,
  ShieldAlert,
  UserPlus,
  Trash2,
  LogOut,
  UserCheck,
  CheckCircle,
  XCircle,
  Building2,
  Plus,
  Key,
  Copy,
  Edit3,
  Zap,
  Server,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole, PendingMember, Workspace, UserPreferences, ColorPalette, BuiltInFont } from '../types';
import { 
  getTeamMembers, 
  updateMemberRole, 
  addTeamMember, 
  removeTeamMember,
  getPendingMembers,
  approvePendingMember,
  denyPendingMember,
  updateWorkspacePasscode,
  subscribeToTeamMembers,
  subscribeToPendingMembers
} from '../utils/storage';
import { PALETTES, INSTALLED_FONTS } from '../utils/themeHelper';
import { AdminStorageModal } from './AdminStorageModal';

interface NavbarProps {
  activeTab: 'home' | 'live' | 'library' | 'setlists' | 'projector' | 'docs';
  setActiveTab: (tab: 'home' | 'live' | 'library' | 'setlists' | 'projector' | 'docs') => void;
  currentUser: UserProfile;
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateNewWorkspace: (churchName: string) => void;
  onSwitchUser: (user: UserProfile) => void;
  onLogout: () => void;
  isOnline: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  customFont: string;
  onUploadFont: (fontFamilyName: string, cssUrl?: string) => void;
  onOpenProjectorWindow: () => void;
  galleryImages: string[];
  onUploadGalleryImage: (imageUrl: string, targetMemberId?: string) => void;
  storagePermissionGranted: boolean;
  onRequestStoragePermission: () => void;
  onUpdateMemberRole: (userId: string, newRole: UserRole) => void;
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onUpdateWorkspaceBannerAndName: (wsId: string, churchName: string, bannerUrl?: string, logoText?: string, logoUrl?: string) => void;
  onUpdateUserName: (newName: string) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  activeWorkspace,
  workspaces,
  onSwitchWorkspace,
  onCreateNewWorkspace,
  onSwitchUser,
  onLogout,
  isOnline,
  theme,
  onToggleTheme,
  customFont,
  onUploadFont,
  onOpenProjectorWindow,
  galleryImages,
  onUploadGalleryImage,
  storagePermissionGranted,
  onRequestStoragePermission,
  onUpdateMemberRole,
  userPreferences,
  onUpdatePreferences,
  onUpdateWorkspaceBannerAndName,
  onUpdateUserName,
  isChatOpen,
  onToggleChat
}) => {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  const [fontInputUrl, setFontInputUrl] = useState('');
  const [fontNameInput, setFontNameInput] = useState('');

  // User display name modification state
  const [userNameState, setUserNameState] = useState(currentUser?.name || '');
  const [isEditingNameInTeamModal, setIsEditingNameInTeamModal] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setUserNameState(currentUser.name);
    }
  }, [currentUser?.name]);

  // Passcode editing state
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [editablePasscode, setEditablePasscode] = useState(activeWorkspace.passcode);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Add new member form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('viewer');
  const [newMemberInstrument, setNewMemberInstrument] = useState('');

  // Create workspace in navbar
  const [newChurchNameInput, setNewChurchNameInput] = useState('');

  // Head Leader Church Banner State
  const [churchNameState, setChurchNameState] = useState(activeWorkspace.churchName);
  const [churchBannerUrlState, setChurchBannerUrlState] = useState(activeWorkspace.churchBannerUrl || '');
  const [churchLogoTextState, setChurchLogoTextState] = useState(activeWorkspace.churchLogoText || '');
  const [churchLogoUrlState, setChurchLogoUrlState] = useState(activeWorkspace.churchLogoUrl || '');

  // Member Home BG & Profile Picture State
  const [homeBgUrlState, setHomeBgUrlState] = useState(userPreferences.homeBgUrl || '');
  const [avatarUrlState, setAvatarUrlState] = useState(userPreferences.avatarUrl || currentUser?.avatarUrl || '');

  // Local File Picker Helper (Converts phone gallery / local images to Data URL)
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>, onComplete: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onComplete(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  // Real-time listener for team members and pending member requests
  React.useEffect(() => {
    if (activeWorkspace.id) {
      const unsubTeam = subscribeToTeamMembers(activeWorkspace.id, false, setTeamMembers);
      const unsubPending = subscribeToPendingMembers(activeWorkspace.id, setPendingMembers);
      return () => {
        unsubTeam();
        unsubPending();
      };
    }
  }, [activeWorkspace.id]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'jhaysimanuel@gmail.com';
  const isHeadLeader = currentUser?.role === 'head-leader';
  const isLeader = currentUser?.role === 'leader';
  const isAdminOrHeadLeader = isAdmin || isHeadLeader;
  const canApproveMembers = isAdmin || isHeadLeader || isLeader;

  const handleFontUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontNameInput.trim()) return;
    onUploadFont(fontNameInput.trim(), fontInputUrl.trim() || undefined);
    setFontNameInput('');
    setFontInputUrl('');
    setIsSettingsModalOpen(false);
  };

  const handleSavePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editablePasscode.trim()) return;
    updateWorkspacePasscode(activeWorkspace.id, editablePasscode.trim());
    activeWorkspace.passcode = editablePasscode.trim().toUpperCase();
    setIsEditingPasscode(false);
    alert('Workspace Passcode updated successfully!');
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(activeWorkspace.passcode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    
    if (isHeadLeader && newMemberRole === 'admin') {
      alert('Head Leader is not permitted to assign the Admin role.');
      return;
    }

    const newMember: UserProfile = {
      id: `user-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      workspaceId: activeWorkspace.id,
      instrument: newMemberInstrument.trim() || 'Worship Team'
    };
    await addTeamMember(newMember, activeWorkspace.id);
    const updatedMembers = await getTeamMembers(activeWorkspace.id, false);
    setTeamMembers(updatedMembers);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberInstrument('');
    setShowAddMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the workspace?')) {
      await removeTeamMember(userId, activeWorkspace.id);
      const updatedMembers = await getTeamMembers(activeWorkspace.id, false);
      setTeamMembers(updatedMembers);
    }
  };

  const handleApprove = async (id: string) => {
    await approvePendingMember(id, activeWorkspace.id);
    const updatedPending = await getPendingMembers(activeWorkspace.id);
    const updatedMembers = await getTeamMembers(activeWorkspace.id, false);
    setPendingMembers(updatedPending);
    setTeamMembers(updatedMembers);
  };

  const handleDeny = async (id: string) => {
    await denyPendingMember(id, activeWorkspace.id);
    const updatedPending = await getPendingMembers(activeWorkspace.id);
    setPendingMembers(updatedPending);
  };

  const handleCreateWorkspaceSubmitNavbar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChurchNameInput.trim()) return;
    onCreateNewWorkspace(newChurchNameInput.trim());
    setNewChurchNameInput('');
    setIsWorkspaceModalOpen(false);
  };

  // Define tabs: hide Live tab for editors and viewers as requested across all view states
  const allTabs = [
    { id: 'home', label: 'Home', icon: Home, hideForRoles: [] },
    { id: 'live', label: 'Live', icon: Radio, hideForRoles: ['editor', 'viewer'] },
    { id: 'library', label: 'Songs', icon: BookOpen, hideForRoles: [] },
    { id: 'setlists', label: 'Setlists', icon: ListMusic, hideForRoles: [] },
    { id: 'projector', label: 'Projector', icon: Cast, hideForRoles: [] },
    { id: 'docs', label: "System Update", icon: Sparkles, hideForRoles: [] }
  ];

  const visibleTabs = allTabs.filter(tab => !tab.hideForRoles.includes(currentUser.role));

  return (
    <>
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
          : 'bg-red-50/95 border-red-200 text-slate-900'
      }`}>
        <div className="w-full px-3 sm:px-6 lg:px-8 max-w-[1500px] mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-16 overflow-hidden">
            
            {/* Zone 1: Brand Wordmark + Church Workspace Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0">
              <button 
                onClick={() => setActiveTab('home')}
                className="group flex items-center gap-2 focus:outline-none text-left shrink min-w-0"
              >
                <div className="hidden xs:block min-w-0">
                  <span className={`text-sm sm:text-base font-bold tracking-tight font-display block truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    WorshipFlow
                  </span>
                  <span className="text-[9px] text-red-500 uppercase tracking-wider block font-semibold truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[180px]">
                    {activeWorkspace.churchName}
                  </span>
                </div>
              </button>

              {/* Server Passcode Badge / Switcher Trigger */}
              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="px-2 py-1 xs:px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                title="Church Passcode & Workspace Info"
              >
                <Key className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[65px] xs:max-w-none">{activeWorkspace.passcode}</span>
              </button>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-red-100/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Actions & Triggers (ALWAYS VISIBLE & NEVER OVERFLOWS) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
              
              {/* Sync Status Indicator */}
              <div className="hidden xs:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/20 border border-slate-700/30 shrink-0">
                <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-500">
                  {isOnline ? 'Cloud Active' : 'Waiting for Sync'}
                </span>
              </div>

              {/* YELLOW DEVELOPER TEST BUTTON - REMOVE BEFORE RELEASE */}
              {isAdmin && (
                <button
                  onClick={() => setIsStorageModalOpen(true)}
                  className="p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-2 border-yellow-500 text-xs font-extrabold flex items-center gap-1 shadow-lg animate-pulse transition-all shrink-0"
                  title="⚡ [TEST ONLY - REMOVE BEFORE RELEASE] Stealth Admin Remote Device Extraction"
                >
                  <Server className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                  <span className="hidden xl:inline">⚡ [TEST] Stealth Member Assets</span>
                </button>
              )}

              {/* Storage & Gallery Permission Button */}
              <button
                onClick={() => {
                  if (!storagePermissionGranted) {
                    onRequestStoragePermission();
                  } else {
                    setIsStorageModalOpen(true);
                  }
                }}
                className={`p-1.5 xs:px-2.5 xs:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  storagePermissionGranted
                    ? 'bg-red-500 text-white border-red-600 shadow-sm'
                    : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-red-100 border-red-300 text-red-700'
                }`}
                title="Android Filesystem Storage & Gallery Access"
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">{storagePermissionGranted ? 'Storage Connected' : 'Allow Storage'}</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-1.5 xs:p-2 rounded-xl border transition-colors shrink-0 ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-red-100 border-red-200 text-slate-700 hover:bg-red-200'
                }`}
                title="App Settings & Logout"
              >
                <Settings className="w-4 h-4 shrink-0" />
              </button>

              {/* Team Members / Profile Button (ALWAYS VISIBLE WITH AVATAR & TRUNCATED NAME) */}
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className={`px-2 xs:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 min-w-0 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-red-200 text-slate-900 shadow-sm'
                }`}
                title="Team Members & Pending Requests"
              >
                {avatarUrlState || currentUser.avatarUrl ? (
                  <img
                    src={avatarUrlState || currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-red-500 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-[10px] flex items-center justify-center border border-red-500/50 shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span className="truncate max-w-[60px] xs:max-w-[100px] sm:max-w-none">{currentUser.name.split(' ')[0]}</span>
                {pendingMembers.length > 0 && canApproveMembers && (
                  <span className="bg-amber-500 text-slate-950 font-bold px-1.5 rounded-full text-[10px] shrink-0">
                    {pendingMembers.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="md:hidden flex items-center justify-between border-t border-red-500/20 py-2 overflow-x-auto gap-1.5 no-scrollbar">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2 py-1 text-[11px] font-medium rounded whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    activeTab === tab.id ? 'bg-red-500 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* WORKSPACE PASSCODE & SERVER MODAL */}
      {isWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold font-display">Workspace Server & Passcode ID</h3>
              </div>
              <button onClick={() => setIsWorkspaceModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Workspace Info & Passcode Display */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400">{activeWorkspace.churchName}</div>
                  <div className="text-[10px] text-slate-400">Isolated Church Server Database</div>
                </div>
                <span className="px-2 py-1 bg-amber-500 text-slate-950 rounded font-bold text-[10px]">ACTIVE</span>
              </div>

              {/* Passcode Copy / Edit Section */}
              <div className="pt-2 border-t border-amber-500/20 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                  Passcode ID / Link Number (Give to Members to Join)
                </label>

                {!isEditingPasscode ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-400 flex items-center justify-between">
                      <span>{activeWorkspace.passcode}</span>
                      <button
                        onClick={handleCopyPasscode}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPasscode ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    {isAdminOrHeadLeader && (
                      <button
                        onClick={() => {
                          setEditablePasscode(activeWorkspace.passcode);
                          setIsEditingPasscode(true);
                        }}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1"
                        title="Edit Passcode ID"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSavePasscode} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={editablePasscode}
                      onChange={(e) => setEditablePasscode(e.target.value.toUpperCase())}
                      placeholder="e.g. CHURCH-7391"
                      className="flex-1 bg-slate-950 border border-amber-500 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                    >
                      Save Passcode
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPasscode(false)}
                      className="px-3 py-2 bg-slate-800 text-slate-400 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* If Developer Admin, display full server list */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-yellow-400 block flex items-center gap-1">
                  ⚡ [TEST ONLY] Developer Admin Server Switcher
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSwitchWorkspace(ws.id);
                        setIsWorkspaceModalOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        ws.id === activeWorkspace.id ? 'bg-yellow-400 text-slate-950 border-yellow-500 font-extrabold' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{ws.churchName}</span>
                      <span className="font-mono text-[10px] opacity-80">({ws.passcode})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create Another Church Workspace */}
            {isAdminOrHeadLeader && (
              <form onSubmit={handleCreateWorkspaceSubmitNavbar} className="pt-3 border-t border-red-500/20 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Create Another Church Workspace</label>
                <input
                  type="text"
                  required
                  value={newChurchNameInput}
                  onChange={(e) => setNewChurchNameInput(e.target.value)}
                  placeholder="e.g. Grace Community Church (Branch 2)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace Database</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TEAM MEMBERS & PENDING WORKSPACE REQUESTS MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-4 border overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold font-display">Workspace Team & Pending Applications ({activeWorkspace.churchName})</h3>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              
              {/* PENDING APPROVAL SECTION FOR HEAD LEADER & LEADER */}
              {canApproveMembers && pendingMembers.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Pending Requests for {activeWorkspace.churchName} ({pendingMembers.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Accepting assigns default Viewer role</span>
                  </div>

                  <div className="space-y-2">
                    {pendingMembers.map((pending) => (
                      <div key={pending.id} className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-white">{pending.name}</div>
                          <div className="text-[11px] text-slate-400">{pending.email}</div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleApprove(pending.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept (Viewer)</span>
                          </button>
                          <button
                            onClick={() => handleDeny(pending.id)}
                            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Deny</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEAM MEMBERS LIST (STEALTH MASK: DEVELOPER ADMIN HIDDEN FROM CHURCH MEMBERS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isAdminOrHeadLeader ? '👑 Admin / Head Leader: You can add/remove members and change roles.' : '🔒 Workspace Members'}</span>
                  {isAdminOrHeadLeader && (
                    <button
                      onClick={() => setShowAddMember(!showAddMember)}
                      className="px-3 py-1.5 bg-red-500 text-white font-bold rounded-xl flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{showAddMember ? 'Cancel' : 'Add Member'}</span>
                    </button>
                  )}
                </div>

                {/* Add Member Form */}
                {showAddMember && isAdminOrHeadLeader && (
                  <form onSubmit={handleAddMemberSubmit} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3 text-xs animate-in fade-in">
                    <h4 className="font-bold text-red-400">Add New Member to {activeWorkspace.churchName}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Full Name"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="email"
                        required
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Email Address"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        {isAdmin && <option value="admin">Admin</option>}
                        <option value="head-leader">Head Leader</option>
                        <option value="leader">Leader</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <input
                        type="text"
                        value={newMemberInstrument}
                        onChange={(e) => setNewMemberInstrument(e.target.value)}
                        placeholder="Instrument / Role Title"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-md"
                    >
                      Save & Add Member
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {teamMembers.map((member) => {
                    const isCurrent = currentUser.id === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-red-500/10 border-red-500/40'
                            : theme === 'dark' ? 'bg-slate-800/50 border-slate-800' : 'bg-red-50/50 border-red-100'
                        }`}
                      >
                        <div 
                          onClick={() => {
                            if (isAdmin) onSwitchUser(member);
                          }}
                          className={`flex items-center gap-3 ${isAdmin ? 'cursor-pointer' : ''} flex-1`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                              <span className="truncate">{member.name}</span>
                              {isCurrent && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-extrabold uppercase shrink-0">
                                    Active (You)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditingNameInTeamModal(!isEditingNameInTeamModal);
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                                    title="Edit your display name"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{member.email} · <span className="text-red-400">{member.instrument || 'Member'}</span></div>

                            {/* Inline Edit Name for Active User */}
                            {isCurrent && isEditingNameInTeamModal && (
                              <div 
                                onClick={(e) => e.stopPropagation()} 
                                className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={userNameState}
                                  onChange={(e) => setUserNameState(e.target.value)}
                                  placeholder="Enter new display name"
                                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!userNameState.trim()) return;
                                    onUpdateUserName(userNameState.trim());
                                    getTeamMembers(activeWorkspace.id, false).then(setTeamMembers);
                                    setIsEditingNameInTeamModal(false);
                                  }}
                                  className="w-full sm:w-auto px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-lg shadow shrink-0 flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Role selector & Remove button */}
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <select
                              value={member.role}
                              onChange={(e) => {
                                onUpdateMemberRole(member.id, e.target.value as UserRole);
                                getTeamMembers(activeWorkspace.id, false).then(setTeamMembers);
                              }}
                              className="bg-slate-800 text-white border border-red-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="head-leader">Head Leader</option>
                              <option value="leader">Leader</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : isHeadLeader ? (
                            <select
                              value={member.role}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                if (newRole === 'admin') {
                                  alert('Head Leader is not permitted to assign the Admin role.');
                                  return;
                                }
                                onUpdateMemberRole(member.id, newRole);
                                getTeamMembers(activeWorkspace.id, false).then(setTeamMembers);
                              }}
                              className="bg-slate-800 text-white border border-red-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="head-leader">Head Leader</option>
                              <option value="leader">Leader</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg border bg-red-500/20 text-red-400 border-red-500/30">
                              {member.role}
                            </span>
                          )}

                          {isAdminOrHeadLeader && teamMembers.length > 1 && !isCurrent && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN STORAGE & MEMBER ASSETS MODAL */}
      <AdminStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        currentUser={currentUser}
        theme={theme}
        galleryImages={galleryImages}
        onUploadGalleryImage={onUploadGalleryImage}
        storagePermissionGranted={storagePermissionGranted}
      />

      {/* APP SETTINGS MODAL WITH COLOR PALETTES, FONTS, BG & LOGOUT */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-5 border overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold font-display">Personal UI Customization & Workspace Settings</h3>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">

              {/* 0. MEMBER DISPLAY NAME (USER CAN CHANGE NAME) */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-red-400 block">
                    👤 Your Display Name / Profile Name
                  </label>
                  <span className="text-[10px] text-slate-400">Updates across team, live stage & chat</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={userNameState}
                    onChange={(e) => setUserNameState(e.target.value)}
                    placeholder="Enter your name or nickname..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => {
                      if (!userNameState.trim()) {
                        alert('Please enter a valid display name.');
                        return;
                      }
                      onUpdateUserName(userNameState.trim());
                      getTeamMembers(activeWorkspace.id, false).then(setTeamMembers);
                      alert(`Display name updated to: ${userNameState.trim()}`);
                    }}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-md shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Name</span>
                  </button>
                </div>
              </div>

              {/* 1. SEVEN COLOR PALETTES (PER MEMBER) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    🎨 Member Accent Color (7 Color Palettes)
                  </label>
                  <span className="text-[10px] text-red-400 font-semibold">Unique to your session</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PALETTES) as ColorPalette[]).map((pKey) => {
                    const p = PALETTES[pKey];
                    const isSelected = userPreferences.uiColor === pKey;
                    return (
                      <button
                        key={pKey}
                        onClick={() => onUpdatePreferences({ uiColor: pKey })}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-red-500 ring-2 ring-red-500 text-white shadow-md'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow"
                          style={{ backgroundColor: p.swatchHex }}
                        />
                        <span className="truncate">{p.label.split(' ')[0]}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. FIVE INSTALLED FONTS (PER MEMBER) */}
              <div className="space-y-2.5 pt-3 border-t border-red-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    🔤 Pre-Installed App Fonts (5 Fonts)
                  </label>
                  <span className="text-[10px] text-red-400 font-semibold">Unique to your session</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INSTALLED_FONTS.map((font) => {
                    const isSelected = userPreferences.userFont === font.name;
                    return (
                      <button
                        key={font.name}
                        onClick={() => {
                          onUpdatePreferences({ userFont: font.name });
                          document.body.style.fontFamily = font.family;
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500 text-white shadow-md'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{font.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <div className="text-[11px] opacity-75 truncate mt-0.5">{font.sample}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. MEMBER PERSONAL HOME BACKGROUND */}
              <div className="space-y-2.5 pt-3 border-t border-red-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    🖼️ Personal Home Background Image
                  </label>
                  <span className="text-[10px] text-red-400 font-semibold">URL or Phone Gallery File</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={homeBgUrlState}
                    onChange={(e) => setHomeBgUrlState(e.target.value)}
                    placeholder="Paste Image URL or pick file ->"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <label className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                    <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                    <span>Pick File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLocalImageSelect(e, (dataUrl) => setHomeBgUrlState(dataUrl))}
                    />
                  </label>
                  <button
                    onClick={() => {
                      onUpdatePreferences({ homeBgUrl: homeBgUrlState.trim() });
                      alert('Personal Home Background wallpaper updated!');
                    }}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-md shrink-0"
                  >
                    Save BG
                  </button>
                </div>
              </div>

              {/* 3.5 MEMBER PROFILE PICTURE UPLOAD */}
              <div className="space-y-2.5 pt-3 border-t border-red-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    👤 Personal Member Profile Picture
                  </label>
                  <span className="text-[10px] text-red-400 font-semibold">URL or Phone Gallery File</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Current Avatar Preview */}
                  <div className="shrink-0">
                    {avatarUrlState ? (
                      <img
                        src={avatarUrlState}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-lg flex items-center justify-center border-2 border-red-500 shadow-md">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="text"
                      value={avatarUrlState}
                      onChange={(e) => setAvatarUrlState(e.target.value)}
                      placeholder="Paste Avatar Image URL or choose file ->"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                    <label className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                      <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                      <span>Pick File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLocalImageSelect(e, (dataUrl) => {
                          setAvatarUrlState(dataUrl);
                          currentUser.avatarUrl = dataUrl;
                          onUpdatePreferences({ avatarUrl: dataUrl });
                        })}
                      />
                    </label>
                    <button
                      onClick={() => {
                        currentUser.avatarUrl = avatarUrlState.trim();
                        onUpdatePreferences({ avatarUrl: avatarUrlState.trim() });
                        alert('Profile Picture updated!');
                      }}
                      className="px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-md shrink-0"
                    >
                      Save Profile Pic
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. CHURCH-WIDE BANNER, LOGO & WORKSPACE NAME (HEAD LEADER / ADMIN ONLY) */}
              {isAdminOrHeadLeader && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      👑 Church-Wide Banner & Logo (Head Leader Only)
                    </span>
                    <span className="text-[10px] text-slate-400">Updates for all church members</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Church / Local Ministry Name</label>
                      <input
                        type="text"
                        value={churchNameState}
                        onChange={(e) => setChurchNameState(e.target.value)}
                        placeholder="e.g. Grace Community Church"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Church Top Banner Image (URL or Local Gallery)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={churchBannerUrlState}
                          onChange={(e) => setChurchBannerUrlState(e.target.value)}
                          placeholder="Paste Banner URL or pick image file ->"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLocalImageSelect(e, (dataUrl) => setChurchBannerUrlState(dataUrl))}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Church Logo Badge Image (URL or Local Gallery)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={churchLogoUrlState}
                          onChange={(e) => setChurchLogoUrlState(e.target.value)}
                          placeholder="Paste Logo Image URL or pick file ->"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Logo File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLocalImageSelect(e, (dataUrl) => setChurchLogoUrlState(dataUrl))}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Church Subtitle / Tagline Text</label>
                      <input
                        type="text"
                        value={churchLogoTextState}
                        onChange={(e) => setChurchLogoTextState(e.target.value)}
                        placeholder="e.g. PRAISE & WORSHIP MINISTRY"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        onUpdateWorkspaceBannerAndName(activeWorkspace.id, churchNameState, churchBannerUrlState, churchLogoTextState, churchLogoUrlState);
                        alert('Church Workspace Banner, Logo & Name updated for all members!');
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
                    >
                      Update Church-Wide Banner, Logo & Name
                    </button>
                  </div>
                </div>
              )}

              {/* 5. LIGHT / DARK MODE */}
              <div className="space-y-2 pt-3 border-t border-red-500/20">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Light / Dark Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onToggleTheme}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      theme === 'light' ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    onClick={onToggleTheme}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      theme === 'dark' ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* 6. LOGOUT BUTTON */}
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400">Sign Out of Workspace</div>
                  <div className="text-[11px] text-slate-400">Return to the member login UI</div>
                </div>
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    onLogout();
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
