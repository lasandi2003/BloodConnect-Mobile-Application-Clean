const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function draft() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return {
    patient: { fullName: 'Example Patient', age: 30, gender: 'Female', contactNumber: '0771234567',
      representativeName: 'Example Representative', representativeContactNumber: '0772345678', relationshipToPatient: 'Sibling' },
    hospital: { hospitalName: 'Example Hospital', hospitalLocation: 'Colombo' },
    bloodRequirement: { bloodGroup: 'O+', unitsRequired: 2 },
    requiredDate: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'),
    urgencyLevel: 'Urgent',
  };
}

// Load only this service and its pure utilities. All Firebase operations are mocked.
function setup() {
  const records = new Map();
  const state = { writes: 0, transactions: 0, failBeforeCommit: false, failAfterCommit: false };
  const auth = { currentUser: { uid: 'requester-user' } };
  const firestore = {
    getDocFromServer: async reference => ({ exists: () => records.has(reference.path), data: () => records.get(reference.path) }),
    onSnapshot: (reference, options, next, error) => {
      state.listener = { reference, options, next, error, closed: false };
      return () => { state.listener.closed = true; };
    },
    collection: (_db, name) => ({ name }),
    doc: (reference, name, id) => id ? { id, path: `${name}/${id}` } : { id: 'generated-test-id', path: `${reference.name}/generated-test-id` },
    serverTimestamp: () => ({ serverTimestamp: true }),
    runTransaction: async (_db, callback) => {
      state.transactions++;
      const pending = [];
      const receipt = await callback({
        get: async reference => ({ exists: () => records.has(reference.path), data: () => records.get(reference.path) }),
        set: (reference, data) => pending.push([reference.path, data]),
        update: (reference, data) => pending.push([reference.path, { ...records.get(reference.path), ...data }]),
      });
      if (state.failBeforeCommit) {
        state.failBeforeCommit = false;
        throw Object.assign(new Error('Unavailable'), { code: 'unavailable' });
      }
      for (const [key, data] of pending) { records.set(key, data); state.writes++; }
      if (state.failAfterCommit) {
        state.failAfterCommit = false;
        throw Object.assign(new Error('Acknowledgement lost'), { code: 'unavailable' });
      }
      return receipt;
    },
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    function localRequire(request) {
      if (request === 'firebase/firestore') return firestore;
      if (request.endsWith('config/firebase')) return { auth, db: {} };
      if (request.startsWith('.')) return load(path.resolve(path.dirname(filename), `${request}.ts`));
      throw new Error(`Unexpected dependency: ${request}`);
    }
    new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
    return module.exports;
  }
  return { service: load(path.resolve(__dirname, '../emergencyRequestService.ts')), records, state, auth,
    statusView: load(path.resolve(__dirname, '../../utils/requestStatus.ts')).getRequestStatusView };
}

test('generating a request ID performs no save', () => {
  const { service, state } = setup();
  assert.equal(service.createEmergencyRequestId(), 'generated-test-id');
  assert.equal(state.transactions, 0);
  assert.equal(state.writes, 0);
});

test('submission writes donor-compatible fields and an unverified pending status', async () => {
  const { service, state, records } = setup();
  const receipt = await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  const saved = records.get('emergencyRequests/request-1');
  assert.equal(state.writes, 1);
  assert.equal(saved.requesterId, 'requester-user');
  assert.equal(saved.patientName, 'Example Patient');
  assert.equal(saved.patient.age, 30);
  assert.equal(saved.hospitalName, 'Example Hospital');
  assert.equal(saved.location, 'Colombo');
  assert.equal(saved.bloodGroup, 'O+');
  assert.equal(saved.unitsRequired, 2);
  assert.equal(saved.urgency, 'urgent');
  assert.equal(saved.contactName, 'Example Representative');
  assert.equal(saved.contactPhone, '0772345678');
  assert.equal(saved.verified, false);
  assert.equal(saved.status, 'pending_verification');
  assert.deepEqual(saved.createdAt, { serverTimestamp: true });
  assert.deepEqual(saved.updatedAt, { serverTimestamp: true });
  assert.equal(receipt.requestId, 'request-1');
  assert.equal(receipt.status, 'pending_verification');
});

test('retrying the same ID returns the saved record without overwriting it', async () => {
  const { service, state, records } = setup();
  await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  const edited = draft();
  edited.hospital.hospitalName = 'Changed Hospital';
  const receipt = await service.submitEmergencyRequest(edited, 'requester-user', 'request-1');
  assert.equal(state.writes, 1);
  assert.equal(records.size, 1);
  assert.equal(receipt.hospitalName, 'Example Hospital');
});

test('a failed commit rejects; retrying safely creates one request', async () => {
  const { service, state, records } = setup();
  state.failBeforeCommit = true;
  await assert.rejects(service.submitEmergencyRequest(draft(), 'requester-user', 'request-1'));
  assert.equal(records.size, 0);
  await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  assert.equal(state.writes, 1);
});

