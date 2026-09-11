import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PatientSidebar } from './components/PatientSidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientRecords } from './pages/PatientRecords';
import { PatientUpload } from './pages/PatientUpload';
import { PatientAccessControl } from './pages/PatientAccessControl';
import { PatientHistory } from './pages/PatientHistory';
import { PatientEmergency } from './pages/PatientEmergency';
import { PatientProfile } from './pages/PatientProfile';
import { PatientSettings } from './pages/PatientSettings';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorPatientView } from './pages/DoctorPatientView';
import { Shield, User, Stethoscope, ArrowRightLeft, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading, login, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('user_patient_1');
  const [activeGrantCount, setActiveGrantCount] = useState<number>(1);

  // Sync initial route based on auth status
  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (currentRoute !== '/register') {
          setCurrentRoute('/');
        }
      } else if (user.role === 'PATIENT') {
        if (currentRoute === '/' || currentRoute === '/register' || currentRoute.startsWith('/doctor')) {
          setCurrentRoute('/patient/dashboard');
        }
      } else if (user.role === 'DOCTOR') {
        if (currentRoute === '/' || currentRoute === '/register' || currentRoute.startsWith('/patient')) {
          setCurrentRoute('/doctor/dashboard');
        }
      }
    }
  }, [user, loading]);

  // Fetch active grant count for sidebar badge
  useEffect(() => {
    if (user?.role === 'PATIENT') {
      fetch('/api/access')
        .then(res => res.json())
        .then(data => {
          setActiveGrantCount(data.activeGrant ? 1 : 0);
        })
        .catch(() => {});
    }
  }, [user, currentRoute]);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPatientForDoctor = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentRoute(`/doctor/patient/${patientId}`);
  };

  // Hackathon quick switch
  const handleQuickSwitchRole = async (targetUsername: string) => {
    if (targetUsername === 'rahul') {
      await login('rahul', 'DemoPatient123!');
      setCurrentRoute('/patient/dashboard');
    } else if (targetUsername === 'drsharma') {
      await login('drsharma', 'DemoDoctor123!');
      setCurrentRoute('/doctor/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-600 tracking-wider uppercase">
          Loading HealthVault Zero-Trust Architecture...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar currentRoute={currentRoute} onRouteChange={handleNavigate} />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col">
        {!user ? (
          // Public Authentication Views
          <main className="flex-1">
            {currentRoute === '/register' ? (
              <RegisterPage onNavigate={handleNavigate} />
            ) : (
              <LoginPage onNavigate={handleNavigate} />
            )}
          </main>
        ) : user.role === 'PATIENT' ? (
          // Patient Experience with Sidebar
          <div className="flex-1 flex flex-col md:flex-row">
            <PatientSidebar
              currentRoute={currentRoute}
              onRouteChange={handleNavigate}
              activeGrantCount={activeGrantCount}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20">
              {currentRoute === '/patient/dashboard' && <PatientDashboard onNavigate={handleNavigate} />}
              {currentRoute === '/patient/records' && <PatientRecords onNavigate={handleNavigate} />}
              {currentRoute === '/patient/upload' && <PatientUpload onNavigate={handleNavigate} />}
              {currentRoute === '/patient/access' && <PatientAccessControl onNavigate={handleNavigate} />}
              {currentRoute === '/patient/history' && <PatientHistory onNavigate={handleNavigate} />}
              {currentRoute === '/patient/emergency' && <PatientEmergency onNavigate={handleNavigate} />}
              {currentRoute === '/patient/profile' && <PatientProfile />}
              {currentRoute === '/patient/settings' && <PatientSettings />}
            </main>
          </div>
        ) : (
          // Doctor Experience
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20">
            {currentRoute.startsWith('/doctor/patient/') ? (
              <DoctorPatientView
                patientId={selectedPatientId}
                onBack={() => setCurrentRoute('/doctor/dashboard')}
              />
            ) : (
              <DoctorDashboard
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatientForDoctor}
              />
            )}
          </main>
        )}
      </div>

      {/* Hackathon Judge & Demo Switcher Bar */}
      <aside aria-label="Hackathon Demo Controller" className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 text-white border-t border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-500 text-[10px] font-bold tracking-wide uppercase">
            Hackathon Demo Bar
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Active Session: <strong className="text-white">{user ? `${user.name} (${user.role})` : 'Logged Out'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Instant Switch:</span>
          <button
            type="button"
            id="demo-switch-to-patient"
            onClick={() => handleQuickSwitchRole('rahul')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.username === 'rahul'
                ? 'bg-blue-600 text-white ring-1 ring-white/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Rahul (Patient)</span>
          </button>

          <button
            type="button"
            id="demo-switch-to-doctor"
            onClick={() => handleQuickSwitchRole('drsharma')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.username === 'drsharma'
                ? 'bg-emerald-600 text-white ring-1 ring-white/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Dr. Sharma (Doctor)</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
