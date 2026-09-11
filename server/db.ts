import bcrypt from 'bcryptjs';
import { 
  User, 
  PatientProfile, 
  DoctorProfile, 
  MedicalRecord, 
  AccessGrant, 
  AccessEvent, 
  AIClinicalSummary,
  PermissionCategory,
  AccessPurpose
} from '../src/types';

// In-memory persistent database store with full relational model
class DatabaseStore {
  users: (User & { passwordHash: string })[] = [];
  patientProfiles: PatientProfile[] = [];
  doctorProfiles: DoctorProfile[] = [];
  medicalRecords: MedicalRecord[] = [];
  accessGrants: AccessGrant[] = [];
  accessEvents: AccessEvent[] = [];
  clinicalSummaries: AIClinicalSummary[] = [];
  sessions: Map<string, { userId: string; role: 'PATIENT' | 'DOCTOR'; expiresAt: number }> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    // Generate secure bcrypt hashes for demo accounts
    const salt = bcrypt.genSaltSync(10);
    const patientPasswordHash = bcrypt.hashSync('DemoPatient123!', salt);
    const doctorPasswordHash = bcrypt.hashSync('DemoDoctor123!', salt);

    const rahulId = 'usr_patient_rahul';
    const doctorId = 'usr_doctor_sharma';