test('lost save acknowledgement is recovered without a duplicate write', async () => {
  const { service, state, records } = setup();
  state.failAfterCommit = true;
  await assert.rejects(service.submitEmergencyRequest(draft(), 'requester-user', 'request-1'));
  assert.equal(records.size, 1);
  const receipt = await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  assert.equal(receipt.requestId, 'request-1');
  assert.equal(state.writes, 1);
});

test('a changed session cannot create a request', async () => {
  const { service, state, auth } = setup();
  auth.currentUser = { uid: 'other-user' };
  await assert.rejects(service.submitEmergencyRequest(draft(), 'requester-user', 'request-1'), /session has changed/);
  assert.equal(state.transactions, 0);
  assert.equal(state.writes, 0);
});

test('an existing request belonging to another user cannot be overwritten', async () => {
  const { service, state, records } = setup();
  records.set('emergencyRequests/request-1', { requesterId: 'other-user' });
  await assert.rejects(service.submitEmergencyRequest(draft(), 'requester-user', 'request-1'), /unavailable/);
  assert.equal(state.writes, 0);
});

test('submission revalidates dates and patient data before any save', async () => {
  const { service, state } = setup();
  const expired = draft();
  expired.requiredDate = '2000-01-01';
  await assert.rejects(service.submitEmergencyRequest(expired, 'requester-user', 'request-1'), /future date/);
  const invalid = draft();
  invalid.patient.age = 121;
  await assert.rejects(service.submitEmergencyRequest(invalid, 'requester-user', 'request-2'), /age/);
  assert.equal(state.writes, 0);
});

test('a retry recovers an existing receipt even if the original required date has passed', async () => {
  const { service, state, records } = setup();
  await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  records.get('emergencyRequests/request-1').requiredDate = '2000-01-01';
  const expired = draft();
  expired.requiredDate = '2000-01-01';
  const receipt = await service.submitEmergencyRequest(expired, 'requester-user', 'request-1');
  assert.equal(receipt.requiredDate, '2000-01-01');
  assert.equal(state.writes, 1);
});

test('a malformed existing record cannot produce a success receipt', async () => {
  const { service, state, records } = setup();
  records.set('emergencyRequests/request-1', { requesterId: 'requester-user' });
  await assert.rejects(service.submitEmergencyRequest(draft(), 'requester-user', 'request-1'), /could not be loaded/);
  assert.equal(state.writes, 0);
});

test('a recovered receipt reports the saved status rather than resetting verification', async () => {
  const { service, state, records } = setup();
  await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  records.get('emergencyRequests/request-1').status = 'verified';
  records.get('emergencyRequests/request-1').verified = true;
  const receipt = await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  assert.equal(receipt.status, 'verified');
  assert.equal(records.get('emergencyRequests/request-1').verified, true);
  assert.equal(state.writes, 1);
});

test('status listener forwards live changes and cache metadata and can unsubscribe', async () => {
  const { service, state, records } = setup();
  await service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  const updates = [];
  const unsubscribe = service.watchEmergencyRequest('request-1', 'requester-user', (...args) => updates.push(args), assert.fail);
  const saved = records.get('emergencyRequests/request-1');
  state.listener.next({ exists: () => true, data: () => saved, metadata: { fromCache: true, hasPendingWrites: false } });
  assert.equal(updates[0][0].status, 'pending_verification');
  assert.equal(updates[0][1], true);
  saved.status = 'verified'; saved.verified = true;
  state.listener.next({ exists: () => true, data: () => saved, metadata: { fromCache: false, hasPendingWrites: false } });
  assert.equal(updates[1][0].verified, true);
  assert.equal(updates[1][0].status, 'verified');
  assert.equal(updates[1][1], false);
  unsubscribe();
  assert.equal(state.listener.closed, true);
});

test('a cached missing record is distinguished from a server-confirmed missing record', () => {
  const { service, state } = setup();
  const updates = [];
  service.watchEmergencyRequest('missing', 'requester-user', (...args) => updates.push(args), assert.fail);
  for (const fromCache of [true, false]) {
    state.listener.next({ exists: () => false, metadata: { fromCache, hasPendingWrites: false } });
  }
  assert.deepEqual(updates, [[null, true, false], [null, false, false]]);
});

test('a listener never exposes a request belonging to another requester', () => {
  const { service, state } = setup();
  const failures = [];
  service.watchEmergencyRequest('request-1', 'requester-user', () => assert.fail('Unexpected disclosure'), error => failures.push(error));
  state.listener.next({ exists: () => true, data: () => ({ requesterId: 'other-user' }), metadata: { fromCache: false, hasPendingWrites: false } });
  assert.match(failures[0].message, /does not belong/);
});

