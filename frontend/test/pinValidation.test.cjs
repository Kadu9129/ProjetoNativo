const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validatePin } = require('../src/services/pinModel');

const valid = { name: 'Praça Teste', description: 'Ponto fictício da Aula 2', latitude: -23.55, longitude: -46.63 };

test('CT04: campos vazios ou só com espaços são rejeitados', () => {
  for (const field of ['name', 'description']) {
    for (const value of ['', '   ', null]) {
      assert.throws(() => validatePin({ ...valid, [field]: value }));
    }
  }
});

test('CT09: nome aceita 1, 99 e 100 caracteres e rejeita 0 e 101', () => {
  for (const length of [1, 99, 100]) {
    assert.equal(validatePin({ ...valid, name: 'N'.repeat(length) }).name.length, length);
  }
  for (const length of [0, 101]) {
    assert.throws(() => validatePin({ ...valid, name: 'N'.repeat(length) }), /nome/);
  }
});

test('CT10: descrição aceita 1, 499 e 500 caracteres e rejeita 0 e 501', () => {
  for (const length of [1, 499, 500]) {
    assert.equal(validatePin({ ...valid, description: 'D'.repeat(length) }).description.length, length);
  }
  for (const length of [0, 501]) {
    assert.throws(() => validatePin({ ...valid, description: 'D'.repeat(length) }), /descrição/);
  }
});

test('normaliza espaços sem alterar as coordenadas do lugar', () => {
  assert.deepEqual(validatePin({ ...valid, name: '  Praça Teste  ', description: '  Ponto fictício da Aula 2  ' }), valid);
});

test('aceita extremos geográficos e rejeita valores fora deles ou não numéricos', () => {
  for (const latitude of [-90, 0, 90]) {
    for (const longitude of [-180, 0, 180]) {
      assert.equal(validatePin({ ...valid, latitude, longitude }).latitude, latitude);
    }
  }
  for (const latitude of [-90.001, 90.001, NaN, Infinity, '0', null]) {
    assert.throws(() => validatePin({ ...valid, latitude }), /latitude/);
  }
  for (const longitude of [-180.001, 180.001, NaN, Infinity, '0', null]) {
    assert.throws(() => validatePin({ ...valid, longitude }), /longitude/);
  }
});
