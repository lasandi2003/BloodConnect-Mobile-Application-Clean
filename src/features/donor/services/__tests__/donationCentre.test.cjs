const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function setup() {
  const auth = { currentUser: { uid: 'donor-user' } };
  const state = {};
  const firebase = {
    collection: (_, name) => ({ name }), where: (field, op, value) => ({ field, op, value }),
    query: (collection, ...constraints) => ({ collection, constraints }),
    onSnapshot: (reference, options, next, error) => {
      state.listener = { reference, options, next, error, closed: false };
      return () => { state.listener.closed = true; };
    },
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const localRequire = name => {
      if (name === 'firebase/firestore') return firebase;
      if (name.endsWith('config/firebase')) return { auth, db: {} };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`));
      throw new Error(`Unexpected dependency ${name}`);
    };
    new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
    return module.exports;
  }
  return { auth, state, utils: load(path.resolve(__dirname, '../../utils/donationCentres.ts')), service: load(path.resolve(__dirname, '../donationCentreService.ts')) };
}

// Synthetic coordinates and contact data are test fixtures only, never production listings.
const raw = { name: 'Test Centre', address: 'Test Address', district: 'Test District', phone: '+94 77 123 4567', latitude: 0, longitude: 1, isActive: true };

test('Haversine computes zero, equatorial distance and dateline crossings', () => {
  const { utils } = setup();
  assert.equal(utils.haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
  assert.ok(Math.abs(utils.haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) - 111.195) < 0.01);
  assert.ok(Math.abs(utils.haversineKm({ latitude: 0, longitude: 179 }, { latitude: 0, longitude: -179 }) - 222.39) < 0.01);
});
test('inactive, incomplete, nonnumeric or out-of-range centre records are excluded', () => {
  const { utils } = setup();
  for (const patch of [{ isActive: false }, { isActive: 'true' }, { latitude: 91 }, { longitude: -181 }, { latitude: NaN }, { longitude: '1' }, { phone: 'javascript:bad' }, { address: '' }]) {
    assert.equal(utils.parseDonationCentre('id', { ...raw, ...patch }), null);
  }
  assert.equal(utils.parseDonationCentre('id', raw).phone, raw.phone);
  assert.throws(() => utils.haversineKm({ latitude: 100, longitude: 0 }, { latitude: 0, longitude: 0 }), /Invalid coordinates/);
});
test('nearest sorting works independently of names; denied location sorts names without invented distances', () => {
  const { utils } = setup();
  const near = utils.parseDonationCentre('near', { ...raw, name: 'Z Near' });
  const far = utils.parseDonationCentre('far', { ...raw, name: 'A Far', longitude: 2 });
  assert.deepEqual(utils.nearbyCentres([far, near], { latitude: 0, longitude: 0 }, '').map(item => item.id), ['near', 'far']);
  const noLocation = utils.nearbyCentres([near, far], null, '');
  assert.deepEqual(noLocation.map(item => item.id), ['far', 'near']);
  assert.ok(noLocation.every(item => item.distanceKm === null));
});
test('name and district search is trimmed and case-insensitive', () => {
  const { utils } = setup();
  const centre = utils.parseDonationCentre('id', raw);
  assert.equal(utils.nearbyCentres([centre], null, '  CENTRE ').length, 1);
  assert.equal(utils.nearbyCentres([centre], null, ' DISTRICT ').length, 1);
  assert.equal(utils.nearbyCentres([centre], null, 'unmatched').length, 0);
});
test('maps URL uses saved coordinates and dialer URL strips formatting', () => {
  const { utils } = setup();
  assert.equal(utils.directionsUrl({ latitude: 0, longitude: -1 }), 'https://www.google.com/maps/dir/?api=1&destination=0%2C-1');
  assert.equal(utils.centrePhoneUrl('+94 (77) 123-4567'), 'tel:+94771234567');
});
test('listener queries only active records, forwards cache metadata and reports malformed records', () => {
  const { service, state } = setup();
  let result;
  const stop = service.watchActiveDonationCentres('donor-user', (...args) => { result = args; }, error => { throw error; });
  assert.deepEqual(state.listener.reference, { collection: { name: 'donationCentres' }, constraints: [{ field: 'isActive', op: '==', value: true }] });
  state.listener.next({ docs: [{ id: 'valid', data: () => raw }, { id: 'bad', data: () => ({}) }], metadata: { fromCache: true } });
  assert.equal(result[0].length, 1); assert.equal(result[1], true); assert.equal(result[2], 1);
  stop(); assert.equal(state.listener.closed, true);
});
test('listener rejects changed sessions and forwards Firestore errors', () => {
  const { service, state, auth } = setup();
  const errors = []; let calls = 0;
  service.watchActiveDonationCentres('other-user', () => calls++, error => errors.push(error));
  assert.equal(state.listener, undefined);
  service.watchActiveDonationCentres('donor-user', () => calls++, error => errors.push(error));
  auth.currentUser = null;
  state.listener.next({ docs: [], metadata: { fromCache: false } });
  state.listener.error({ code: 'permission-denied' });
  assert.equal(calls, 0); assert.equal(errors.length, 3);
  assert.match(service.getDonationCentreError(errors[2]), /read rules/);
});
