import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, LogOut, User as UserIcon, Activity } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onRouteChange }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRouteChange(user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard')}>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">HEALTHVAULT</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Privacy First
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Your health. Your records. Your control.</p>
          </div>
        </div>

        {/* Status Badge & User Controls */}
        <div className="flex items-center gap-3">
          {/* Privacy Default Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Trust Vault Protected
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-none">{user.name}</div>
                  <div className="text-[11px] text-slate-500 leading-tight flex items-center gap-1 mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.role === 'PATIENT' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                    {user.role === 'PATIENT' ? 'Patient' : 'Attending Doctor'}
                  </div>
                </div>
              </div>

              <button
                id="navbar-logout-btn"
                onClick={async () => {
                  await logout();
                  onRouteChange('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Sign out of HealthVault"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
