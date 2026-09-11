import React, { useState, useEffect } from 'react';
import { CountdownTimer } from '../components/CountdownTimer';
import { GrantAccessModal } from '../components/GrantAccessModal';
import { RevokeModal } from '../components/RevokeModal';
import { 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  UserCheck, 
  RefreshCw, 
  Lock,
  Plus,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { AccessGrant, AccessRequest, PermissionCategory } from '../types';

interface PatientAccessControlProps {
  onNavigate: (route: string) => void;
}

const ALL_CATEGORIES: PermissionCategory[] = [
  'Diagnoses',
  'Medications',
  'Allergies',
  'Investigations',
  'Documents',
];

export const PatientAccessControl: React.FC<PatientAccessControlProps> = ({ onNavigate }) => {
  const [activeGrant, setActiveGrant] = useState<AccessGrant | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/access');
      if (res.ok) {
        const data = await res.json();
        setActiveGrant(data.activeGrant || null);
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load access data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessData();
  }, []);

  const handleRespondRequest = async (requestId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/access/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(approved ? 'Doctor access granted for 24 hours.' : 'Access request denied. Doctor will receive HTTP 403.');
        fetchAccessData();
      } else {
        setActionMessage(data.error || 'Failed to respond to request.');
      }
    } catch {
      setActionMessage('Network error occurred.');
    }
  };

  const handleSimulateExpiration = async () => {
    if (!activeGrant) return;
    try {
      const res = await fetch(`/api/access/simulate-expire/${activeGrant.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        setActionMessage('Simulated 24-hour expiration! Doctor access immediately terminated.');
        fetchAccessData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Control</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            You decide who can access your health information.
          </p>
        </div>

        <button
          id="grant-new-access-btn"
          onClick={() => setGrantModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Grant New Access
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: PENDING DOCTOR REQUESTS */}
      {requests.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
              Pending Doctor Access Requests ({requests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{req.doctorName}</div>
                    <div className="text-xs text-slate-500">{req.doctorOrganization}</div>
                  </div>
                  <div className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded self-start">
                    Requested 24-Hour Access
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <div><strong>Purpose:</strong> {req.purpose}</div>
                  <div><strong>Requested Categories:</strong> {req.requestedPermissions.join(', ')}</div>
                  <div className="text-[11px] text-slate-500">Requested at: {new Date(req.createdAt).toLocaleTimeString()}</div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    id={`deny-request-${req.id}`}
                    onClick={() => handleRespondRequest(req.id, false)}
                    className="px-4 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                  >
                    Deny Access
                  </button>
                  <button
                    type="button"
                    id={`grant-request-${req.id}`}
                    onClick={() => handleRespondRequest(req.id, true)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
                  >
                    Grant Access (24h)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ACTIVE GRANTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Current Active Access Grants</h2>
          </div>
          <span className="text-xs text-slate-500">Time-Limited 24-Hour Window</span>
        </div>

        {activeGrant ? (
          <div className="border border-slate-200 rounded-xl p-5 space-y-5 bg-slate-50/50">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{activeGrant.doctorName}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeGrant.doctorOrganization} • Purpose: {activeGrant.purpose}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Remaining Access</div>
                  <CountdownTimer expiresAt={activeGrant.expiresAt} onExpire={fetchAccessData} />
                </div>
              </div>
            </div>

            {/* Permission breakdown */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Category Authorizations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {ALL_CATEGORIES.map(cat => {
                  const granted = activeGrant.permissions.includes(cat);
                  return (
                    <div
                      key={cat}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        granted
                          ? 'bg-blue-50/80 border-blue-200 text-blue-950 font-medium'
                          : 'bg-slate-100/60 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {granted ? (
                          <Check className="w-4 h-4 text-blue-600" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{cat}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        granted ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {granted ? 'AUTHORIZED' : 'ACCESS DENIED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grant Meta info */}
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4 pt-2">
              <div>Granted: {new Date(activeGrant.grantedAt).toLocaleString()}</div>
              <div>Expires: {new Date(activeGrant.expiresAt).toLocaleString()}</div>
              <div>Grant Token ID: <span className="font-mono text-slate-700">{activeGrant.id.slice(0, 8)}...</span></div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {/* Demo Helper Button */}
              <button
                type="button"
                id="simulate-expiration-btn-control"
                onClick={handleSimulateExpiration}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1.5"
                title="Immediately expire grant to demo zero-trust expiration"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Simulate 24h Expiration (Demo)
              </button>

              <button
                type="button"
                id="revoke-access-btn"
                onClick={() => setRevokeModalOpen(true)}
                className="px-4 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded-md transition-colors"
              >
                Revoke Access Immediately
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-slate-500">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Nobody has unrestricted access to your medical records.
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Default privacy state is ACTIVE. Doctors cannot view diagnoses, prescriptions, or documents without a grant.
              </p>
            </div>
            <button
              type="button"
              id="grant-access-empty-state-btn"
              onClick={() => setGrantModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Grant 24-Hour Access
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GrantAccessModal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        onGrantCreated={() => {
          setActionMessage('Access successfully granted for 24 hours.');
          fetchAccessData();
        }}
      />

      <RevokeModal
        grant={activeGrant}
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onRevoked={() => {
          setActionMessage('Access revoked. Doctor sessions immediately invalidated.');
          fetchAccessData();
        }}
      />
    </div>
  );
};
