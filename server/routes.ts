import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase, saveDatabase, logAudit } from './db';
import { hashPassword, comparePassword, generateToken, verifyToken, generateStaffIdentifier, resolveUserPermissions } from './auth';
import { User, DepartmentAssignment, FinancialTransaction, WorshipSchedule, Member } from './types';

export const apiRouter = Router();

// Extend Request interface to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    loginIdentifier: string;
    name: string;
    email: string;
    mustChangePassword: boolean;
    status: string;
    permissions: string[];
    assignments: DepartmentAssignment[];
  };
}

// Authentication Middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  if (payload.status === 'inactive') {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact the administrator.' });
  }

  req.user = payload;
  next();
}

// Permission Checking Middleware (RBAC)
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const isSystemAdmin = req.user.permissions.includes('users.deactivate') && req.user.permissions.includes('departments.manage');
    const hasPerm = req.user.permissions.includes(permission) || isSystemAdmin;

    if (!hasPerm) {
      return res.status(403).json({
        error: `Access Denied: You lack the required permission (${permission}) for this operation.`
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

/**
 * POST /api/auth/login
 * Handles both staff login identifiers (e.g. admin@system-gtra.org, fSiximba@worship-gtra.org)
 * and member email addresses.
 */
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Login identifier and password are required.' });
    }

    const cleanIdentifier = String(loginIdentifier).trim().toLowerCase();
    const db = await getDatabase();

    // Find by loginIdentifier or by email
    const user = db.users.find(
      (u) =>
        u.loginIdentifier.toLowerCase() === cleanIdentifier ||
        u.email.toLowerCase() === cleanIdentifier
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username, staff identifier, or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account is deactivated. Please consult your administrator.' });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username, staff identifier, or password.' });
    }

    const permissions = resolveUserPermissions(user, db.roles);
    const token = generateToken(user, permissions);

    await logAudit(user.id, user.loginIdentifier, 'USER_LOGIN', {
      method: 'password',
      mustChangePassword: user.mustChangePassword,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginIdentifier: user.loginIdentifier,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        assignments: user.departmentAssignments,
      },
      permissions,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Authentication failed due to internal error.' });
  }
});

