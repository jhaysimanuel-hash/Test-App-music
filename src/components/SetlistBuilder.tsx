import React, { useState } from 'react';
import { EventSetlist, SetlistItem, Song, UserProfile } from '../types';
import { PRIMARY_KEYS } from '../utils/chordTransposer';
import { 
  ListMusic, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Radio, 
  X, 
  Search,
  Music,
  User,
  Printer
} from 'lucide-react';
import { Workspace } from '../types';
import { LeadSheetPrintModal } from './LeadSheetPrintModal';

interface SetlistBuilderProps {
  setlists: EventSetlist[];
  songs: Song[];
  currentUser: UserProfile;
  activeWorkspace: Workspace;
  activeSetlistId: string;
  theme: 'dark' | 'light';
  onSaveSetlist: (setlist: EventSetlist) => void;
  onDeleteSetlist: (setlistId: string) => void;
  onLaunchLiveSetlist: (setlist: EventSetlist) => void;
}

export const SetlistBuilder: React.FC<SetlistBuilderProps> = ({
  setlists,
  songs,
  currentUser,
  activeWorkspace,
  activeSetlistId,
  theme,
  onSaveSetlist,
  onDeleteSetlist,
  onLaunchLiveSetlist
}) => {
  const [selectedSetlistId, setSelectedSetlistId] = useState<string>(
    activeSetlistId || setlists[0]?.id || ''
  );
  
  React.useEffect(() => {
    if (!selectedSetlistId && setlists.length > 0) {
      setSelectedSetlistId(activeSetlistId || setlists[0].id);
    }
  }, [setlists, activeSetlistId, selectedSetlistId]);
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-11-08');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventLeader, setNewEventLeader] = useState(currentUser.name);
  const [newEventTheme, setNewEventTheme] = useState('');

  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [songPickerSearch, setSongPickerSearch] = useState('');

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'editor' || currentUser.role === 'leader' || currentUser.role === 'head-leader';
  const currentSetlist = setlists.find(s => s.id === selectedSetlistId) || setlists[0];

  const canDelete = currentUser.role === 'admin' || currentUser.role === 'leader' || currentUser.role === 'head-leader';

  const handleCreateNewSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newSetlist: EventSetlist = {
      id: `setlist-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      leaderId: currentUser.id,
      leaderName: newEventLeader.trim() || currentUser.name,
      theme: newEventTheme.trim(),
      items: [],
      createdAt: new Date().toISOString()
    };

    onSaveSetlist(newSetlist);
    setSelectedSetlistId(newSetlist.id);
    setIsNewEventModalOpen(false);
    setNewEventTitle('');
    setNewEventTheme('');
  };

  const handleAddSongToSetlist = (song: Song) => {
    if (!currentSetlist) return;

    const newItem: SetlistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      songId: song.id,
      songTitle: song.title,
      artist: song.artist,
      keyOverride: song.defaultKey,
      leadSinger: currentSetlist.leaderName,
      durationMinutes: 5
    };

    const updated: EventSetlist = {
      ...currentSetlist,
      items: [...currentSetlist.items, newItem]
    };

    onSaveSetlist(updated);
    setIsSongPickerOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!currentSetlist || !window.confirm('Remove this song from setlist?')) return;
    const updated: EventSetlist = {
      ...currentSetlist,
      items: currentSetlist.items.filter(i => i.id !== itemId)
    };
    onSaveSetlist(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!currentSetlist) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSetlist.items.length) return;

    const items = [...currentSetlist.items];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    onSaveSetlist({ ...currentSetlist, items });
  };

  const handleUpdateItemKey = (itemId: string, newKey: string) => {
    if (!currentSetlist) return;
    const items = currentSetlist.items.map(i => i.id === itemId ? { ...i, keyOverride: newKey } : i);
    onSaveSetlist({ ...currentSetlist, items });
  };

  const handleUpdateItemLead = (itemId: string, newLead: string) => {
    if (!currentSetlist) return;
    const items = currentSetlist.items.map(i => i.id === itemId ? { ...i, leadSinger: newLead } : i);
    onSaveSetlist({ ...currentSetlist, items });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b ${
        theme === 'dark' ? 'border-slate-800 text-white' : 'border-red-200 text-slate-900'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Setlist Builder</span>
            <span>·</span>
            <span>{setlists.length} Scheduled Events</span>
          </div>
          <h1 className={`text-2xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Event Lineups & Setlists
          </h1>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsNewEventModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Grid: Left Event Selector, Right Lineup Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Events List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">
            Available Service Events
          </h2>

          <div className="space-y-2">
            {setlists.map((setlist) => {
              const isSelected = setlist.id === currentSetlist?.id;
              const isLive = setlist.id === activeSetlistId;

              return (
                <div
                  key={setlist.id}
                  onClick={() => setSelectedSetlistId(setlist.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? theme === 'dark' ? 'bg-slate-900 border-red-500/40 shadow-lg' : 'bg-red-50 border-red-300 shadow-sm'
                      : theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-red-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{setlist.title}</h3>
                    {isLive && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500 text-white shrink-0 animate-pulse">
                        ACTIVE LIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{setlist.date}</span>
                    {setlist.time && (
                      <>
                        <span>·</span>
                        <span>{setlist.time}</span>
                      </>
                    )}
                  </div>

                  <div className={`flex items-center justify-between text-xs text-slate-400 mt-3 pt-2.5 border-t ${
                    theme === 'dark' ? 'border-slate-800' : 'border-red-100'
                  }`}>
                    <span>{setlist.items.length} Songs</span>
                    <span>Leader: {setlist.leaderName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Setlist Items */}
        <div className="lg:col-span-8">
          {currentSetlist ? (
            <div className={`border rounded-2xl p-5 shadow-xl space-y-5 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-500/20">
                <div>
                  <div className="flex items-center gap-2 text-xs text-red-500 mb-0.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{currentSetlist.date} {currentSetlist.time ? `at ${currentSetlist.time}` : ''}</span>
                    <span>·</span>
                    <span>Leader: {currentSetlist.leaderName}</span>
                  </div>
                  <h2 className="text-xl font-bold font-display">{currentSetlist.title}</h2>
                  {currentSetlist.theme && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">Theme: {currentSetlist.theme}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-red-50 border-red-200 text-slate-800 hover:bg-red-100'
                    }`}
                    title="Print Sunday Setlist & Chords Lead Sheet PDF"
                  >
                    <Printer className="w-4 h-4 text-red-500" />
                    <span>Print / Export PDF</span>
                  </button>

                  <button
                    onClick={() => onLaunchLiveSetlist(currentSetlist)}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Launch Live on Stage</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you absolutely sure you want to delete this setlist? This action cannot be undone.')) {
                          onDeleteSetlist(currentSetlist.id);
                          if (setlists.length > 1) {
                            const other = setlists.find(s => s.id !== currentSetlist.id);
                            if (other) setSelectedSetlistId(other.id);
                          }
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Delete Setlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Setlist Song List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Song Order & Key Overrides ({currentSetlist.items.length})
                  </h3>
                  {canEdit && (
                    <button
                      onClick={() => setIsSongPickerOpen(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Song from Library</span>
                    </button>
                  )}
                </div>

                {currentSetlist.items.length === 0 ? (
                  <div className={`text-center py-12 border rounded-xl text-slate-400 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-red-50/50 border-red-100'
                  }`}>
                    <Music className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs">No songs added to this setlist yet.</p>
                    <button
                      onClick={() => setIsSongPickerOpen(true)}
                      className="mt-2 text-xs text-red-500 font-bold hover:underline"
                    >
                      Click here to choose songs from library
                    </button>
                  </div>
                ) : (
                  currentSetlist.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        theme === 'dark' ? 'bg-slate-800/50 border-slate-800 text-white' : 'bg-red-50/40 border-red-100 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-white disabled:opacity-20">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === currentSetlist.items.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div>
                          <div className="text-sm font-bold">{item.songTitle}</div>
                          <div className="text-xs text-slate-400">{item.artist}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1 ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'
                        }`}>
                          <label className="text-[11px] text-slate-400">Key:</label>
                          <select
                            value={item.keyOverride}
                            onChange={(e) => handleUpdateItemKey(item.id, e.target.value)}
                            disabled={!canEdit}
                            className="bg-transparent text-xs font-bold text-red-500 focus:outline-none cursor-pointer"
                          >
                            {PRIMARY_KEYS.map((k) => (
                              <option key={k} value={k} className="bg-slate-900 text-white">{k}</option>
                            ))}
                          </select>
                        </div>

                        <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1 ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'
                        }`}>
                          <User className="w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={item.leadSinger || ''}
                            onChange={(e) => handleUpdateItemLead(item.id, e.target.value)}
                            disabled={!canEdit}
                            placeholder="Lead Vocalist"
                            className="bg-transparent text-xs placeholder-slate-500 focus:outline-none w-24"
                          />
                        </div>

                        {canEdit && (
                          <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={`border rounded-2xl p-12 text-center text-slate-400 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-200'
            }`}>
              <p>Select or create a service setlist on the left.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Event */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
              <h2 className="text-base font-bold font-display">Create Service Event</h2>
              <button onClick={() => setIsNewEventModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSetlist} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Sunday Worship Celebration"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Service Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-red-500/20 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewEventModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl shadow-md">Create Setlist</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Song Picker */}
      {isSongPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl max-h-[80vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-4 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
              <h2 className="text-base font-bold font-display">Add Song to Setlist</h2>
              <button onClick={() => setIsSongPickerOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={songPickerSearch}
                onChange={(e) => setSongPickerSearch(e.target.value)}
                placeholder="Search songs..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {songs
                .filter(s => s.title.toLowerCase().includes(songPickerSearch.toLowerCase()))
                .map(song => (
                  <button
                    key={song.id}
                    onClick={() => handleAddSongToSetlist(song)}
                    className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 flex items-center justify-between text-white"
                  >
                    <div>
                      <div className="text-xs font-bold">{song.title}</div>
                      <div className="text-[11px] text-slate-400">{song.artist} · Key {song.defaultKey}</div>
                    </div>
                    <span className="text-xs text-red-400 font-semibold">+ Add</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lead Sheet & Setlist Print PDF Exporter */}
      {isPrintModalOpen && currentSetlist && (
        <LeadSheetPrintModal
          setlist={currentSetlist}
          songs={songs}
          workspace={activeWorkspace}
          theme={theme}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
