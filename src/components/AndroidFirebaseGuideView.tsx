import React, { useState } from 'react';
import { 
  Sparkles, 
  Printer, 
  Image as ImageIcon, 
  Users, 
  Radio, 
  Maximize2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Tag, 
  MessageSquare, 
  X, 
  Zap, 
  Bug, 
  Layers, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface UpdateItem {
  id: string;
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'fix';
  category: string;
  title: string;
  icon: React.ElementType;
  description: string;
  details: string[];
}

export const AndroidFirebaseGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'feature' | 'improvement' | 'fix'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updatesList: UpdateItem[] = [
    // LATEST FEATURES
    {
      id: 'cloud-migration',
      version: 'v3.0.0',
      date: 'Latest Update',
      type: 'feature',
      category: 'Cloud & Infrastructure',
      title: 'Full Firebase Cloud Migration',
      icon: Zap,
      description: 'The entire application is now powered by Firebase for real-time data synchronization.',
      details: [
        'Secure Authentication: Implement Google Login for all team members with isolated user profiles.',
        'Real-time Live Stage: Live stage changes (sections, keys, blackout) now sync instantly across all connected devices in the church.',
        'Persistent Cloud Storage: Songs, setlists, and chat messages are now securely stored in Firestore and available on any device.',
        'Automated RBAC: Server-side security rules enforce roles (Head Leader, Leader, Editor, Viewer) for data integrity.'
      ]
    },
    {
      id: 'sync-indicator',
      version: 'v2.6.0',
      date: 'Latest Update',
      type: 'feature',
      category: 'Cloud & Sync',
      title: 'Cloud Sync Status Indicator',
      icon: Radio,
      description: 'Real-time visibility of your connection and data sync status.',
      details: [
        'Sync Badge: New subtle indicator in the top navbar shows "Cloud Synced" when online and "Offline Mode" when disconnected.',
        'Data Safety: Visual confirmation that your changes are safe even when working offline.',
        'Network Awareness: Instant feedback when switching between online and offline states.'
      ]
    },
    {
      id: 'print-single',
      version: 'v2.5.0',
      date: 'Latest Update',
      type: 'feature',
      category: 'Printing & PDF',
      title: 'Single-Song Printing & Print Options',
      icon: Printer,
      description: 'Easily print or export individual songs straight from your repertoire.',
      details: [
        'Single Song Printer: Click the printer icon on any song card in the Song Library to trigger an instant print preview.',
        'Custom Print Modes: Select between "Lyrics + Chords" (for band musicians) or "Lyrics Only" (for vocalists).',
        'Printable Sunday Setlists: Export full setlists with automatic page layout and key signatures.'
      ]
    },
    {
      id: 'profile-pic-name',
      version: 'v2.4.5',
      date: 'Latest Update',
      type: 'feature',
      category: 'User & Profile',
      title: 'Member Profile Pictures & Name Editing',
      icon: Users,
      description: 'Personalize your profile picture and team display name.',
      details: [
        'Custom Avatars: Upload personal profile pictures via local phone gallery files or image web links.',
        'User Display Name: Change your display name anytime through App Settings or Team Modal.',
        'Real-time Presence: Display avatar and custom name automatically sync across stage view and team list.'
      ]
    },
    {
      id: 'church-banner-logo',
      version: 'v2.4.0',
      date: 'Latest Update',
      type: 'feature',
      category: 'Branding & Media',
      title: 'Church Hero Banner & Logo Customization',
      icon: ImageIcon,
      description: 'Prominently display your church branding and worship ministry images.',
      details: [
        'Custom Banner & Logo: Upload top hero banner background image and church logo badge.',
        'Local Storage Uploads: Full support for picking images from phone photo gallery.',
        'Enhanced Dashboard: Banner and emblem featured on the church home view.'
      ]
    },

    // IMPROVEMENTS
    {
      id: 'chat-readability',
      version: 'v2.3.0',
      date: 'Recent Update',
      type: 'improvement',
      category: 'UI & Contrast',
      title: 'Chat Box Readability & High Text Contrast',
      icon: MessageSquare,
      description: 'Optimized typography for clear reading in Light Mode and Dark Mode.',
      details: [
        'Light Mode Contrast: Dark text with high visibility background colors for daylight outdoor rehearsals.',
        'Dark Mode Contrast: Crisp high-contrast text against dark surface containers.',
        'Decluttered Navbar: Removed unnecessary theme icons and chat buttons from top navigation bar.'
      ]
    },
    {
      id: 'responsive-orientation',
      version: 'v2.2.0',
      date: 'Recent Update',
      type: 'improvement',
      category: 'Layout & Responsiveness',
      title: 'Screen Size & Orientation Optimization',
      icon: Maximize2,
      description: 'Responsive layout fitting all mobile screens, tablets, and orientation modes.',
      details: [
        'Portrait & Landscape: Flawless layout adaptivity across all devices and aspect ratios.',
        'Zero Overlap Discipline: Prevented text overflow, button clipping, and side-scrolling gaps.'
      ]
    },

    // BUG FIXES
    {
      id: 'navbar-profile-fix',
      version: 'v2.5.1',
      date: 'Latest Fix',
      type: 'fix',
      category: 'Navigation Fix',
      title: 'Fixed Top-Right Profile Overflow & Top-Left Live Icon',
      icon: Bug,
      description: 'Resolved profile container clipping on small viewports and removed pulsing live icon.',
      details: [
        'Top-Right Profile Fix: Restructured Zone 3 flex constraints to prevent profile avatar and name from overflowing off-screen.',
        'Removed Top-Left Live Icon: Cleaned up brand logo area by removing the pulsing radio indicator.',
        'Responsive Truncation: Guaranteed profile avatar and display name are always visible on mobile screens.'
      ]
    },
    {
      id: 'stage-eye-strain-fix',
      version: 'v2.1.5',
      date: 'Recent Fix',
      type: 'fix',
      category: 'Stage View Fix',
      title: 'Removed Eye-Strain Animations & Star Icon',
      icon: Bug,
      description: 'Eliminated distracting color animations and star icons from the stage display.',
      details: [
        'Color Stability: Removed alternating/changing text background colors on worship leader lyrics.',
        'Clean Visuals: Removed star icon on live stage view for a distraction-free presenter display.'
      ]
    }
  ];

  const filteredUpdates = selectedType === 'all' 
    ? updatesList 
    : updatesList.filter(u => u.type === selectedType);

  const featuresCount = updatesList.filter(u => u.type === 'feature').length;
  const improvementsCount = updatesList.filter(u => u.type === 'improvement').length;
  const fixesCount = updatesList.filter(u => u.type === 'fix').length;

  const handleCopySummary = () => {
    const summaryText = `WorshipFlow System Updates & What's New:\n\n` +
      `🚀 FEATURES (${featuresCount}):\n` +
      updatesList.filter(u => u.type === 'feature').map(u => ` - ${u.title}: ${u.description}`).join('\n') +
      `\n\n⚡ IMPROVEMENTS (${improvementsCount}):\n` +
      updatesList.filter(u => u.type === 'improvement').map(u => ` - ${u.title}: ${u.description}`).join('\n') +
      `\n\n🐛 BUG FIXES (${fixesCount}):\n` +
      updatesList.filter(u => u.type === 'fix').map(u => ` - ${u.title}: ${u.description}`).join('\n');
    
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>What's New & System Updates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              WorshipFlow System Updates
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time platform logs for latest features, system improvements, and bug fixes to keep your worship team informed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>Open Release Modal</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Counters & Filter Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedType('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedType === 'all'
              ? 'bg-red-500/15 border-red-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">All Updates</div>
          <div className="text-xl font-black text-white mt-1 font-display">{updatesList.length} Overview</div>
        </button>

        <button
          onClick={() => setSelectedType('feature')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedType === 'feature'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Latest Features</span>
          </div>
          <div className="text-xl font-black text-white mt-1 font-display">{featuresCount} Features</div>
        </button>

        <button
          onClick={() => setSelectedType('improvement')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedType === 'improvement'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Improvements</span>
          </div>
          <div className="text-xl font-black text-white mt-1 font-display">{improvementsCount} Enhancements</div>
        </button>

        <button
          onClick={() => setSelectedType('fix')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedType === 'fix'
              ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Bug className="w-3 h-3" />
            <span>Bug Fixes</span>
          </div>
          <div className="text-xl font-black text-white mt-1 font-display">{fixesCount} Resolved</div>
        </button>
      </div>

      {/* Updates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredUpdates.map((item) => {
          const IconComponent = item.icon;
          const isFeature = item.type === 'feature';
          const isImprovement = item.type === 'improvement';

          return (
            <div 
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl space-y-4 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-2xl border ${
                      isFeature 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                        : isImprovement 
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-white font-display">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isFeature 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : isImprovement 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {item.description}
                </p>

                {/* Bullet List */}
                <div className="pt-2 space-y-2 border-t border-slate-800/80">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        isFeature ? 'text-emerald-500' : isImprovement ? 'text-amber-500' : 'text-purple-500'
                      }`} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version Footer */}
              <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/60 mt-2">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{item.version}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{item.date}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* WHAT'S NEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-5 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-500/15 border border-red-500/30 text-red-500 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">System Updates & What's New</h3>
                  <p className="text-xs text-slate-400">Latest features, improvements, and bug fixes for the worship team</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              
              {/* 1. LATEST FEATURES */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                  <span>Latest Features</span>
                </div>
                <div className="space-y-3">
                  {updatesList.filter(u => u.type === 'feature').map(u => (
                    <div key={u.id} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300">{u.title}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">{u.version}</span>
                      </div>
                      <p className="text-xs text-slate-300">{u.description}</p>
                      <ul className="space-y-1 pt-1">
                        {u.details.map((d, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. IMPROVEMENTS */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pb-2 border-b border-amber-500/20">
                  <Zap className="w-4 h-4" />
                  <span>System Improvements</span>
                </div>
                <div className="space-y-3">
                  {updatesList.filter(u => u.type === 'improvement').map(u => (
                    <div key={u.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{u.title}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">{u.version}</span>
                      </div>
                      <p className="text-xs text-slate-300">{u.description}</p>
                      <ul className="space-y-1 pt-1">
                        {u.details.map((d, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. BUG FIXES */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 pb-2 border-b border-purple-500/20">
                  <Bug className="w-4 h-4" />
                  <span>Bug Fixes & UX Repairs</span>
                </div>
                <div className="space-y-3">
                  {updatesList.filter(u => u.type === 'fix').map(u => (
                    <div key={u.id} className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300">{u.title}</span>
                        <span className="text-[10px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/20">{u.version}</span>
                      </div>
                      <p className="text-xs text-slate-300">{u.description}</p>
                      <ul className="space-y-1 pt-1">
                        {u.details.map((d, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-purple-500 font-bold">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">WorshipFlow v2.5.1 Build</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow"
              >
                Close Update Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

