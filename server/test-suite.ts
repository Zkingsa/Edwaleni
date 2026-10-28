import { getDatabase, seedInitialData } from './db';
import { generateStaffIdentifier, hashPassword, comparePassword, generateToken, verifyToken, resolveUserPermissions } from './auth';
import { User, Role } from './types';

async function runTests() {
  console.log('=== STARTING GTRA AUTHENTICATION & RBAC TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Database Initialization & Default Admin Credentials
  console.log('--- Test Suite 1: Database Seeding & Default Admin ---');
  const db = await getDatabase();
  const admin = db.users.find(u => u.loginIdentifier === 'admin@system-gtra.org');
  assert(Boolean(admin), 'Default System Administrator exists in database');
  assert(admin?.mustChangePassword === true, 'Default System Administrator mustChangePassword flag is true');
  
  const passwordMatch = await comparePassword('AdminGTRA', admin?.passwordHash || '');
  assert(passwordMatch, 'Default System Administrator password matches initial "AdminGTRA"');

  // TEST 2: Seed Repeatability - Never reset existing admin password
  console.log('\n--- Test Suite 2: Password Persistence (No Reset on Restart) ---');
  // Simulate admin changing password to a custom password
  const customPasswordHash = await hashPassword('CustomAdmin2026!');
  admin!.passwordHash = customPasswordHash;
  admin!.mustChangePassword = false;
  
  // Re-run seedInitialData
  await seedInitialData(db);
  const reloadedAdmin = db.users.find(u => u.loginIdentifier === 'admin@system-gtra.org');
  assert(reloadedAdmin?.passwordHash === customPasswordHash, 'Re-running seed does NOT overwrite changed admin password');
  assert(reloadedAdmin?.mustChangePassword === false, 'Re-running seed preserves mustChangePassword = false');

  // Reset back to initial state for testing
  reloadedAdmin!.passwordHash = await hashPassword('AdminGTRA');
  reloadedAdmin!.mustChangePassword = true;

  // TEST 3: Staff Login Email Convention & Duplicate Handling
  console.log('\n--- Test Suite 3: Staff Email Convention & Collision Handling ---');
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Fika Siximba',
      firstName: 'Fika',
      lastName: 'Siximba',
      email: 'fSiximba@system-gtra.org',
      loginIdentifier: 'fSiximba@system-gtra.org',
      passwordHash: 'dummy',
      mustChangePassword: false,
      status: 'active',
      departmentAssignments: [],
      createdAt: '',
      updatedAt: ''
    }
  ];

  const newIdentifier = generateStaffIdentifier('Bongani', 'Shongwe', 'worship-gtra.org', mockUsers);
  assert(newIdentifier === 'bShongwe@worship-gtra.org', 'Generates standard convention bShongwe@worship-gtra.org');

  const duplicateIdentifier = generateStaffIdentifier('Fika', 'Siximba', 'system-gtra.org', mockUsers);
  assert(duplicateIdentifier === 'fSiximba1@system-gtra.org', 'Handles duplicate identifier by appending numeric suffix fSiximba1@system-gtra.org');

  const secondDuplicate = generateStaffIdentifier('Fika', 'Siximba', 'system-gtra.org', [
    ...mockUsers,
    { ...mockUsers[0], id: '2', loginIdentifier: 'fSiximba1@system-gtra.org' }
  ]);
  assert(secondDuplicate === 'fSiximba2@system-gtra.org', 'Handles subsequent collisions by incrementing to fSiximba2@system-gtra.org');

  // TEST 4: Department and Role Configurations
  console.log('\n--- Test Suite 4: Departments & Positions Presence ---');
  assert(db.departments.length >= 10, `Configured departments exist (found ${db.departments.length})`);
  assert(db.positions.length >= 20, `Configured positions exist (found ${db.positions.length})`);

  const seniorPastorPos = db.positions.find(p => p.title === 'Senior Pastor');
  const worshipMgrPos = db.positions.find(p => p.title === 'Worship Team Manager');
  const treasurerPos = db.positions.find(p => p.title === 'Treasurer');
  const cfoPos = db.positions.find(p => p.title === 'Chief Financial Officer (CFO)');
  const auditorPos = db.positions.find(p => p.title === 'Finance Auditor');

  assert(Boolean(seniorPastorPos), 'Senior Pastor position is configured');
  assert(Boolean(worshipMgrPos), 'Worship Team Manager position is configured');
  assert(Boolean(treasurerPos), 'Treasurer position is configured');
  assert(Boolean(cfoPos), 'CFO position is configured');
  assert(Boolean(auditorPos), 'Finance Auditor position is configured');

  // TEST 5: RBAC Permissions Evaluation
  console.log('\n--- Test Suite 5: Granular Role Permissions Evaluation ---');
  const worshipManagerRole = db.roles.find(r => r.id === 'worship_manager');
  assert(worshipManagerRole?.permissions.includes('worship.schedule.manage') === true, 'Worship Manager has worship.schedule.manage');
  assert(worshipManagerRole?.permissions.includes('worship.attendance.manage') === true, 'Worship Manager has worship.attendance.manage');
  assert(worshipManagerRole?.permissions.includes('finance.transactions.approve') === false, 'Worship Manager cannot approve finance transactions');

  const auditorRole = db.roles.find(r => r.id === 'finance_auditor');
  assert(auditorRole?.permissions.includes('finance.transactions.view') === true, 'Auditor can view transactions');
  assert(auditorRole?.permissions.includes('finance.transactions.create') === false, 'Auditor cannot create transactions (read-only)');
  assert(auditorRole?.permissions.includes('finance.transactions.approve') === false, 'Auditor cannot approve transactions (read-only)');

  const pastorRole = db.roles.find(r => r.id === 'senior_pastor');
  assert(pastorRole?.permissions.includes('members.view') === true, 'Pastor can view members');
  assert(pastorRole?.permissions.includes('pastoral_care.view') === true, 'Pastor has pastoral_care.view');
  assert(pastorRole?.permissions.includes('finance.transactions.approve') === false, 'Pastor does not have unrestricted financial approval');

  // TEST 6: JWT Token Lifecycle
  console.log('\n--- Test Suite 6: JWT Token Security ---');
  const token = generateToken(admin!, ['departments.manage', 'users.view']);
  const decoded = verifyToken(token);
  assert(decoded?.userId === admin!.id, 'JWT token decodes valid user id');
  assert(decoded?.loginIdentifier === 'admin@system-gtra.org', 'JWT token contains staff login identifier');

  const invalidToken = verifyToken('corrupted.token.value');
  assert(invalidToken === null, 'Corrupted token safely rejected');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
