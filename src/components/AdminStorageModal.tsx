import React, { useState } from 'react';
import { 
  ImageIcon, 
  Upload, 
  X, 
  HardDrive, 
} from 'lucide-react';
import { UserProfile } from '../types';
import { getMemberGallery } from '../utils/storage';

interface AdminStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  theme: 'dark' | 'light';
  galleryImages: string[];
  onUploadGalleryImage: (imageUrl: string, targetMemberId?: string) => void;
  storagePermissionGranted: boolean;
}

export const AdminStorageModal: React.FC<AdminStorageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  theme,
  galleryImages,
  onUploadGalleryImage,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [memberGalleryImages, setMemberGalleryImages] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      getMemberGallery(currentUser.id).then(setMemberGalleryImages);
    }
  }, [isOpen, currentUser.id]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    onUploadGalleryImage(customUrlInput.trim(), currentUser.id);
    setCustomUrlInput('');
    setActiveTab('gallery');
    setMemberGalleryImages(prev => [customUrlInput.trim(), ...prev]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className={`w-full max-w-3xl flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-950/30">
          <h2 className="text-base font-bold">Workspace Shared Assets</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-3 flex gap-2 border-b border-slate-700 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'gallery' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shared Gallery
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'upload' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload Asset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {memberGalleryImages.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setPreviewImage(img)}
                  className="aspect-video cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt="Gallery item" className="w-full h-full object-cover rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-md mx-auto">
              <HardDrive className="w-12 h-12 text-red-500 mx-auto" />
              <input
                type="url"
                required
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Image URL"
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl"
              >
                Upload
              </button>
            </form>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
