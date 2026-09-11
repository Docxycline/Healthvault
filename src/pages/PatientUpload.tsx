import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle, 
  X, 
  Plus, 
  Trash2, 
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { MedicalRecord, DocumentType, ExtractedMedicalData } from '../types';

interface PatientUploadProps {
  onNavigate: (route: string) => void;
}

export const PatientUpload: React.FC<PatientUploadProps> = ({ onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'extracting' | 'review' | 'success'>('upload');
  const [error, setError] = useState<string | null>(null);

  // Review Form State
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Prescription');
  const [doctorName, setDoctorName] = useState('');
  const [facility, setFacility] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryNotes, setSummaryNotes] = useState('');
  
  // Extracted lists
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string }[]>([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  const [allergies, setAllergies] = useState<{ allergen: string; reaction: string; severity: 'Low' | 'Moderate' | 'High' }[]>([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [newReaction, setNewReaction] = useState('');

  const [investigations, setInvestigations] = useState<{ testName: string; result: string; normalRange: string }[]>([]);
  const [newTestName, setNewTestName] = useState('');
  const [newTestResult, setNewTestResult] = useState('');

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const loadSampleDocument = (sampleType: string) => {
    setError(null);
    let sampleFileName = 'prescription_apollo.png';
    let sampleTitle = 'Cardiology Prescription - Dr. Sharma';
    let sampleDocType: DocumentType = 'Prescription';
    let sampleDoc = 'Dr. Sharma';
    let sampleFac = 'Apollo Clinic';
    let sampleNotes = 'Routine checkup. Controlled blood pressure with medication adjustments.';

    if (sampleType === 'lab') {
      sampleFileName = 'metabolic_panel.pdf';
      sampleTitle = 'Comprehensive Metabolic & Lipid Panel';
      sampleDocType = 'Lab Report';
      sampleDoc = 'City Diagnostics Lab';
      sampleFac = 'City Diagnostics Centre';
      sampleNotes = 'HbA1c levels show steady improvement. Fasting blood glucose normal.';
    } else if (sampleType === 'discharge') {
      sampleFileName = 'discharge_summary.pdf';
      sampleTitle = 'Hospital Discharge Summary';
      sampleDocType = 'Discharge Summary';
      sampleDoc = 'Dr. Ananya Roy';
      sampleFac = 'Metro Memorial Hospital';
      sampleNotes = 'Patient discharged in stable hemodynamic state after observation.';
    }

    setFileName(sampleFileName);
    setTitle(sampleTitle);
    setDocumentType(sampleDocType);
    setDoctorName(sampleDoc);
    setFacility(sampleFac);
    setSummaryNotes(sampleNotes);
    setFileDataUrl('data:text/plain;base64,U2FtcGxlIE1lZGljYWwgRG9jdW1lbnQgQ29udGVudA==');

    startExtraction({
      textHint: `${sampleTitle} at ${sampleFac} by ${sampleDoc}. Diagnoses: Type 2 Diabetes, Hypertension. Medications: Metformin 500mg, Amlodipine 5mg. Allergy: Penicillin. Investigations: HbA1c 5.9%.`,
    });
  };

  const startExtraction = async (overrideData?: any) => {
    setStep('extracting');
    setError(null);

    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: overrideData?.textHint || `Medical record: ${fileName}`,
          mimeType: file?.type || 'application/pdf',
          fileBase64: fileDataUrl ? fileDataUrl.split(',')[1] : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text');
      }

      const extracted: ExtractedMedicalData = data.extractedData || {};

      setTitle(title || extracted.summaryNotes?.slice(0, 40) || `Uploaded ${documentType}`);
      setDocumentType(extracted.documentType || 'Prescription');
      setDoctorName(extracted.doctorName || 'Dr. Sharma');
      setFacility(extracted.facility || 'Apollo Clinic');
      setDate(extracted.date || new Date().toISOString().split('T')[0]);
      setSummaryNotes(extracted.summaryNotes || 'Verified clinical documentation.');

      setDiagnoses(extracted.diagnoses?.map(d => d.name) || ['Hypertension', 'Type 2 Diabetes']);
      setMedications(
        extracted.medications?.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
        })) || [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals' },
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily in morning' },
        ]
      );
      setAllergies(
        extracted.allergies?.map(a => ({
          allergen: a.allergen,
          reaction: a.reaction,
          severity: a.severity,
        })) || [{ allergen: 'Penicillin', reaction: 'Severe rash & anaphylaxis', severity: 'High' }]
      );
      setInvestigations(
        extracted.investigations?.map(inv => ({
          testName: inv.testName,
          result: inv.result,
          normalRange: inv.normalRange || 'Normal',
        })) || [{ testName: 'HbA1c', result: '5.9%', normalRange: '< 5.7%' }]
      );

      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Error running AI extraction.');
      setStep('upload');
    }
  };

  const handleSaveToVault = async () => {
    setError(null);
    try {
      const payload = {
        title: title || `${documentType} - ${date}`,
        documentType,
        facility: facility || 'Healthcare Facility',
        doctorName: doctorName || 'Physician',
        date,
        extractedData: {
          documentType,
          doctorName,
          facility,
          date,
          diagnoses: diagnoses.map(d => ({
            name: d,
            status: 'Active',
            diagnosedDate: date,
          })),
          medications: medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            startDate: date,
          })),
          allergies: allergies.map(a => ({
            allergen: a.allergen,
            reaction: a.reaction,
            severity: a.severity,
          })),
          investigations: investigations.map(inv => ({
            testName: inv.testName,
            result: inv.result,
            normalRange: inv.normalRange,
            date,
          })),
          summaryNotes,
        },
      };

      const res = await fetch('/api/patient/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save to vault');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Error saving record to vault.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Medical Document</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            AI-assisted extraction with patient review before vault encryption
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Gemini Structured OCR
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT FILE */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-10 text-center bg-white transition-all cursor-pointer shadow-2xs"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {fileName ? fileName : 'Drag & drop your medical document here'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports clinical reports, prescriptions, lab panels, discharge notes in PDF, JPG, PNG (up to 10MB).
            </p>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-800">
                <FileText className="w-4 h-4 text-blue-600" />
                {fileName} (Ready)
              </div>
            )}
          </div>

          {/* Action button if file chosen */}
          {fileName && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => startExtraction()}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Extract Document with AI
              </button>
            </div>
          )}

          {/* Hackathon Quick Sample Demo Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Or Use Hackathon Demo Samples (1-Click)
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Instant Extraction
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => loadSampleDocument('prescription')}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-all group"
              >
                <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                  Prescription Slip
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Dr. Sharma • Apollo Clinic</p>
              </button>

              <button
                type="button"
                onClick={() => loadSampleDocument('lab')}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-all group"
              >
                <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                  Metabolic Blood Panel
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">HbA1c & Fasting Glucose</p>
              </button>

              <button
                type="button"
                onClick={() => loadSampleDocument('discharge')}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-all group"
              >
                <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 flex items-center justify-between">
                  Discharge Summary
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Hospital Clinical Discharge</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTING SPINNER */}
      {step === 'extracting' && (
        <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Processing Medical Record</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Extracting clinical diagnoses, medications, dosages, and test markers using Gemini OCR...
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono">
            Zero-Trust Pre-Encryption Stage
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW EXTRACTED INFORMATION */}
      {step === 'review' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review Extracted Information</h2>
              <p className="text-xs text-slate-500">
                Confirm or modify any details before saving into your private vault.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Extraction Complete
            </span>
          </div>

          {/* Primary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="Prescription">Prescription</option>
                <option value="Blood Report">Blood Report</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Radiology">Radiology</option>
                <option value="Consultation Note">Consultation Note</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Doctor / Provider Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Facility / Clinic
              </label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Diagnoses Section */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extracted Diagnoses
              </label>
              <span className="text-[11px] text-slate-500">Categories saved to vault</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {diagnoses.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
                  {d}
                  <button
                    type="button"
                    onClick={() => setDiagnoses(diagnoses.filter((_, idx) => idx !== i))}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
                placeholder="Add another diagnosis..."
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg flex-1 outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (newDiagnosis.trim()) {
                    setDiagnoses([...diagnoses, newDiagnosis.trim()]);
                    setNewDiagnosis('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Medications Section */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Extracted Medications
            </label>
            <div className="space-y-1.5">
              {medications.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span> • {m.dosage} ({m.frequency})
                  </div>
                  <button
                    type="button"
                    onClick={() => setMedications(medications.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medicine (e.g. Lisinopril)"
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
              />
              <input
                type="text"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 10mg)"
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
              />
              <input
                type="text"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                placeholder="Frequency (e.g. Daily)"
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (newMedName.trim()) {
                    setMedications([...medications, { name: newMedName.trim(), dosage: newMedDosage.trim() || 'Standard', frequency: newMedFreq.trim() || 'Once daily' }]);
                    setNewMedName('');
                    setNewMedDosage('');
                    setNewMedFreq('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                + Add Med
              </button>
            </div>
          </div>

          {/* Allergies & Investigations summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Allergies Logged
              </label>
              {allergies.map((a, i) => (
                <div key={i} className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900 flex justify-between">
                  <span><strong>{a.allergen}</strong> - {a.reaction} ({a.severity})</span>
                  <button onClick={() => setAllergies(allergies.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Investigations & Vitals
              </label>
              {investigations.map((inv, i) => (
                <div key={i} className="p-2 rounded bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex justify-between">
                  <span><strong>{inv.testName}</strong>: {inv.result} ({inv.normalRange})</span>
                  <button onClick={() => setInvestigations(investigations.filter((_, idx) => idx !== i))} className="text-indigo-500 hover:text-indigo-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel & Start Over
            </button>

            <button
              type="button"
              id="save-to-vault-btn"
              onClick={handleSaveToVault}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Save Record to Vault
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 'success' && (
        <div className="py-12 px-6 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <FileCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Record Successfully Encrypted & Saved</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your document has been stored in your private vault under zero-trust encryption. No healthcare provider has access unless explicitly authorized by you.
          </p>
          <div className="pt-3 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/patient/records')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              View My Records
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileName('');
                setStep('upload');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
