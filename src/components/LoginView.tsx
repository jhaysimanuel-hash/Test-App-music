import React, { useState, useEffect } from 'react';
import { Radio, ArrowRight, Clock, Plus, Key, Sparkles } from 'lucide-react';
import { UserProfile, Workspace } from '../types';
import { signInWithGoogle } from '../firebase';
import { 
  getWorkspaces, 
  createWorkspace, 
  addPendingMember,
  findWorkspaceByPasscode,
  setActiveWorkspaceId,
  getCurrentUserProfile
} from '../utils/storage';

interface LoginViewProps {
  onLogin: (user: UserProfile, workspaceId: string) => void;
  theme: 'dark' | 'light';
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, theme }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [authStage, setAuthStage] = useState<'initial' | 'setup-profile' | 'pending'>('initial');

  // Navigation mode: 'join-passcode' (Members paste passcode ID) | 'create-workspace' (Auto Head Leader)
  const [mode, setMode] = useState<'join-passcode' | 'create-workspace'>('join-passcode');

  // Profile setup fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');

  // Join Workspace via Passcode fields
  const [passcodeInput, setPasscodeInput] = useState('');

  // Create Workspace fields (Auto Head Leader)
  const [newChurchName, setNewChurchName] = useState('');

  const [targetPendingWs, setTargetPendingWs] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaces().then(setWorkspaces).catch((err: unknown) => {
      console.warn('Unable to load workspaces:', err);
    });
  }, []);

  const handleGoogleLoginAction = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        setUid(user.uid);
        setEmail(user.email || '');
        setName(user.displayName || '');

        const profile = await getCurrentUserProfile();
        if (profile && profile.workspaceId) {
          setActiveWorkspaceId(profile.workspaceId);
          onLogin(profile, profile.workspaceId);
        } else if (profile) {
          // Profile exists but no workspace
          setAuthStage('setup-profile');
        } else {
          // Brand new user
          setAuthStage('setup-profile');
        }
      }
    } catch (err: any) {
      const code = typeof err?.code === 'string' ? err.code : '';
      const message = code === 'auth/unauthorized-domain'
        ? 'This app address is not enabled for Google sign-in in Firebase.'
        : code === 'auth/operation-not-allowed'
          ? 'Google sign-in is not enabled in Firebase for this app.'
          : err?.message || 'Failed to sign in with Google';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Joining Church Workspace via Passcode ID
  const handleJoinByPasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!passcodeInput.trim()) {
      setError('Please enter the Workspace Passcode.');
      setLoading(false);
      return;
    }

    try {
      const foundWs = await findWorkspaceByPasscode(passcodeInput.trim());

      if (!foundWs) {
        setError('Invalid Passcode ID. Please check with your Head Leader.');
        return;
      }

      await addPendingMember({
        id: uid,
        name: name.trim(),
        email: email.trim(),
        workspaceId: foundWs.id
      });

      setTargetPendingWs(foundWs);
      setAuthStage('pending');
    } catch (err: any) {
      setError(err?.message || 'Could not connect to the church workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Creating Workspace (Auto Head Leader Entry)
  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!newChurchName.trim()) {
      setError('Please enter a church name.');
      setLoading(false);
      return;
    }

    const tempHeadLeader: UserProfile = {
      id: uid,
      name: name.trim(),
      email: email.trim(),
      role: 'head-leader',
      instrument: 'Worship Head Leader'
    };

    try {
      const newWs = await createWorkspace(newChurchName.trim(), tempHeadLeader);
      onLogin({ ...tempHeadLeader, workspaceId: newWs.id }, newWs.id);
    } catch (err: any) {
      setError(err?.message || 'Could not create the church workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authStage === 'pending' && targetPendingWs) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-red-50 via-white to-red-100 text-slate-900'
      }`}>
        <div className="w-full max-w-md text-center space-y-6">
          <div className={`rounded-3xl p-8 shadow-2xl border space-y-5 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-200'
          }`}>
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display">Waiting for Head Leader Approval</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your application to join <b>{targetPendingWs.churchName}</b> has been submitted. once accepted by the Head Leader, you will automatically enter as a <b>Viewer</b>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-left text-xs space-y-1">
              <div className="text-slate-400">Applicant: <b className="text-white">{name}</b></div>
              <div className="text-slate-400">Email: <b className="text-white">{email}</b></div>
              <div className="text-slate-400">Church Workspace: <b className="text-amber-400">{targetPendingWs.churchName}</b></div>
              <div className="text-slate-400">Default Role upon Acceptance: <b className="text-emerald-400">Viewer</b></div>
            </div>

            <button
              onClick={() => setAuthStage('initial')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-all"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-red-50 via-white to-red-100 text-slate-900'
    }`}>
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto shadow-lg shadow-red-500/10">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">WorshipFlow Cloud</h1>
          <p className="text-xs text-slate-400">Secure real-time worship management for church teams</p>
        </div>

          {authStage === 'initial' ? (
            <div className={`rounded-3xl p-8 shadow-2xl border text-center space-y-6 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-200'
            }`}>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Welcome Back</h2>
                <p className="text-xs text-slate-400">Sign in to sync your library, setlists, and live stage</p>
              </div>

              <button
                onClick={handleGoogleLoginAction}
                disabled={loading}
                className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 border border-slate-200"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              {error && (
                <p className="text-xs text-red-500 font-bold">{error}</p>
              )}

              <p className="text-[10px] text-slate-500">
                By continuing, you agree to secure cloud storage of your worship team data.
              </p>
            </div>
          ) : authStage === 'setup-profile' ? (
            <div className={`rounded-3xl p-8 shadow-2xl border text-center space-y-6 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-200'
            }`}>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                <p className="text-xs text-slate-400">Please choose how you want to enter WorshipFlow.</p>
              </div>
              <div className="text-xs font-bold text-red-400">Profile stage setup is pending. Please contact admin.</div>
              <button
                onClick={() => setAuthStage('initial')}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setMode('join-passcode')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'join-passcode' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Join Church</span>
                </button>
                <button
                  onClick={() => setMode('create-workspace')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'create-workspace' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
...

            <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-200'
            }`}>
              {mode === 'join-passcode' ? (
                <form onSubmit={handleJoinByPasscodeSubmit} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Passcode ID
                    </div>
                    <p className="text-slate-400">
                      Enter the passcode provided by your Head Leader to join your church's cloud workspace.
                    </p>
                  </div>

                  {error && <div className="text-red-500 text-[10px] font-bold text-center">{error}</div>}

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Workspace Passcode</label>
                    <input
                      type="text"
                      required
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. GRACE-1001"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Joining...' : 'Request Access'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs space-y-1">
                    <div className="font-bold text-red-400 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> New Cloud Workspace
                    </div>
                    <p className="text-slate-400">
                      Start a new church workspace. You will be the Head Leader and can invite your team with a generated passcode.
                    </p>
                  </div>

                  {error && <div className="text-red-500 text-[10px] font-bold text-center">{error}</div>}

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Church / Ministry Name</label>
                    <input
                      type="text"
                      required
                      value={newChurchName}
                      onChange={(e) => setNewChurchName(e.target.value)}
                      placeholder="e.g. Grace Community Church"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Creating...' : 'Create & Enter'}</span>
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={() => setAuthStage('initial')}
              className="w-full text-[10px] text-slate-500 hover:text-white font-bold"
            >
              Sign out from {email}
            </button>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500">
          WorshipFlow Cloud · Real-time Sync Powered by Firebase
        </div>
      </div>
    </div>
  );
};