/**
 * POST /api/auth/register
 * Public registration for church members.
 * Strictly prevents self-assignment of staff roles or privileged GTRA domains.
 */
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email address, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();

    // Security check: ordinary public users CANNOT register with staff domains!
    const privilegedDomains = [
      'system-gtra.org',
      'leader-gtra.org',
      'finance-gtra.org',
      'worship-gtra.org',
      'pastor-gtra.org',
      'youth-gtra.org',
      'media-gtra.org',
      'admin-gtra.org'
    ];
    const isPrivilegedDomain = privilegedDomains.some((d) => cleanEmail.endsWith(`@${d}`));

    if (isPrivilegedDomain) {
      return res.status(400).json({
        error: 'Privileged staff domains (@*-gtra.org) cannot be self-registered. Please contact the Church Administrator.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = await getDatabase();

    const existingUser = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.loginIdentifier.toLowerCase() === cleanEmail
    );
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr-mbr-${Date.now()}`,
      name: cleanName,
      firstName,
      lastName,
      email: cleanEmail,
      loginIdentifier: cleanEmail,
      passwordHash,
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [], // Ordinary member has no staff department assignments
      phone: phone ? String(phone).trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Also add to member directory
    db.members.push({
      id: `mbr-${Date.now()}`,
      userId: newUser.id,
      fullName: cleanName,
      email: cleanEmail,
      phone: phone || '',
      address: 'Edwaleni Community',
      membershipStatus: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      ministryInterests: [],
    });

    await saveDatabase(db);
    await logAudit(newUser.id, newUser.loginIdentifier, 'MEMBER_REGISTERED', { email: cleanEmail });

    const permissions: string[] = [];
    const token = generateToken(newUser, permissions);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        loginIdentifier: newUser.loginIdentifier,
        status: newUser.status,
        mustChangePassword: false,
        assignments: [],
      },
      permissions,
      mustChangePassword: false,
    });
  } catch (err: any) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated user with permissions and assignments.
 */
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const user = db.users.find((u) => u.id === req.user?.userId);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const permissions = resolveUserPermissions(user, db.roles);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        loginIdentifier: user.loginIdentifier,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        assignments: user.departmentAssignments,
        phone: user.phone,
      },
      permissions,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err: any) {
    console.error('Auth /me Error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * POST /api/auth/change-password
 * Allows users (or required initial admin) to update their password securely.
 */
apiRouter.post('/auth/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const db = await getDatabase();
    const user = db.users.find((u) => u.id === req.user?.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await comparePassword(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: 'Current password provided is incorrect.' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    await logAudit(user.id, user.loginIdentifier, 'PASSWORD_CHANGED', {
      note: 'User successfully updated password and cleared mustChangePassword flag.',
    });

    res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// -------------------------------------------------------------
// 2. DEPARTMENTS & POSITIONS MANAGEMENT
// -------------------------------------------------------------

apiRouter.get('/departments', async (_req: Request, res: Response) => {
  const db = await getDatabase();
  res.json(db.departments);
});

apiRouter.post('/departments', requireAuth, requirePermission('departments.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, categoryDomain, description } = req.body;
    if (!name || !code || !categoryDomain) {
      return res.status(400).json({ error: 'Name, code, and categoryDomain are required.' });
    }

    const db = await getDatabase();
    const newDept = {
      id: `dept-${Date.now()}`,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      categoryDomain: String(categoryDomain).trim().toLowerCase().replace(/^@/, ''),
      description: String(description || '').trim(),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    db.departments.push(newDept);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'DEPARTMENT_CREATED', newDept);

    res.status(201).json(newDept);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

apiRouter.put('/departments/:id', requireAuth, requirePermission('departments.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, categoryDomain } = req.body;

    const db = await getDatabase();
    const dept = db.departments.find((d) => d.id === id);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    if (name) dept.name = String(name).trim();
    if (description !== undefined) dept.description = String(description).trim();
    if (status) dept.status = status;
    if (categoryDomain) dept.categoryDomain = String(categoryDomain).trim().toLowerCase().replace(/^@/, '');

    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'DEPARTMENT_UPDATED', { id, name: dept.name, status: dept.status });

    res.json(dept);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update department.' });
  }
});

apiRouter.get('/positions', async (_req: Request, res: Response) => {
  const db = await getDatabase();
  res.json(db.positions);
});

apiRouter.post('/positions', requireAuth, requirePermission('departments.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, departmentId, defaultRoleId, description } = req.body;
    if (!title || !departmentId || !defaultRoleId) {
      return res.status(400).json({ error: 'Title, departmentId, and defaultRoleId are required.' });
    }

    const db = await getDatabase();
    const newPos = {
      id: `pos-${Date.now()}`,
      title: String(title).trim(),
      departmentId: String(departmentId),
      defaultRoleId: String(defaultRoleId),
      description: String(description || '').trim(),
    };

    db.positions.push(newPos);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'POSITION_CREATED', newPos);

    res.status(201).json(newPos);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create position.' });
  }
});

apiRouter.get('/roles', async (_req: Request, res: Response) => {
  const db = await getDatabase();
  res.json(db.roles);
});

// -------------------------------------------------------------
// 3. STAFF MANAGEMENT (STAFF IDENTIFIER CONVENTION & RBAC)
// -------------------------------------------------------------

apiRouter.get('/staff', requireAuth, requirePermission('users.view'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  const staffUsers = db.users
    .filter((u) => (u.departmentAssignments && u.departmentAssignments.length > 0) || u.loginIdentifier.includes('@'))
    .map((u) => ({
      id: u.id,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      loginIdentifier: u.loginIdentifier,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      assignments: u.departmentAssignments,
      phone: u.phone,
      createdAt: u.createdAt,
    }));

  res.json(staffUsers);
});

/**
 * POST /api/staff
 * Creates a new staff member and auto-generates their GTRA staff login email
 * using the requested convention (initialSurname@domain).
 */
apiRouter.post('/staff', requireAuth, requirePermission('users.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, departmentId, positionId, roleId, phone } = req.body;

    if (!firstName || !lastName || !departmentId || !positionId || !roleId) {
      return res.status(400).json({ error: 'First name, surname, department, position, and role are required.' });
    }

    const db = await getDatabase();
    const dept = db.departments.find((d) => d.id === departmentId);
    if (!dept) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    // Auto-generate staff login identifier
    const loginIdentifier = generateStaffIdentifier(firstName, lastName, dept.categoryDomain, db.users);

    const initialPassword = 'Gtra' + Math.floor(1000 + Math.random() * 9000) + '!';
    const passwordHash = await hashPassword(initialPassword);

    const newStaff: User = {
      id: `usr-stf-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: loginIdentifier,
      loginIdentifier,
      passwordHash,
      mustChangePassword: true, // Must change on first login!
      status: 'active',
      departmentAssignments: [
        {
          departmentId,
          positionId,
          roleId,
        },
      ],
      phone: phone ? String(phone).trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newStaff);
    await saveDatabase(db);

    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'STAFF_CREATED', {
      staffId: newStaff.id,
      loginIdentifier: newStaff.loginIdentifier,
      department: dept.name,
      positionId,
      roleId,
    });

    res.status(201).json({
      success: true,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        loginIdentifier: newStaff.loginIdentifier,
        email: newStaff.email,
        status: newStaff.status,
        assignments: newStaff.departmentAssignments,
      },
      initialPassword, // Provided to admin to give to staff
    });
  } catch (err: any) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: err.message || 'Failed to create staff member.' });
  }
});

