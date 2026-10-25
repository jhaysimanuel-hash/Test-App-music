import { LiveSessionState } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY_LIVE_SESSION = 'worshipflow_live_session_state';
const DEFAULT_ROOM_ID = 'main-sanctuary';

export const INITIAL_LIVE_STATE: LiveSessionState = {
  roomId: DEFAULT_ROOM_ID,
  activeEventId: 'setlist-sunday-service',
  activeSongId: 'song-goodness-of-god',
  activeSectionId: 'section-2', // Verse 1
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
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.currentState = this.loadInitialState();

    if (typeof window !== 'undefined') {
      // Network listener
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
    console.log("Initializing sync engine for workspace:", wsId);
    if (this.currentWorkspaceId === wsId) return;
    this.currentWorkspaceId = wsId;

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    const docRef = doc(db, 'workspaces', wsId, 'live', 'current');
    this.unsubscribeFirestore = onSnapshot(docRef, (snapshot: any) => {
      console.log("Received live state update for workspace:", wsId);
      if (snapshot.exists()) {
        const data = snapshot.data() as LiveSessionState;
        this.handleIncomingState(data);
      }
    });
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
    
    // Cache to localStorage
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

  /**
   * Broadcast state changes to all listening gadgets & windows via Firestore
   */
  public async broadcastUpdate(partial: Partial<LiveSessionState>, authorName: string = 'Worship Leader') {
    const nextState: LiveSessionState = {
      ...this.currentState,
      ...partial,
      updatedBy: authorName,
      updatedAt: Date.now()
    };

    console.log("Broadcasting live state update:", partial);
    this.currentState = nextState;

    if (this.currentWorkspaceId) {
      try {
        const docRef = doc(db, 'workspaces', this.currentWorkspaceId, 'live', 'current');
        await setDoc(docRef, nextState);
      } catch (err) {
        console.error('Failed to sync live state to cloud', err);
      }
    }

    // Local notification
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
