/**
 * WorshipFlow - Core Vanilla JavaScript & Hybrid App Controller (app.js)
 * Implements:
 * 1. RBAC via Google Sign-In (Firebase Auth)
 * 2. Real-Time Live Sync (Firebase Realtime Database: live_sessions/{room_id})
 * 3. Dual View Switcher (Musician Lyrics+Chords vs Vocalist Lyrics Only)
 * 4. Song Library CRUD & Category Filtering
 * 5. Projector Presentation Broadcast
 */

import { auth, database, signInWithGoogle, logOut } from './firebase-config.js';
import { ref, onValue, set, update, push, remove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Application State
export const AppState = {
  currentUser: null,
  currentRole: 'viewer', // 'admin' | 'leader' | 'editor' | 'viewer'
  currentRoomId: 'main-sanctuary',
  activeSongId: null,
  activeSectionId: null,
  viewMode: 'musician', // 'musician' | 'vocalist'
  songs: [],
  selectedCategory: 'All',
  selectedKey: 'All'
};

// 1. ROLE-BASED ACCESS CONTROL (RBAC) & AUTH
export function initAuthListener(onUserChanged) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Query role
      const roleRef = ref(database, `users/${user.uid}/role`);
      onValue(roleRef, (snapshot) => {
        AppState.currentUser = user;
        AppState.currentRole = snapshot.val() || 'viewer';
        if (onUserChanged) onUserChanged(AppState.currentUser, AppState.currentRole);
      });
    } else {
      AppState.currentUser = null;
      AppState.currentRole = 'viewer';
      if (onUserChanged) onUserChanged(null, 'viewer');
    }
  });
}

// 2. REAL-TIME LIVE SYNC (Firebase Realtime Database)
export function listenToLiveSession(roomId, onSyncUpdate) {
  const sessionRef = ref(database, `live_sessions/${roomId}`);
  return onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      AppState.activeSongId = data.activeSongId;
      AppState.activeSectionId = data.activeSectionId;
      if (onSyncUpdate) onSyncUpdate(data);
    }
  });
}

// Leader triggers section change -> updates database in real-time
export async function broadcastSectionChange(roomId, songId, sectionId, sectionLabel) {
  if (AppState.currentRole !== 'admin' && AppState.currentRole !== 'leader') {
    throw new Error("Permission Denied: Only Leaders and Admins can broadcast live section changes.");
  }

  const sessionRef = ref(database, `live_sessions/${roomId}`);
  return await update(sessionRef, {
    activeSongId: songId,
    activeSectionId: sectionId,
    activeSectionLabel: sectionLabel,
    updatedAt: Date.now(),
    updatedBy: AppState.currentUser ? AppState.currentUser.displayName : 'Leader'
  });
}

// 3. SONG LIBRARY CRUD & CATEGORIES
export function listenToSongLibrary(onSongsLoaded) {
  const songsRef = ref(database, 'songs');
  return onValue(songsRef, (snapshot) => {
    const data = snapshot.val() || {};
    AppState.songs = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    if (onSongsLoaded) onSongsLoaded(AppState.songs);
  });
}

export async function createSong(songData) {
  if (AppState.currentRole !== 'admin' && AppState.currentRole !== 'editor') {
    throw new Error("Permission Denied: Only Admins and Editors can create songs.");
  }
  const songsRef = ref(database, 'songs');
  const newRef = push(songsRef);
  return await set(newRef, {
    ...songData,
    createdAt: Date.now()
  });
}

export async function deleteSong(songId) {
  if (AppState.currentRole !== 'admin' && AppState.currentRole !== 'editor') {
    throw new Error("Permission Denied: Only Admins and Editors can delete songs.");
  }
  return await remove(ref(database, `songs/${songId}`));
}

// 4. SMART VIEW SWITCHER (Dual View)
export function toggleViewMode(mode) {
  AppState.viewMode = mode; // 'musician' or 'vocalist'
  const chordElements = document.querySelectorAll('.chord-tag');
  chordElements.forEach(el => {
    el.style.display = mode === 'vocalist' ? 'none' : 'inline-block';
  });
  
  const lyricElements = document.querySelectorAll('.lyric-line');
  lyricElements.forEach(el => {
    if (mode === 'vocalist') {
      el.classList.add('vocalist-enlarged');
    } else {
      el.classList.remove('vocalist-enlarged');
    }
  });
}
