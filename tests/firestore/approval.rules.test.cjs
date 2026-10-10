const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField,
  query, where, serverTimestamp, Timestamp, runTransaction } = require('firebase/firestore');

// Fail closed if no local emulator was explicitly started. Never import app Firebase config.
const PROJECT_ID = 'demo-bloodconnect-approval';
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulator) throw new Error('Start the Firestore emulator with npm test; FIRESTORE_EMULATOR_HOST is required.');
const [host, portText] = emulator.split(':');
if (!['127.0.0.1', 'localhost'].includes(host) || !/^\d+$/.test(portText)) throw new Error('These tests run only on a loopback Firestore emulator.');
let env;
const oldTime = Timestamp.fromMillis(1700000000000);
const professional = { institutionName: 'Example Institution', designation: 'Staff Member', employeeId: 'EMP-123' };
function account(uid, role, extra = {}) {
  return { uid, fullName: 'Example Account', email: `${uid}@example.invalid`, phone: '0771234567',
    role, status: 'active', createdAt: oldTime, updatedAt: oldTime, ...extra };
}
function registration(uid, role, extra = {}) {
  return { ...account(uid, role), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(), ...extra };
}
function requestRecord(owner = 'requester', extra = {}) {
  return { requesterId: owner, patientName: 'Test Patient', bloodGroup: 'A+', unitsRequired: 2,
    hospitalName: 'Test Hospital', location: 'Colombo', requiredDate: '2026-12-15', urgency: 'urgent',
    status: 'pending_verification', verified: false, createdAt: oldTime, updatedAt: oldTime, ...extra };
}
function decision(status, reviewer = 'admin') {
  return { approvalStatus: status, updatedAt: serverTimestamp(),
    ...(status === 'approved' ? { approvedBy: reviewer, approvedAt: serverTimestamp() }
      : { rejectedBy: reviewer, rejectedAt: serverTimestamp() }) };
}
const db = uid => env.authenticatedContext(uid).firestore();
const profile = (database, uid) => doc(database, 'users', uid);
const request = (database, id = 'request') => doc(database, 'emergencyRequests', id);
const match = (database, id = 'request_donor') => doc(database, 'donorMatches', id);
const inventory = database => doc(database, 'bloodInventory', 'A+');
function responseRecord(uid = 'donor', id = 'request') {
  return { donorId: uid, requestId: id, response: 'accepted', status: 'accepted',
    requestSnapshot: { bloodGroup: 'A+', hospitalName: 'Test Hospital' },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}

before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: {
    host, port: Number(portText), rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.approval.rules'), 'utf8'),
  } });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  // This resets only the fixed demo project in the local emulator.
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    const rows = [account('admin', 'admin'), account('suspended-admin', 'admin', { status: 'suspended' }),
      account('donor', 'donor'), account('other-donor', 'donor'), account('requester', 'requester'), account('other-requester', 'requester')];
    for (const [role, prefix] of [['healthcare', 'health'], ['bloodBank', 'bank']]) {
      for (const status of ['pending', 'approved', 'rejected']) rows.push(account(`${prefix}-${status}`, role, { ...professional, approvalStatus: status }));
      rows.push(account(`${prefix}-legacy`, role, professional));
      rows.push(account(`${prefix}-suspended`, role, { ...professional, approvalStatus: 'approved', status: 'suspended' }));
    }
    await Promise.all(rows.map(row => setDoc(profile(database, row.uid), row)));
    await Promise.all([
      setDoc(doc(database, 'donorProfiles', 'donor'), { userId: 'donor', fullName: 'Test Donor', bloodGroup: 'A+', isAvailable: true }),
      setDoc(doc(database, 'donorProfiles', 'other-donor'), { userId: 'other-donor', fullName: 'Another Donor', bloodGroup: 'A+', isAvailable: true }),
      setDoc(request(database), requestRecord()), setDoc(request(database, 'other-request'), requestRecord('other-requester')),
      setDoc(inventory(database), { bloodGroup: 'A+', availableUnits: 100, status: 'Normal' }),
      setDoc(doc(database, 'donorResponses', 'request_donor'), { donorId: 'donor', requestId: 'request', response: 'accepted', status: 'accepted', createdAt: oldTime, updatedAt: oldTime }),
      setDoc(match(database), { requestId: 'request', donorId: 'donor', status: 'matched', createdAt: oldTime, updatedAt: oldTime }),
      setDoc(doc(database, 'donorMatches', 'request_donor', 'messages', 'existing'), { senderId: 'health-approved', senderRole: 'healthcare', text: 'Test message', createdAt: oldTime }),
    ]);
  });
});