    // 1. Users
    this.users = [
      {
        id: rahulId,
        name: 'Rahul Sharma',
        username: 'rahul',
        email: 'rahul@demo.com',
        passwordHash: patientPasswordHash,
        role: 'PATIENT',
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
      {
        id: doctorId,
        name: 'Dr. Sharma',
        username: 'drsharma',
        email: 'doctor@demo.com',
        passwordHash: doctorPasswordHash,
        role: 'DOCTOR',
        createdAt: '2026-05-15T09:00:00.000Z',
        updatedAt: '2026-05-15T09:00:00.000Z',
      },
    ];

    // 2. Profiles
    this.patientProfiles = [
      {
        id: 'prof_patient_rahul',
        userId: rahulId,
        age: 21,
        bloodGroup: 'B+',
        emergencyContact: '+1 (555) 019-2834',
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ];

    this.doctorProfiles = [
      {
        id: 'prof_doctor_sharma',
        userId: doctorId,
        doctorName: 'Dr. Sharma',
        organization: 'Apollo Clinic',
        specialty: 'Internal Medicine',
        licenseNumber: 'MD-92841-DL',
        createdAt: '2026-05-15T09:00:00.000Z',
      },
    ];

    // 3. Medical Records for Rahul
    this.medicalRecords = [
      {
        id: 'rec_01',
        patientId: rahulId,
        title: 'Prescription & Follow-up Plan',
        documentType: 'Prescription',
        fileLocation: '/documents/prescription_aug21.pdf',
        date: '2026-08-21',
        facility: 'Apollo Clinic',
        doctorName: 'Dr. Sharma',
        extractedData: {
          diagnoses: [
            { name: 'Hypertension', diagnosedDate: '2025-11-10', status: 'Active', notes: 'Essential hypertension stage 1' },
            { name: 'Type 2 Diabetes', diagnosedDate: '2026-02-14', status: 'Active', notes: 'Diet and medication controlled' },
          ],
          medications: [
            { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily morning', startDate: '2025-11-12', prescribedBy: 'Dr. Sharma' },
            { name: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily with meals', startDate: '2026-02-15', prescribedBy: 'Dr. Sharma' },
            { name: 'Atorvastatin 10mg', dosage: '10mg', frequency: 'Once daily bedtime', startDate: '2026-05-20', prescribedBy: 'Dr. Sharma' },
          ],
          allergies: [
            { allergen: 'Penicillin', reaction: 'Urticaria, facial angioedema', severity: 'High' },
          ],
          investigations: [
            { testName: 'Blood Pressure', result: '130/84 mmHg', normalRange: '< 120/80 mmHg', date: '2026-08-21', facility: 'Apollo Clinic' }
          ],
          summaryNotes: 'Patient doing well on current regimen. Continue Amlodipine and Metformin.',
        },
        createdAt: '2026-08-21T10:15:00.000Z',
        updatedAt: '2026-08-21T10:15:00.000Z',
      },
      {
        id: 'rec_02',
        patientId: rahulId,
        title: 'Comprehensive Metabolic & Blood Report',
        documentType: 'Blood Report',
        fileLocation: '/documents/blood_report_aug14.pdf',
        date: '2026-08-14',
        facility: 'City Diagnostics',
        doctorName: 'Dr. R. Mehta (Pathologist)',
        extractedData: {
          diagnoses: [],
          medications: [],
          allergies: [],
          investigations: [
            { testName: 'HbA1c', result: '5.9%', normalRange: '< 5.7% (Pre-diabetic 5.7-6.4%)', date: '2026-08-14', facility: 'City Diagnostics' },
            { testName: 'Fasting Plasma Glucose', result: '108 mg/dL', normalRange: '70-99 mg/dL', date: '2026-08-14', facility: 'City Diagnostics' },
            { testName: 'Lipid Profile - Total Cholesterol', result: '192 mg/dL', normalRange: '< 200 mg/dL', date: '2026-08-14', facility: 'City Diagnostics' },
            { testName: 'Lipid Profile - LDL', result: '112 mg/dL', normalRange: '< 100 mg/dL', date: '2026-08-14', facility: 'City Diagnostics' },
            { testName: 'Lipid Profile - HDL', result: '46 mg/dL', normalRange: '> 40 mg/dL', date: '2026-08-14', facility: 'City Diagnostics' },
          ],
          summaryNotes: 'HbA1c shows good glycemic control on Metformin. LDL slightly elevated.',
        },
        createdAt: '2026-08-14T14:30:00.000Z',
        updatedAt: '2026-08-14T14:30:00.000Z',
      },
      {
        id: 'rec_03',
        patientId: rahulId,
        title: 'Hospital Discharge Summary',
        documentType: 'Discharge Summary',
        fileLocation: '/documents/discharge_summary_jul02.pdf',
        date: '2026-07-02',
        facility: 'City Hospital',
        doctorName: 'Dr. K. Verma',
        extractedData: {
          diagnoses: [
            { name: 'Acute Gastroenteritis (Resolved)', diagnosedDate: '2026-06-29', status: 'Resolved', notes: 'Hospital stay 3 days, IV fluids given' },
            { name: 'Hypertension', diagnosedDate: '2025-11-10', status: 'Active', notes: 'Maintained during stay' },
          ],
          medications: [
            { name: 'Oral Rehydration Salts', dosage: '1 sachet in 1L water', frequency: 'As needed for 2 days', startDate: '2026-07-02', prescribedBy: 'Dr. K. Verma' },
          ],
          allergies: [
            { allergen: 'Penicillin', reaction: 'Severe allergic rash', severity: 'High' },
          ],
          investigations: [
            { testName: 'Serum Electrolytes (Sodium)', result: '138 mEq/L', normalRange: '135-145 mEq/L', date: '2026-07-01', facility: 'City Hospital Lab' },
            { testName: 'Serum Electrolytes (Potassium)', result: '4.1 mEq/L', normalRange: '3.5-5.0 mEq/L', date: '2026-07-01', facility: 'City Hospital Lab' },
          ],
          summaryNotes: 'Discharged in stable condition with normal hydration markers.',
        },
        createdAt: '2026-07-02T11:00:00.000Z',
        updatedAt: '2026-07-02T11:00:00.000Z',
      },
    ];

    // 4. Default State: ACCESS DENIED.
    // Notice: We do NOT seed any active access grant! Access must be explicitly granted by the patient.
    this.accessGrants = [];

    // 5. Initial audit history (prior demonstration events)
    this.accessEvents = [
      {
        id: 'evt_init_01',
        patientId: rahulId,
        doctorId: doctorId,
        doctorName: 'Dr. Sharma',
        patientName: 'Rahul Sharma',
        action: 'ACCESS_REQUESTED',
        category: 'Consultation Request',
        timestamp: '2026-08-20T09:30:00.000Z',
        purpose: 'Consultation',
        type: 'STANDARD',
        details: 'Initial clinic intake requested for routine follow-up',
      },
      {
        id: 'evt_init_02',
        patientId: rahulId,
        doctorId: doctorId,
        doctorName: 'Dr. Sharma',
        patientName: 'Rahul Sharma',
        action: 'ACCESS_GRANTED',
        category: 'Diagnoses, Medications, Allergies',
        timestamp: '2026-08-20T09:35:00.000Z',
        purpose: 'Consultation',
        type: 'STANDARD',
        details: 'Rahul granted 24-hour access for consultation',
      },
      {
        id: 'evt_init_03',
        patientId: rahulId,
        doctorId: doctorId,
        doctorName: 'Dr. Sharma',
        patientName: 'Rahul Sharma',
        action: 'DIAGNOSIS_VIEWED',
        category: 'Diagnoses',
        timestamp: '2026-08-20T10:12:00.000Z',
        purpose: 'Consultation',
        type: 'STANDARD',
        details: 'Dr. Sharma viewed diagnoses timeline',
      },
      {
        id: 'evt_init_04',
        patientId: rahulId,
        doctorId: doctorId,
        doctorName: 'Dr. Sharma',
        patientName: 'Rahul Sharma',
        action: 'MEDICATION_VIEWED',
        category: 'Medications',
        timestamp: '2026-08-20T10:15:00.000Z',
        purpose: 'Consultation',
        type: 'STANDARD',
        details: 'Dr. Sharma viewed active medications list',
      },
      {
        id: 'evt_init_05',
        patientId: rahulId,
        doctorId: doctorId,
        doctorName: 'Dr. Sharma',
        patientName: 'Rahul Sharma',
        action: 'ACCESS_EXPIRED',
        category: 'Session Expired',
        timestamp: '2026-08-21T09:35:00.000Z',
        purpose: 'Consultation',
        type: 'STANDARD',
        details: '24-hour authorization automatically lapsed per privacy policy',
      },
    ];
  }

  // --- Helpers ---

  // Check and update expired grants automatically
  refreshGrants() {
    const now = Date.now();
    for (const grant of this.accessGrants) {
      if (grant.status === 'ACTIVE' && new Date(grant.expiresAt).getTime() <= now) {
        grant.status = 'EXPIRED';
        this.logEvent({
          patientId: grant.patientId,
          doctorId: grant.doctorId,
          action: 'ACCESS_EXPIRED',
          category: '24-Hour Expiration',
          purpose: grant.purpose,
          type: grant.type,
          details: `24-hour window closed. Doctor access automatically expired.`,
        });
      }
    }
  }

  logEvent(event: Omit<AccessEvent, 'id' | 'timestamp'>): AccessEvent {
    const doctor = this.doctorProfiles.find(d => d.userId === event.doctorId);
    const patient = this.users.find(u => u.id === event.patientId);

    const docName = event.doctorName || doctor?.doctorName || 'Dr. Sharma';
    const patName = event.patientName || patient?.name || 'Rahul Sharma';

    const fullEvent: AccessEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      doctorName: docName,
      patientName: patName,
      actorName: docName,
      actorRole: 'Physician / System',
      description: event.details || `${event.action.replace('_', ' ')} recorded for ${docName}`,
      eventType: event.action,
      ...event,
    };
    this.accessEvents.unshift(fullEvent);
    return fullEvent;
  }

  // Find active grant between patient and doctor
  getActiveGrant(patientId: string, doctorId: string): AccessGrant | null {
    this.refreshGrants();
    const grant = this.accessGrants.find(
      g => g.patientId === patientId && 
           g.doctorId === doctorId && 
           g.status === 'ACTIVE' && 
           new Date(g.expiresAt).getTime() > Date.now()
    );
    return grant || null;
  }

  // Grant access (24 hours standard)
  createGrant(params: {
    patientId: string;
    doctorId: string;
    permissions: PermissionCategory[];
    purpose: AccessPurpose;
    type?: 'STANDARD' | 'EMERGENCY';
  }): AccessGrant {
    this.refreshGrants();
    
    // Revoke any previous active grant for this pair
    for (const g of this.accessGrants) {
      if (g.patientId === params.patientId && g.doctorId === params.doctorId && g.status === 'ACTIVE') {
        g.status = 'REVOKED';
      }
    }

    const doctorProfile = this.doctorProfiles.find(d => d.userId === params.doctorId);
    const patient = this.users.find(u => u.id === params.patientId);

    const createdAt = new Date();
    // EXACTLY 24 HOURS
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    const grant: AccessGrant = {
      id: `grant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: params.patientId,
      doctorId: params.doctorId,
      patientName: patient?.name || 'Rahul Sharma',
      doctorName: doctorProfile?.doctorName || 'Dr. Sharma',
      doctorOrganization: doctorProfile?.organization || 'Apollo Clinic',
      permissions: params.permissions,
      purpose: params.purpose,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'ACTIVE',
      type: params.type || 'STANDARD',
    };

    this.accessGrants.unshift(grant);

    this.logEvent({
      patientId: params.patientId,
      doctorId: params.doctorId,
      action: params.type === 'EMERGENCY' ? 'EMERGENCY_ACCESS' : 'ACCESS_GRANTED',
      category: params.permissions.join(', '),
      purpose: params.purpose,
      type: params.type || 'STANDARD',
      details: `Granted 24-hour access to ${grant.doctorName} for ${params.purpose}`,
    });

    return grant;
  }

  // Revoke grant
  revokeGrant(grantId: string, revokedByUserId: string): AccessGrant | null {
    const grant = this.accessGrants.find(g => g.id === grantId);
    if (!grant) return null;

    grant.status = 'REVOKED';

    this.logEvent({
      patientId: grant.patientId,
      doctorId: grant.doctorId,
      action: 'ACCESS_REVOKED',
      category: 'Revoked by Patient',
      purpose: grant.purpose,
      type: grant.type,
      details: `Patient immediately revoked access for ${grant.doctorName}`,
    });

    return grant;
  }

  // Simulate expiration for Hackathon Demo
  simulateExpiration(grantId: string): AccessGrant | null {
    const grant = this.accessGrants.find(g => g.id === grantId);
    if (!grant) return null;

    grant.status = 'EXPIRED';
    // Set expiresAt to 5 minutes in the past
    grant.expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    this.logEvent({
      patientId: grant.patientId,
      doctorId: grant.doctorId,
      action: 'ACCESS_EXPIRED',
      category: 'Simulated Expiration',
      purpose: grant.purpose,
      type: grant.type,
      details: `Demo simulation: 24-hour access grant manually expired. Doctor immediately loses access.`,
    });

    return grant;
  }
}

export const db = new DatabaseStore();
