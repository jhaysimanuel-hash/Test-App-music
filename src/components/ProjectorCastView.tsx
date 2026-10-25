import React, { useState, useRef, useEffect } from 'react';
import { Song, LiveSessionState, ProjectorSettings, UserProfile } from '../types';
import { parseSongLyrics } from '../utils/songParser';
import { 
  Tv, 
  Settings, 
  Maximize, 
  Minimize, 
  ExternalLink,
  X,
  Sparkles,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface ProjectorCastViewProps {
  songs: Song[];
  liveState: LiveSessionState;
  settings: ProjectorSettings;
  theme: 'dark' | 'light';
  galleryImages: string[];
  storagePermissionGranted: boolean;
  onRequestStoragePermission: () => void;
  onUpdateSettings: (settings: ProjectorSettings) => void;
  isStandalone?: boolean;
  currentUser: UserProfile;
  onUploadGalleryImage: (imageUrl: string, targetMemberId?: string) => void;
}

export const ProjectorCastView: React.FC<ProjectorCastViewProps> = ({
  songs,
  liveState,
  settings,
  theme,
  galleryImages,
  storagePermissionGranted,
  onRequestStoragePermission,
  onUpdateSettings,
  isStandalone = false,
  currentUser,
  onUploadGalleryImage
}) => {
  const [showControls, setShowControls] = useState<boolean>(!isStandalone);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const activeSong = React.useMemo(() => songs.find(s => s.id === liveState.activeSongId) || songs[0], [songs, liveState.activeSongId]);
  const sections = React.useMemo(() => activeSong ? parseSongLyrics(activeSong.lyricsWithChords) : [], [activeSong]);
  const currentSection = React.useMemo(() => sections.find(s => s.id === liveState.activeSectionId) || sections[0], [sections, liveState.activeSectionId]);
  
  // Font Scaling
  const [currentFontSize, setCurrentFontSize] = useState(settings.fontSize);
  useEffect(() => {
    setCurrentFontSize(settings.fontSize);
  }, [settings.fontSize]);

  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (container) {
      let fontSize = settings.fontSize;
      container.style.fontSize = `${fontSize}px`;
      while (container.scrollHeight > container.clientHeight && fontSize > 20) {
        fontSize -= 2;
        container.style.fontSize = `${fontSize}px`;
      }
      setCurrentFontSize(fontSize);
    }
  }, [liveState.activeSectionContent, settings.fontSize]);

  const canChangeBg = ['head-leader', 'leader', 'admin'].includes(currentUser.role);
  
  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onUploadGalleryImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const openInNewWindow = () => {
    const projectorUrl = `${window.location.origin}${window.location.pathname}?view=projector`;
    window.open(projectorUrl, 'WorshipFlow_Projector', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  };

  const lines = React.useMemo(() => {
    if (liveState.activeSectionContent) {
      return liveState.activeSectionContent.split('\n').filter(Boolean);
    }
    return currentSection ? currentSection.lines.map(l => l.lyricsLine).filter(Boolean) : [];
  }, [liveState.activeSectionContent, currentSection]);

  return (
    <div className="space-y-4">
      {/* Top PC Master POV */}
      {!isStandalone && (
        <div className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-red-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-sm font-bold font-display">PC Master Control POV (Operator Screen)</h2>
                <p className="text-xs text-slate-400">Select phone gallery background images to instantly project behind the lyrics.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canChangeBg && (
                <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Background</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadBg} />
                </label>
              )}
              <button
                onClick={openInNewWindow}
                className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pop-out Projector Window</span>
              </button>
            </div>
          </div>
...
          {/* Gallery Background Selector for Projector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Background from Phone Gallery (@capacitor/filesystem)
              </span>
              {!storagePermissionGranted && (
                <button
                  onClick={onRequestStoragePermission}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Allow Storage Access to load gallery
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onUpdateSettings({ ...settings, bgColor: `url(${img})` })}
                  className="w-20 h-12 rounded-xl overflow-hidden border-2 border-red-500 shrink-0 hover:scale-105 transition-transform relative group"
                >
                  <img src={img} alt="Gallery background" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold">
                    Use
                  </div>
                </button>
              ))}
              <button
                onClick={() => onUpdateSettings({ ...settings, bgColor: '#000000' })}
                className="px-4 h-12 rounded-xl bg-slate-800 text-white text-xs font-bold shrink-0 border border-slate-700"
              >
                Solid Black
              </button>
            </div>
          </div>

          {/* Quick Section Jump Buttons */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Live Section Jump
            </span>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const isActive = liveState.activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      const event = new CustomEvent('worshipflow-jump-section', { 
                        detail: { 
                          sectionId: section.id, 
                          label: section.label,
                          content: section.plainLyrics
                        } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-red-500 text-white border-red-600 shadow-md scale-105'
                        : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Screen: The Live Projected Feed Display */}
      <div 
        className={`flex items-center justify-center bg-black ${
          isStandalone ? 'fixed inset-0 z-50' : 'relative min-h-[60vh] rounded-3xl overflow-hidden border border-red-500/30 shadow-2xl'
        }`}
      >
        <div 
          className="relative aspect-video w-full max-w-full flex flex-col justify-between overflow-hidden transition-all duration-300 shadow-2xl"
          style={{
            backgroundColor: liveState.isBlackout ? '#000000' : (settings.bgColor.startsWith('url') ? undefined : settings.bgColor),
            backgroundImage: settings.bgColor.startsWith('url') ? settings.bgColor : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: settings.textColor
          }}
        >
          {/* Header toolbar */}
          <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[10px] sm:text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold">{activeSong?.title}</span>
              <span>·</span>
              <span className="text-red-400 font-semibold">{currentSection?.label || 'Verse'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControls(!showControls)}
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/10"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/10"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Projected Lyrics Area */}
          <div className={`flex-1 flex flex-col px-4 sm:px-16 py-6 sm:py-12 ${
            settings.alignment === 'center' ? 'justify-center items-center text-center' : 'justify-center text-left'
          }`}>
            {liveState.isBlackout ? (
              <div className="text-slate-700 text-xs sm:text-sm tracking-widest uppercase">BLACKOUT</div>
            ) : liveState.showLogo ? (
              <div className="text-center space-y-2 sm:space-y-3">
                <Sparkles className="w-8 h-8 sm:w-12 h-12 text-red-400 mx-auto" />
                <h1 className="text-2xl sm:text-4xl font-bold text-white font-display">{settings.churchLogoText}</h1>
              </div>
            ) : lines.length > 0 ? (
              <div ref={lyricsContainerRef} className="space-y-2 sm:space-y-4 bg-black/50 p-4 sm:p-6 rounded-3xl backdrop-blur-sm" style={{ fontSize: `${settings.fontSize}px` }}>
                {lines.map((line, idx) => (
                  <p key={idx} className="font-bold tracking-tight text-balance drop-shadow-lg text-white leading-tight">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-2 sm:space-y-3 animate-pulse">
                <Sparkles className="w-8 h-8 sm:w-12 h-12 text-red-400/50 mx-auto" />
                <h1 className="text-lg sm:text-2xl font-bold text-white/40 font-display italic">Waiting for worship leader...</h1>
                <p className="text-[10px] sm:text-xs text-white/20">Lyrics will appear here automatically when a song is selected.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 sm:p-4 flex items-center justify-between text-[8px] sm:text-xs text-white/50 bg-black/40 backdrop-blur-sm">
            <span>Sanctuary Projected Feed</span>
            <span>WorshipFlow Output</span>
          </div>

          {/* Settings Drawer */}
          {showControls && (
            <div className="absolute bottom-12 right-4 w-64 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl p-4 shadow-2xl text-white z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-500">Projector Settings</h4>
                <button onClick={() => setShowControls(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1">
                  <span>Font Size</span>
                  <span className="font-bold text-red-500">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="100"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })}
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
