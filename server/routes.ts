import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import { extractDocumentWithAI, generateClinicalSummaryWithAI } from './gemini';
import { PermissionCategory, AccessPurpose, UserRole } from '../src/types';

export const apiRouter = Router();

const SESSION_COOKIE_NAME = 'hv_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Middleware: Extract current authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    return next();
  }

  const session = db.sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) db.sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME);
    return next();
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    db.sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME);
    return next();
  }

  req.user = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.', code: 'UNAUTHORIZED' });
  }
  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: `Access denied. Requires ${role} role, but logged in as ${req.user.role}.`, 
        code: 'FORBIDDEN' 
      });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, confirmPassword, role, doctorName, organization } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username & email
    const existing = db.users.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }

    const userRole: UserRole = role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserId = `usr_${userRole.toLowerCase()}_${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: userRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    if (userRole === 'PATIENT') {
      db.patientProfiles.push({
        id: `prof_${newUserId}`,
        userId: newUserId,
        age: 25,
        bloodGroup: 'O+',
        createdAt: new Date().toISOString(),
      });
    } else {
      db.doctorProfiles.push({
        id: `prof_${newUserId}`,
        userId: newUserId,
        doctorName: doctorName?.trim() || name.trim(),
        organization: organization?.trim() || 'Apollo Clinic',
        specialty: 'Physician',
        createdAt: new Date().toISOString(),
      });
    }

    // Auto-login after registration
    const sessionId = crypto.randomBytes(32).toString('hex');
    db.sessions.set(sessionId, {
      userId: newUserId,
      role: userRole,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
    });

    res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanInput = username.trim().toLowerCase();
    const user = db.users.find(
      u => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    db.sessions.set(sessionId, {
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
    });

    const patientProfile = db.patientProfiles.find(p => p.userId === user.id);
    const doctorProfile = db.doctorProfiles.find(d => d.userId === user.id);

    res.json({
      message: 'Sign in successful.',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        patientProfile,
        doctorProfile,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    db.sessions.delete(sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ message: 'Signed out successfully.' });
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  const patientProfile = db.patientProfiles.find(p => p.userId === req.user!.id);
  const doctorProfile = db.doctorProfiles.find(d => d.userId === req.user!.id);

  res.json({
    user: {
      ...req.user,
      patientProfile,
      doctorProfile,
    },
  });
});

// ----------------------------------------------------
// PATIENT ROUTES
// ----------------------------------------------------

apiRouter.get('/patient/profile', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  const patientProfile = db.patientProfiles.find(p => p.userId === req.user!.id);
  res.json({
    user: req.user,
    profile: patientProfile,
  });
});

apiRouter.get('/patient/records', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  const patientId = req.user!.id;
  const records = db.medicalRecords.filter(r => r.patientId === patientId);

  // Compile full patient clinical timeline and unified views
  const diagnoses: any[] = [];
  const medications: any[] = [];
  const allergies: any[] = [];
  const investigations: any[] = [];

  for (const rec of records) {
    if (rec.extractedData.diagnoses) diagnoses.push(...rec.extractedData.diagnoses);
    if (rec.extractedData.medications) medications.push(...rec.extractedData.medications);
    if (rec.extractedData.allergies) allergies.push(...rec.extractedData.allergies);
    if (rec.extractedData.investigations) investigations.push(...rec.extractedData.investigations);
  }

  res.json({
    records,
    summary: {
      diagnosesCount: diagnoses.length,
      medicationsCount: medications.length,
      allergiesCount: allergies.length,
      documentsCount: records.length,
    },
    diagnoses,
    medications,
    allergies,
    investigations,
  });
});

apiRouter.post('/patient/records', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, documentType, facility, doctorName, date, extractedData } = req.body;
    if (!title || !documentType) {
      return res.status(400).json({ error: 'Title and document type are required.' });
    }

    const newRecord = {
      id: `rec_${Date.now()}`,
      patientId: req.user!.id,
      title: title.trim(),
      documentType: documentType,
      facility: facility || 'Local Clinic',
      doctorName: doctorName || 'Physician',
      date: date || new Date().toISOString().split('T')[0],
      extractedData: extractedData || {
        diagnoses: [],
        medications: [],
        allergies: [],
        investigations: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.medicalRecords.unshift(newRecord);

    // Audit log
    db.logEvent({
      patientId: req.user!.id,
      doctorId: '',
      doctorName: 'Self (Patient)',
      patientName: req.user!.name,
      action: 'DOCUMENT_VIEWED',
      category: 'Medical Document Uploaded',
      purpose: 'Record Addition',
      type: 'STANDARD',
      details: `Patient added record "${newRecord.title}" (${newRecord.documentType})`,
    });

    res.status(201).json({ message: 'Record saved successfully.', record: newRecord });
  } catch (err: any) {
    console.error('Error saving record:', err);
    res.status(500).json({ error: 'Failed to save record.' });
  }
});

// ----------------------------------------------------
// ACCESS CONTROL ROUTES (PATIENT-CONTROLLED)
// ----------------------------------------------------

apiRouter.get('/access', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.refreshGrants();

  if (req.user!.role === 'PATIENT') {
    const grants = db.accessGrants.filter(g => g.patientId === req.user!.id);
    const activeGrant = grants.find(g => g.status === 'ACTIVE' && new Date(g.expiresAt).getTime() > Date.now());
    return res.json({
      grants,
      activeGrant: activeGrant || null,
      hasActiveGrant: !!activeGrant,
    });
  } else {
    // Doctor
    const grants = db.accessGrants.filter(g => g.doctorId === req.user!.id);
    return res.json({ grants });
  }
});

apiRouter.post('/access', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId, permissions, purpose, type } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required.' });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'At least one permission must be selected.' });
    }

    const validCategories: PermissionCategory[] = ['Diagnoses', 'Medications', 'Allergies', 'Investigations', 'Documents'];
    const filteredPermissions = permissions.filter((p: any) => validCategories.includes(p));

    if (filteredPermissions.length === 0) {
      return res.status(400).json({ error: 'Invalid permissions requested.' });
    }

    const grant = db.createGrant({
      patientId: req.user!.id,
      doctorId,
      permissions: filteredPermissions,
      purpose: purpose || 'Consultation',
      type: type || 'STANDARD',
    });

    res.status(201).json({
      message: '24-hour access granted successfully.',
      grant,
    });
  } catch (err: any) {
    console.error('Error granting access:', err);
    res.status(500).json({ error: 'Failed to grant access.' });
  }
});

apiRouter.delete('/access/:id', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const grant = db.accessGrants.find(g => g.id === id);

  if (!grant) {
    return res.status(404).json({ error: 'Access grant not found.' });
  }

  if (grant.patientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to revoke this grant.' });
  }

  const updated = db.revokeGrant(id, req.user!.id);
  res.json({ message: 'Access revoked immediately.', grant: updated });
});

// Demo simulate expiration endpoint
apiRouter.post('/access/simulate-expire/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const grant = db.simulateExpiration(id);
  if (!grant) {
    return res.status(404).json({ error: 'Grant not found.' });
  }
  res.json({
    message: 'Simulated 24-hour expiration applied. Doctor access is now EXPIRED.',
    grant,
  });
});

// Doctor requests access
apiRouter.post('/access/request', requireAuth, requireRole('DOCTOR'), (req: AuthenticatedRequest, res: Response) => {
  const { patientId, permissions, purpose } = req.body;
  const patient = db.users.find(u => u.id === patientId && u.role === 'PATIENT');
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found.' });
  }

  const doctorProfile = db.doctorProfiles.find(d => d.userId === req.user!.id);

  // Check if active grant already exists
  const existing = db.getActiveGrant(patientId, req.user!.id);
  if (existing) {
    return res.status(400).json({ error: 'An active access grant already exists.' });
  }

  const requestGrant: any = {
    id: `req_${Date.now()}`,
    patientId,
    doctorId: req.user!.id,
    patientName: patient.name,
    doctorName: doctorProfile?.doctorName || 'Dr. Sharma',
    doctorOrganization: doctorProfile?.organization || 'Apollo Clinic',
    permissions: permissions || ['Diagnoses', 'Medications', 'Allergies'],
    purpose: purpose || 'Consultation',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    type: 'STANDARD',
  };

  db.accessGrants.unshift(requestGrant);

  db.logEvent({
    patientId,
    doctorId: req.user!.id,
    action: 'ACCESS_REQUESTED',
    category: requestGrant.permissions.join(', '),
    purpose: requestGrant.purpose,
    type: 'STANDARD',
    details: `${doctorProfile?.doctorName || 'Doctor'} requested access for ${requestGrant.purpose}`,
  });

  res.json({ message: 'Access requested from patient.', request: requestGrant });
});

// Patient responds to access request (GRANT or DENY)
apiRouter.post('/access/respond/:id', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { decision, permissions } = req.body; // decision: 'GRANT' | 'DENY'

  const grant = db.accessGrants.find(g => g.id === id);
  if (!grant || grant.patientId !== req.user!.id) {
    return res.status(404).json({ error: 'Access request not found.' });
  }

  if (decision === 'DENY') {
    grant.status = 'DENIED';
    db.logEvent({
      patientId: req.user!.id,
      doctorId: grant.doctorId,
      action: 'ACCESS_DENIED',
      category: 'Access Request Denied',
      purpose: grant.purpose,
      type: grant.type,
      details: `Patient explicitly denied access request from ${grant.doctorName}. No data revealed.`,
    });

    return res.json({ message: 'Access request denied.', grant });
  }

  // GRANT
  const createdAt = new Date();
  grant.status = 'ACTIVE';
  grant.createdAt = createdAt.toISOString();
  grant.expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    grant.permissions = permissions;
  }

  db.logEvent({
    patientId: req.user!.id,
    doctorId: grant.doctorId,
    action: 'ACCESS_GRANTED',
    category: grant.permissions.join(', '),
    purpose: grant.purpose,
    type: grant.type,
    details: `Patient approved 24-hour access request for ${grant.doctorName}`,
  });

  res.json({ message: 'Access granted for 24 hours.', grant });
});

// ----------------------------------------------------
// AUDIT LOGGING / ACCESS HISTORY
// ----------------------------------------------------

apiRouter.get('/access/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.refreshGrants();
  let events = [];

  if (req.user!.role === 'PATIENT') {
    events = db.accessEvents.filter(e => e.patientId === req.user!.id);
  } else {
    // Doctor
    events = db.accessEvents.filter(e => e.doctorId === req.user!.id);
  }

  res.json({ events });
});

// ----------------------------------------------------
// DOCTOR ROUTES (STRICT SERVER-SIDE AUTHORIZATION)
// ----------------------------------------------------

apiRouter.get('/doctor/patients', requireAuth, requireRole('DOCTOR'), (req: AuthenticatedRequest, res: Response) => {
  db.refreshGrants();
  const doctorId = req.user!.id;

  // Filter ONLY patients with an ACTIVE and NON-EXPIRED access grant
  const activeGrants = db.accessGrants.filter(
    g => g.doctorId === doctorId && 
         g.status === 'ACTIVE' && 
         new Date(g.expiresAt).getTime() > Date.now()
  );

  const patients = activeGrants.map(grant => {
    const patientUser = db.users.find(u => u.id === grant.patientId);
    const patientProfile = db.patientProfiles.find(p => p.userId === grant.patientId);
    return {
      patientId: grant.patientId,
      name: patientUser?.name || grant.patientName || 'Rahul Sharma',
      username: patientUser?.username || 'rahul',
      age: patientProfile?.age || 21,
      grantId: grant.id,
      status: grant.status,
      permissions: grant.permissions,
      purpose: grant.purpose,
      expiresAt: grant.expiresAt,
      createdAt: grant.createdAt,
      type: grant.type,
    };
  });

  res.json({ patients });
});

apiRouter.get('/doctor/patient/:id', requireAuth, requireRole('DOCTOR'), (req: AuthenticatedRequest, res: Response) => {
  db.refreshGrants();
  const patientId = req.params.id;
  const doctorId = req.user!.id;

  // 1. Authenticated user (verified by requireAuth)
  // 2. Doctor role (verified by requireRole)
  // 3. Patient exists
  const patientUser = db.users.find(u => u.id === patientId && u.role === 'PATIENT');
  if (!patientUser) {
    return res.status(404).json({ error: 'Patient record not found.', code: 'NOT_FOUND' });
  }

  const patientProfile = db.patientProfiles.find(p => p.userId === patientId);

  // 4. Doctor relationship & 5. AccessGrant exists & 6. Status is ACTIVE & 7. Grant not expired
  const activeGrant = db.getActiveGrant(patientId, doctorId);

  if (!activeGrant) {
    // Check if there was an expired or revoked grant to give clear feedback
    const pastGrant = db.accessGrants.find(g => g.patientId === patientId && g.doctorId === doctorId);
    const reason = pastGrant?.status === 'REVOKED' 
      ? 'Access revoked by patient.' 
      : pastGrant?.status === 'EXPIRED' 
        ? '24-hour access expired.' 
        : 'Patient authorization required.';

    // Log unauthorized attempt
    db.logEvent({
      patientId,
      doctorId,
      action: 'ACCESS_DENIED',
      category: 'Unauthorized View Attempt',
      purpose: 'Unauthorized Access',
      type: 'STANDARD',
      details: `Doctor attempted to access records without active authorization. ${reason}`,
    });

    return res.status(403).json({
      error: `403 ACCESS DENIED. ${reason}`,
      code: 'FORBIDDEN',
      reason,
    });
  }

  // Record overall record view in audit log
  db.logEvent({
    patientId,
    doctorId,
    action: 'RECORD_VIEWED',
    category: 'Patient Record Accessed',
    purpose: activeGrant.purpose,
    type: activeGrant.type,
    details: `Doctor opened authorized record view for ${patientUser.name}`,
  });

  // GATHER ONLY AUTHORIZED CATEGORIES
  const patientRecords = db.medicalRecords.filter(r => r.patientId === patientId);

  const authorizedData: any = {};

  if (activeGrant.permissions.includes('Diagnoses')) {
    const diagList: any[] = [];
    for (const r of patientRecords) {
      if (r.extractedData.diagnoses) diagList.push(...r.extractedData.diagnoses);
    }
    authorizedData.diagnoses = diagList;
    db.logEvent({
      patientId,
      doctorId,
      action: 'DIAGNOSIS_VIEWED',
      category: 'Diagnoses',
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor viewed diagnoses`,
    });
  }

  if (activeGrant.permissions.includes('Medications')) {
    const medList: any[] = [];
    for (const r of patientRecords) {
      if (r.extractedData.medications) medList.push(...r.extractedData.medications);
    }
    authorizedData.medications = medList;
    db.logEvent({
      patientId,
      doctorId,
      action: 'MEDICATION_VIEWED',
      category: 'Medications',
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor viewed medications`,
    });
  }

  if (activeGrant.permissions.includes('Allergies')) {
    const algList: any[] = [];
    for (const r of patientRecords) {
      if (r.extractedData.allergies) algList.push(...r.extractedData.allergies);
    }
    authorizedData.allergies = algList;
    db.logEvent({
      patientId,
      doctorId,
      action: 'ALLERGY_VIEWED',
      category: 'Allergies',
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor viewed allergies`,
    });
  }

  if (activeGrant.permissions.includes('Investigations')) {
    const invList: any[] = [];
    for (const r of patientRecords) {
      if (r.extractedData.investigations) invList.push(...r.extractedData.investigations);
    }
    authorizedData.investigations = invList;
    db.logEvent({
      patientId,
      doctorId,
      action: 'INVESTIGATION_VIEWED',
      category: 'Investigations',
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor viewed investigations`,
    });
  }

  if (activeGrant.permissions.includes('Documents')) {
    authorizedData.documents = patientRecords.map(r => ({
      id: r.id,
      title: r.title,
      documentType: r.documentType,
      date: r.date,
      facility: r.facility,
      doctorName: r.doctorName,
    }));
    db.logEvent({
      patientId,
      doctorId,
      action: 'DOCUMENT_VIEWED',
      category: 'Documents',
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor viewed medical documents list`,
    });
  }

  res.json({
    patient: {
      id: patientUser.id,
      name: patientUser.name,
      username: patientUser.username,
      age: patientProfile?.age || 21,
      bloodGroup: patientProfile?.bloodGroup || 'B+',
    },
    grant: {
      id: activeGrant.id,
      permissions: activeGrant.permissions,
      purpose: activeGrant.purpose,
      expiresAt: activeGrant.expiresAt,
      createdAt: activeGrant.createdAt,
      status: activeGrant.status,
      type: activeGrant.type,
    },
    authorizedData,
  });
});

