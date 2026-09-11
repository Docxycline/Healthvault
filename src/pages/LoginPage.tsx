import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, User, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleQuickDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-sm mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">HEALTHVAULT</h1>
        <p className="mt-1 text-sm font-medium text-blue-700">
          "Your health. Your records. Your control."
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Secure access to your health records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="rahul or drsharma"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white text-slate-900"
                  required
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Demo reset: Use demo passwords DemoPatient123! or DemoDoctor123!'); }} className="text-blue-600 hover:text-blue-700 font-medium">
                Forgot Password?
              </a>
              <button
                type="button"
                id="create-account-link"
                onClick={() => onNavigate('/register')}
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Create Account
              </button>
            </div>

            <button
              type="submit"
              id="signin-btn"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Hackathon Demo Accounts Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Hackathon Demo Accounts
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready to Test
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Patient Demo Box */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-900">DEMO PATIENT</span>
                    <span className="text-[10px] text-blue-700 font-medium">(Rahul)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                    Username: <span className="font-semibold text-slate-800">rahul</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Password: <span className="font-semibold text-slate-800">DemoPatient123!</span>
                  </div>
                </div>
                <button
                  type="button"
                  id="quick-fill-patient-btn"
                  onClick={() => handleQuickDemoFill('rahul', 'DemoPatient123!')}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors shadow-2xs"
                >
                  Quick Fill
                </button>
              </div>

              {/* Doctor Demo Box */}
              <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">DEMO DOCTOR</span>
                    <span className="text-[10px] text-slate-700 font-medium">(Dr. Sharma)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                    Username: <span className="font-semibold text-slate-800">drsharma</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Password: <span className="font-semibold text-slate-800">DemoDoctor123!</span>
                  </div>
                </div>
                <button
                  type="button"
                  id="quick-fill-doctor-btn"
                  onClick={() => handleQuickDemoFill('drsharma', 'DemoDoctor123!')}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Quick Fill
                </button>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
              <span className="font-bold">Core Rule:</span> Default status is <strong>ACCESS DENIED</strong>. The doctor has zero access until Rahul explicitly grants it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