for (const role of ['donor', 'requester']) {
  test(`${role} registration succeeds without approval`, async () => {
    const uid = `new-${role}`;
    await assertSucceeds(setDoc(profile(db(uid), uid), registration(uid, role)));
  });
}
for (const role of ['healthcare', 'bloodBank']) {
  test(`${role} registration requires pending approval and professional details`, async () => {
    const uid = `new-${role}`; const database = db(uid);
    await assertFails(setDoc(profile(database, uid), registration(uid, role)));
    await assertFails(setDoc(profile(database, uid), registration(uid, role, { ...professional, approvalStatus: 'approved' })));
    await assertFails(setDoc(profile(database, uid), registration(uid, role, { approvalStatus: 'pending' })));
    await assertSucceeds(setDoc(profile(database, uid), registration(uid, role, { ...professional, approvalStatus: 'pending' })));
  });
}
test('normal and unauthenticated users cannot create admins or other user profiles', async () => {
  await assertFails(setDoc(profile(db('new-admin'), 'new-admin'), registration('new-admin', 'admin')));
  await assertFails(setDoc(profile(db('donor'), 'someone-else'), registration('someone-else', 'donor')));
  await assertFails(setDoc(profile(env.unauthenticatedContext().firestore(), 'anonymous'), registration('anonymous', 'requester')));
});
test('registration cannot spoof reviewer IDs or approval timestamps', async () => {
  const uid = 'fake-staff';
  for (const extra of [{ approvedBy: 'admin' }, { rejectedBy: 'admin' }, { approvedAt: oldTime }, { rejectedAt: oldTime }]) {
    await assertFails(setDoc(profile(db(uid), uid), registration(uid, 'healthcare', { ...professional, approvalStatus: 'pending', ...extra })));
  }
});

