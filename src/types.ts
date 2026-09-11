export type UserRole = 'PATIENT' | 'DOCTOR';

export type PermissionCategory = 
  | 'Diagnoses' 
  | 'Medications' 
  | 'Allergies' 
  | 'Investigations' 
  | 'Documents';

export type AccessPurpose = 
  | 'Consultation' 
  | 'Follow-up' 
  | 'Emergency' 
  | 'Other';

export type GrantStatus = 
  | 'ACTIVE' 
  | 'REVOKED' 
  | 'EXPIRED' 
  | 'DENIED' 
  | 'PENDING';

export type AccessAction =
  | 'ACCESS_REQUESTED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_EXPIRED'
  | 'RECORD_VIEWED'
  | 'DIAGNOSIS_VIEWED'
  | 'MEDICATION_VIEWED'
  | 'ALLERGY_VIEWED'
  | 'INVESTIGATION_VIEWED'
  | 'DOCUMENT_VIEWED'
  | 'EMERGENCY_ACCESS';

export type AuditEventType = AccessAction;

export type DocumentType =
  | 'Prescription'
  | 'Blood Report'
  | 'Lab Report'
  | 'Discharge Summary'
  | 'Lab Result'
  | 'Clinical Notes'
  | 'Radiology'
  | 'Consultation Note'
  | 'Other';

export interface ExtractedMedicalData {
  documentType?: DocumentType;
  doctorName?: string;
  facility?: string;
  date?: string;
  diagnoses?: DiagnosisItem[];
  medications?: MedicationItem[];
  allergies?: AllergyItem[];
  investigations?: InvestigationItem[];
  summaryNotes?: string;
}

export interface AccessRequest {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorOrganization: string;
  requestedPermissions: PermissionCategory[];
  purpose: AccessPurpose;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
}

export interface PatientProfile {
  id: string;
  userId: string;
  age: number;
  bloodGroup?: string;
  emergencyContact?: string;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  doctorName: string;
  organization: string;
  specialty?: string;
  licenseNumber?: string;
  createdAt: string;
}

export interface DiagnosisItem {
  name: string;
  diagnosedDate: string;
  status: 'Active' | 'Resolved' | 'Chronic';
  notes?: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  prescribedBy?: string;
}

export interface AllergyItem {
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'High';
}

export interface InvestigationItem {
  testName: string;
  result: string;
  normalRange?: string;
  date: string;
  facility?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  documentType: 'Prescription' | 'Blood Report' | 'Discharge Summary' | 'Lab Result' | 'Clinical Notes';
  fileLocation?: string;
  date: string;
  facility: string;
  doctorName?: string;
  extractedData: {
    diagnoses: DiagnosisItem[];
    medications: MedicationItem[];
    allergies: AllergyItem[];
    investigations: InvestigationItem[];
    summaryNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AccessGrant {
  id: string;
  patientId: string;
  doctorId: string;
  patientName?: string;
  doctorName: string;
  doctorOrganization: string;
  permissions: PermissionCategory[];
  purpose: AccessPurpose;
  createdAt: string;
  grantedAt?: string;
  expiresAt: string;
  status: GrantStatus;
  type: 'STANDARD' | 'EMERGENCY';
}

export interface AccessEvent {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  patientName?: string;
  action: AccessAction;
  eventType?: AuditEventType;
  actorName?: string;
  actorRole?: string;
  description?: string;
  ipAddress?: string;
  category?: string;
  timestamp: string;
  purpose?: string;
  type: 'STANDARD' | 'EMERGENCY';
  details?: string;
}

export interface AIClinicalSummary {
  id: string;
  patientId: string;
  doctorId: string;
  content: string;
  createdAt: string;
  authorizedCategories: PermissionCategory[];
}

export interface AuthorizedPatientView {
  patient: {
    id: string;
    name: string;
    age: number;
    username: string;
  };
  grant: {
    id: string;
    permissions: PermissionCategory[];
    purpose: string;
    expiresAt: string;
    createdAt: string;
    status: GrantStatus;
    type: 'STANDARD' | 'EMERGENCY';
  };
  authorizedData: {
    diagnoses?: DiagnosisItem[];
    medications?: MedicationItem[];
    allergies?: AllergyItem[];
    investigations?: InvestigationItem[];
    documents?: {
      id: string;
      title: string;
      documentType: string;
      date: string;
      facility: string;
    }[];
  };
}
