export type UserRole = 'admin' | 'head-leader' | 'leader' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
  avatarUrl?: string;
  instrument?: string;
}

export type ColorPalette = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal' | 'rose';
export type BuiltInFont = 'Outfit' | 'Plus Jakarta Sans' | 'Playfair Display' | 'Space Grotesk' | 'Inter';

export interface UserPreferences {
  uiColor: ColorPalette;
  userFont: BuiltInFont;
  homeBgUrl?: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  churchName: string;
  passcode: string; // Unique workspace passcode / link code
  createdById: string;
  createdByName: string;
  createdAt: string;
  churchBannerUrl?: string;
  churchLogoText?: string;
  churchLogoUrl?: string;
}

export interface PendingMember {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  createdAt: string;
}

export interface TeamNoteMessage {
  id: string;
  workspaceId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  isPinned?: boolean;
}

export type SongCategory = 
  | 'Praise'
  | 'Worship'
  | 'Tagalog'
  | 'English'
  | 'Communion'
  | 'Hymn'
  | 'Fast'
  | 'Slow'
  | 'Offering'
  | 'Reflection';

export interface Song {
  id: string;
  title: string;
  artist: string;
  defaultKey: string;
  tempo?: number; // BPM
  timeSignature?: string; // "4/4", "3/4", "6/8"
  categories: string[];
  lyricsWithChords: string; // Bracketed chords format e.g. [G]Amazing [D]grace
  ccli?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedLine {
  chordsLine?: string;
  lyricsLine: string;
  tokens: Array<{ chord?: string; text: string }>;
}

export interface SongSection {
  id: string;
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'tag' | 'instrumental' | 'outro';
  label: string; // e.g., "Verse 1", "Chorus 1", "Bridge"
  lines: ParsedLine[];
  plainLyrics: string;
}

export interface SetlistItem {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  keyOverride: string;
  leadSinger?: string;
  notes?: string;
  durationMinutes?: number;
}

export interface EventSetlist {
  id: string;
  title: string;
  date: string;
  time?: string;
  leaderId: string;
  leaderName: string;
  theme?: string;
  notes?: string;
  items: SetlistItem[];
  createdAt: string;
}

export interface LiveSessionState {
  roomId: string;
  activeEventId: string;
  activeSongId: string;
  activeSectionId: string;
  activeSectionLabel: string;
  activeSectionContent?: string; // Transposed lyrics for the current section
  activeSongTitle: string;
  activeArtist: string;
  currentKey: string;
  isBlackout: boolean;
  showLogo: boolean;
  stageMessage?: string;
  updatedBy: string;
  updatedAt: number;
}

export interface ProjectorSettings {
  fontSize: number; // in pixels or rem
  fontFamily: 'Outfit' | 'Plus Jakarta Sans' | 'Playfair Display' | 'monospace';
  textColor: string;
  bgColor: string;
  accentColor: string;
  alignment: 'center' | 'left';
  verticalPosition: 'center' | 'lower-third';
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  showSongTitleBanner: boolean;
  churchLogoText: string;
}
