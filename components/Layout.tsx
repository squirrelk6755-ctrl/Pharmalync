
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  isEmergency?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, role, userName, isEmergency }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('pl_current_user');
    navigate('/');
  };

  const roleStyles = {
    [UserRole.ADMIN]: 'bg-slate-900 border-slate-800',
    [UserRole.DOCTOR]: 'bg-blue-600 border-blue-800',
    [UserRole.PATIENT]: 'bg-emerald-600 border-emerald-800',
    [UserRole.PHARMACY]: 'bg-indigo-600 border-indigo-800',
  };

  return (
    <div className="min-h-screen flex flex-col bg-medical-pattern">
      <header className={`${isEmergency ? 'bg-red-600 animate-pulse border-red-500' : roleStyles[role]} text-white shadow-2xl sticky top-0 z-40 border-b-4 transition-all duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
            <div className="bg-white text-blue-600 p-2 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Activity size={28} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight leading-none">PharmaLync</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Clinical Vault Network</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] opacity-70 font-black uppercase tracking-widest">{role} Portal</span>
              <span className="text-sm font-black tracking-tight">{userName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 border border-white/10 shadow-inner"
              title="Secure Logout"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {isEmergency && (
        <div className="bg-red-600 border-b border-red-700 py-3 px-4 flex items-center justify-center gap-3 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl z-30">
          <HeartPulse size={16} className="animate-bounce" />
          EMERGENCY PROTOCOL ACTIVE • FULL CLINICAL AUDIT ENABLED
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-in fade-in duration-700">
        {children}
      </main>

      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 py-10 text-center">
        <div className="flex justify-center gap-8 mb-6 opacity-20 grayscale">
          <Activity size={24} />
          <HeartPulse size={24} />
          <ShieldCheck size={24} />
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} PharmaLync • Verified Clinical Systems
        </p>
      </footer>
    </div>
  );
};