// Endpoint to simulate doctor attempting unauthorized category access (Hackathon step 15 & 16)
apiRouter.get('/doctor/patient/:id/probe-category/:category', requireAuth, requireRole('DOCTOR'), (req: AuthenticatedRequest, res: Response) => {
  db.refreshGrants();
  const { id: patientId, category } = req.params;
  const doctorId = req.user!.id;

  const activeGrant = db.getActiveGrant(patientId, doctorId);
  if (!activeGrant) {
    db.logEvent({
      patientId,
      doctorId,
      action: 'ACCESS_DENIED',
      category: category,
      purpose: 'Unauthorized Probe',
      type: 'STANDARD',
      details: `Doctor attempted unauthorized category probe "${category}" without active grant.`,
    });
    return res.status(403).json({
      error: '403 ACCESS DENIED: Patient authorization required.',
      code: 'FORBIDDEN',
      category,
    });
  }

  if (!activeGrant.permissions.includes(category as PermissionCategory)) {
    // Critical hackathon test requirement: return 403 HTTP!
    db.logEvent({
      patientId,
      doctorId,
      action: 'ACCESS_DENIED',
      category: category,
      purpose: activeGrant.purpose,
      type: activeGrant.type,
      details: `Doctor attempted to access unauthorized category "${category}". Patient has not authorized this permission.`,
    });

    return res.status(403).json({
      error: `403 ACCESS DENIED: Permission for "${category}" was NOT granted by the patient.`,
      code: 'FORBIDDEN',
      category,
      authorizedPermissions: activeGrant.permissions,
    });
  }

  res.json({
    message: `Permission for ${category} is authorized.`,
    authorized: true,
  });
});

