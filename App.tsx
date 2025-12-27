
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DisasterLensAI from './pages/DisasterLensAI';
import CitizenPortal from './pages/CitizenPortal';
import EvidenceHub from './pages/EvidenceHub';
import AdminCommandCenter from './pages/AdminCommandCenter';
import LoginPage from './pages/LoginPage';
import { firebaseService } from './firebase';
import { UserProfile, SUPPORTED_CITIES } from './types';

const Sidebar = ({ user }: { user: UserProfile | null }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const handleLogout = () => {
    firebaseService.logout();
    window.location.reload();
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 glass z-50 border-r border-white/10 animate-in slide-in-from-left duration-700">
      <div className="mb-12">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center neo-glow-blue rotate-45 group">
          <div className="-rotate-45 font-black text-black text-[10px] group-hover:scale-110 transition-transform tracking-tighter">DXC</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-8 flex-1">
        {isAdmin ? (
          <>
            <NavLink to="/" icon="📊" active={isActive('/')} label="Ops Dashboard" />
            <NavLink to="/admin" icon="🛡️" active={isActive('/admin')} label="Operations Console" />
          </>
        ) : (
          <>
            <NavLink to="/disasterlens" icon="🤖" active={isActive('/disasterlens')} label="Structural AI Scanner" />
            <NavLink to="/citizen" icon="👤" active={isActive('/citizen')} label="Citizen Reporting" />
            <NavLink to="/evidence" icon="🕵️" active={isActive('/evidence')} label="Evidence Hub" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <div className="group relative">
          <button 
            onClick={handleLogout} 
            className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all duration-500 border border-white/10 hover:border-red-500/50 shadow-lg hover:shadow-red-500/20 active:scale-90"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">⏻</span>
          </button>
          <div className="absolute left-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/95 text-[10px] text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-red-500/20 font-mono uppercase tracking-[0.2em] shadow-2xl z-[100]">
            Terminate Session
          </div>
        </div>
      </div>

      <div className="text-white/30 text-[8px] font-mono rotate-90 mb-8 whitespace-nowrap uppercase tracking-[0.3em] font-bold">
        {isAdmin ? 'SECURE_ADMIN_UPLINK' : 'CITIZEN_SAFE_NODE'}
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, active, label }: { to: string; icon: string; active: boolean; label: string }) => (
  <Link to={to} className="group relative">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'text-white/30 hover:bg-white/10 hover:text-white'}`}>
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
    </div>
    <div className="absolute left-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/95 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-white/10 font-mono uppercase tracking-[0.2em] shadow-2xl z-[100]">
      {label}
    </div>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(firebaseService.getCurrentUser());
  const [city, setCity] = useState<string>(SUPPORTED_CITIES[0]);

  const handleLogin = (u: UserProfile) => {
    setUser(u);
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#020202] text-white flex selection:bg-cyan-500/30">
        <Sidebar user={user} />
        <main className={`flex-1 ${user ? 'ml-20' : ''} p-8 overflow-y-auto h-screen relative scroll-smooth`}>
          <div className="fixed inset-0 pointer-events-none opacity-40 overflow-hidden -z-10">
             <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-cyan-600/10 blur-[180px] rounded-full animate-pulse"></div>
             <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[150px] rounded-full"></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"></div>
          </div>
          
          <Routes>
            {!user ? (
              <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
            ) : user.role === 'ADMIN' ? (
              <>
                <Route path="/" element={<Dashboard currentCity={city} onCityChange={setCity} />} />
                <Route path="/admin" element={<AdminCommandCenter />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/disasterlens" element={<DisasterLensAI currentCity={city} />} />
                <Route path="/citizen" element={<CitizenPortal currentCity={city} />} />
                <Route path="/evidence" element={<EvidenceHub currentCity={city} />} />
                <Route path="*" element={<Navigate to="/disasterlens" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
