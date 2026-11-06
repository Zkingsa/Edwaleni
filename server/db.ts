import fs from 'fs';
import path from 'path';
import { DatabaseSchema, AuditLog, User } from './types';
import { INITIAL_DEPARTMENTS, INITIAL_POSITIONS, INITIAL_ROLES } from './seedData';
import { hashPassword } from './auth';
import { getSupabaseAdmin } from './supabase';

const DEFAULT_DATA_FILE = path.join(process.cwd(), 'data', 'church-store.json');

// In-memory cache to ensure speed and consistency
let cache: DatabaseSchema | null = null;
const STATE_ID = 1;

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

function ensureDataDirectory() {
  const directory = path.dirname(getDataFile());
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function getDataFile() {
  return process.env.CHURCH_DATA_FILE || DEFAULT_DATA_FILE;
}

function removeDemoData(db: DatabaseSchema): boolean {
  const demoUserIds = new Set([
    'usr-pastor-khaya',
    'usr-worship-manager',
    'usr-treasurer',
    'usr-sample-member',
    'usr-mbr-1793190575426',
    'usr-stf-1793190575579',
  ]);
  const demoUserEmails = new Set([
    'skhaya@pastor-gtra.org',
    'mdlamini@worship-gtra.org',
    'tmaseko@finance-gtra.org',
    'lindiwe.zulu@gmail.com',
    'member.1793190575310@gmail.com',
    'fsiximba@worship-gtra.org',
  ]);
  const demoMemberIds = new Set(['mbr-1', 'mbr-2', 'mbr-3', 'mbr-1793190575426']);
  const demoMemberEmails = new Set([
    'bongani.s@gmail.com',
    'nomcebo.sim@outlook.com',
    'zodwa.v@yahoo.com',
    'member.1793190575310@gmail.com',
  ]);
  const demoScheduleIds = new Set(['ws-1', 'ws-2']);
  const demoTransactionIds = new Set(['tx-1', 'tx-2', 'tx-3']);
  const hasDemoData =
    db.users.some((user) => demoUserIds.has(user.id) || demoUserEmails.has(user.email.toLowerCase())) ||
    db.members.some((member) => demoMemberIds.has(member.id) || demoMemberEmails.has(member.email.toLowerCase())) ||
    db.worshipSchedules.some((schedule) => demoScheduleIds.has(schedule.id)) ||
    db.transactions.some((transaction) => demoTransactionIds.has(transaction.id));
  if (!hasDemoData) return false;

  db.users = db.users.filter((user) => !demoUserIds.has(user.id) && !demoUserEmails.has(user.email.toLowerCase()));
  db.members = db.members.filter((member) => !demoMemberIds.has(member.id) && !demoMemberEmails.has(member.email.toLowerCase()));
  db.worshipSchedules = db.worshipSchedules.filter((schedule) => !demoScheduleIds.has(schedule.id));
  db.transactions = db.transactions.filter((transaction) => !demoTransactionIds.has(transaction.id));

  return true;
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (!isSupabaseConfigured() && cache) {
    return cache;
  }

  ensureDataDirectory();
  const dataFile = getDataFile();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from('church_state')
      .select('payload, revision')
      .eq('id', STATE_ID)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load church data from Supabase: ${error.message}`);
    }

    if (row) {
      const state = row.payload as DatabaseSchema;
      state.revision = Number(row.revision);
      state.appointments ||= [];
      state.eventRequests ||= [];
      state.mediaAssets ||= [];
      await seedInitialData(state);
      return state;
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase is required in production. Configure SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }

  if (fs.existsSync(dataFile)) {
    try {
      const content = fs.readFileSync(dataFile, 'utf-8');
      cache = JSON.parse(content) as DatabaseSchema;
      // Ensure all top-level arrays exist
      if (!cache.users) cache.users = [];
      if (!cache.departments) cache.departments = [];
      if (!cache.positions) cache.positions = [];
      if (!cache.roles) cache.roles = [];
      if (!cache.members) cache.members = [];
      if (!cache.transactions) cache.transactions = [];
      if (!cache.worshipSchedules) cache.worshipSchedules = [];
      if (!cache.appointments) cache.appointments = [];
      if (!cache.eventRequests) cache.eventRequests = [];
      if (!cache.mediaAssets) cache.mediaAssets = [];
      if (!cache.auditLogs) cache.auditLogs = [];
      cache.revision = 0;
      if (removeDemoData(cache)) {
        await saveDatabase(cache);
      }
      await seedInitialData(cache);
      return cache;
    } catch (err) {
      console.error('Error reading church-store.json, re-initializing:', err);
    }
  }

  // Initialize empty schema and run seed
  cache = {
    revision: 0,
    users: [],
    departments: [],
    positions: [],
    roles: [],
    members: [],
    transactions: [],
    worshipSchedules: [],
    appointments: [],
    eventRequests: [],
    mediaAssets: [],
    auditLogs: [],
  };

  await saveDatabase(cache);
  await seedInitialData(cache);
  return cache;
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const expectedRevision = Number(data.revision || 0);
    const { revision: _revision, ...payload } = data;
    const { data: nextRevision, error } = await supabase.rpc('save_church_state', {
      p_id: STATE_ID,
      p_expected_revision: expectedRevision,
      p_payload: payload,
    });

    if (error) {
      throw new Error(`Failed to save church data to Supabase: ${error.message}`);
    }
    if (typeof nextRevision !== 'number') {
      throw new Error('Church data changed in another request. Reload and retry your changes.');
    }

    data.revision = nextRevision;
    cache = null;
    return;
  }

  ensureDataDirectory();
  cache = data;
  const dataFile = getDataFile();
  const tempFile = `${dataFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, dataFile);
}

/**
 * Audit Logger for Sensitive Financial and Administrative Operations
 */
export async function logAudit(
  userId: string,
  userIdentifier: string,
  action: string,
  details: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  const db = await getDatabase();
  const entry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    userIdentifier,
    action,
    details,
    ipAddress,
  };
  db.auditLogs.unshift(entry);
  // Cap audit log to last 2,000 entries
  if (db.auditLogs.length > 2000) {
    db.auditLogs = db.auditLogs.slice(0, 2000);
  }
  await saveDatabase(db);
}