/**
 * PUT /api/staff/:id
 * Assigns or updates staff department, position, role, or active status.
 */
apiRouter.put('/staff/:id', requireAuth, requirePermission('users.update'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignments, regenerateIdentifier } = req.body;

    const db = await getDatabase();
    const staff = db.users.find((u) => u.id === id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    // Safety: prevent deactivating the default admin if it's the only admin
    if (staff.loginIdentifier === 'admin@system-gtra.org' && status === 'inactive') {
      return res.status(400).json({ error: 'The primary system administrator account cannot be deactivated.' });
    }

    if (status) {
      staff.status = status;
    }

    if (Array.isArray(assignments)) {
      staff.departmentAssignments = assignments;

      // If requested or if department changed, re-evaluate domain identifier
      if (regenerateIdentifier && assignments.length > 0) {
        const primaryDept = db.departments.find((d) => d.id === assignments[0].departmentId);
        if (primaryDept && primaryDept.categoryDomain) {
          const newIdent = generateStaffIdentifier(
            staff.firstName,
            staff.lastName,
            primaryDept.categoryDomain,
            db.users,
            staff.id
          );
          staff.loginIdentifier = newIdent;
          staff.email = newIdent;
        }
      }
    }

    staff.updatedAt = new Date().toISOString();
    await saveDatabase(db);

    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'STAFF_UPDATED', {
      staffId: staff.id,
      loginIdentifier: staff.loginIdentifier,
      status: staff.status,
      assignments: staff.departmentAssignments,
    });

    res.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        loginIdentifier: staff.loginIdentifier,
        email: staff.email,
        status: staff.status,
        assignments: staff.departmentAssignments,
      },
    });
  } catch (err: any) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff record.' });
  }
});

// -------------------------------------------------------------
// 4. CHURCH MEMBERS DIRECTORY (PASTOR & ADMIN)
// -------------------------------------------------------------

apiRouter.get('/members', requireAuth, requirePermission('members.view'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  res.json(db.members);
});

