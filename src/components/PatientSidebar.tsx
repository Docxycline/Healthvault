import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  KeyRound, 
  History, 
  AlertCircle, 
  UserCircle, 
  Settings, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface PatientSidebarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  activeGrantCount?: number;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  currentRoute,
  onRouteChange,
  activeGrantCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'nav-overview', label: 'Overview', route: '/patient/dashboard', icon: LayoutDashboard },
    { id: 'nav-records', label: 'My Records', route: '/patient/records', icon: FileText },
    { id: 'nav-upload', label: 'Upload Record', route: '/patient/upload', icon: UploadCloud },
    { 
      id: 'nav-access', 
      label: 'Access Control', 
      route: '/patient/access', 
      icon: KeyRound,
      badge: activeGrantCount > 0 ? `${activeGrantCount} Active` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    { id: 'nav-history', label: 'Access History', route: '/patient/history', icon: History },
    { id: 'nav-emergency', label: 'Emergency Access', route: '/patient/emergency', icon: AlertCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Patient Portal
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.id}
                  id={item.id}
                  onClick={() => onRouteChange(item.route)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Privacy notice callout */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Zero-Trust Vault
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Doctors cannot view any records without your explicit 24-hour grant.
          </p>
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-slate-200 space-y-1">
        <button
          id="sidebar-profile-btn"
          onClick={() => onRouteChange('/patient/profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentRoute === '/patient/profile'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCircle className="w-4 h-4 text-slate-400" />
          <span>Profile</span>
        </button>

        <button
          id="sidebar-settings-btn"
          onClick={() => onRouteChange('/patient/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentRoute === '/patient/settings'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        <button
          id="sidebar-logout-btn"
          onClick={async () => {
            await logout();
            onRouteChange('/');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
