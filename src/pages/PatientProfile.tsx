import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, Mail, Calendar, Building, Phone } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Identity & Profile</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Zero-trust verified digital health identity
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs">
            {user?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Rahul Sharma'}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Patient Identifier: <strong className="font-mono text-slate-700">{user?.id}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Decentralized Vault Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">Full Legal Name</span>
            <div className="font-bold text-slate-900 text-sm">{user?.name}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">Vault Username</span>
            <div className="font-mono font-bold text-slate-900 text-sm">{user?.username}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">Primary Contact Email</span>
            <div className="font-bold text-slate-900 text-sm">{user?.email}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">Account Role</span>
            <div className="font-bold text-blue-700 text-sm">{user?.role}</div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Patient Record Sovereignty</span>
            Under the HealthVault protocol, medical facilities store records under your ownership keys. No third-party hospital network has access to your records unless authorized.
          </div>
        </div>
      </div>
    </div>
  );
};