apiRouter.post('/members', requireAuth, requirePermission('members.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email, phone, address, membershipStatus, ministryInterests, pastoralNotes } = req.body;
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const db = await getDatabase();
    const newMember: Member = {
      id: `mbr-${Date.now()}`,
      fullName: String(fullName).trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
      address: String(address || 'Edwaleni').trim(),
      membershipStatus: membershipStatus || 'active',
      joinDate: new Date().toISOString().split('T')[0],
      ministryInterests: Array.isArray(ministryInterests) ? ministryInterests : [],
      pastoralNotes: pastoralNotes ? String(pastoralNotes).trim() : undefined,
    };

    db.members.push(newMember);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'MEMBER_ADDED', { id: newMember.id, name: newMember.fullName });

    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// -------------------------------------------------------------
// 5. FINANCE OPERATIONS (TREASURER, CFO, AUDITOR)
// -------------------------------------------------------------

apiRouter.get('/finance/transactions', requireAuth, requirePermission('finance.transactions.view'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  res.json(db.transactions);
});

apiRouter.post('/finance/transactions', requireAuth, requirePermission('finance.transactions.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, amount, currency, description, donorName } = req.body;

    const numAmount = parseFloat(amount);
    if (!type || !category || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid transaction type, category, and positive amount are required.' });
    }

    const db = await getDatabase();
    const isIncome = ['tithe', 'offering', 'donation', 'project'].includes(type);

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      category: String(category).trim(),
      amount: numAmount,
      currency: currency === 'ZAR' ? 'ZAR' : 'USD',
      description: String(description || '').trim(),
      recordedBy: req.user!.userId,
      recordedByName: req.user!.name,
      donorName: donorName ? String(donorName).trim() : undefined,
      // Income transactions automatically marked approved; expense requests start as pending
      status: isIncome ? 'approved' : 'pending',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    if (isIncome) {
      newTx.approvedBy = req.user!.userId;
      newTx.approvedByName = req.user!.name;
      newTx.approvedAt = new Date().toISOString();
    }

    db.transactions.unshift(newTx);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'FINANCE_TRANSACTION_RECORDED', {
      id: newTx.id,
      type: newTx.type,
      amount: newTx.amount,
      currency: newTx.currency,
      status: newTx.status,
    });

    res.status(201).json(newTx);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record transaction.' });
  }
});

apiRouter.post('/finance/transactions/:id/approve', requireAuth, requirePermission('finance.transactions.approve'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const tx = db.transactions.find((t) => t.id === id);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction record not found.' });
    }

    tx.status = 'approved';
    tx.approvedBy = req.user!.userId;
    tx.approvedByName = req.user!.name;
    tx.approvedAt = new Date().toISOString();

    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'FINANCE_TRANSACTION_APPROVED', {
      id: tx.id,
      amount: tx.amount,
      approver: req.user!.name,
    });

    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve transaction.' });
  }
});

// -------------------------------------------------------------
// 6. WORSHIP AND PRAISE OPERATIONS
// -------------------------------------------------------------

apiRouter.get('/worship/schedules', requireAuth, requirePermission('worship.schedule.view'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  res.json(db.worshipSchedules);
});

apiRouter.post('/worship/schedules', requireAuth, requirePermission('worship.schedule.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, date, time, venue, recurrence, songs, roster, notes } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required for worship schedule.' });
    }

    const db = await getDatabase();
    const newSchedule: WorshipSchedule = {
      id: `ws-${Date.now()}`,
      title: String(title).trim(),
      type: type || 'rehearsal',
      date: String(date).trim(),
      time: String(time).trim(),
      venue: String(venue || 'Main Sanctuary • Edwaleni').trim(),
      recurrence: recurrence || 'none',
      songs: Array.isArray(songs) ? songs : [],
      roster: Array.isArray(roster) ? roster : [],
      notes: String(notes || '').trim(),
      attendanceRecorded: false,
      attendedMembers: [],
      createdAt: new Date().toISOString(),
    };

    db.worshipSchedules.unshift(newSchedule);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'WORSHIP_SCHEDULE_CREATED', {
      id: newSchedule.id,
      title: newSchedule.title,
      date: newSchedule.date,
    });

    res.status(201).json(newSchedule);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create worship schedule.' });
  }
});

apiRouter.post('/worship/schedules/:id/attendance', requireAuth, requirePermission('worship.attendance.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { attendedMembers } = req.body;

    const db = await getDatabase();
    const sched = db.worshipSchedules.find((s) => s.id === id);

    if (!sched) {
      return res.status(404).json({ error: 'Worship schedule not found.' });
    }

    sched.attendanceRecorded = true;
    sched.attendedMembers = Array.isArray(attendedMembers) ? attendedMembers : [];

    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'WORSHIP_ATTENDANCE_RECORDED', {
      id: sched.id,
      count: sched.attendedMembers.length,
    });

    res.json(sched);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record worship attendance.' });
  }
});

// -------------------------------------------------------------
// 7. SECURITY AUDIT LOGS
// -------------------------------------------------------------

apiRouter.get('/audit-logs', requireAuth, requirePermission('users.view'), async (req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  // Filter or return logs
  res.json(db.auditLogs.slice(0, 100));
});
