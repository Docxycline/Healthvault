import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Stethoscope, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Lock, 
  Plus, 
  ShieldAlert,
  Send,
  User,
  Check
} from 'lucide-react';
import { PermissionCategory, AccessPurpose } from '../types';

interface DoctorDashboardProps {
  onNavigate: (route: string) => void;
  onSelectPatient: (patientId: string) => void;
}

interface ActivePatientData {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  grantId: string;
  permissions: PermissionCategory[];
  purpose: string;
  expiresAt: string;
  grantedAt: string;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate, onSelectPatient }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<ActivePatientData[]>([]);
  const [loading, setLoading] = useState(true);

  // Request Access Modal / Form state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('rahul');
  const [requestedCategories, setRequestedCategories] = useState<PermissionCategory[]>([
    'Diagnoses',
    'Medications',
    'Allergies',
  ]);
  const [purpose, setPurpose] = useState<AccessPurpose>('Consultation');
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emergency override modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Trauma admission / Unconscious patient');

  const fetchDoctorPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorPatients();
  }, []);

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    setRequestStatus(null);
    try {
      const res = await fetch('/api/access/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientUsername: patientSearch,
          permissions: requestedCategories,
          purpose,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestStatus('Access request submitted! Rahul can now view and approve it in Access Control.');
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestStatus(null);
        }, 2500);
      } else {
        setRequestStatus(data.error || 'Failed to submit request.');
      }
    } catch {
      setRequestStatus('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBreakGlassEmergency = async (patientId: string) => {
    try {
      const res = await fetch(`/api/doctor/patient/${patientId}/emergency-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: emergencyReason }),
      });
      if (res.ok) {
        setShowEmergencyModal(false);
        fetchDoctorPatients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allCategories: PermissionCategory[] = [
    'Diagnoses',
    'Medications',
    'Allergies',
    'Investigations',
    'Documents',
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Doctor Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.doctorProfile?.doctorName || 'Dr. Sharma'}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Licensed Practitioner
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.doctorProfile?.organization || 'Apollo Clinic'} • {user?.doctorProfile?.specialty || 'General Medicine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="request-patient-access-btn"
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Request Patient Access
          </button>
        </div>
      </div>

      {/* Zero Trust Explanation Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Zero-Trust Clinical Access Enforced
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Doctors do not automatically receive access to patient records. All viewing requires active 24-hour patient consent.
            </p>
          </div>
        </div>
        <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          RBAC Security Active
        </div>
      </div>

      {/* Patients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Patients with Active Access</h2>
            <p className="text-xs text-slate-500">
              Only patients who have explicitly granted non-expired access appear here.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {patients.length} Authorized Patient{patients.length === 1 ? '' : 's'}
          </span>
        </div>

        {patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {patients.map((pat) => (
              <div
                key={pat.patientId}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{pat.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Age {pat.age || 21} • {pat.gender || 'Male'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Expires In</div>
                      <CountdownTimer expiresAt={pat.expiresAt} onExpire={fetchDoctorPatients} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-2">
                      Purpose: <strong className="text-slate-800">{pat.purpose}</strong>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 mb-1.5">
                      Granted Categories:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pat.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-blue-600" />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    id={`view-patient-${pat.patientId}`}
                    onClick={() => onSelectPatient(pat.patientId)}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Patient Records</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                No patients have currently granted you access.
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Under HealthVault's zero-trust architecture, you cannot access records until a patient authorizes your request.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                id="request-access-empty-btn"
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Request Access from Rahul
              </button>
              <button
                type="button"
                id="break-glass-trigger-btn"
                onClick={() => setShowEmergencyModal(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Emergency Break-Glass
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REQUEST ACCESS MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Request 24-Hour Patient Access</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {requestStatus && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                  {requestStatus}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Patient Username
                </label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="e.g. rahul"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">Hackathon demo patient: <strong>rahul</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Request Specific Categories
                </label>
                <div className="space-y-1.5">
                  {allCategories.map(cat => {
                    const checked = requestedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer ${
                          checked ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setRequestedCategories(requestedCategories.filter(c => c !== cat));
                              } else {
                                setRequestedCategories([...requestedCategories, cat]);
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span>{cat}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Time-bound 24h</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Clinical Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as AccessPurpose)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>If approved by Rahul, this access grant will automatically expire in 24 hours.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="submit-doctor-request-btn"
                  onClick={handleSendRequest}
                  disabled={isSubmitting || requestedCategories.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Access Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY BREAK-GLASS MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-rose-300 overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold">Emergency Break-Glass Activation</h3>
              </div>
              <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                <strong>WARNING:</strong> This action bypasses standard consent for immediate critical intervention. It will be permanently logged in the public audit trail and capped at 4 hours.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Clinical Justification
                </label>
                <textarea
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-break-glass-btn"
                  onClick={() => handleBreakGlassEmergency('user_patient_1')}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Authorize Break-Glass Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
