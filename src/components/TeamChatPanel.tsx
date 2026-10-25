import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Pin, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  UserCheck, 
  Sparkles,
  Bell
} from 'lucide-react';
import { UserProfile, UserRole, TeamNoteMessage } from '../types';
import { 
  getWorkspaceChatMessages, 
  addWorkspaceChatMessage, 
  deleteWorkspaceChatMessage,
  subscribeToWorkspaceChat
} from '../utils/storage';

interface TeamChatPanelProps {
  currentUser: UserProfile;
  workspaceId: string;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onToggle: () => void;
}

export const TeamChatPanel: React.FC<TeamChatPanelProps> = ({
  currentUser,
  workspaceId,
  theme,
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<TeamNoteMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (workspaceId) {
      const unsubscribe = subscribeToWorkspaceChat(workspaceId, (newMessages) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
    }
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !currentUser) return;

    await addWorkspaceChatMessage(workspaceId, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: inputContent.trim()
    });

    setInputContent('');
  };

  const handleDeleteMessage = async (msgId: string) => {
    await deleteWorkspaceChatMessage(workspaceId, msgId);
  };

  const canDeleteAny = currentUser.role === 'admin' || currentUser.role === 'head-leader' || currentUser.role === 'leader';

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-red-500 hover:bg-red-400 text-white rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce transition-all active:scale-95"
        title="Open Team Notes & Chat Box"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs font-extrabold hidden sm:inline">Team Notes & Chat ({messages.length})</span>
        {messages.length > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        )}
      </button>
    );
  }

  return (
    <aside className={`fixed top-16 right-0 bottom-0 z-40 w-full sm:w-96 flex flex-col border-l shadow-2xl transition-all duration-300 backdrop-blur-md ${
      theme === 'dark' ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-slate-50 border-red-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
        theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <span>Team Notes & Reminders</span>
              <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-500 text-[10px] font-mono font-bold">
                {messages.length}
              </span>
            </h3>
            <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Live bulletin board for worship team members</p>
          </div>
        </div>

        <button 
          onClick={onToggle}
          className={`p-1.5 rounded-xl transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-red-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
        theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-100/70'
      }`}>
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
            <p className="text-xs font-semibold">No team notes or chat messages yet.</p>
            <p className="text-[10px] text-slate-500">Post reminders, rehearsal times, or song requests!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const canDelete = isMe || canDeleteAny;
            const avatarUrl = isMe ? currentUser.avatarUrl : undefined;

            return (
              <div 
                key={msg.id}
                className={`p-3 rounded-2xl border text-xs space-y-2 transition-all shadow-sm ${
                  msg.isPinned 
                    ? theme === 'dark' ? 'bg-amber-500/15 border-amber-500/40 text-slate-100' : 'bg-amber-50 border-amber-300 text-slate-900'
                    : isMe 
                    ? theme === 'dark' ? 'bg-red-500/20 border-red-500/40 text-slate-100' : 'bg-red-50 border-red-200 text-slate-900'
                    : theme === 'dark' ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 truncate">
                    {/* User Avatar Circle */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={msg.senderName}
                        className="w-5 h-5 rounded-full object-cover border border-red-400 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold flex items-center justify-center text-[9px] shrink-0">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}

                    <span className={`font-extrabold truncate ${
                      isMe 
                        ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                        : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {msg.senderName}
                    </span>

                    <span className={`px-1.5 py-0.2 rounded uppercase font-mono text-[9px] font-bold ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {msg.senderRole}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 shrink-0 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className={`p-0.5 transition-colors ${
                          theme === 'dark' ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600'
                        }`}
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className={`text-xs leading-relaxed break-words font-medium ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t shrink-0 ${
        theme === 'dark' ? 'bg-slate-950/90 border-red-500/20' : 'bg-white border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Type a team note, rehearsal time or message..."
            className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-red-500 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            className="p-2 bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-md transition-all active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
};
