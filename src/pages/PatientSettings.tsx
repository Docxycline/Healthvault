import React from 'react';
import { Settings, Shield, Bell, Lock, Key, RefreshCw } from 'lucide-react';

export const PatientSettings: React.FC = () => {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Vault Settings</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Privacy rules, 24-hour expiration preferences, and audit subscriptions
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200 shadow-2xs text-xs">
        <div className="p-5 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Default 24-Hour Expiration</span>
            <p className="text-slate-500 mt-0.5">All regular doctor access automatically terminates after 24 hours.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold">Enforced (Always On)</span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Strict Category Isolation</span>
            <p className="text-slate-500 mt-0.5">Deny all unselected clinical record categories with HTTP 403 Forbidden.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold">Active</span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Access Audit Logging</span>
            <p className="text-slate-500 mt-0.5">Maintain an immutable audit trail for every doctor query and document download.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold">Enabled</span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Emergency Override Alerting</span>
            <p className="text-slate-500 mt-0.5">Instant alerts when break-glass emergency access is activated.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold">Critical Only</span>
        </div>
      </div>
    </div>
  );
};
