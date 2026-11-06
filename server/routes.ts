import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase, saveDatabase, logAudit } from './db';
import { comparePassword, generateStaffIdentifier, resolveUserPermissions } from './auth';
import { User, DepartmentAssignment, FinancialTransaction, WorshipSchedule, Member } from './types';
import { getSupabaseAdmin, getSupabasePublic } from './supabase';
import { sendStaffInvitation } from './brevo';
import { createMediaDownloadUrl, createMediaUpload, verifyMediaUpload } from './r2';
import { randomBytes } from 'node:crypto';

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
    authUserId: string;
  };
}

// Authentication Middleware
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user: authUser }, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !authUser?.email) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    const db = await getDatabase();
    const profile = db.users.find((entry) =>
      entry.authUserId === authUser.id || entry.email.toLowerCase() === authUser.email!.toLowerCase()
    );
    if (!profile) {
      return res.status(401).json({ error: 'Account profile not found. Contact the system administrator.' });
    }
    if (profile.status === 'inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact the administrator.' });
    }

    const permissions = resolveUserPermissions(profile, db.roles);
    req.user = {
      userId: profile.id,
      loginIdentifier: profile.loginIdentifier,
      name: profile.name,
      email: profile.email,
      mustChangePassword: profile.mustChangePassword,
      status: profile.status,
      permissions,
      assignments: profile.departmentAssignments,
      authUserId: authUser.id,
    };
    return next();
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return res.status(503).json({ error: 'Authentication service is unavailable. Try again shortly.' });
  }
}

