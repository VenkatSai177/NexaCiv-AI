
import React, { useState } from 'react';
import { firebaseService } from '../firebase';
import { UserProfile } from '../types';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) {
      setError("Please select or enter a Google account email.");
      return;
    }
    setLoading('ADMIN');
    setError(null);
    try {
      // Simulation of a 1.5s neural handshake
      await new Promise(r => setTimeout(r, 1500));
      const u = await firebaseService.loginWithGoogle(true, adminEmail);
      onLogin(u);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  };

  const handleCitizenAuth = async (asGuest: boolean) => {
    setLoading(asGuest ? 'GUEST' : 'CITIZEN');
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const u = asGuest ? await firebaseService.loginAsGuest() : await firebaseService.loginWithGoogle(false);
      onLogin(u);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  };

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/5 rounded-full animate-spin-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-reverse-spin"></div>
      </div>

      <div className="w-full max-w-xl glass p-16 rounded-[60px] border-white/5 relative z-10 text-center animate-in zoom-in-95 fade-in duration-1000 shadow-3xl">
        <div className="mb-14 inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-purple-600 to-cyan-400 rounded-[36px] flex items-center justify-center neo-glow-blue rotate-[15deg] mb-10 transition-transform hover:rotate-0 duration-700 mx-auto">
            <span className="text-5xl -rotate-[15deg] transition-transform group-hover:rotate-0">🛡️</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            Urban Security Portal
          </h1>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.5em] font-bold">DisasterLens X CivicGuard // GRID_v3.1</p>
        </div>

        <div className="space-y-6">
          <button 
            disabled={!!loading}
            onClick={() => handleCitizenAuth(true)}
            className="w-full py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-[1.02] flex items-center justify-center gap-6 group disabled:opacity-50"
          >
            {loading === 'GUEST' ? (
              <span className="animate-pulse">INITIALIZING_GUEST_ENTRY...</span>
            ) : (
              <>
                <span className="text-xl group-hover:scale-125 transition-transform opacity-50 group-hover:opacity-100">👤</span>
                Citizen Portal Gateway
              </>
            )}
          </button>

          <div className="py-6 flex items-center gap-6 text-[9px] font-mono text-white/20 uppercase tracking-[0.5em] font-black">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
            Role Authorization Required
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
             <div className="relative">
                <input 
                   type="email"
                   value={adminEmail}
                   onChange={(e) => setAdminEmail(e.target.value)}
                   placeholder="Enter Authorized Admin Email"
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                   list="admin-hints"
                />
                <datalist id="admin-hints">
                   <option value="admin@disasterlens.gov" />
                   <option value="ops@civicguard.org" />
                   <option value="unauthorized@test.com" />
                </datalist>
             </div>
             <button 
                type="submit"
                disabled={!!loading}
                className="w-full py-6 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 text-black rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-[1.03] shadow-[0_0_40px_rgba(0,242,255,0.2)] flex items-center justify-center gap-6 group disabled:opacity-50"
             >
                {loading === 'ADMIN' ? (
                  <span className="animate-pulse">DECRYPTING_CREDENTIALS...</span>
                ) : (
                  <>
                    <span className="text-2xl group-hover:rotate-12 transition-transform">🛡️</span>
                    Admin Strategic Center (SSO)
                  </>
                )}
             </button>
          </form>

          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-mono uppercase tracking-widest animate-in slide-in-from-top-2 duration-500 leading-relaxed">
              {error}
            </div>
          )}
        </div>

        <p className="mt-16 text-[10px] text-white/20 font-mono max-w-sm mx-auto leading-loose uppercase tracking-widest">
          Unauthorized access is logged via neural footprint. Monitoring enforced by Metropolitan AI Safety Council.
        </p>
      </div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 animate-scan"></div>
    </div>
  );
};

export default LoginPage;