// ----------------------------------------------------
// AI ROUTES (DOCUMENT EXTRACTION & CLINICAL SUMMARY)
// ----------------------------------------------------

apiRouter.post('/ai/extract', requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, base64Data, rawText } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required.' });
    }

    const extracted = await extractDocumentWithAI({
      fileName,
      fileType: fileType || 'application/pdf',
      base64Data,
      rawText,
    });

    res.json({
      message: 'Document analyzed successfully.',
      extracted,
    });
  } catch (err: any) {
    console.error('Error during AI extraction:', err);
    res.status(500).json({ error: 'Document extraction failed.' });
  }
});

apiRouter.post('/ai/summary', requireAuth, requireRole('DOCTOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const doctorId = req.user!.id;
    const activeGrant = db.getActiveGrant(patientId, doctorId);

    if (!activeGrant) {
      return res.status(403).json({
        error: '403 ACCESS DENIED: Active patient authorization required to generate summary.',
        code: 'FORBIDDEN',
      });
    }

    const patientUser = db.users.find(u => u.id === patientId);
    const patientProfile = db.patientProfiles.find(p => p.userId === patientId);
    const patientRecords = db.medicalRecords.filter(r => r.patientId === patientId);

    // CRITICAL: Filter ONLY authorized categories! Never send unauthorized data to Gemini!
    const authorizedData: any = {};
    if (activeGrant.permissions.includes('Diagnoses')) {
      const diag: any[] = [];
      for (const r of patientRecords) if (r.extractedData.diagnoses) diag.push(...r.extractedData.diagnoses);
      authorizedData.diagnoses = diag;
    }
    if (activeGrant.permissions.includes('Medications')) {
      const meds: any[] = [];
      for (const r of patientRecords) if (r.extractedData.medications) meds.push(...r.extractedData.medications);
      authorizedData.medications = meds;
    }
    if (activeGrant.permissions.includes('Allergies')) {
      const alg: any[] = [];
      for (const r of patientRecords) if (r.extractedData.allergies) alg.push(...r.extractedData.allergies);
      authorizedData.allergies = alg;
    }
    if (activeGrant.permissions.includes('Investigations')) {
      const inv: any[] = [];
      for (const r of patientRecords) if (r.extractedData.investigations) inv.push(...r.extractedData.investigations);
      authorizedData.investigations = inv;
    }
    if (activeGrant.permissions.includes('Documents')) {
      authorizedData.documents = patientRecords.map(r => ({
        title: r.title,
        documentType: r.documentType,
        date: r.date,
        facility: r.facility,
      }));
    }

    const summaryText = await generateClinicalSummaryWithAI({
      patientName: patientUser?.name || 'Rahul Sharma',
      patientAge: patientProfile?.age || 21,
      authorizedData,
      authorizedPermissions: activeGrant.permissions,
    });

    const summaryRecord = {
      id: `summary_${Date.now()}`,
      patientId,
      doctorId,
      content: summaryText,
      createdAt: new Date().toISOString(),
      authorizedCategories: activeGrant.permissions,
    };

    db.clinicalSummaries.unshift(summaryRecord);

    res.json({
      summary: summaryRecord,
    });
  } catch (err: any) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Failed to generate clinical summary.' });
  }
});

