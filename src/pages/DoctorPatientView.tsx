import React, { useState, useEffect } from 'react';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Pill, 
  AlertTriangle, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Bug,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { PermissionCategory, DiagnosisItem, MedicationItem, AllergyItem, InvestigationItem, MedicalRecord } from '../types';

interface DoctorPatientViewProps {
  patientId: string;
  onBack: () => void;
}

export const DoctorPatientView: React.FC<DoctorPatientViewProps> = ({ patientId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Unauthorized Probe State (Hackathon Testing)
  const [probeResult, setProbeResult] = useState<{ category: string; status: number; message: string } | null>(null);
  const [probing, setProbing] = useState(false);

  const fetchPatientRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/doctor/patient/${patientId}`);
      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || 'Access Denied: You do not have active authorization for this patient.');
        setData(null);
        return;
      }

      setData(resData);
    } catch {
      setError('Network error loading patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientRecords();
  }, [patientId]);

  const handleGenerateAiSummary = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setAiError(resData.error || 'Failed to generate summary.');
        return;
      }
      setAiSummary(resData);
    } catch {
      setAiError('Network error during AI summarization.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleProbeUnauthorized = async (category: PermissionCategory) => {
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await fetch(`/api/doctor/patient/${patientId}/probe-category/${category}`);
      const resData = await res.json();
      setProbeResult({
        category,
        status: res.status,
        message: resData.error || resData.message || JSON.stringify(resData),
      });
    } catch {
      setProbeResult({
        category,
        status: 500,
        message: 'Request failed to reach server.',
      });
    } finally {
      setProbing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Verifying patient grant and decrypting authorized categories...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctor Dashboard
        </button>

        <div className="bg-white rounded-xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-950">403 FORBIDDEN: ACCESS DENIED</h2>
            <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
              {error || 'Patient has revoked or not granted access to their medical records.'}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Audit record <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">ACCESS_DENIED</code> was logged.
          </p>
        </div>
      </div>
    );
  }

  const { patient, grant, records, authorizedData } = data;
  const permissions: PermissionCategory[] = grant?.permissions || [];
  const unauthorizedCategories: PermissionCategory[] = [
    'Diagnoses',
    'Medications',
    'Allergies',
    'Investigations',
    'Documents',
  ].filter(c => !permissions.includes(c as PermissionCategory)) as PermissionCategory[];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Authorized Patients
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">
            Grant ID: {grant?.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Patient Header with 24-Hour Expiration Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Age {patient.age || 21} • {patient.gender || 'Male'} • Patient-controlled access
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left md:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Time-Limited Expiration</div>
              <CountdownTimer expiresAt={grant.expiresAt} onExpire={fetchPatientRecords} />
            </div>

            <button
              id="generate-ai-summary-btn"
              onClick={handleGenerateAiSummary}
              disabled={loadingAi}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingAi ? 'Synthesizing...' : 'Generate AI Clinical Summary'}
            </button>
          </div>
        </div>

        {/* Granted vs Denied Badges */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Permitted by Patient:</span>
          {permissions.map(p => (
            <span key={p} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
              ✓ {p}
            </span>
          ))}
          {unauthorizedCategories.map(p => (
            <span key={p} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 flex items-center gap-1">
              ✕ {p} (403 Blocked)
            </span>
          ))}
        </div>
      </div>

      {/* AI CLINICAL SUMMARY SECTION (If triggered) */}
      {aiSummary && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">AI Clinical Summary</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Filtered via Authorized Scope
              </span>
            </div>
            <button
              onClick={() => setAiSummary(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Overview */}
            <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-800 leading-relaxed">
              <strong className="block text-slate-900 font-bold mb-1">Clinical Overview:</strong>
              {aiSummary.summary?.overview}
            </div>

            {/* Two-column insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Key Clinical Findings:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {aiSummary.summary?.keyFindings?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Medication / Treatment Plan:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {aiSummary.summary?.treatmentPlan?.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Caution & Follow-up */}
            {aiSummary.summary?.cautions && aiSummary.summary.cautions.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <strong className="block font-bold mb-1">Cautions & Allergy Alerts:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {aiSummary.summary.cautions.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mandatory Disclaimer */}
            <div className="p-2.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-tight">
              <strong>Medical Disclaimer:</strong> {aiSummary.disclaimer || 'AI-generated clinical summary for assistive evaluation only. Does not replace professional diagnostic judgment.'}
            </div>
          </div>
        </div>
      )}

      {/* HACKATHON TEST PANEL: PROBE UNAUTHORIZED ACCESS */}
      {unauthorizedCategories.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hackathon Security Probe Test
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Test server-side enforcement of 403 Forbidden
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Try requesting an unauthorized category below to verify that the backend strictly rejects access and logs an audit failure:
          </p>

          <div className="flex flex-wrap gap-2">
            {unauthorizedCategories.map(cat => (
              <button
                key={cat}
                type="button"
                id={`probe-${cat}`}
                onClick={() => handleProbeUnauthorized(cat)}
                disabled={probing}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-red-400 hover:text-red-700 transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <span>Probe {cat}</span>
                <span className="text-[10px] text-red-600 font-mono font-bold">Expect 403</span>
              </button>
            ))}
          </div>

          {probeResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              probeResult.status === 403
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>HTTP {probeResult.status}: Server Response for [{probeResult.category}]</span>
              </div>
              <p className="mt-1 font-mono text-[11px] bg-white/70 p-2 rounded border border-red-200">
                {probeResult.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* MEDICAL INFORMATION DISPLAY (AUTHORIZED VS LOCKED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. DIAGNOSES */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Diagnoses</h2>
            </div>
            {permissions.includes('Diagnoses') ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Locked
              </span>
            )}
          </div>

          {permissions.includes('Diagnoses') ? (
            <div className="p-4 divide-y divide-slate-100 text-xs">
              {authorizedData?.diagnoses?.map((d: DiagnosisItem, i: number) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-slate-500 mt-0.5">{d.notes || 'Condition documented in patient records.'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-50/70">
              <Lock className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-900">403 NOT AUTHORIZED</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Patient has not granted access to Diagnoses.
              </p>
            </div>
          )}
        </div>

        {/* 2. MEDICATIONS */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Medications</h2>
            </div>
            {permissions.includes('Medications') ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Locked
              </span>
            )}
          </div>

          {permissions.includes('Medications') ? (
            <div className="p-4 divide-y divide-slate-100 text-xs">
              {authorizedData?.medications?.map((m: MedicationItem, i: number) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-slate-600 mt-0.5">
                      Dosage: <strong>{m.dosage}</strong> • {m.frequency}
                    </div>
                  </div>
                  <span className="text-slate-400 text-[11px]">Since {m.startDate}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-50/70">
              <Lock className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-900">403 NOT AUTHORIZED</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Patient has not granted access to Medications.
              </p>
            </div>
          )}
        </div>

        {/* 3. ALLERGIES */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Allergies</h2>
            </div>
            {permissions.includes('Allergies') ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Locked
              </span>
            )}
          </div>

          {permissions.includes('Allergies') ? (
            <div className="p-4 divide-y divide-slate-100 text-xs">
              {authorizedData?.allergies?.map((a: AllergyItem, i: number) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-red-950">{a.allergen}</div>
                    <div className="text-red-700 mt-0.5">Reaction: {a.reaction}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
                    {a.severity} Severity
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-50/70">
              <Lock className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-900">403 NOT AUTHORIZED</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Patient has not granted access to Allergies.
              </p>
            </div>
          )}
        </div>

        {/* 4. INVESTIGATIONS */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Investigations</h2>
            </div>
            {permissions.includes('Investigations') ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Locked (403)
              </span>
            )}
          </div>

          {permissions.includes('Investigations') ? (
            <div className="p-4 divide-y divide-slate-100 text-xs">
              {authorizedData?.investigations?.map((inv: InvestigationItem, i: number) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{inv.testName}</div>
                    <div className="text-slate-600 mt-0.5">
                      Result: <strong className="text-blue-700">{inv.result}</strong> (Normal: {inv.normalRange})
                    </div>
                  </div>
                  <span className="text-slate-400 text-[11px]">{inv.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-50/70">
              <Lock className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-900">403 NOT AUTHORIZED</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Patient has not granted access to Investigations.
              </p>
            </div>
          )}
        </div>

        {/* 5. DOCUMENTS */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs md:col-span-2">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Medical Documents</h2>
            </div>
            {permissions.includes('Documents') ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Authorized
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Locked (403)
              </span>
            )}
          </div>

          {permissions.includes('Documents') ? (
            <div className="p-4 divide-y divide-slate-100 text-xs">
              {records?.map((rec: MedicalRecord) => (
                <div key={rec.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{rec.title}</div>
                    <div className="text-slate-500">{rec.facility} • {rec.documentType}</div>
                  </div>
                  <span className="text-slate-400 text-[11px]">{rec.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2 bg-slate-50/70">
              <Lock className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-900">403 NOT AUTHORIZED</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Patient has not granted access to Medical Documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
