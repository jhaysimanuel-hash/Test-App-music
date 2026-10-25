import React, { useState, useEffect, useRef } from 'react';
import { 
  Song, 
  EventSetlist, 
  SongSection, 
  LiveSessionState, 
  UserProfile 
} from '../types';
import { parseSongLyrics } from '../utils/songParser';
import { 
  transposeLyricsWithChords, 
  getSemitoneDistance, 
  PRIMARY_KEYS, 
  calculateCapo 
} from '../utils/chordTransposer';
import { syncEngine } from '../utils/syncEngine';
import { 
  Radio, 
  Music, 
  Mic2, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  KeyRound,
  Tv,
  MessageSquare
} from 'lucide-react';

interface LiveStageViewProps {
  currentUser: UserProfile;
  songs: Song[];
  setlists: EventSetlist[];
  liveState: LiveSessionState;
  theme: 'dark' | 'light';
  onOpenProjector: () => void;
}

export const LiveStageView: React.FC<LiveStageViewProps> = ({
  currentUser,
  songs,
  setlists,
  liveState,
  theme,
  onOpenProjector
}) => {
  const [viewMode, setViewMode] = useState<'musician' | 'vocalist'>('musician');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const activeSong = songs.find(s => s.id === liveState.activeSongId) || songs[0];
  const activeSetlist = setlists.find(s => s.id === liveState.activeEventId) || setlists[0];
  
  const [selectedKey, setSelectedKey] = useState<string>(liveState.currentKey || activeSong?.defaultKey || 'G');
  const [guitarCapoShape, setGuitarCapoShape] = useState<string>('G');
  const [showCapoCalc, setShowCapoCalc] = useState<boolean>(false);
  const [stageMessageInput, setStageMessageInput] = useState<string>('');

  useEffect(() => {
    if (liveState.currentKey) {
      setSelectedKey(liveState.currentKey);
    } else if (activeSong) {
      setSelectedKey(activeSong.defaultKey);
    }
  }, [liveState.currentKey, activeSong]);

  const semitones = activeSong ? getSemitoneDistance(activeSong.defaultKey, selectedKey) : 0;
  const transposedLyrics = activeSong 
    ? transposeLyricsWithChords(activeSong.lyricsWithChords, semitones, selectedKey)
    : '';
  const sections: SongSection[] = parseSongLyrics(transposedLyrics);

  const isLeaderOrAdmin = currentUser.role === 'leader' || currentUser.role === 'admin';

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      if (isAutoScrolling && lyricsContainerRef.current) {
        const delta = time - lastTime;
        if (delta > 30) {
          lyricsContainerRef.current.scrollTop += scrollSpeed * 0.7;
          lastTime = time;
        }
      }
      if (isAutoScrolling) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    if (isAutoScrolling) {
      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  useEffect(() => {
    if (!liveState.activeSectionId) return;
    const targetEl = document.getElementById(`section-card-${liveState.activeSectionId}`);
    if (targetEl && lyricsContainerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [liveState.activeSectionId]);

  const handleSelectSection = (section: SongSection) => {
    if (!isLeaderOrAdmin) return;
    syncEngine.broadcastUpdate({
      activeSectionId: section.id,
      activeSectionLabel: section.label,
      activeSectionContent: section.plainLyrics
    }, currentUser.name);
  };

  const handleNextSection = () => {
    if (!isLeaderOrAdmin || sections.length === 0) return;
    const currentIndex = sections.findIndex(s => s.id === liveState.activeSectionId);
    const nextIndex = (currentIndex + 1) % sections.length;
    handleSelectSection(sections[nextIndex]);
  };

  const handlePrevSection = () => {
    if (!isLeaderOrAdmin || sections.length === 0) return;
    const currentIndex = sections.findIndex(s => s.id === liveState.activeSectionId);
    const prevIndex = currentIndex <= 0 ? sections.length - 1 : currentIndex - 1;
    handleSelectSection(sections[prevIndex]);
  };

  const handleSwitchSong = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const setlistItem = activeSetlist?.items.find(i => i.songId === songId);
    const chosenKey = setlistItem?.keyOverride || song.defaultKey;

    setSelectedKey(chosenKey);

    const firstSection = parseSongLyrics(song.lyricsWithChords)[0];
    syncEngine.broadcastUpdate({
      activeSongId: song.id,
      activeSongTitle: song.title,
      activeArtist: song.artist,
      currentKey: chosenKey,
      activeSectionId: firstSection?.id || 'section-1',
      activeSectionLabel: firstSection?.label || 'Verse 1',
      activeSectionContent: firstSection?.plainLyrics || ''
    }, currentUser.name);
  };

  const handleKeyChange = (newKey: string) => {
    setSelectedKey(newKey);
    if (isLeaderOrAdmin) {
      syncEngine.broadcastUpdate({ currentKey: newKey }, currentUser.name);
    }
  };



  const capoInfo = calculateCapo(selectedKey, guitarCapoShape);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      {/* Broadcast Banner removed */}

      {/* Top Stage Control Strip */}
      <div className={`border rounded-2xl p-3 sm:p-4 shadow-xl ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                <span className="font-semibold text-red-500">
                  {isLeaderOrAdmin ? 'Leader Live Control' : 'Connected Gadget (Live Follow)'}
                </span>
                <span>·</span>
                <span>Room: {liveState.roomId}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display flex items-center gap-2">
                {activeSong?.title}
                <span className={`text-xs px-2 py-0.5 rounded border font-normal font-sans ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
                }`}>
                  Key: {selectedKey}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSong?.artist} · Active Section: <span className="text-red-500 font-semibold">{liveState.activeSectionLabel}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-50 border-red-200'}`}>
              <button
                onClick={() => setViewMode('musician')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'musician'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Musician</span>
              </button>
              <button
                onClick={() => setViewMode('vocalist')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'vocalist'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>Vocalist</span>
              </button>
            </div>

            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-50 border-red-200'}`}>
              <KeyRound className="w-3.5 h-3.5 text-red-500 ml-1" />
              <select
                value={selectedKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                {PRIMARY_KEYS.map((k) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">{k}</option>
                ))}
              </select>
            </div>

            {viewMode === 'musician' && (
              <button
                onClick={() => setShowCapoCalc(!showCapoCalc)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                  showCapoCalc 
                    ? 'bg-red-500 text-white border-red-600' 
                    : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
                }`}
              >
                Capo
              </button>
            )}

            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`p-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                isAutoScrolling ? 'bg-red-500 text-white border-red-600 animate-pulse' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Scroll</span>
            </button>

            <button
              onClick={onOpenProjector}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1 ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-red-50 border-red-200 text-slate-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span>Projector</span>
            </button>
          </div>
        </div>

        {showCapoCalc && (
          <div className="mt-3 pt-3 border-t border-red-500/20 text-xs flex items-center justify-between">
            <span>Guitar Capo: {capoInfo.message}</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Setlist & Section Trigger Pad */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`border rounded-2xl p-4 shadow-lg ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
              Service Setlist ({activeSetlist?.items.length || 0})
            </h2>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {activeSetlist?.items.map((item, idx) => {
                const isCurrent = item.songId === activeSong?.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => isLeaderOrAdmin && handleSwitchSong(item.songId)}
                    disabled={!isLeaderOrAdmin}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                      isCurrent
                        ? 'bg-red-500/20 border-red-500/50 text-red-500 font-bold'
                        : theme === 'dark' ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-red-50/50 border-red-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item.songTitle}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 font-mono font-bold shrink-0">
                      {item.keyOverride}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`border rounded-2xl p-4 shadow-lg ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-red-500" />
                <h2 className="text-xs uppercase tracking-wider font-bold">
                  {isLeaderOrAdmin ? 'Leader Section Controller' : 'Live Sync Stream'}
                </h2>
              </div>
              {isLeaderOrAdmin && (
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevSection} className="p-1 rounded bg-red-500/20 text-red-500"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleNextSection} className="p-1 rounded bg-red-500/20 text-red-500"><ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sections.map((section) => {
                const isActive = liveState.activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSelectSection(section)}
                    disabled={!isLeaderOrAdmin}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'bg-red-500 border-red-600 text-white font-bold shadow-lg shadow-red-500/30 scale-[1.01] ring-2 ring-red-400'
                        : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{section.label}</span>
                      {isActive && <span className="text-[9px] uppercase font-bold bg-white text-red-600 px-1 rounded">LIVE</span>}
                    </div>
                  </button>
                );
              })}
            </div>


            {/* Controls removed */}
          </div>
        </div>

        {/* Right Column: Highlighting Reader (No blinking / flashing animation) */}
        <div className="lg:col-span-8">
          <div 
            ref={lyricsContainerRef}
            className={`border rounded-2xl p-4 sm:p-6 shadow-xl max-h-[75vh] overflow-y-auto space-y-6 scroll-smooth ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
            }`}
            style={{ fontSize: `${16 * fontSizeMultiplier}px` }}
          >
            {sections.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No lyrics available.</div>
            ) : (
              sections.map((section) => {
                const isActive = liveState.activeSectionId === section.id;
                return (
                  <div
                    key={section.id}
                    id={`section-card-${section.id}`}
                    onClick={() => isLeaderOrAdmin && handleSelectSection(section)}
                    className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 border ${
                      isActive
                        ? 'bg-red-500/15 border-l-4 border-l-red-500 border-red-500/40 shadow-xl ring-2 ring-red-500/30'
                        : theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-red-50/30 border-red-100 hover:border-red-300'
                    } ${isLeaderOrAdmin ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-md ${
                          isActive
                            ? 'bg-red-500 text-white shadow-sm'
                            : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-red-100 text-red-700'
                        }`}>
                          {section.label} {isActive ? 'LIVE' : ''}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Active Leader Section
                          </span>
                        )}
                      </div>
                    </div>

                    {viewMode === 'vocalist' ? (
                      <div className="space-y-2 font-medium leading-relaxed">
                        {section.lines.map((line, lIdx) => (
                          <p key={lIdx} className={`text-base sm:text-lg ${isActive ? 'text-red-600 dark:text-red-300 font-bold' : ''}`}>
                            {line.lyricsLine}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 font-chord leading-normal">
                        {section.lines.map((line, lIdx) => {
                          if (line.tokens && line.tokens.length > 0) {
                            return (
                              <div key={lIdx} className="flex flex-wrap items-end gap-x-2 gap-y-1">
                                {line.tokens.map((token, tIdx) => (
                                  <div key={tIdx} className="inline-flex flex-col">
                                    {token.chord ? (
                                      <span className="text-red-500 font-bold text-xs sm:text-sm mb-1 text-left">
                                        {token.chord}
                                      </span>
                                    ) : (
                                      <span className="text-xs opacity-0 mb-1 select-none">·</span>
                                    )}
                                    <span className={`text-sm sm:text-base font-sans ${isActive ? 'font-bold' : ''}`}>
                                      {token.text || '\u00A0'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div key={lIdx}>
                              {line.chordsLine && <div className="text-red-500 font-bold text-xs sm:text-sm">{line.chordsLine}</div>}
                              <div className="text-sm sm:text-base font-sans">{line.lyricsLine}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
