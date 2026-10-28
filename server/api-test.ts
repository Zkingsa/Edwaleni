async function testApi() {
  const BASE_URL = 'http://localhost:3000/api';
  console.log('Testing live API endpoints on', BASE_URL);

  // 1. Login with Default Admin
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: 'admin@system-gtra.org',
      password: 'AdminGTRA'
    })
  });

  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  console.log('✓ Admin login succeeded. mustChangePassword:', adminLoginData.mustChangePassword);
  const adminToken = adminLoginData.token;

  // 2. Reject privileged domain self-registration
  const badRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Hacker User',
      email: 'hacker@system-gtra.org',
      password: 'password123'
    })
  });
  if (badRegRes.status === 400) {
    console.log('✓ Blocked self-registration with privileged domain @system-gtra.org');
  } else {
    throw new Error('Privileged domain self-registration was NOT blocked!');
  }

  // 3. Register regular member
  const memberRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Church Member',
      email: `member.${Date.now()}@gmail.com`,
      phone: '+268 7699 9999',
      password: 'MemberPassword2026!'
    })
  });
  const memberRegData = await memberRegRes.json();
  if (!memberRegRes.ok || !memberRegData.token) {
    throw new Error(`Member registration failed: ${JSON.stringify(memberRegData)}`);
  }
  console.log('✓ Member registration succeeded for', memberRegData.user.email);
  const memberToken = memberRegData.token;

  // 4. Test RBAC protection: ordinary member cannot access /api/staff
  const memberStaffRes = await fetch(`${BASE_URL}/staff`, {
    headers: { Authorization: `Bearer ${memberToken}` }
  });
  if (memberStaffRes.status === 403) {
    console.log('✓ RBAC blocked non-privileged member from /api/staff (403 Forbidden)');
  } else {
    throw new Error(`Expected 403 for member accessing /api/staff, got ${memberStaffRes.status}`);
  }

  // 5. Admin creates staff member with auto-generated GTRA email
  const createStaffRes = await fetch(`${BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      firstName: 'Fika',
      lastName: 'Siximba',
      departmentId: 'dept-worship',
      positionId: 'pos-worship-manager',
      roleId: 'worship_manager',
      phone: '+268 7611 0000'
    })
  });

  const createStaffData = await createStaffRes.json();
  if (!createStaffRes.ok) {
    throw new Error(`Create staff failed: ${JSON.stringify(createStaffData)}`);
  }
  console.log('✓ Staff created with GTRA convention:', createStaffData.staff.loginIdentifier);
  if (!createStaffData.staff.loginIdentifier.startsWith('fSiximba@worship-gtra.org')) {
    throw new Error(`Identifier does not match convention: ${createStaffData.staff.loginIdentifier}`);
  }

  console.log('\nALL API INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

testApi().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