/**
 * Seeder: Initialises System Administrator and Departments if absent.
 * NEVER resets existing admin password or deletes existing data.
 */
export async function seedInitialData(db: DatabaseSchema): Promise<void> {
  let changed = removeDemoData(db);

  // 1. Seed Roles if missing
  if (db.roles.length === 0) {
    db.roles = [...INITIAL_ROLES];
    changed = true;
  }

  // 2. Seed Departments if missing
  if (db.departments.length === 0) {
    db.departments = [...INITIAL_DEPARTMENTS];
    changed = true;
  }

  // 3. Seed Positions if missing
  if (db.positions.length === 0) {
    db.positions = [...INITIAL_POSITIONS];
    changed = true;
  }

  for (const roleId of ['system_admin', 'media_manager']) {
    const role = db.roles.find((entry) => entry.id === roleId);
    if (role && !role.permissions.includes('media.assets.manage')) {
      role.permissions.push('media.assets.view', 'media.assets.manage');
      changed = true;
    }
  }
  const departmentLeader = db.roles.find((entry) => entry.id === 'department_leader');
  if (departmentLeader && !departmentLeader.permissions.includes('members.view')) {
    departmentLeader.permissions.push('members.view');
    changed = true;
  }
  const configuredChurchAdmin = INITIAL_ROLES.find((entry) => entry.id === 'church_admin');
  const churchAdmin = db.roles.find((entry) => entry.id === 'church_admin');
  if (configuredChurchAdmin && churchAdmin &&
      JSON.stringify(churchAdmin.permissions) !== JSON.stringify(configuredChurchAdmin.permissions)) {
    churchAdmin.permissions = [...configuredChurchAdmin.permissions];
    changed = true;
  }

  // 4. Seed Default System Administrator ONLY IF IT DOES NOT ALREADY EXIST
  const defaultAdminIdentifier = 'admin@system-gtra.org';
  const existingAdmin = db.users.find(
    (u) => u.id === 'usr-admin-default' || u.loginIdentifier.toLowerCase() === defaultAdminIdentifier
  );

  if (!existingAdmin) {
    console.log('[GTRA Security Seed] Creating initial default system administrator...');
    const hashedInitialPassword = await hashPassword('AdminGTRA');
    const defaultAdmin: User = {
      id: 'usr-admin-default',
      name: 'GTRA System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      email: defaultAdminIdentifier,
      loginIdentifier: defaultAdminIdentifier,
      passwordHash: hashedInitialPassword,
      mustChangePassword: true, // Must change on first login!
      status: 'active',
      departmentAssignments: [
        {
          departmentId: 'dept-admin',
          positionId: 'pos-church-admin',
          roleId: 'system_admin',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(defaultAdmin);
    db.auditLogs.unshift({
      id: `audit-${Date.now()}-init-admin`,
      timestamp: new Date().toISOString(),
      userId: defaultAdmin.id,
      userIdentifier: defaultAdminIdentifier,
      action: 'SYSTEM_ADMIN_INITIALISED',
      details: {
        note: 'Default System Administrator created with temporary initial password. Password change required on first login.',
      },
    });
    changed = true;
  }

  const systemAdmin = db.users.find(
    (user) => user.id === 'usr-admin-default' || user.loginIdentifier.toLowerCase() === defaultAdminIdentifier
  )!;
  for (const user of db.users) {
    const assignments = user.departmentAssignments || [];
    if (user.id === systemAdmin.id) {
      if (!assignments.some((assignment) => assignment.roleId === 'system_admin')) {
        assignments.push({
          departmentId: 'dept-admin',
          positionId: 'pos-church-admin',
          roleId: 'system_admin',
        });
        changed = true;
      }
      user.departmentAssignments = assignments;
      continue;
    }

    const filteredAssignments = assignments.filter((assignment) => assignment.roleId !== 'system_admin');
    if (filteredAssignments.length !== assignments.length) {
      user.departmentAssignments = filteredAssignments;
      changed = true;
    }
  }

  if (changed) {
    await saveDatabase(db);
  }
}
