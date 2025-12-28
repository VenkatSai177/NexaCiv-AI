
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-hidden bg-black selection:bg-cyan-500/30">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/5 rounded-full animate-spin-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/5 rounded-full animate-reverse-spin"></div>
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-scan"></div>
      </div>

      <div className="w-full max-w-[95%] sm:max-w-[540px] md:max-w-[600px] lg:max-w-[640px] glass p-8 sm:p-12 md:p-16 rounded-[48px] sm:rounded-[60px] border-white/5 relative z-10 flex flex-col items-center animate-in zoom-in-95 fade-in duration-1000 shadow-3xl">
        
        <header className="w-full flex flex-col items-center gap-8 sm:gap-10 mb-12 sm:mb-14">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-purple-600 to-cyan-400 rounded-[32px] flex items-center justify-center neo-glow-blue rotate-[15deg] transition-transform hover:rotate-0 duration-700 shadow-[0_0_50px_rgba(0,242,255,0.2)]">
              <span className="text-3xl -rotate-[15deg] transition-transform group-hover:rotate-0 select-none font-black text-black">NXA</span>
            </div>
            <div className="absolute -inset-4 bg-cyan-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>

          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent leading-none">
              NexaCiv AI
            </h1>
            <p className="text-white/40 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold">
              DisasterLens x CivicGuard Unified Intelligence Grid
            </p>
          </div>
        </header>

        <div className="w-full flex flex-col gap-8 sm:gap-10">
          <button 
            disabled={!!loading}
            onClick={() => handleCitizenAuth(true)}
            className="w-full py-5 sm:py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 sm:gap-6 group disabled:opacity-50 shadow-xl"
          >
            {loading === 'GUEST' ? (
              <span className="animate-pulse">INITIALIZING_GUEST_ENTRY...</span>
            ) : (
              <>
                <span className="text-xl group-hover:scale-125 transition-transform opacity-40 group-hover:opacity-100">👤</span>
                Citizen Portal Gateway
              </>
            )}
          </button>

          <div className="w-full flex items-center gap-6 px-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
            <span className="text-[8px] sm:text-[9px] font-mono text-white/20 uppercase tracking-[0.5em] font-black whitespace-nowrap">
              Grid Authorization
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
          </div>

          <form onSubmit={handleAdminAuth} className="w-full flex flex-col gap-5 sm:gap-6">
             <div className="w-full relative group">
                <input 
                   type="email"
                   value={adminEmail}
                   onChange={(e) => setAdminEmail(e.target.value)}
                   placeholder="Authorized Admin Credentials"
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 sm:py-5 px-6 sm:px-8 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10 group-hover:bg-white/[0.07]"
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
                className="w-full py-5 sm:py-6 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 text-black rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_40px_rgba(0,242,255,0.15)] flex items-center justify-center gap-4 sm:gap-6 group disabled:opacity-50"
             >
                {loading === 'ADMIN' ? (
                  <span className="animate-pulse">DECRYPTING_CREDENTIALS...</span>
                ) : (
                  <>
                    <span className="text-2xl group-hover:rotate-12 transition-transform">🛡️</span>
                    Strategic Command Center
                  </>
                )}
             </button>
          </form>

          {error && (
            <div className="w-full p-4 sm:p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest animate-in slide-in-from-top-2 duration-500 leading-relaxed text-center">
              [ GRID_ERROR ]: {error}
            </div>
          )}
        </div>

        <footer className="mt-12 sm:mt-16 w-full text-center">
          <p className="text-[9px] sm:text-[10px] text-white/20 font-mono max-w-sm mx-auto leading-loose uppercase tracking-widest px-4">
            NexaCiv AI Platform // Secure Urban Monitoring Enforced by Council.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
