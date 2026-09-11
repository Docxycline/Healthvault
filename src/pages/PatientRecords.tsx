import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Pill, 
  AlertTriangle, 
  Activity, 
  Files, 
  Search, 
  Calendar, 
  Building, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { MedicalRecord, DiagnosisItem, MedicationItem, AllergyItem, InvestigationItem } from '../types';

interface PatientRecordsProps {
  onNavigate: (route: string) => void;
}

export const PatientRecords: React.FC<PatientRecordsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'diagnoses' | 'medications' | 'allergies' | 'investigations' | 'documents'>('all');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetch('/api/patient/records')
      .then(res => res.json())
      .then(data => {
        setRecords(data.records || []);
        if (data.records && data.records.length > 0) {
          setSelectedRecord(data.records[0]);
        }
      })
      .catch(err => console.error('Failed to load records:', err))
      .finally(() => setLoading(false));
  }, []);

  // Aggregated data
  const allDiagnoses: { item: DiagnosisItem; sourceRecord: string; date: string }[] = [];
  const allMedications: { item: MedicationItem; sourceRecord: string; date: string }[] = [];
  const allAllergies: { item: AllergyItem; sourceRecord: string; date: string }[] = [];
  const allInvestigations: { item: InvestigationItem; sourceRecord: string; date: string }[] = [];

  for (const rec of records) {
    if (rec.extractedData.diagnoses) {
      rec.extractedData.diagnoses.forEach(d => allDiagnoses.push({ item: d, sourceRecord: rec.title, date: rec.date }));
    }
    if (rec.extractedData.medications) {
      rec.extractedData.medications.forEach(m => allMedications.push({ item: m, sourceRecord: rec.title, date: rec.date }));
    }
    if (rec.extractedData.allergies) {
      rec.extractedData.allergies.forEach(a => allAllergies.push({ item: a, sourceRecord: rec.title, date: rec.date }));
    }
    if (rec.extractedData.investigations) {
      rec.extractedData.investigations.forEach(i => allInvestigations.push({ item: i, sourceRecord: rec.title, date: rec.date }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Medical Records</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Patient Private Vault
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            You hold total unshared ownership of all records in this vault.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/patient/upload')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <Files className="w-3.5 h-3.5" />
          Add / Upload Document
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'all', label: 'Timeline & All Documents', count: records.length },
          { id: 'diagnoses', label: 'Diagnoses', count: allDiagnoses.length },
          { id: 'medications', label: 'Medications', count: allMedications.length },
          { id: 'allergies', label: 'Allergies', count: allAllergies.length },
          { id: 'investigations', label: 'Investigations', count: allInvestigations.length },
          { id: 'documents', label: 'Clinical Documents', count: records.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: ALL / TIMELINE */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medical Timeline List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chronological Health Timeline
            </h2>

            <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
              {records.map((record) => (
                <div key={record.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 group-hover:scale-125 transition-transform" />

                  <div 
                    onClick={() => setSelectedRecord(record)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedRecord?.id === record.id
                        ? 'border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {record.documentType}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{record.date}</span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1.5">{record.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {record.doctorName} • {record.facility}
                        </p>
                      </div>

                      <button
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        title="View Record Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Extracted Pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {record.extractedData.diagnoses?.map((d, i) => (
                        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {d.name}
                        </span>
                      ))}
                      {record.extractedData.medications?.map((m, i) => (
                        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.name}
                        </span>
                      ))}
                      {record.extractedData.allergies?.map((a, i) => (
                        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Allergy: {a.allergen}
                        </span>
                      ))}
                      {record.extractedData.investigations?.map((inv, i) => (
                        <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {inv.testName}: {inv.result}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Record Details Pane */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs self-start sticky top-20">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Record Deep Dive
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedRecord.documentType}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecord.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div><strong className="text-slate-700">Facility:</strong> {selectedRecord.facility}</div>
                    <div><strong className="text-slate-700">Practitioner:</strong> {selectedRecord.doctorName || 'Attending Physician'}</div>
                    <div><strong className="text-slate-700">Date Issued:</strong> {selectedRecord.date}</div>
                    {selectedRecord.fileLocation && (
                      <div className="text-[11px] text-blue-600 font-mono mt-1">
                        Encrypted File Ref: {selectedRecord.fileLocation}
                      </div>
                    )}
                  </div>
                </div>

                {selectedRecord.extractedData.summaryNotes && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-1">Clinical Notes:</span>
                    {selectedRecord.extractedData.summaryNotes}
                  </div>
                )}

                {/* Extracted Details */}
                <div className="space-y-3 pt-2 text-xs">
                  {selectedRecord.extractedData.diagnoses && selectedRecord.extractedData.diagnoses.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Diagnoses:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        {selectedRecord.extractedData.diagnoses.map((d, i) => (
                          <li key={i}>
                            <strong>{d.name}</strong> ({d.status}) - {d.notes || 'Documented'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRecord.extractedData.medications && selectedRecord.extractedData.medications.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Medications:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        {selectedRecord.extractedData.medications.map((m, i) => (
                          <li key={i}>
                            <strong>{m.name}</strong> • {m.frequency}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRecord.extractedData.allergies && selectedRecord.extractedData.allergies.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1 text-red-700">Allergies:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                        {selectedRecord.extractedData.allergies.map((a, i) => (
                          <li key={i}>
                            <strong>{a.allergen}</strong>: {a.reaction} ({a.severity} severity)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRecord.extractedData.investigations && selectedRecord.extractedData.investigations.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Lab Findings:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        {selectedRecord.extractedData.investigations.map((inv, i) => (
                          <li key={i}>
                            <strong>{inv.testName}</strong>: {inv.result} ({inv.normalRange || 'Standard range'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Select any timeline item to inspect full clinical details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DIAGNOSES */}
      {activeTab === 'diagnoses' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Documented Diagnoses</h2>
            <p className="text-xs text-slate-500">Official medical conditions logged in your records</p>
          </div>
          <div className="divide-y divide-slate-200">
            {allDiagnoses.map((d, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{d.item.name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      d.item.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{d.item.notes || 'Essential condition documented'}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Diagnosed: {d.item.diagnosedDate}</div>
                  <div className="text-[11px] text-slate-500">{d.sourceRecord}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEDICATIONS */}
      {activeTab === 'medications' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Current Medications</h2>
            <p className="text-xs text-slate-500">Prescribed dosages and schedules</p>
          </div>
          <div className="divide-y divide-slate-200">
            {allMedications.map((m, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">{m.item.name}</span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Dosage: <strong className="text-slate-800">{m.item.dosage}</strong> • {m.item.frequency}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Prescribed: {m.item.startDate}</div>
                  <div className="text-[11px] text-slate-500">By {m.item.prescribedBy || 'Physician'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ALLERGIES */}
      {activeTab === 'allergies' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Recorded Allergies</h2>
            <p className="text-xs text-slate-500">Crucial allergy alerts for healthcare providers</p>
          </div>
          <div className="divide-y divide-slate-200">
            {allAllergies.map((a, index) => (
              <div key={index} className="p-4 flex items-center justify-between bg-red-50/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-950">{a.item.allergen}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                        {a.item.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">Reaction: {a.item.reaction}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Logged in: {a.sourceRecord}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INVESTIGATIONS */}
      {activeTab === 'investigations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Laboratory & Diagnostic Investigations</h2>
            <p className="text-xs text-slate-500">Blood panels, test readings, and vitals</p>
          </div>
          <div className="divide-y divide-slate-200">
            {allInvestigations.map((inv, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <span className="text-sm font-bold text-slate-900">{inv.item.testName}</span>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Result: <strong className="text-blue-700 font-bold">{inv.item.result}</strong> (Standard Range: {inv.item.normalRange || 'N/A'})
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Test Date: {inv.item.date}</div>
                  <div className="text-[11px] text-slate-500">{inv.item.facility || inv.sourceRecord}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Medical Document Archives</h2>
              <p className="text-xs text-slate-500">Official prescriptions, discharge slips, and lab reports</p>
            </div>
          </div>
          <div className="divide-y divide-slate-200">
            {records.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Files className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
                    <p className="text-xs text-slate-500">{r.facility} • {r.doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    {r.documentType}
                  </span>
                  <span className="text-xs text-slate-400">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
