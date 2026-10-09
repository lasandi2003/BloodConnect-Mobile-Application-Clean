const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function setup(role = 'admin') {
  const auth = { currentUser: { uid: 'admin-user' } };
  const reads = [];
  const state = { denied: null, switchSession: false };
  const firebase = {
    collection: (_, name) => ({ name }), doc: (_, name, id) => ({ path: `${name}/${id}` }),
    getDocFromServer: async () => ({ exists: () => true, data: () => ({ role }) }),
    getDocsFromServer: async reference => {
      reads.push(reference.name);
      if (state.switchSession) auth.currentUser = null;
      if (reference.name === state.denied) throw { code: 'permission-denied' };
      return { docs: [{ id: 'record', data: () => ({ fullName: 'Example', bloodGroup: 'A+', status: 'active' }) }] };
    },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../adminOverviewService.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name === 'firebase/firestore' ? firebase : { auth, db: {} }, module, module.exports);
  return { service: module.exports, reads, auth, state };
}

test('non-admin accounts cannot read administration collections', async () => {
  const { service, reads } = setup('requester');
  await assert.rejects(service.loadAdminOverview('admin-user'), /administrator access/);
  assert.deepEqual(reads, []);
});

test('admin sections load independently and denied sections are not reported as empty', async () => {
  const { service, reads, state } = setup();
  state.denied = 'donorMatches';
  const result = await service.loadAdminOverview('admin-user');
  assert.equal(reads.length, 6);
  assert.equal(result.users.rows.length, 1);
  assert.match(result.donorMatches.error, /rules/);
  assert.equal(result.donorMatches.rows.length, 0);
});

test('session changes cannot return another account administration data', async () => {
  const { service, state } = setup();
  state.switchSession = true;
  await assert.rejects(service.loadAdminOverview('admin-user'), /sign in again/);
});

test('legacy records render safely without fabricating inventory or donor availability', () => {
  const { service } = setup();
  assert.match(service.buildAdminRow('bloodInventory', 'A-', {}).details[0], /Not recorded/);
  assert.ok(service.buildAdminRow('donorProfiles', 'id', {}).details.includes('Availability not recorded'));
  assert.equal(service.buildAdminRow('emergencyRequests', 'id', {}).title.includes('Not recorded'), true);
});