for (const uid of ['donor', 'requester', 'health-pending', 'bank-pending']) {
  test(`${uid} cannot change own privilege, approval or audit fields`, async () => {
    const database = db(uid);
    for (const patch of [decision('approved', uid), { approvalStatus: 'approved' }, { approvalStatus: deleteField() },
      { approvedBy: uid }, { rejectedBy: uid }, { approvedAt: serverTimestamp() }, { rejectedAt: serverTimestamp() },
      { role: 'admin' }, { status: 'suspended' }, { status: deleteField() }, { uid: 'someone-else' }]) {
      await assertFails(updateDoc(profile(database, uid), patch));
    }
    // Legacy audit metadata must also resist actual deletion, even when bundled
    // with an otherwise legitimate profile change. Do not remove the no-op assertion above.
    await env.withSecurityRulesDisabled(async context => {
      await updateDoc(profile(context.firestore(), uid), {
        approvedBy: 'admin', rejectedBy: 'admin', approvedAt: oldTime, rejectedAt: oldTime,
      });
    });
    for (const field of ['approvedBy', 'rejectedBy', 'approvedAt', 'rejectedAt']) {
      await assertFails(updateDoc(profile(database, uid), { [field]: deleteField(), fullName: 'Forbidden combined change' }));
    }
    await assertSucceeds(updateDoc(profile(database, uid), { fullName: 'Updated Name', phone: '0772222222', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(profile(database, uid), { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });
}
test('ordinary users cannot approve another account', async () => {
  await assertFails(updateDoc(profile(db('donor'), 'health-pending'), decision('approved', 'donor')));
  // Approval grants staff operations, not authority to edit personal privileges.
  for (const uid of ['health-approved', 'bank-approved']) {
    const database = db(uid);
    for (const patch of [{ approvalStatus: deleteField() }, { approvalStatus: 'pending' },
      { role: 'admin' }, { status: 'suspended' }, { approvedBy: uid }, { rejectedBy: deleteField() },
      { approvedAt: serverTimestamp() }, { rejectedAt: deleteField() }]) {
      await assertFails(updateDoc(profile(database, uid), patch));
    }
    await assertSucceeds(updateDoc(profile(database, uid), { fullName: 'Updated Staff Name', updatedAt: serverTimestamp() }));
  }
});
for (const [uid, status] of [['health-pending', 'approved'], ['bank-pending', 'approved'], ['health-legacy', 'approved'], ['bank-legacy', 'rejected'], ['health-pending', 'rejected']]) {
  test(`admin can explicitly set ${uid} to ${status}`, async () => {
    await assertSucceeds(updateDoc(profile(db('admin'), uid), decision(status)));
  });
}
test('admin decisions require correct reviewer, server time, staff role and pending transition', async () => {
  const database = db('admin');
  await assertFails(updateDoc(profile(database, 'health-pending'), decision('approved', 'another-admin')));
  await assertFails(updateDoc(profile(database, 'health-pending'), { ...decision('approved'), approvedAt: oldTime }));
  await assertFails(updateDoc(profile(database, 'health-pending'), { ...decision('approved'), employeeId: 'REPLACED' }));
  await assertFails(updateDoc(profile(database, 'donor'), decision('approved')));
  await assertFails(updateDoc(profile(database, 'admin'), decision('approved')));
  await assertFails(updateDoc(profile(database, 'health-approved'), decision('rejected')));
  await assertFails(updateDoc(profile(database, 'health-rejected'), decision('approved')));
  await assertFails(updateDoc(profile(database, 'health-pending'), { ...decision('approved'), rejectedBy: 'admin', rejectedAt: serverTimestamp() }));
});
test('suspended admins cannot review or reactivate themselves; active admins can manage another account status', async () => {
  await assertFails(updateDoc(profile(db('suspended-admin'), 'health-pending'), decision('approved', 'suspended-admin')));
  await assertFails(updateDoc(profile(db('suspended-admin'), 'suspended-admin'), { status: 'active', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(profile(db('admin'), 'donor'), { status: 'suspended', updatedAt: serverTimestamp() }));
});
test('admin queue query works and ordinary users cannot query all users', async () => {
  await assertSucceeds(getDocs(query(collection(db('admin'), 'users'), where('role', 'in', ['healthcare', 'bloodBank']))));
  await assertFails(getDocs(collection(db('donor'), 'users')));
});

for (const uid of ['health-pending', 'health-rejected', 'health-legacy', 'health-suspended']) {
  test(`${uid} cannot access healthcare collections, verification or matching`, async () => {
    const database = db(uid);
    await assertSucceeds(getDoc(profile(database, uid)));
    await assertFails(getDocs(collection(database, 'donorProfiles')));
    await assertFails(getDoc(doc(database, 'donorProfiles', 'donor')));
    await assertFails(getDocs(collection(database, 'donorResponses')));
    await assertFails(getDoc(request(database)));
    await assertFails(updateDoc(request(database), { verified: true, status: 'verified', updatedAt: serverTimestamp() }));
    await assertFails(getDoc(match(database)));
    await assertFails(setDoc(match(database, 'request_other-donor'), { requestId: 'request', donorId: 'other-donor', status: 'matched', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    await assertFails(getDocs(collection(database, 'donorMatches', 'request_donor', 'messages')));
    await assertFails(setDoc(doc(database, 'donorMatches', 'request_donor', 'messages', 'new'), { senderId: uid, senderRole: 'healthcare', text: 'Forbidden', createdAt: serverTimestamp() }));
  });
}
for (const uid of ['bank-pending', 'bank-rejected', 'bank-legacy', 'bank-suspended']) {
  test(`${uid} cannot read or modify inventory`, async () => {
    const database = db(uid);
    await assertSucceeds(getDoc(profile(database, uid)));
    await assertFails(getDoc(inventory(database)));
    await assertFails(getDocs(collection(database, 'bloodInventory')));
    await assertFails(setDoc(doc(database, 'bloodInventory', 'B+'), { bloodGroup: 'B+', availableUnits: 30, status: 'Normal' }));
    await assertFails(updateDoc(inventory(database), { availableUnits: 80, status: 'Normal' }));
    await assertFails(deleteDoc(inventory(database)));
    await assertFails(getDoc(request(database)));
  });
}
test('approved healthcare can read profiles/responses, verify/reject requests, create matches and send messages', async () => {
  const database = db('health-approved');
  await assertSucceeds(getDocs(collection(database, 'donorProfiles')));
  await assertSucceeds(getDocs(query(collection(database, 'donorResponses'), where('status', 'in', ['accepted', 'completed']))));
  await assertSucceeds(getDocs(collection(database, 'emergencyRequests')));
  await assertSucceeds(updateDoc(request(database), { verified: true, status: 'verified', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(request(database, 'other-request'), { verified: false, status: 'rejected', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(request(database), { unitsRequired: 99, verified: true, status: 'verified', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(match(database, 'request_other-donor')));
  await assertSucceeds(setDoc(match(database, 'request_other-donor'), { requestId: 'request', donorId: 'other-donor', status: 'matched', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertSucceeds(getDocs(collection(database, 'donorMatches')));
  await assertSucceeds(setDoc(doc(database, 'donorMatches', 'request_donor', 'messages', 'new'), { senderId: 'health-approved', senderRole: 'healthcare', text: 'Hello', createdAt: serverTimestamp() }));
  await assertFails(setDoc(match(database, 'wrong-id'), { requestId: 'request', donorId: 'donor', status: 'matched', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
});
test('approved blood-bank staff can use valid inventory operations; malformed stock is denied', async () => {
  const database = db('bank-approved');
  await assertSucceeds(getDocs(collection(database, 'bloodInventory')));
  await assertSucceeds(getDocs(collection(database, 'emergencyRequests')));
  await assertSucceeds(setDoc(doc(database, 'bloodInventory', 'B+'), { bloodGroup: 'B+', availableUnits: 30, status: 'Normal' }));
  await assertSucceeds(updateDoc(inventory(database), { availableUnits: 10, status: 'Low Stock' }));
  await assertFails(updateDoc(inventory(database), { availableUnits: -1 }));
  await assertFails(updateDoc(inventory(database), { bloodGroup: 'invalid' }));
  await assertSucceeds(deleteDoc(inventory(database)));
  await assertFails(updateDoc(request(database), { verified: true, status: 'verified', updatedAt: serverTimestamp() }));
});

test('requester creation transaction can read an unused ID, create pending request and query own history', async () => {
  const database = db('requester');
  const reference = request(database, 'new-request');
  await assertSucceeds(runTransaction(database, async transaction => {
    assert.equal((await transaction.get(reference)).exists(), false);
    transaction.set(reference, requestRecord('requester', { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }));
  await assertSucceeds(getDocs(query(collection(database, 'emergencyRequests'), where('requesterId', '==', 'requester'))));
  await assertSucceeds(getDoc(request(database)));
  await assertFails(getDoc(request(database, 'other-request')));
  await assertFails(getDocs(collection(database, 'emergencyRequests')));
  await assertFails(setDoc(request(database, 'fake-owner'), requestRecord('other-requester', { createdAt: serverTimestamp(), updatedAt: serverTimestamp() })));
  await assertFails(setDoc(request(database, 'fake-verified'), requestRecord('requester', { status: 'verified', verified: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })));
});
test('requester can edit only own unverified request and soft-cancel without changing patient/owner/verification', async () => {
  const database = db('requester');
  await assertSucceeds(updateDoc(request(database), { unitsRequired: 3, hospitalName: 'Updated Hospital', location: 'Kandy', requiredDate: '2026-12-20', urgency: 'critical', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(request(database), { bloodGroup: 'O-', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(request(database), { requesterId: 'other-requester' }));
  await assertFails(updateDoc(request(database), { verified: true, status: 'verified', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(request(database, 'other-request'), { unitsRequired: 3, updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(request(database), { status: 'cancelled', cancelledBy: 'requester', cancelledAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(request(database), { unitsRequired: 4, updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(request(database)));
});
test('donor profiles, response existence checks, creation, owner queries, withdrawal and deletion continue working', async () => {
  const database = db('donor');
  await assertSucceeds(getDoc(doc(database, 'donorProfiles', 'donor')));
  await assertSucceeds(updateDoc(doc(database, 'donorProfiles', 'donor'), { isAvailable: false, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(database, 'donorProfiles', 'other-donor'), { isAvailable: false }));
  await assertSucceeds(getDocs(collection(database, 'emergencyRequests')));
  const reference = doc(database, 'donorResponses', 'new-request_donor');
  await assertSucceeds(getDoc(reference));
  await assertSucceeds(setDoc(reference, responseRecord('donor', 'new-request')));
  await assertSucceeds(getDocs(query(collection(database, 'donorResponses'), where('donorId', '==', 'donor'))));
  await assertFails(getDocs(collection(database, 'donorResponses')));
  await assertFails(setDoc(doc(database, 'donorResponses', 'new-request_other-donor'), responseRecord('other-donor', 'new-request')));
  await assertFails(updateDoc(reference, { requestId: 'changed', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(reference));
  await assertSucceeds(updateDoc(reference, { status: 'withdrawn', updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(reference));
});
test('matched donor can read/send messages; unmatched donors, spoofed senders and message mutations are denied', async () => {
  const database = db('donor');
  await assertSucceeds(getDocs(collection(database, 'donorMatches', 'request_donor', 'messages')));
  const message = doc(database, 'donorMatches', 'request_donor', 'messages', 'new');
  await assertSucceeds(setDoc(message, { senderId: 'donor', senderRole: 'donor', text: 'Hello', createdAt: serverTimestamp() }));
  await assertFails(setDoc(doc(database, 'donorMatches', 'request_donor', 'messages', 'spoof'), { senderId: 'health-approved', senderRole: 'healthcare', text: 'Spoofed', createdAt: serverTimestamp() }));
  await assertFails(updateDoc(message, { text: 'Edited' }));
  await assertFails(deleteDoc(message));
  await assertFails(getDocs(collection(db('other-donor'), 'donorMatches', 'request_donor', 'messages')));
  await assertFails(setDoc(match(database, 'request_other-donor'), { requestId: 'request', donorId: 'other-donor', status: 'matched', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
});
test('unauthenticated and unmatched paths deny all collection access', async () => {
  const database = env.unauthenticatedContext().firestore();
  for (const name of ['users', 'donorProfiles', 'emergencyRequests', 'donorResponses', 'donorMatches', 'bloodInventory']) await assertFails(getDocs(collection(database, name)));
  await assertFails(setDoc(doc(db('admin'), 'unconfiguredCollection', 'anything'), { value: true }));
});
