import { LiveSessionState } from '../types';
import { supabase } from '../firebase';

const STORAGE_KEY_LIVE_SESSION = 'worshipflow_live_session_state';
const DEFAULT_ROOM_ID = 'main-sanctuary';

export const INITIAL_LIVE_STATE: LiveSessionState = {
  roomId: DEFAULT_ROOM_ID,
  activeEventId: 'setlist-sunday-service',
  activeSongId: 'song-goodness-of-god',
  activeSectionId: 'section-2',
  activeSectionLabel: 'Verse 1',
  activeSongTitle: 'Goodness of God',
  activeArtist: 'Bethel Music / Jenn Johnson',
  currentKey: 'G',
  isBlackout: false,
  showLogo: false,
  stageMessage: '',
  updatedBy: 'Worship Leader',
  updatedAt: Date.now()
};

type SyncListener = (state: LiveSessionState) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private currentState: LiveSessionState;
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentWorkspaceId: string | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;

  constructor() {
    this.currentState = this.loadInitialState();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineStatus = true;
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false;
        this.notifyListeners();
      });
    }
  }

  public initWorkspace(wsId: string) {
    if (this.currentWorkspaceId === wsId) return;
    this.currentWorkspaceId = wsId;

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    // Load current live state.
    this.fetchState(wsId);

    this.channel = supabase.channel(`live-${wsId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `workspace_id=eq.${wsId}` }, (payload: any) => {
        const data = payload.new;
        if (data && data.state) {
          this.handleIncomingState(data.state as LiveSessionState);
        }
      })
      .subscribe();
  }

  private async fetchState(wsId: string) {
    try {
      const { data, error } = await supabase.from('live_sessions').select('state').eq('workspace_id', wsId).maybeSingle();
      if (!error && data?.state) {
        this.handleIncomingState(data.state as LiveSessionState);
      }
    } catch (err) {
      console.warn('fetchState error:', err);
    }
  }

  private loadInitialState(): LiveSessionState {
    if (typeof window === 'undefined') return INITIAL_LIVE_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LIVE_SESSION);
      if (stored) {
        return { ...INITIAL_LIVE_STATE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not read stored live session', e);
    }
    return INITIAL_LIVE_STATE;
  }

  private handleIncomingState(newState: LiveSessionState) {
    if (!newState || (this.currentState && newState.updatedAt < this.currentState.updatedAt)) {
      return;
    }
    this.currentState = newState;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_LIVE_SESSION, JSON.stringify(newState));
      } catch (e) {}
    }
    this.notifyListeners();
  }

  public getState(): LiveSessionState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public async broadcastUpdate(partial: Partial<LiveSessionState>, authorName: string = 'Worship Leader') {
    const nextState: LiveSessionState = {
      ...this.currentState,
      ...partial,
      updatedBy: authorName,
      updatedAt: Date.now()
    };
    this.currentState = nextState;

    if (this.currentWorkspaceId) {
      try {
        await supabase.from('live_sessions').upsert({
          workspace_id: this.currentWorkspaceId,
          state: nextState,
          updated_by: authorName,
          updated_at: nextState.updatedAt,
        });
      } catch (err) {
        console.error('Failed to sync live state to cloud', err);
      }
    }

    this.notifyListeners();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }
}

export const syncEngine = new SyncEngine();
