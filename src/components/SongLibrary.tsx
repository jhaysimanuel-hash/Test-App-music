import React, { useState } from 'react';
import { Song, UserProfile, EventSetlist } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Music, 
  X, 
  BookOpen, 
  RotateCcw,
  ListPlus,
  Eye,
  ChevronUp,
  ChevronDown,
  Printer
} from 'lucide-react';
import { parseSongLyrics, transposeKey } from '../utils/songParser';

interface SongLibraryProps {
  songs: Song[];
  currentUser: UserProfile;
  setlists: EventSetlist[];
  theme: 'dark' | 'light';
  onSaveSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onResetSongs: () => void;
  onSelectSongForLive: (songId: string) => void;
  onAddToSetlist: (songId: string, setlistId: string) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  songs,
  currentUser,
  setlists,
  theme,
  onSaveSong,
  onDeleteSong,
  onResetSongs,
  onSelectSongForLive,
  onAddToSetlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State for New/Edit Song
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Simple Form Fields as requested
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formDefaultKey, setFormDefaultKey] = useState('G');
  const [formLyrics, setFormLyrics] = useState('');

  // Add to setlist picker modal
  const [songToAddToSetlist, setSongToAddToSetlist] = useState<Song | null>(null);

  // Viewing Song Lyrics Reader Modal
  const [viewingSong, setViewingSong] = useState<Song | null>(null);
  const [transposedSemitones, setTransposedSemitones] = useState<number>(0);

  // Admin, Editor, and Leader can edit songs as requested
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'editor' || currentUser.role === 'leader';

  // Filter songs by title or artist
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingSong(null);
    setFormTitle('');
    setFormArtist('');
    setFormDefaultKey('G');
    setFormLyrics('[Verse 1]\n[G]Amazing [D]grace how [Em]sweet the [C]sound\n\n[Chorus]\n[G]Praise the [D]Lord');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (song: Song) => {
    setEditingSong(song);
    setFormTitle(song.title);
    setFormArtist(song.artist);
    setFormDefaultKey(song.defaultKey);
    setFormLyrics(song.lyricsWithChords);
    setIsModalOpen(true);
  };

  const handleSubmitSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newOrUpdatedSong: Song = {
      id: editingSong ? editingSong.id : `song-${Date.now()}`,
      title: formTitle.trim(),
      artist: formArtist.trim() || 'Worship Team',
      defaultKey: formDefaultKey,
      categories: ['Worship'],
      lyricsWithChords: formLyrics,
      createdAt: editingSong ? editingSong.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSong(newOrUpdatedSong);
    setIsModalOpen(false);
  };

  const handlePrintSong = (song: Song) => {
    const wantsChords = confirm(`Printing "${song.title}"\n\nClick OK to print WITH CHORDS.\nClick CANCEL to print LYRICS ONLY.`);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      window.print();
      return;
    }
    const sections = parseSongLyrics(song.lyricsWithChords);
    printWindow.document.write(`
      <html>
        <head>
          <title>Lead Sheet - ${song.title}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #0f172a; }
            h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
            .artist { font-size: 14px; color: #64748b; margin-bottom: 16px; }
            .key-badge { display: inline-block; padding: 4px 10px; background: #fee2e2; color: #dc2626; font-weight: bold; border-radius: 8px; font-size: 12px; margin-bottom: 24px; }
            .section { margin-bottom: 24px; page-break-inside: avoid; border-left: 3px solid #dc2626; padding-left: 12px; }
            .section-label { font-size: 11px; font-weight: bold; text-transform: uppercase; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
            .line { margin-bottom: 8px; }
            .chords { font-family: monospace; font-weight: bold; color: #dc2626; font-size: 13px; }
            .lyrics { font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>${song.title}</h1>
          <div class="artist">${song.artist}</div>
          <div class="key-badge">Key: ${song.defaultKey} ${!wantsChords ? '(Lyrics Only)' : ''}</div>
          ${sections.map(sec => `
            <div class="section">
              <div class="section-label">${sec.label}</div>
              ${sec.lines.map(l => `
                <div class="line">
                  ${(wantsChords && l.tokens.some(t => t.chord)) ? `<div class="chords">${l.tokens.map(t => t.chord || '').join(' ')}</div>` : ''}
                  <div class="lyrics">${l.lyricsLine || sec.plainLyrics}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className={`text-2xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Song Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simple repertoire manager: Title, Edit, Delete, Add to Setlist, and Single Song Print.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Song</span>
            </button>
          )}

          <button
            onClick={onResetSongs}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Reset default songs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search song title or artist..."
          className={`w-full rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-red-500 border transition-all ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        />
      </div>

      {/* Clean Song List */}
      <div className="space-y-2.5">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No songs found.</p>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {/* Song Title & Artist (Clickable to view full lyrics & chords) */}
              <div 
                onClick={() => {
                  setViewingSong(song);
                  setTransposedSemitones(0);
                }}
                className="flex items-center gap-3.5 cursor-pointer flex-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 font-bold text-sm group-hover:scale-105 transition-transform">
                  {song.defaultKey}
                </div>
                <div>
                  <h3 className={`text-sm font-bold group-hover:text-red-500 transition-colors flex items-center gap-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span>{song.title}</span>
                    <Eye className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-400">{song.artist}</p>
                </div>
              </div>

              {/* Action Buttons as requested: Title, Edit, Delete, Add in Setlist & Print Single Song */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handlePrintSong(song)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                  title="Print Single Song"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectSongForLive(song.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Launch on Live Stage"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Stage</span>
                </button>

                <button
                  onClick={() => setSongToAddToSetlist(song)}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold transition-colors flex items-center gap-1 border border-blue-500/30"
                  title="Add in Setlist"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Add to Setlist</span>
                </button>

                {canEdit && (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(song)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Song"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSong(song.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 transition-colors"
                      title="Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Larger Add / Edit Song Modal as requested */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-4 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-red-500/20 shrink-0">
              <h2 className="text-base font-bold font-display">
                {editingSong ? 'Edit Song & Chords (Expanded Editor)' : 'Add New Song'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSong} className="flex-1 overflow-y-auto space-y-4 text-xs pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-400 block mb-1">Song Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Goodness of God"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Default Key</label>
                  <input
                    type="text"
                    value={formDefaultKey}
                    onChange={(e) => setFormDefaultKey(e.target.value)}
                    placeholder="e.g. G"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Artist / Writer</label>
                <input
                  type="text"
                  value={formArtist}
                  onChange={(e) => setFormArtist(e.target.value)}
                  placeholder="e.g. Bethel Music"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-400">Lyrics & Chords (Bracketed Format e.g. [G]Amazing [D]grace)</label>
                  <span className="text-[10px] text-red-400">Expanded Large Textarea for easy typing & copy-paste</span>
                </div>
                <textarea
                  rows={14}
                  value={formLyrics}
                  onChange={(e) => setFormLyrics(e.target.value)}
                  placeholder="[Verse 1]&#10;[G]Amazing [D]grace how [Em]sweet the [C]sound..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-red-500 leading-relaxed shadow-inner"
                />
              </div>

              <div className="pt-3 border-t border-red-500/20 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-semibold text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-red-500 hover:bg-red-400 rounded-xl shadow-lg text-xs"
                >
                  {editingSong ? 'Save Song Changes' : 'Add Song'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add to Setlist Picker */}
      {songToAddToSetlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-display">
                Add "{songToAddToSetlist.title}" to Setlist
              </h3>
              <button onClick={() => setSongToAddToSetlist(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {setlists.map((setlist) => (
                <button
                  key={setlist.id}
                  onClick={() => {
                    onAddToSetlist(songToAddToSetlist.id, setlist.id);
                    setSongToAddToSetlist(null);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{setlist.title}</div>
                    <div className="text-[10px] text-slate-400">{setlist.date}</div>
                  </div>
                  <span className="text-xs text-red-400 font-semibold">+ Add</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CLEAN SONG LYRICS & CHORDS READER MODAL */}
      {viewingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl p-6 shadow-2xl space-y-4 border overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header with Title, Key Transposer & Print/Close */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-500/20 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold font-display">{viewingSong.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-bold text-xs border border-red-500/30">
                    Key {transposeKey(viewingSong.defaultKey, transposedSemitones)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{viewingSong.artist}</p>
              </div>

              {/* Transposer & Action Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs font-bold">
                  <span className="px-2 text-slate-400 text-[10px] uppercase">Transpose:</span>
                  <button
                    onClick={() => setTransposedSemitones(prev => prev - 1)}
                    className="p-1 hover:bg-slate-700 text-white rounded"
                    title="Key Down (-1)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-amber-400 font-mono">
                    {transposedSemitones > 0 ? `+${transposedSemitones}` : transposedSemitones}
                  </span>
                  <button
                    onClick={() => setTransposedSemitones(prev => prev + 1)}
                    className="p-1 hover:bg-slate-700 text-white rounded"
                    title="Key Up (+1)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  {transposedSemitones !== 0 && (
                    <button
                      onClick={() => setTransposedSemitones(0)}
                      className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
                  title="Print / PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setViewingSong(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render Parsed Lyrics & Chords with Transposition */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {parseSongLyrics(viewingSong.lyricsWithChords).map((section) => (
                <div key={section.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="inline-block px-3 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider border border-red-500/30">
                    {section.label}
                  </div>

                  <div className="space-y-3 pt-1">
                    {section.lines.map((line, lIdx) => (
                      <div key={lIdx} className="space-y-0.5">
                        {line.tokens.some(t => t.chord) && (
                          <div className="flex flex-wrap text-amber-400 font-mono font-bold text-xs sm:text-sm leading-none gap-2">
                            {line.tokens.map((tok, tIdx) => {
                              if (!tok.chord) return null;
                              const currentTransposedChord = transposeKey(tok.chord, transposedSemitones);
                              return (
                                <span
                                  key={tIdx}
                                  className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                >
                                  {currentTransposedChord}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed tracking-wide">
                          {line.lyricsLine || section.plainLyrics}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Lyrics & Chords Reader</span>
              <button
                onClick={() => {
                  onSelectSongForLive(viewingSong.id);
                  setViewingSong(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Music className="w-4 h-4" />
                <span>Launch on Live Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