// Permission Checking Middleware (RBAC)
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.status === 'pending') {
      return res.status(403).json({ error: 'Verify your email and set your password before using the portal.' });
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

    const adminClient = getSupabaseAdmin();

    if (!user.authUserId) {
      const passwordMatch = user.passwordHash
        ? await comparePassword(password, user.passwordHash)
        : false;
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username, staff identifier, or password.' });
      }

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      });
      if (createError || !created.user) {
        console.error('Legacy account migration failed:', createError);
        return res.status(503).json({ error: 'Could not migrate this account to secure sign-in. Contact the system administrator.' });
      }

      user.authUserId = created.user.id;
      user.passwordHash = undefined;
      user.updatedAt = new Date().toISOString();
      await saveDatabase(db);
    }

    const { data: session, error: signInError } = await getSupabasePublic().auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError || !session.session) {
      return res.status(401).json({ error: 'Invalid username, staff identifier, or password.' });
    }

    const permissions = resolveUserPermissions(user, db.roles);

    await logAudit(user.id, user.loginIdentifier, 'USER_LOGIN', {
      method: 'password',
      mustChangePassword: user.mustChangePassword,
    });

    res.json({
      token: session.session.access_token,
      refreshToken: session.session.refresh_token,
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

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
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

    const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });
    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Could not create your account.' });
    }

    const newUser: User = {
      id: `usr-mbr-${Date.now()}`,
      name: cleanName,
      firstName,
      lastName,
      email: cleanEmail,
      loginIdentifier: cleanEmail,
      authUserId: authData.user.id,
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

    try {
      await saveDatabase(db);
    } catch (error) {
      await getSupabaseAdmin().auth.admin.deleteUser(authData.user.id);
      throw error;
    }
    await logAudit(newUser.id, newUser.loginIdentifier, 'MEMBER_REGISTERED', { email: cleanEmail });

    const { data: loginData, error: loginError } = await getSupabasePublic().auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (loginError || !loginData.session) {
      throw new Error('Account created, but automatic sign-in failed. Please sign in manually.');
    }

    res.status(201).json({
      token: loginData.session.access_token,
      refreshToken: loginData.session.refresh_token,
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
      permissions: [],
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

    const { error: verifyError } = await getSupabasePublic().auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return res.status(400).json({ error: 'Current password provided is incorrect.' });
    }

    if (!user.authUserId) {
      return res.status(400).json({ error: 'This account has not completed secure account migration.' });
    }

    const { error: updateError } = await getSupabaseAdmin().auth.admin.updateUserById(user.authUserId, {
      password: newPassword,
    });
    if (updateError) {
      console.error('Password update failed:', updateError);
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    user.passwordHash = undefined;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    await logAudit(user.id, user.loginIdentifier, 'PASSWORD_CHANGED', {
      note: 'User successfully updated password and cleared mustChangePassword flag.',
    });

    apiRouter.post('/auth/activate', requireAuth, async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDatabase();
        const user = db.users.find((entry) => entry.id === req.user?.userId);
        if (!user || user.authUserId !== req.user?.authUserId) {
          return res.status(404).json({ error: 'Invited account profile was not found.' });
        }

        user.status = 'active';
        user.mustChangePassword = false;
        user.updatedAt = new Date().toISOString();
        await saveDatabase(db);
        await logAudit(user.id, user.loginIdentifier, 'STAFF_INVITATION_ACCEPTED', {
          email: user.email,
        });
        return res.json({ success: true });
      } catch (error) {
        console.error('Invitation activation failed:', error);
        return res.status(500).json({ error: 'Could not activate this account.' });
      }
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
 * Creates a pending staff profile and sends a one-time Supabase invitation link through Brevo.
 */
apiRouter.post('/staff', requireAuth, requirePermission('users.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, departmentId, positionId, roleId, phone } = req.body;

    if (!firstName || !lastName || !email || !departmentId || !positionId || !roleId) {
      return res.status(400).json({ error: 'First name, surname, contact email, department, position, and role are required.' });
    }

    const db = await getDatabase();
    const dept = db.departments.find((d) => d.id === departmentId);
    if (!dept) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }
    if (!db.positions.some((position) => position.id === positionId && position.departmentId === departmentId)) {
      return res.status(400).json({ error: 'Selected position does not belong to the selected department.' });
    }
    if (!db.roles.some((role) => role.id === roleId)) {
      return res.status(400).json({ error: 'Selected application role does not exist.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid contact email address.' });
    }
    if (db.users.some((user) => user.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const loginIdentifier = generateStaffIdentifier(firstName, lastName, dept.categoryDomain, db.users);
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      return res.status(503).json({ error: 'APP_URL must be configured before staff invitations can be sent.' });
    }

    const { data: inviteData, error: inviteError } = await getSupabaseAdmin().auth.admin.generateLink({
      type: 'invite',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl.replace(/\/$/, '')}/?setup=invite`,
        data: { full_name: `${String(firstName).trim()} ${String(lastName).trim()}` },
      },
    });
    if (inviteError || !inviteData.user || !inviteData.properties.action_link) {
      console.error('Supabase invitation generation failed:', inviteError);
      return res.status(502).json({ error: 'Could not create an account invitation. Check Supabase Auth configuration.' });
    }

    const newStaff: User = {
      id: `usr-stf-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      authUserId: inviteData.user.id,
      loginIdentifier,
      mustChangePassword: false,
      status: 'pending',
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
    try {
      await saveDatabase(db);
    } catch (error) {
      await getSupabaseAdmin().auth.admin.deleteUser(inviteData.user.id);
      throw error;
    }
    try {
      await sendStaffInvitation(cleanEmail, newStaff.name, inviteData.properties.action_link);
    } catch (error) {
      try {
        const rollback = await getDatabase();
        rollback.users = rollback.users.filter((user) => user.id !== newStaff.id);
        await saveDatabase(rollback);
      } catch (rollbackError) {
        console.error('Could not roll back staff profile after invitation email failure:', rollbackError);
      }
      await getSupabaseAdmin().auth.admin.deleteUser(inviteData.user.id);
      throw error;
    }

    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'STAFF_CREATED', {
      staffId: newStaff.id,
      loginIdentifier: newStaff.loginIdentifier,
      email: newStaff.email,
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
    if (staff.status === 'pending' && status === 'active') {
      return res.status(400).json({ error: 'Pending invitations can only be activated by completing the emailed account setup link.' });
    }
    if (status !== undefined && status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ error: 'Staff status must be active or inactive.' });
    }

    // Safety: prevent deactivating the default admin if it's the only admin
    if (staff.loginIdentifier === 'admin@system-gtra.org' && status === 'inactive') {
      return res.status(400).json({ error: 'The primary system administrator account cannot be deactivated.' });
    }

    if (status) {
      if (staff.authUserId) {
        const { error: authUpdateError } = await getSupabaseAdmin().auth.admin.updateUserById(staff.authUserId, {
          ban_duration: status === 'inactive' ? '876000h' : 'none',
        });
        if (authUpdateError) {
          console.error('Could not update staff sign-in status:', authUpdateError);
          return res.status(502).json({ error: 'Could not update the staff account in Supabase Auth.' });
        }
      }
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

apiRouter.get('/members', requireAuth, requirePermission('members.view'), async (req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  if (!req.user!.permissions.includes('pastoral_care.view')) {
    return res.json(db.members.map(({ pastoralNotes: _pastoralNotes, ...member }) => member));
  }
  return res.json(db.members);
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

apiRouter.get('/appointments', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user?.permissions.includes('pastoral_care.view')) {
    return res.status(403).json({ error: 'You do not have permission to view appointment requests.' });
  }
  const db = await getDatabase();
  return res.json(db.appointments);
});

apiRouter.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { userName, contactInfo, userEmail, dateTime, timeSlot, type, notes } = req.body;
    if (!userName || !contactInfo || !dateTime || !timeSlot || !type) {
      return res.status(400).json({ error: 'Name, contact information, date, time, and session type are required.' });
    }
    if (typeof notes === 'string' && notes.length > 500) {
      return res.status(400).json({ error: 'Notes must be 500 characters or fewer.' });
    }
    if (!Number.isFinite(Date.parse(dateTime)) || Date.parse(dateTime) < Date.now()) {
      return res.status(400).json({ error: 'Appointment date must be in the future.' });
    }

    const db = await getDatabase();
    const appointment = {
      id: `appt-${Date.now()}-${randomBytes(4).toString('hex')}`,
      userName: String(userName).trim().slice(0, 100),
      contactInfo: String(contactInfo).trim().slice(0, 255),
      userEmail: typeof userEmail === 'string' ? userEmail.trim().slice(0, 255) : '',
      dateTime: new Date(dateTime).toISOString(),
      timeSlot: String(timeSlot).trim().slice(0, 50),
      type: String(type).trim().slice(0, 50),
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    db.appointments.unshift(appointment);
    await saveDatabase(db);
    return res.status(201).json({ success: true, appointmentId: appointment.id });
  } catch (error) {
    console.error('Appointment request creation failed:', error);
    return res.status(500).json({ error: 'Could not submit the appointment request.' });
  }
});

apiRouter.get('/event-requests', requireAuth, requirePermission('events.manage'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  return res.json(db.eventRequests);
});

apiRouter.post('/event-requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, eventTitle } = req.body;
    if (![eventId, eventTitle].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Event is required.' });
    }
    if (req.user!.status !== 'active') {
      return res.status(403).json({ error: 'Complete your account setup before sending an event request.' });
    }
    const db = await getDatabase();
    const requester = db.users.find((user) => user.id === req.user!.userId);
    if (!requester) return res.status(404).json({ error: 'Your account profile was not found.' });
    if (db.eventRequests.some((entry) => entry.eventId === eventId.trim() && entry.requesterUserId === requester.id)) {
      return res.status(409).json({ error: 'You have already sent a request for this event.' });
    }
    const request = {
      id: `event-request-${randomBytes(8).toString('hex')}`,
      eventId: eventId.trim().slice(0, 100),
      eventTitle: eventTitle.trim().slice(0, 150),
      requesterUserId: requester.id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    db.eventRequests.unshift(request);
    await saveDatabase(db);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Event request creation failed:', error);
    return res.status(500).json({ error: 'Could not submit the event request.' });
  }
});

apiRouter.get('/media/assets', requireAuth, requirePermission('media.assets.view'), async (_req: AuthRequest, res: Response) => {
  const db = await getDatabase();
  res.json(db.mediaAssets);
});

apiRouter.post('/media/uploads', requireAuth, requirePermission('media.assets.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, contentType, size } = req.body;
    if (typeof name !== 'string' || typeof contentType !== 'string') {
      return res.status(400).json({ error: 'File name and content type are required.' });
    }
    const upload = await createMediaUpload(req.user!.userId, name, contentType, Number(size));
    return res.json(upload);
  } catch (error) {
    console.error('Media upload URL creation failed:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not prepare media upload.' });
  }
});

apiRouter.post('/media/assets', requireAuth, requirePermission('media.assets.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, objectKey } = req.body;
    if (typeof name !== 'string' || typeof objectKey !== 'string' ||
        !objectKey.startsWith(`church-media/${req.user!.userId}/`)) {
      return res.status(400).json({ error: 'Invalid media upload details.' });
    }

    const file = await verifyMediaUpload(objectKey);
    const db = await getDatabase();
    const asset = {
      id: `media-${randomBytes(12).toString('hex')}`,
      name: name.trim().slice(0, 150),
      objectKey,
      contentType: file.contentType,
      size: file.size,
      uploadedBy: req.user!.userId,
      uploadedAt: new Date().toISOString(),
    };
    db.mediaAssets.unshift(asset);
    await saveDatabase(db);
    await logAudit(req.user!.userId, req.user!.loginIdentifier, 'MEDIA_ASSET_UPLOADED', {
      assetId: asset.id,
      name: asset.name,
    });
    return res.status(201).json(asset);
  } catch (error) {
    console.error('Media asset registration failed:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not save media asset.' });
  }
});

apiRouter.get('/media/assets/:id/url', requireAuth, requirePermission('media.assets.view'), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const asset = db.mediaAssets.find((entry) => entry.id === req.params.id);
    if (!asset) return res.status(404).json({ error: 'Media asset not found.' });
    const url = await createMediaDownloadUrl(asset.objectKey);
    return res.json({ url, expiresIn: 300 });
  } catch (error) {
    console.error('Media download link creation failed:', error);
    return res.status(500).json({ error: 'Could not create a media download link.' });
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
