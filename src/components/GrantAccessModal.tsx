import React, { useState, useEffect } from 'react';
import { PermissionCategory, AccessPurpose } from '../types';
import { ShieldCheck, Check, X, Clock, AlertCircle, ChevronRight, UserCheck } from 'lucide-react';

interface DoctorOption {
  id: string;
  name: string;
  organization: string;
  specialty: string;
}

interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantCreated: () => void;
}

const ALL_CATEGORIES: PermissionCategory[] = [
  'Diagnoses',
  'Medications',
  'Allergies',
  'Investigations',
  'Documents',
];

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({
  isOpen,
  onClose,
  onGrantCreated,
}) => {
  const [step, setStep] = useState<'configure' | 'review'>('configure');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionCategory[]>([
    'Diagnoses',
    'Medications',
    'Allergies',
  ]);
  const [purpose, setPurpose] = useState<AccessPurpose>('Consultation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('configure');
      setError(null);
      fetch('/api/doctors')
        .then(res => res.json())
        .then(data => {
          if (data.doctors && data.doctors.length > 0) {
            setDoctors(data.doctors);
            setSelectedDoctorId(data.doctors[0].id);
          }
        })
        .catch(err => console.error('Failed to load doctors:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  const togglePermission = (perm: PermissionCategory) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleConfirmGrant = async () => {
    if (!selectedDoctorId) {
      setError('Please select a doctor.');
      return;
    }
    if (selectedPermissions.length === 0) {
      setError('Select at least one permission to grant.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          permissions: selectedPermissions,
          purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to grant access');
        setLoading(false);
        return;
      }

      onGrantCreated();
      onClose();
    } catch (err: any) {
      setError('Network error while creating grant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {step === 'configure' ? 'Grant Doctor Access' : 'Access Review'}
              </h2>
              <p className="text-xs text-slate-500">Explicit patient authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        {step === 'configure' ? (
          <div className="p-6 space-y-6">
            {/* Step 1: Select Doctor */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Doctor
              </label>
              <div className="space-y-2">
                {doctors.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedDoctorId === doc.id
                        ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-200">
                        Dr
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{doc.name}</div>
                        <div className="text-xs text-slate-500">{doc.organization} • {doc.specialty}</div>
                      </div>
                    </div>
                    {selectedDoctorId === doc.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: What can this doctor access */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                2. What can this doctor access?
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Unchecked categories will return <span className="font-semibold text-red-600">403 Access Denied</span> to the doctor.
              </p>
              <div className="space-y-2">
                {ALL_CATEGORIES.map(cat => {
                  const checked = selectedPermissions.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? 'border-blue-300 bg-blue-50/40 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(cat)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{cat}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        checked ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {checked ? 'Authorized' : 'Deny Access'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Purpose */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                3. Purpose of Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Consultation', 'Follow-up', 'Emergency', 'Other'] as AccessPurpose[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      purpose === p
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Duration Callout */}
            <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Access Duration: 24 Hours Only
                </div>
                <p className="text-xs text-blue-700 mt-0.5">
                  Access automatically expires after 24 hours. You can revoke access at any time.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-review-access-btn"
                onClick={() => {
                  if (selectedPermissions.length === 0) {
                    setError('Select at least one medical category.');
                    return;
                  }
                  setStep('review');
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Review Access</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: ACCESS REVIEW */
          <div className="p-6 space-y-5">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                You Are About To Share
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Doctor:</span>
                  <div className="font-semibold text-slate-900 text-sm mt-0.5">
                    {selectedDoctor?.name || 'Dr. Sharma'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Organization:</span>
                  <div className="font-semibold text-slate-900 text-sm mt-0.5">
                    {selectedDoctor?.organization || 'Apollo Clinic'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Purpose:</span>
                  <div className="font-semibold text-slate-900 text-sm mt-0.5">{purpose}</div>
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <div className="font-bold text-blue-700 text-sm mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    24 HOURS
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">Authorized Categories:</div>
                <div className="space-y-1.5">
                  {ALL_CATEGORIES.map(cat => {
                    const isGranted = selectedPermissions.includes(cat);
                    return (
                      <div
                        key={cat}
                        className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md ${
                          isGranted ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isGranted ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span className="font-medium">{cat}</span>
                        </div>
                        <span className="font-semibold text-[11px]">
                          {isGranted ? '✓ Granted' : '✕ Denied (403)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="text-xs text-slate-600 space-y-1 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
              <p className="font-medium text-amber-900">• Access will automatically expire after 24 hours.</p>
              <p className="font-medium text-amber-900">• You can revoke access at any time from Access Control.</p>
              <p className="text-amber-800 text-[11px]">
                Every time this doctor accesses your records, an audit entry will be permanently logged.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('configure')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                id="modal-confirm-grant-btn"
                onClick={handleConfirmGrant}
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                {loading ? 'Granting...' : 'Confirm & Grant Access'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