test('a changed session stops status data being exposed', () => {
  const { service, state, auth } = setup();
  const failures = [];
  service.watchEmergencyRequest('request-1', 'requester-user', () => assert.fail('Unexpected disclosure'), error => failures.push(error));
  auth.currentUser = { uid: 'other-user' };
  state.listener.next({ exists: () => false, metadata: { fromCache: false, hasPendingWrites: false } });
  assert.match(failures[0].message, /session has changed/);
});

test('progress uses saved states without inventing matches or completed donations', () => {
  const { statusView } = setup();
  assert.equal(statusView('pending_verification', false).stage, 1);
  assert.equal(statusView('verified', true).stage, 2);
  assert.equal(statusView('matched', true).stage, 3);
  assert.equal(statusView('completed', true).stage, 4);
  assert.equal(statusView('cancelled', true).stage, null);
  assert.equal(statusView('cancelled', true).terminal, true);
  assert.equal(statusView('unexpected_status', true).stage, null);
});

async function updateFixture() {
  const setupResult = setup();
  await setupResult.service.submitEmergencyRequest(draft(), 'requester-user', 'request-1');
  const baseline = await setupResult.service.getRequestForUpdate('request-1', 'requester-user');
  const form = { unitsRequired: '3', hospitalName: 'Updated Hospital', hospitalLocation: 'Kandy',
    requiredDate: baseline.requiredDate, urgencyLevel: 'Critical' };
  return { ...setupResult, baseline, form };
}

test('updating changes only the editable fields and preserves patient, owner, status and verification', async () => {
  const { service, records, baseline, form, state } = await updateFixture();
  const original = { ...records.get('emergencyRequests/request-1') };
  await service.updateEmergencyRequest('request-1', 'requester-user', form, baseline);
  const saved = records.get('emergencyRequests/request-1');
  assert.equal(saved.unitsRequired, 3);
  assert.equal(saved.hospitalName, 'Updated Hospital');
  assert.equal(saved.location, 'Kandy');
  assert.equal(saved.urgency, 'critical');
  for (const key of ['patient', 'patientName', 'bloodGroup', 'requesterId', 'status', 'verified', 'createdAt', 'contactName', 'contactPhone']) {
    assert.deepEqual(saved[key], original[key]);
  }
  assert.deepEqual(saved.updatedAt, { serverTimestamp: true });
  assert.equal(state.writes, 2);
});

test('updates reject requests that have been verified or closed since loading', async () => {
  for (const status of ['verified', 'matched', 'completed', 'cancelled', 'rejected', 'closed']) {
    const { service, records, baseline, form, state } = await updateFixture();
    records.get('emergencyRequests/request-1').status = status;
    await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline), /cannot be edited/);
    assert.equal(state.writes, 1);
  }
  const { service, records, baseline, form, state } = await updateFixture();
  records.get('emergencyRequests/request-1').verified = true;
  await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline), /cannot be edited/);
  assert.equal(state.writes, 1);
});

test('concurrent changes to editable fields are not overwritten', async () => {
  const { service, records, baseline, form, state } = await updateFixture();
  records.get('emergencyRequests/request-1').unitsRequired = 5;
  await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline), /details have changed/);
  assert.equal(records.get('emergencyRequests/request-1').unitsRequired, 5);
  assert.equal(state.writes, 1);
});

test('another requester cannot load or update the record', async () => {
  const { service, records, baseline, form, state } = await updateFixture();
  records.get('emergencyRequests/request-1').requesterId = 'other-user';
  await assert.rejects(service.getRequestForUpdate('request-1', 'requester-user'), /does not belong/);
  await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline), /does not belong/);
  assert.equal(state.writes, 1);
});

test('invalid units, date and missing hospital details cannot be saved', async () => {
  const { service, baseline, form, state } = await updateFixture();
  for (const values of [{ unitsRequired: '0' }, { unitsRequired: '1.5' }, { requiredDate: '2000-01-01' }, { hospitalName: '' }, { hospitalLocation: '' }]) {
    await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', { ...form, ...values }, baseline));
  }
  assert.equal(state.writes, 1);
});

test('a failed update commit preserves the saved request', async () => {
  const { service, records, baseline, form, state } = await updateFixture();
  state.failBeforeCommit = true;
  await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline));
  assert.equal(records.get('emergencyRequests/request-1').unitsRequired, 2);
  assert.equal(state.writes, 1);
});

test('missing records and mismatched request IDs cannot be updated', async () => {
  const { service, records, baseline, form, state } = await updateFixture();
  await assert.rejects(service.updateEmergencyRequest('request-2', 'requester-user', form, baseline), /does not match/);
  records.delete('emergencyRequests/request-1');
  await assert.rejects(service.updateEmergencyRequest('request-1', 'requester-user', form, baseline), /could not be found/);
  assert.equal(state.writes, 1);
});
