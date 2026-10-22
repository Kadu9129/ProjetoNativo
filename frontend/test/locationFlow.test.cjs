const assert = require('node:assert/strict');
const { test } = require('node:test');
const { locateUser } = require('../src/services/locationFlow');

function provider(overrides = {}) {
  return {
    Accuracy: { Balanced: 3 },
    getForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: async () => ({ coords: { latitude: -23.55, longitude: -46.63 } }),
    ...overrides,
  };
}

test('CT01: localização concedida retorna coordenadas sem solicitar novamente', async () => {
  const result = await locateUser(provider({
    requestForegroundPermissionsAsync: async () => assert.fail('Não deve pedir novamente'),
  }));
  assert.deepEqual(result, { status: 'located', coordinate: { latitude: -23.55, longitude: -46.63 } });
});

test('CT01: permissão inicial é solicitada e a concessão permite localizar', async () => {
  let requests = 0;
  const result = await locateUser(provider({
    getForegroundPermissionsAsync: async () => ({ status: 'undetermined', canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => { requests++; return { status: 'granted' }; },
  }));
  assert.equal(requests, 1);
  assert.equal(result.status, 'located');
});

test('CT02: recusa não consulta GPS nem retorna coordenadas', async () => {
  const result = await locateUser(provider({
    getForegroundPermissionsAsync: async () => ({ status: 'undetermined', canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => ({ status: 'denied', canAskAgain: true }),
    getCurrentPositionAsync: async () => assert.fail('GPS não autorizado'),
  }));
  assert.equal(result.status, 'denied');
  assert.equal(result.coordinate, undefined);
  assert.match(result.message, /explorar o mapa/);
});

test('CT06: bloqueio permanente orienta configurações e não repete o pedido', async () => {
  const result = await locateUser(provider({
    getForegroundPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }),
    requestForegroundPermissionsAsync: async () => assert.fail('Permissão bloqueada'),
  }));
  assert.equal(result.status, 'blocked');
  assert.match(result.message, /configurações/);
  assert.equal(result.coordinate, undefined);
});

test('CT06: recusa permanente no diálogo também orienta configurações', async () => {
  const result = await locateUser(provider({
    getForegroundPermissionsAsync: async () => ({ status: 'undetermined', canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }),
  }));
  assert.equal(result.status, 'blocked');
});

test('CT07: GPS desligado permite recuperação sem posição fictícia', async () => {
  const result = await locateUser(provider({
    hasServicesEnabledAsync: async () => false,
    getCurrentPositionAsync: async () => assert.fail('Serviço desligado'),
  }));
  assert.equal(result.status, 'disabled');
  assert.match(result.message, /Ative/);
  assert.equal(result.coordinate, undefined);
});

test('CT08: timeout encerra a tentativa e ignora resposta tardia', async () => {
  let finish;
  const result = await locateUser(provider({
    getCurrentPositionAsync: () => new Promise((resolve) => { finish = resolve; }),
  }), { timeoutMs: 5 });
  assert.equal(result.status, 'timeout');
  finish({ coords: { latitude: 0, longitude: 0 } });
  assert.equal(result.coordinate, undefined);
});

test('CT08: erro do provedor é falha, nunca sucesso', async () => {
  const result = await locateUser(provider({
    getCurrentPositionAsync: async () => { throw new Error('GPS indisponível'); },
  }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.coordinate, undefined);
});

test('CT08: rejeita coordenadas inválidas do provedor', async () => {
  for (const coords of [{ latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
    const result = await locateUser(provider({ getCurrentPositionAsync: async () => ({ coords }) }));
    assert.equal(result.status, 'unavailable');
  }
});
