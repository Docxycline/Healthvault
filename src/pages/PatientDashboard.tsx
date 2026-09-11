import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { GrantAccessModal } from '../components/GrantAccessModal';
import { RevokeModal } from '../components/RevokeModal';
import { 
  FileText, 
  Pill, 
  AlertTriangle, 
  Files, 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  ChevronRight, 
  UserCheck, 
  Lock, 
  Sparkles,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { AccessGrant, MedicalRecord } from '../types';

interface PatientDashboardProps {
  onNavigate: (route: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    diagnosesCount: 2,
    medicationsCount: 3,
    allergiesCount: 1,
    documentsCount: 3,
  });
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [activeGrant, setActiveGrant] = useState<AccessGrant | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [recordsRes, accessRes] = await Promise.all([
        fetch('/api/patient/records'),
        fetch('/api/access'),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setStats(data.summary || {
          diagnosesCount: 2,
          medicationsCount: 3,
          allergiesCount: 1,
          documentsCount: 3,
        });
        setRecentRecords(data.records?.slice(0, 3) || []);
      }

      if (accessRes.ok) {
        const accessData = await accessRes.json();
        setActiveGrant(accessData.activeGrant || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSimulateExpiration = async () => {
    if (!activeGrant) return;
    try {
      const res = await fetch(`/api/access/simulate-expire/${activeGrant.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error simulating expiration:', err);
    }
  };

  const allCategories = ['Diagnoses', 'Medications', 'Allergies', 'Investigations', 'Documents'];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'Rahul'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Your health records, under your control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('/patient/upload')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Files className="w-3.5 h-3.5 text-slate-500" />
            Upload Record
          </button>
          <button
            id="grant-new-access-banner-btn"
            onClick={() => setGrantModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Grant Access
          </button>
        </div>
      </div>

      {/* Primary Privacy Statement Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Privacy-by-Design Architecture
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Default: Access Denied
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Nobody has unrestricted access to your medical records.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/patient/history')}
          className="text-xs font-medium text-blue-300 hover:text-white flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          View Audit Log <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('/patient/records')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Diagnoses</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.diagnosesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Documented conditions</div>
        </div>

        <div 
          onClick={() => onNavigate('/patient/records')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Medications</span>
            <Pill className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.medicationsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active prescriptions</div>
        </div>

        <div 
          onClick={() => onNavigate('/patient/records')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Allergies</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.allergiesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Penicillin (Severe)</div>
        </div>

        <div 
          onClick={() => onNavigate('/patient/records')}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Documents</span>
            <Files className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.documentsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Encrypted clinical files</div>
        </div>
      </div>

      {/* Main Grid: Active Access vs Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Access Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Active Access Grant
                </h2>
              </div>
              {activeGrant && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE
                </span>
              )}
            </div>

            {activeGrant ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{activeGrant.doctorName}</div>
                      <div className="text-xs text-slate-500">{activeGrant.doctorOrganization}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Expires In</div>
                      <CountdownTimer expiresAt={activeGrant.expiresAt} onExpire={fetchDashboardData} />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="font-semibold text-slate-800">{activeGrant.purpose}</span>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">Granted Authorization:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {allCategories.map(cat => {
                      const granted = activeGrant.permissions.includes(cat as any);
                      return (
                        <div
                          key={cat}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border ${
                            granted
                              ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {granted ? (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{cat}</span>
                          </div>
                          <span className="text-[10px] font-mono">
                            {granted ? 'ALLOW' : '403'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Nobody has unrestricted access to your medical records.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    All external access is strictly blocked by default. You can issue a 24-hour time-limited pass at any time.
                  </p>
                </div>
                <button
                  id="empty-grant-btn"
                  onClick={() => setGrantModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Grant 24-Hour Access
                </button>
              </div>
            )}
          </div>

          {activeGrant && (
            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              {/* Hackathon Simulation Helper */}
              <button
                type="button"
                id="simulate-expiration-btn"
                onClick={handleSimulateExpiration}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1"
                title="Hackathon Demo: instantly simulate 24-hour expiration"
              >
                <RefreshCw className="w-3 h-3" />
                Simulate 24h Expiry (Demo)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRevokeModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                >
                  Revoke Access
                </button>
                <button
                  onClick={() => onNavigate('/patient/access')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Manage Access
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Records Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Recent Medical Records
                </h2>
              </div>
              <button
                onClick={() => onNavigate('/patient/records')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onNavigate('/patient/records')}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{record.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {record.doctorName || record.facility} • {record.facility}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-500">
                      {record.date}
                    </span>
                    <div className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                      {record.documentType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Records securely encrypted & indexed</span>
            <button
              onClick={() => onNavigate('/patient/upload')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              + Add New Record
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GrantAccessModal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        onGrantCreated={() => fetchDashboardData()}
      />

      <RevokeModal
        grant={activeGrant}
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onRevoked={() => fetchDashboardData()}
      />
    </div>
  );
};
