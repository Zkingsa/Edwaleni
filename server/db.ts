import fs from 'fs';
import path from 'path';
import { DatabaseSchema, AuditLog, User } from './types';
import { INITIAL_DEPARTMENTS, INITIAL_POSITIONS, INITIAL_ROLES } from './seedData';
import { hashPassword } from './auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'church-store.json');

// In-memory cache to ensure speed and consistency
let cache: DatabaseSchema | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (cache) {
    return cache;
  }

  ensureDataDirectory();

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      cache = JSON.parse(content) as DatabaseSchema;
      // Ensure all top-level arrays exist
      if (!cache.users) cache.users = [];
      if (!cache.departments) cache.departments = [];
      if (!cache.positions) cache.positions = [];
      if (!cache.roles) cache.roles = [];
      if (!cache.members) cache.members = [];
      if (!cache.transactions) cache.transactions = [];
      if (!cache.worshipSchedules) cache.worshipSchedules = [];
      if (!cache.auditLogs) cache.auditLogs = [];
      return cache;
    } catch (err) {
      console.error('Error reading church-store.json, re-initializing:', err);
    }
  }

  // Initialize empty schema and run seed
  cache = {
    users: [],
    departments: [],
    positions: [],
    roles: [],
    members: [],
    transactions: [],
    worshipSchedules: [],
    auditLogs: [],
  };

  await saveDatabase(cache);
  await seedInitialData(cache);
  return cache;
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  ensureDataDirectory();
  cache = data;
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DATA_FILE);
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
  let changed = false;

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

  // 4. Seed Default System Administrator ONLY IF IT DOES NOT ALREADY EXIST
  const defaultAdminIdentifier = 'admin@system-gtra.org';
  const existingAdmin = db.users.find(
    (u) => u.loginIdentifier.toLowerCase() === defaultAdminIdentifier.toLowerCase()
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

  // 5. Seed sample staff members for key roles if users list only has default admin
  if (db.users.length <= 1) {
    console.log('[GTRA Seed] Adding sample pastoral, worship, and finance staff...');
    const defaultStaffPassword = await hashPassword('Gtra2026!');

    // Senior Pastor (pKhaya@pastor-gtra.org)
    db.users.push({
      id: 'usr-pastor-khaya',
      name: 'Pastor S. Khaya',
      firstName: 'Sipho',
      lastName: 'Khaya',
      email: 'sKhaya@pastor-gtra.org',
      loginIdentifier: 'sKhaya@pastor-gtra.org',
      passwordHash: defaultStaffPassword,
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [
        {
          departmentId: 'dept-leadership',
          positionId: 'pos-senior-pastor',
          roleId: 'senior_pastor',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Worship Team Manager (mWorship@worship-gtra.org)
    db.users.push({
      id: 'usr-worship-manager',
      name: 'Musa Dlamini',
      firstName: 'Musa',
      lastName: 'Dlamini',
      email: 'mDlamini@worship-gtra.org',
      loginIdentifier: 'mDlamini@worship-gtra.org',
      passwordHash: defaultStaffPassword,
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [
        {
          departmentId: 'dept-worship',
          positionId: 'pos-worship-manager',
          roleId: 'worship_manager',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // CFO / Treasurer (tFinance@finance-gtra.org)
    db.users.push({
      id: 'usr-treasurer',
      name: 'Thabo Maseko',
      firstName: 'Thabo',
      lastName: 'Maseko',
      email: 'tMaseko@finance-gtra.org',
      loginIdentifier: 'tMaseko@finance-gtra.org',
      passwordHash: defaultStaffPassword,
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [
        {
          departmentId: 'dept-finance',
          positionId: 'pos-treasurer',
          roleId: 'treasurer',
        },
        {
          departmentId: 'dept-finance',
          positionId: 'pos-cfo',
          roleId: 'cfo',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Regular member
    db.users.push({
      id: 'usr-sample-member',
      name: 'Lindiwe Zulu',
      firstName: 'Lindiwe',
      lastName: 'Zulu',
      email: 'lindiwe.zulu@gmail.com',
      loginIdentifier: 'lindiwe.zulu@gmail.com',
      passwordHash: defaultStaffPassword,
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    changed = true;
  }

  // 6. Seed sample members for member directory
  if (db.members.length === 0) {
    db.members = [
      {
        id: 'mbr-1',
        fullName: 'Bongani Shongwe',
        email: 'bongani.s@gmail.com',
        phone: '+268 7611 2345',
        address: 'Section 4, Edwaleni',
        membershipStatus: 'active',
        joinDate: '2021-03-15',
        baptismDate: '2021-06-20',
        ministryInterests: ['Worship Team', 'Men Fellowship'],
        pastoralNotes: 'Faithful family head; visited for home blessing in August.',
      },
      {
        id: 'mbr-2',
        fullName: 'Nomcebo Simelane',
        email: 'nomcebo.sim@outlook.com',
        phone: '+268 7822 5678',
        address: 'Sanctuary Crescent, Edwaleni',
        membershipStatus: 'active',
        joinDate: '2022-01-10',
        baptismDate: '2022-04-17',
        ministryInterests: ["Women's Fellowship", 'Children Ministry'],
        pastoralNotes: 'Sunday school teacher assistant.',
      },
      {
        id: 'mbr-3',
        fullName: 'Zodwa Vilakati',
        email: 'zodwa.v@yahoo.com',
        phone: '+268 7933 9012',
        address: 'Edwaleni North',
        membershipStatus: 'active',
        joinDate: '2023-05-12',
        ministryInterests: ['Prayer Altar', 'Outreach'],
        pastoralNotes: 'Active prayer partner.',
      },
    ];
    changed = true;
  }

  // 7. Seed sample worship schedule
  if (db.worshipSchedules.length === 0) {
    db.worshipSchedules = [
      {
        id: 'ws-1',
        title: 'Mid-Week Choir & Band Rehearsal',
        type: 'rehearsal',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        time: '18:30 - 20:30',
        venue: 'Main Sanctuary • Edwaleni',
        recurrence: 'weekly',
        songs: [
          { title: 'Way Maker', key: 'G', lead: 'Worship Leader' },
          { title: 'The Rock of Ages', key: 'D', lead: 'Choir' },
          { title: 'Jehovah You Are Most High', key: 'C', lead: 'Mass Praise' },
        ],
        roster: [
          { memberId: 'usr-worship-manager', name: 'Musa Dlamini', role: 'Worship Leader', status: 'confirmed' },
          { memberId: 'mbr-1', name: 'Bongani Shongwe', role: 'Keys', status: 'confirmed' },
          { memberId: 'mbr-temp-1', name: 'Sibusiso M.', role: 'Drums', status: 'confirmed' },
          { memberId: 'mbr-temp-2', name: 'Gugu Nxumalo', role: 'Choir Member', status: 'pending' },
          { memberId: 'mbr-temp-3', name: 'Themba Dube', role: 'Bass', status: 'confirmed' },
        ],
        notes: 'Please arrive 15 minutes early for sound check and pre-rehearsal prayer.',
        attendanceRecorded: false,
        attendedMembers: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ws-2',
        title: 'Sunday Morning Anointed Service Repertoire',
        type: 'sunday_service',
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        time: '09:15 - 12:30',
        venue: 'Main Sanctuary • Edwaleni',
        recurrence: 'weekly',
        songs: [
          { title: 'Goodness of God', key: 'Ab', lead: 'Worship Leader' },
          { title: 'Great Are You Lord', key: 'A', lead: 'Choir' },
          { title: 'Standing on the Promises', key: 'G', lead: 'Congregation' },
        ],
        roster: [
          { memberId: 'usr-worship-manager', name: 'Musa Dlamini', role: 'Worship Leader', status: 'confirmed' },
          { memberId: 'mbr-1', name: 'Bongani Shongwe', role: 'Keys', status: 'confirmed' },
        ],
        notes: 'Theme: Standing on the Unshakeable Rock.',
        attendanceRecorded: false,
        attendedMembers: [],
        createdAt: new Date().toISOString(),
      },
    ];
    changed = true;
  }

  // 8. Seed sample financial transactions
  if (db.transactions.length === 0) {
    db.transactions = [
      {
        id: 'tx-1',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        type: 'tithe',
        category: 'Sunday Service Tithes',
        amount: 2500,
        currency: 'USD',
        description: 'Sunday morning envelope collections banked',
        recordedBy: 'usr-treasurer',
        recordedByName: 'Thabo Maseko',
        status: 'approved',
        approvedBy: 'usr-treasurer',
        approvedByName: 'Thabo Maseko',
        approvedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        receiptNumber: 'REC-2026-001',
      },
      {
        id: 'tx-2',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: 'project',
        category: 'Sanctuary Sound System Upgrade',
        amount: 1200,
        currency: 'USD',
        description: 'Contribution toward wireless microphones and soundboard',
        recordedBy: 'usr-treasurer',
        recordedByName: 'Thabo Maseko',
        donorName: 'Anonymous Donor',
        status: 'approved',
        approvedBy: 'usr-treasurer',
        approvedByName: 'Thabo Maseko',
        approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        receiptNumber: 'REC-2026-002',
      },
      {
        id: 'tx-3',
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        type: 'expense',
        category: 'Sanctuary Utilities & Generator Fuel',
        amount: 350,
        currency: 'USD',
        description: 'Diesel fuel purchase for Sunday backup power',
        recordedBy: 'usr-treasurer',
        recordedByName: 'Thabo Maseko',
        status: 'pending',
        receiptNumber: 'REQ-2026-003',
      },
    ];
    changed = true;
  }

  if (changed) {
    await saveDatabase(db);
  }
}
