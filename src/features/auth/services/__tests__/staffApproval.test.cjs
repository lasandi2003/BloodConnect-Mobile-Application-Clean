const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function setup() {
  const records = new Map();
  const auth = { currentUser: { uid: 'admin-user' } };
  records.set('users/admin-user', { uid: 'admin-user', role: 'admin', status: 'active' });
  const state = { reads: [], writes: [], createdAccounts: 0 };
  const snapshot = reference => ({ exists: () => records.has(reference.path), data: () => records.get(reference.path) });
  const firestore = {
    doc: (_, collection, uid) => ({ path: `${collection}/${uid}` }), collection: (_, name) => ({ name }),
    query: (collection, ...constraints) => ({ collection, constraints }), where: (field, operation, value) => ({ field, operation, value }),
    getDoc: async reference => snapshot(reference), getDocFromServer: async reference => snapshot(reference),
    getDocsFromServer: async reference => {
      state.reads.push(reference);
      return { docs: [...records.entries()].filter(([, data]) => ['healthcare', 'bloodBank'].includes(data.role))
        .map(([key, data]) => ({ id: key.split('/')[1], data: () => data })) };
    },
    onSnapshot: (reference, options, next, error) => {
      state.listener = { reference, next, error, closed: false };
      return () => { state.listener.closed = true; };
    },
    serverTimestamp: () => 'SERVER_TIME',
    setDoc: async (reference, data, options) => { records.set(reference.path, options?.merge ? { ...records.get(reference.path), ...data } : data); state.writes.push({ reference, data }); },
    runTransaction: async (_, callback) => callback({
      get: async reference => snapshot(reference),
      update: (reference, data) => { records.set(reference.path, { ...records.get(reference.path), ...data }); state.writes.push({ reference, data }); },
    }),
  };
  const firebaseAuth = {
    createUserWithEmailAndPassword: async (_, email) => { state.createdAccounts++; auth.currentUser = { uid: 'new-user', email }; return { user: auth.currentUser }; },
    updateProfile: async () => {}, deleteUser: async () => {}, signOut: async () => { auth.currentUser = null; },
    signInWithEmailAndPassword: async (_, email) => { auth.currentUser = { uid: 'login-user', email }; return { user: auth.currentUser }; },
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const requireLocal = name => {
      if (name === 'firebase/firestore') return firestore;
      if (name === 'firebase/auth') return firebaseAuth;
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      if (name.endsWith('config/firebase')) return { auth, db: {} };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`));
      throw new Error(`Unexpected dependency: ${name}`);
    };
    new Function('require', 'module', 'exports', code)(requireLocal, module, module.exports);
    return module.exports;
  }
  return { records, auth, state, service: load(path.resolve(__dirname, '../staffApprovalService.ts')),
    authService: load(path.resolve(__dirname, '../authService.ts')), policy: load(path.resolve(__dirname, '../../utils/roleApproval.ts')) };
}

const professional = { institutionName: 'Example Hospital', designation: 'Nurse', employeeId: 'EMP-123' };
function addStaff(records, uid = 'applicant', extra = {}) {
  records.set(`users/${uid}`, { uid, fullName: 'Example Staff', email: 'staff@example.invalid', role: 'healthcare', status: 'active', approvalStatus: 'pending', ...professional, ...extra });
}

for (const role of ['donor', 'requester']) {
  test(`${role} registration remains active and does not require approval`, async () => {
    const { authService, records, policy } = setup();
    const result = await authService.registerAccount({ fullName: 'Example', email: 'example@example.invalid', phone: '0771234567', password: 'test-only', role });
    assert.equal(result.approvalStatus, undefined);
    assert.equal(records.get('users/new-user').status, 'active');
    assert.equal(policy.canAccessRoleDashboard(role, undefined), true);
  });
}
for (const role of ['healthcare', 'bloodBank']) {
  test(`${role} registration saves pending professional details and requires explicit approval`, async () => {
    const { authService, records, policy } = setup();
    const result = await authService.registerAccount({ fullName: 'Example', email: 'example@example.invalid', phone: '0771234567', password: 'test-only', role, ...professional });
    assert.equal(result.approvalStatus, 'pending');
    assert.equal(records.get('users/new-user').employeeId, 'EMP-123');
    for (const status of [undefined, 'pending', 'rejected', 'invalid']) assert.equal(policy.canAccessRoleDashboard(role, status), false);
    assert.equal(policy.canAccessRoleDashboard(role, 'approved'), true);
    assert.equal(policy.canAccessRoleDashboard(role, 'approved', 'suspended'), false);
  });
}

for (const role of ['healthcare', 'bloodBank']) {
  for (const approvalStatus of ['pending', 'approved', 'rejected']) {
    test(`${role} login preserves ${approvalStatus} without bypassing the approval gate`, async () => {
      const { authService, records, policy } = setup();
      addStaff(records, 'login-user', { role, approvalStatus });
      const result = await authService.loginAccount('staff@example.invalid', 'test-only');
      assert.equal(result.approvalStatus, approvalStatus);
      assert.equal(records.get('users/login-user').approvalStatus, approvalStatus);
      assert.equal(policy.canAccessRoleDashboard(role, result.approvalStatus), approvalStatus === 'approved');
    });
  }
}

test('missing professional details fail before creating a Firebase Auth account', async () => {
  const { authService, state } = setup();
  await assert.rejects(authService.registerAccount({ role: 'healthcare' }), /hospital or blood bank/);
  assert.equal(state.createdAccounts, 0);
});

test('social staff registration also starts pending and cannot bypass professional validation', async () => {
  const { authService, records } = setup();
  await authService.completeSocialProfile({ uid: 'social', email: 'social@example.invalid' }, { role: 'bloodBank', fullName: 'Staff', phone: '0771234567', ...professional });
  assert.equal(records.get('users/social').approvalStatus, 'pending');
  await assert.rejects(authService.completeSocialProfile({ uid: 'other' }, { role: 'healthcare' }), /hospital or blood bank/);
});

test('admin queue includes missing-field legacy staff but excludes donors, approved and rejected staff', async () => {
  const { service, records, state } = setup();
  addStaff(records); addStaff(records, 'legacy', { approvalStatus: undefined });
  addStaff(records, 'approved', { approvalStatus: 'approved' }); addStaff(records, 'rejected', { approvalStatus: 'rejected' });
  records.set('users/donor', { role: 'donor' });
  const rows = await service.loadPendingApplications('admin-user');
  assert.deepEqual(rows.map(row => row.uid), ['applicant', 'legacy']);
  assert.equal(rows[1].legacy, true);
  assert.deepEqual(state.reads[0].constraints, [{ field: 'role', operation: 'in', value: ['healthcare', 'bloodBank'] }]);
});

for (const decision of ['approved', 'rejected']) {
  test(`admin ${decision} decision records only status, timestamp and reviewer fields`, async () => {
    const { service, records, state } = setup(); addStaff(records);
    await service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', decision);
    const saved = records.get('users/applicant');
    assert.equal(saved.approvalStatus, decision); assert.equal(saved.employeeId, 'EMP-123'); assert.equal(saved.role, 'healthcare');
    assert.equal(saved[decision === 'approved' ? 'approvedBy' : 'rejectedBy'], 'admin-user');
    assert.equal(saved[decision === 'approved' ? 'approvedAt' : 'rejectedAt'], 'SERVER_TIME');
    assert.equal(Object.keys(state.writes[0].data).length, 4);
    await service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', decision);
    assert.equal(state.writes.length, 1);
  });
}

test('ordinary users cannot approve themselves or other applicants', async () => {
  const { service, records, auth, state } = setup(); addStaff(records); addStaff(records, 'another');
  auth.currentUser = { uid: 'applicant' };
  await assert.rejects(service.reviewStaffApplication('applicant', 'applicant', 'healthcare', 'approved'), /own application/);
  await assert.rejects(service.reviewStaffApplication('applicant', 'another', 'healthcare', 'approved'), /administrator/);
  await assert.rejects(service.loadPendingApplications('applicant'), /administrator/);
  assert.equal(state.writes.length, 0);
});

test('admin can approve blood bank and legacy healthcare accounts explicitly', async () => {
  const { service, records, policy } = setup();
  addStaff(records, 'bank', { role: 'bloodBank' });
  addStaff(records, 'legacy', { approvalStatus: undefined });
  await service.reviewStaffApplication('admin-user', 'bank', 'bloodBank', 'approved');
  await service.reviewStaffApplication('admin-user', 'legacy', 'healthcare', 'approved');
  assert.equal(policy.canAccessRoleDashboard('bloodBank', records.get('users/bank').approvalStatus), true);
  assert.equal(policy.canAccessRoleDashboard('healthcare', records.get('users/legacy').approvalStatus), true);
});

test('legacy profile loading defaults staff to pending without writing approval', async () => {
  const { authService, records, state } = setup();
  addStaff(records, 'legacy', { approvalStatus: undefined });
  const profile = await authService.getUserProfile('legacy');
  assert.equal(profile.approvalStatus, 'pending');
  assert.equal(state.writes.length, 0);
});

test('suspended admins and non-staff targets cannot be approved', async () => {
  const { service, records, state } = setup();
  addStaff(records);
  records.get('users/admin-user').status = 'suspended';
  await assert.rejects(service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', 'approved'), /active administrator/);
  records.get('users/admin-user').status = 'active';
  records.set('users/donor', { role: 'donor' });
  await assert.rejects(service.reviewStaffApplication('admin-user', 'donor', 'healthcare', 'approved'), /role changed/);
  assert.equal(state.writes.length, 0);
});

test('stale roles, reviewed applications and changed sessions cannot be overwritten', async () => {
  const { service, records, auth, state } = setup(); addStaff(records, 'applicant', { role: 'bloodBank' });
  await assert.rejects(service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', 'approved'), /role changed/);
  addStaff(records, 'applicant', { approvalStatus: 'rejected', rejectedBy: 'another-admin' });
  await assert.rejects(service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', 'approved'), /already been reviewed/);
  auth.currentUser = null;
  await assert.rejects(service.reviewStaffApplication('admin-user', 'applicant', 'healthcare', 'approved'), /session changed/);
  assert.equal(state.writes.length, 0);
});

test('staff listener treats missing approval as pending, forwards server changes, and unsubscribes', () => {
  const { service, auth, state } = setup(); auth.currentUser = { uid: 'applicant' };
  const changes = [];
  const stop = service.watchStaffAccess('applicant', 'healthcare', value => changes.push(value), error => { throw error; });
  const send = (approvalStatus, fromCache = false, hasPendingWrites = false) => state.listener.next({ exists: () => true, data: () => ({ role: 'healthcare', status: 'active', approvalStatus }), metadata: { fromCache, hasPendingWrites } });
  send(undefined); send('approved', true); send('approved', false, true); send('approved'); send('rejected');
  assert.equal(changes[0].approvalStatus, 'pending');
  assert.equal(changes[1].fromCache, true); assert.equal(changes[2].fromCache, true);
  assert.equal(changes[3].approvalStatus, 'approved'); assert.equal(changes[3].fromCache, false);
  assert.equal(changes[4].approvalStatus, 'rejected');
  stop(); assert.equal(state.listener.closed, true);
});
