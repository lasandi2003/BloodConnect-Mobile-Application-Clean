const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const moduleExports = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../centreMapHtml.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleExports, moduleExports.exports);
const { centreMapHtml, validMapCoordinates } = moduleExports.exports;
function mapPage(initial, native = true) {
  const messages = []; const events = {}; const tileEvents = {}; const dragEvents = {};
  let markerPoint;
  const marker = { addTo: () => marker, on: (name, callback) => { dragEvents[name] = callback; }, setLatLng: point => { markerPoint = point; }, getLatLng: () => ({ lat: markerPoint[0], lng: markerPoint[1] }) };
  const map = { setView: () => map, on: (name, callback) => { events[name] = callback; } };
  const tiles = { addTo: () => tiles, on: (name, callback) => { tileEvents[name] = callback; } };
  const status = { style: {} };
  const send = text => messages.push(JSON.parse(text));
  const context = vm.createContext({ window: native ? { ReactNativeWebView: { postMessage: send } } : { parent: { postMessage: send } }, document: { getElementById: () => status }, setTimeout: () => {}, L: { map: () => map, tileLayer: () => tiles, divIcon: () => ({}), marker: point => { markerPoint = point; return marker; } } });
  for (const match of centreMapHtml(initial).matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(match[1], context);
  return { messages, events, tileEvents, dragEvents, setMarker: point => { markerPoint = point; } };
}
test('invalid coordinates are rejected before entering the map document', () => {
  for (const point of [null, {}, { latitude: '0', longitude: 0 }, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }]) assert.equal(validMapCoordinates(point), false);
  assert.equal(validMapCoordinates({ latitude: 0, longitude: 0 }), true);
  assert.equal(mapPage({ latitude: '</script>', longitude: 0 }).messages.length, 0);
});
test('new map has no invented selection; clicking and dragging send validated points', () => {
  const page = mapPage(null);
  assert.equal(page.messages.length, 0);
  page.tileEvents.tileload(); assert.equal(page.messages[0].type, 'ready');
  page.events.click({ latlng: { lat: 7, lng: 80 } });
  assert.deepEqual(page.messages[1], { type: 'selection', latitude: 7, longitude: 80 });
  page.setMarker([8, 181]); page.dragEvents.dragend();
  assert.deepEqual(page.messages[2], { type: 'selection', latitude: 8, longitude: -179 });
});
test('existing zero coordinates survive initialization on web and map failures are reported', () => {
  const page = mapPage({ latitude: 0, longitude: 0 }, false);
  assert.deepEqual(page.messages[0], { type: 'selection', latitude: 0, longitude: 0 });
  page.tileEvents.tileerror(); assert.equal(page.messages[1].type, 'error');
});
