import React, { useState } from 'react';
import { EventSetlist, Song, Workspace } from '../types';
import { parseSongLyrics } from '../utils/songParser';
import { transposeLyricsWithChords, getSemitoneDistance } from '../utils/chordTransposer';
import { Printer, X, FileText, CheckSquare, Square, Download } from 'lucide-react';

interface LeadSheetPrintModalProps {
  setlist: EventSetlist;
  songs: Song[];
  workspace: Workspace;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export const LeadSheetPrintModal: React.FC<LeadSheetPrintModalProps> = ({
  setlist,
  songs,
  workspace,
  theme,
  onClose
}) => {
  const [includeFullLeadSheets, setIncludeFullLeadSheets] = useState(true);
  const [showChords, setShowChords] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className={`w-full max-w-4xl rounded-3xl p-6 shadow-2xl border my-auto space-y-6 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
      }`}>
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-500/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-red-500 font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Sunday Setlist & Lead Sheet PDF Exporter</span>
            </div>
            <h2 className="text-xl font-bold font-display">{setlist.title}</h2>
            <p className="text-xs text-slate-400">
              {workspace.churchName} · {setlist.date} {setlist.time ? `at ${setlist.time}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIncludeFullLeadSheets(!includeFullLeadSheets)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 bg-slate-800 border-slate-700 text-slate-200"
            >
              {includeFullLeadSheets ? (
                <CheckSquare className="w-4 h-4 text-red-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>Include Lead Sheets</span>
            </button>

            <button
              onClick={() => setShowChords(!showChords)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 bg-slate-800 border-slate-700 text-slate-200"
              title={showChords ? "Switch to Lyrics Only" : "Switch to Lyrics + Chords"}
            >
              {showChords ? (
                <CheckSquare className="w-4 h-4 text-red-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>With Chords</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTAINER (This section gets printed cleanly on paper) */}
        <div id="printable-sheet-area" className="p-6 bg-white text-slate-900 rounded-2xl space-y-8 font-sans border border-slate-200 shadow-inner print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
          
          {/* Church Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {workspace.churchName}
              </h1>
              <p className="text-sm font-semibold text-slate-600">
                {setlist.title} — Order of Service & Lead Sheets
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
              <div><strong>Date:</strong> {setlist.date}</div>
              <div><strong>Time:</strong> {setlist.time || '10:00 AM'}</div>
              <div><strong>Worship Leader:</strong> {setlist.leaderName}</div>
              {setlist.theme && <div><strong>Theme:</strong> {setlist.theme}</div>}
            </div>
          </div>

          {/* Service Song Lineup Summary Table */}
          <div className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-slate-800 border-b pb-1">
              Service Lineup Summary
            </h2>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-2">Song Title</th>
                  <th className="py-2 px-2">Artist</th>
                  <th className="py-2 px-2">Key</th>
                  <th className="py-2 px-2">Lead Vocalist</th>
                  <th className="py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {setlist.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-1 font-bold text-red-600">{idx + 1}</td>
                    <td className="py-2 px-2 font-bold">{item.songTitle}</td>
                    <td className="py-2 px-2 text-slate-600">{item.artist}</td>
                    <td className="py-2 px-2 font-mono font-bold text-slate-900">{item.keyOverride}</td>
                    <td className="py-2 px-2 text-slate-700">{item.leadSinger || setlist.leaderName}</td>
                    <td className="py-2 px-2 text-slate-500">{item.durationMinutes || 5} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Full Song Lead Sheets */}
          {includeFullLeadSheets && (
            <div className="space-y-10 pt-4 border-t-2 border-slate-900 print:page-break-before-always">
              {setlist.items.map((item, idx) => {
                const song = songs.find(s => s.id === item.songId);
                if (!song) return null;

                const semitones = getSemitoneDistance(song.defaultKey, item.keyOverride);
                const transposedLyrics = transposeLyricsWithChords(song.lyricsWithChords, semitones, item.keyOverride);
                const sections = parseSongLyrics(transposedLyrics);

                return (
                  <div key={item.id} className="space-y-4 print:break-inside-avoid print:page-break-after-always">
                    {/* Song Lead Sheet Title Banner */}
                    <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
                          Song #{idx + 1} Lead Sheet
                        </span>
                        <h3 className="text-lg font-black text-slate-900">{song.title}</h3>
                        <p className="text-xs text-slate-600">{song.artist} {song.ccli ? `· CCLI: ${song.ccli}` : ''}</p>
                      </div>
                      <div className="text-right text-xs font-mono">
                        <span className="inline-block px-2 py-1 bg-slate-900 text-white rounded font-bold">
                          Key: {item.keyOverride}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">Default: {song.defaultKey}</div>
                      </div>
                    </div>

                    {/* Song Chords & Lyrics Sections */}
                    <div className="space-y-4 font-mono text-sm leading-relaxed">
                      {sections.map((section) => (
                        <div key={section.id} className="border-l-2 border-slate-800 pl-3 space-y-2">
                          <span className="text-[10px] uppercase font-sans font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                            {section.label}
                          </span>
                          <div className="space-y-2">
                            {section.lines.map((line, lIdx) => (
                              <div key={lIdx} className="space-y-0.5">
                                {showChords && line.chordsLine && (
                                  <div className="font-bold text-red-600 text-xs tracking-wide">
                                    {line.chordsLine}
                                  </div>
                                )}
                                <div className="font-sans text-xs text-slate-900">
                                  {line.lyricsLine}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t text-center text-[10px] text-slate-400 font-mono">
            Generated by WorshipFlow Workspace Platform · {workspace.churchName}
          </div>
        </div>
      </div>
    </div>
  );
};