// ----------------------------------------------------
// EMERGENCY ACCESS ROUTES
// ----------------------------------------------------

apiRouter.post('/emergency-access', requireAuth, requireRole('DOCTOR'), (req: AuthenticatedRequest, res: Response) => {
  const { patientId, reason, requestedPermissions } = req.body;
  const patient = db.users.find(u => u.id === patientId && u.role === 'PATIENT');
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found.' });
  }

  const doctorProfile = db.doctorProfiles.find(d => d.userId === req.user!.id);

  const emergencyRequest: any = {
    id: `emg_${Date.now()}`,
    patientId,
    doctorId: req.user!.id,
    patientName: patient.name,
    doctorName: doctorProfile?.doctorName || 'Dr. Sharma',
    doctorOrganization: doctorProfile?.organization || 'Apollo Clinic',
    permissions: requestedPermissions || ['Diagnoses', 'Medications', 'Allergies'],
    purpose: reason || 'Emergency treatment',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4h emergency limit
    status: 'PENDING',
    type: 'EMERGENCY',
  };

  db.accessGrants.unshift(emergencyRequest);

  db.logEvent({
    patientId,
    doctorId: req.user!.id,
    action: 'EMERGENCY_ACCESS',
    category: emergencyRequest.permissions.join(', '),
    purpose: emergencyRequest.purpose,
    type: 'EMERGENCY',
    details: `EMERGENCY ACCESS REQUEST: ${doctorProfile?.doctorName} requested priority access. Reason: "${emergencyRequest.purpose}"`,
  });

  res.json({
    message: 'Emergency access request logged and transmitted to patient.',
    request: emergencyRequest,
  });
});

