const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function setup(role = 'admin', status = 'active', saved = null) {
  const writes = [];
  const firebase = {
    collection: (_, name) => name, doc: (_, collection, id) => ({ collection, id }),
    runTransaction: async (_, callback) => callback({
      get: async reference => reference.collection === 'users' ? { exists: () => true, data: () => ({ role, status }) } : { exists: () => !!saved, data: () => saved },
      set: (reference, fields) => writes.push({ reference, fields }), update: (reference, fields) => writes.push({ reference, fields }),
    }),
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../adminDonationCentreService.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name === 'firebase/firestore' ? firebase : { auth: { currentUser: { uid: 'admin' } }, db: {} }, module, module.exports);
  return { service: module.exports, writes };
}
const form = { name: 'Test Centre', address: 'Test Address', district: 'Test District', phone: '+94 77 123 4567', latitude: '0', longitude: '-180', isActive: true };
test('validation accepts numeric zero and boundaries and trims required text', () => {
  const { service } = setup();
  const result = service.validateCentre({ ...form, name: ' Test Centre ' });
  assert.equal(result.fields.name, 'Test Centre'); assert.equal(result.fields.latitude, 0); assert.equal(result.fields.longitude, -180);
});
test('validation rejects empty, nonnumeric, out-of-range coordinates and malformed phone', () => {
  const { service } = setup();
  for (const change of [{ name: ' ' }, { latitude: '' }, { latitude: '91' }, { latitude: 'NaN' }, { longitude: '181' }, { longitude: '0x10' }, { phone: 'abc123456' }, { phone: '123' }]) assert.equal(service.validateCentre({ ...form, ...change }).fields, null);
});
test('mutations require active admin and reject stale edits', async () => {
  const fields = setup().service.validateCentre(form).fields;
  for (const [role, status] of [['donor', 'active'], ['admin', 'suspended']]) await assert.rejects(setup(role, status).service.saveAdminCentre('admin', 'centre', fields, null), /active administrator/);
  const { service, writes } = setup('admin', 'active', { ...fields, name: 'Changed' });
  await assert.rejects(service.saveAdminCentre('admin', 'centre', { ...fields, name: 'Edit' }, { id: 'centre', data: fields }), /changed/);
  assert.equal(writes.length, 0);
});
test('deactivation keeps the record and retrying an acknowledged create is idempotent', async () => {
  const fields = setup().service.validateCentre(form).fields;
  const updating = setup('admin', 'active', fields);
  await updating.service.saveAdminCentre('admin', 'centre', { ...fields, isActive: false }, { id: 'centre', data: fields });
  assert.equal(updating.writes[0].fields.isActive, false);
  const retry = setup('admin', 'active', fields);
  await retry.service.saveAdminCentre('admin', 'centre', fields, null);
  assert.equal(retry.writes.length, 0);
});
