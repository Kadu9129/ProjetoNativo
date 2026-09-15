const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  getMapStatusPresentation,
  hasInternetConnection,
  shouldReloadExternalMap,
} = require('../src/services/mapAvailability');

test('detecta o modo avião e mantém o mapa externo como indisponível', () => {
  const connected = hasInternetConnection({
    isConnected: false,
    isInternetReachable: false,
  });
  const presentation = getMapStatusPresentation(connected, 'available');

  assert.equal(connected, false);
  assert.equal(presentation.unavailable, true);
  assert.match(presentation.label, /Sem internet/);
});

test('recarrega o mapa externo somente na transição de offline para online', () => {
  assert.equal(shouldReloadExternalMap(false, true), true);
  assert.equal(shouldReloadExternalMap(null, true), false);
  assert.equal(shouldReloadExternalMap(true, true), false);
  assert.equal(shouldReloadExternalMap(true, false), false);
});

test('diferencia falha do provedor externo de ausência de internet', () => {
  const presentation = getMapStatusPresentation(true, 'unavailable');

  assert.equal(presentation.unavailable, true);
  assert.match(presentation.label, /dados locais preservados/);
});