apiRouter.patch('/emergency-access/:id', requireAuth, requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'GRANT' or 'DENY'

  const grant = db.accessGrants.find(g => g.id === id && g.type === 'EMERGENCY');
  if (!grant || grant.patientId !== req.user!.id) {
    return res.status(404).json({ error: 'Emergency request not found.' });
  }

  if (action === 'DENY') {
    grant.status = 'DENIED';
    db.logEvent({
      patientId: req.user!.id,
      doctorId: grant.doctorId,
      action: 'ACCESS_DENIED',
      category: 'Emergency Request Denied',
      purpose: grant.purpose,
      type: 'EMERGENCY',
      details: `Patient denied emergency access request from ${grant.doctorName}.`,
    });
    return res.json({ message: 'Emergency access denied.', grant });
  }

  // GRANT
  const createdAt = new Date();
  grant.status = 'ACTIVE';
  grant.createdAt = createdAt.toISOString();
  grant.expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours for emergency

  db.logEvent({
    patientId: req.user!.id,
    doctorId: grant.doctorId,
    action: 'EMERGENCY_ACCESS',
    category: grant.permissions.join(', '),
    purpose: grant.purpose,
    type: 'EMERGENCY',
    details: `EMERGENCY ACCESS AUTHORIZED by patient for 4 hours. Doctor: ${grant.doctorName}`,
  });

  res.json({ message: 'Emergency access authorized for 4 hours.', grant });
});

// ----------------------------------------------------
// UTILITY / LOOKUP ROUTES
// ----------------------------------------------------

// List registered doctors so patient can select them
apiRouter.get('/doctors', requireAuth, (req: Request, res: Response) => {
  const doctors = db.doctorProfiles.map(d => ({
    id: d.userId,
    name: d.doctorName,
    organization: d.organization,
    specialty: d.specialty || 'General Physician',
  }));
  res.json({ doctors });
});

// Lookup patient for doctor
apiRouter.get('/patients/lookup', requireAuth, requireRole('DOCTOR'), (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const patients = db.users
    .filter(u => u.role === 'PATIENT' && (u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)))
    .map(u => {
      const p = db.patientProfiles.find(prof => prof.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        age: p?.age || 21,
      };
    });
  res.json({ patients });
});
