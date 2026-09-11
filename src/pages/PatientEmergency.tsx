import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { AccessEvent } from '../types';

interface PatientEmergencyProps {
  onNavigate: (route: string) => void;
}

export const PatientEmergency: React.FC<PatientEmergencyProps> = ({ onNavigate }) => {
  const [emergencyEvents, setEmergencyEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/access/history')
      .then(res => res.json())
      .then(data => {
        const emergencies = (data.events || []).filter((e: AccessEvent) => e.eventType === 'EMERGENCY_ACCESS');
        setEmergencyEvents(emergencies);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Access Protocol</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            Critical Safeguard
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-0.5">
          Break-glass medical emergency policy and critical authorization logs.
        </p>
      </div>

      {/* Emergency Policy Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 text-amber-800">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Break-Glass Protocol Policy</h2>
            <p className="text-xs text-slate-500">How emergency clinical override functions in HealthVault</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600" />
              4-Hour Limit
            </div>
            <p className="text-slate-600">
              Emergency grants are strictly limited to 4 hours maximum (compared to standard 24-hour consultations).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Permanent Audit
            </div>
            <p className="text-slate-600">
              An immutable EMERGENCY_ACCESS audit record is generated immediately with hospital IP, timestamp, and physician identifier.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Patient Notification
            </div>
            <p className="text-slate-600">
              Patients receive an immediate push notice and email regarding the emergency override and can revoke access anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Activity Records */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Emergency Access Log</h2>
          <p className="text-xs text-slate-500">Historical records of any critical emergency activations</p>
        </div>

        <div className="divide-y divide-slate-200">
          {emergencyEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              No emergency overrides have been executed. Your records remain untouched.
            </div>
          ) : (
            emergencyEvents.map(event => (
              <div key={event.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-rose-900">{event.actorName} (Emergency Attending)</div>
                  <div className="text-slate-600 mt-0.5">{event.description}</div>
                </div>
                <div className="text-right text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
