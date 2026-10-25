import React from 'react';
import { 
  Radio, 
  BookOpen, 
  ListMusic, 
  Cast, 
  ChevronRight, 
  Calendar,
  Tv,
  Building2
} from 'lucide-react';
import { UserProfile, EventSetlist, Song, Workspace, UserPreferences } from '../types';

interface HomeDashboardProps {
  setActiveTab: (tab: 'home' | 'live' | 'library' | 'setlists' | 'projector' | 'docs') => void;
  currentUser: UserProfile;
  songs: Song[];
  setlists: EventSetlist[];
  theme: 'dark' | 'light';
  onLaunchLive: (setlistId: string) => void;
  activeWorkspace: Workspace;
  userPreferences: UserPreferences;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  setActiveTab,
  currentUser,
  songs,
  setlists,
  theme,
  onLaunchLive,
  activeWorkspace,
  userPreferences
}) => {
  const activeSetlist = setlists[0];

  const defaultBanner = '/src/assets/images/worship_hero_banner_1792855953344.jpg';
  const defaultLogo = '/src/assets/images/worship_flow_logo_1792855953074.jpg';

  const bannerUrl = activeWorkspace.churchBannerUrl || defaultBanner;
  const logoUrl = activeWorkspace.churchLogoUrl || defaultLogo;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* PROMINENT CHURCH HERO BANNER & WELCOME CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/30 shadow-2xl bg-slate-950 text-white min-h-[220px] sm:min-h-[260px] flex items-end p-6 sm:p-10 group">
        
        {/* Church / User Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${userPreferences.homeBgUrl || bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Prominent Church Logo */}
            <img 
              src={logoUrl} 
              alt="Church Emblem Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400/80 shadow-2xl shrink-0 bg-slate-900" 
            />

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/30 border border-red-500/50 text-red-300 text-xs font-extrabold uppercase tracking-widest backdrop-blur-md">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeWorkspace.churchLogoText || activeWorkspace.churchName}</span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white drop-shadow-lg">
                Welcome, {currentUser?.name || 'Worship Team'}!
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-xl drop-shadow">
                {activeWorkspace.churchName} · Passcode Server ID: <span className="font-mono text-amber-400 font-bold">{activeWorkspace.passcode}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('live')}
              className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm shadow-xl shadow-red-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Launch Live Stage</span>
            </button>

            <button
              onClick={() => setActiveTab('projector')}
              className="px-5 py-3 rounded-2xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 transition-all backdrop-blur-md shadow-lg"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Projector Cast</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'live',
            title: 'Live Stage & Sync',
            desc: 'Leader POV & Musician Chords',
            icon: Radio,
            color: 'from-red-500/20 to-red-700/10 text-red-500 border-red-500/30',
            badge: 'Active'
          },
          {
            id: 'library',
            title: 'Song Repertoire',
            desc: `${songs.length} Worship Songs in Library`,
            icon: BookOpen,
            color: 'from-emerald-500/20 to-emerald-700/10 text-emerald-500 border-emerald-500/30',
            badge: 'Repertoire'
          },
          {
            id: 'setlists',
            title: 'Service Setlists',
            desc: `${setlists.length} Scheduled Event Lineups`,
            icon: ListMusic,
            color: 'from-blue-500/20 to-blue-700/10 text-blue-500 border-blue-500/30',
            badge: 'Planner'
          },
          {
            id: 'projector',
            title: 'Projector Screen',
            desc: 'PC Display & Lower-Third Feed',
            icon: Cast,
            color: 'from-purple-500/20 to-purple-700/10 text-purple-500 border-purple-500/30',
            badge: 'Cast'
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id as any)}
              className={`group p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:scale-[1.02] ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                  : 'bg-white border-red-200 hover:border-red-300 text-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display group-hover:text-red-500 transition-colors">
                  {card.title}
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {card.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-red-500/20 flex items-center justify-between text-xs font-semibold text-red-500">
                <span>Open module</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Sunday Service Quick Launch Section */}
      {activeSetlist && (
        <div className={`rounded-3xl p-6 border shadow-xl ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-red-500/20">
            <div>
              <div className="flex items-center gap-2 text-xs text-red-500 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeSetlist.date} {activeSetlist.time ? `at ${activeSetlist.time}` : ''}</span>
                <span>·</span>
                <span>Leader: {activeSetlist.leaderName}</span>
              </div>
              <h2 className="text-xl font-bold font-display">
                Next Up: {activeSetlist.title}
              </h2>
            </div>

            <button
              onClick={() => onLaunchLive(activeSetlist.id)}
              className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Start Service Live</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {activeSetlist.items.map((item, idx) => (
              <div 
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-800/40 border-slate-800 text-white' : 'bg-red-50/60 border-red-100 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{item.songTitle}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.artist}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-mono font-bold shrink-0">
                  Key {item.keyOverride}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
