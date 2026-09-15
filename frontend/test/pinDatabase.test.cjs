const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const {
  PIN_QUERIES,
  PIN_SCHEMA_SQL,
  rowToPin,
  validatePin,
} = require('../src/services/pinModel');

let database;
let temporaryDirectory;
let databasePath;

function openDatabase() {
  database = new DatabaseSync(databasePath);
  database.exec(PIN_SCHEMA_SQL);
  return database;
}

function closeDatabase() {
  database?.close();
  database = null;
}

function insertPin(id, fields, timestamp) {
  const pin = validatePin(fields);
  database.prepare(PIN_QUERIES.insert).run(
    id,
    pin.name,
    pin.description,
    pin.latitude,
    pin.longitude,
    timestamp,
    timestamp,
  );
}

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'mappin-sqlite-test-'));
  databasePath = join(temporaryDirectory, 'mappin.db');
  openDatabase();
});

afterEach(() => {
  closeDatabase();
  rmSync(temporaryDirectory, { force: true, recursive: true });
});

test('cadastra e consulta lugares depois de fechar e reabrir o banco', () => {
  insertPin(
    'pin-1',
    { name: 'Praia', description: 'Lugar para caminhar', latitude: -22.9, longitude: -43.1 },
    '2026-09-15T10:00:00.000Z',
  );
  insertPin(
    'pin-2',
    { name: 'Parque', description: 'Área verde', latitude: -22.8, longitude: -43.2 },
    '2026-09-15T11:00:00.000Z',
  );

  closeDatabase();
  openDatabase();

  const pins = database.prepare(PIN_QUERIES.list).all().map(rowToPin);
  assert.equal(pins.length, 2);
  assert.equal(pins[0]._id, 'pin-2');
  assert.equal(pins[1].name, 'Praia');
});

test('mantém edição e exclusão depois de novas reaberturas', () => {
  insertPin(
    'pin-1',
    { name: 'Praça', description: 'Descrição inicial', latitude: -23, longitude: -43 },
    '2026-09-15T10:00:00.000Z',
  );

  closeDatabase();
  openDatabase();
  const updated = validatePin({
    name: 'Praça Central',
    description: 'Descrição atualizada offline',
    latitude: -23,
    longitude: -43,
  });
  database.prepare(PIN_QUERIES.update).run(
    updated.name,
    updated.description,
    updated.latitude,
    updated.longitude,
    '2026-09-15T12:00:00.000Z',
    'pin-1',
  );

  closeDatabase();
  openDatabase();
  const editedPin = rowToPin(database.prepare(PIN_QUERIES.byId).get('pin-1'));
  assert.equal(editedPin.name, 'Praça Central');
  assert.equal(editedPin.description, 'Descrição atualizada offline');

  database.prepare(PIN_QUERIES.delete).run('pin-1');
  closeDatabase();
  openDatabase();
  assert.equal(database.prepare(PIN_QUERIES.byId).get('pin-1'), undefined);
});

test('rejeita dados inválidos antes de gravar no SQLite', () => {
  assert.throws(
    () => validatePin({ name: '', description: 'Teste', latitude: 0, longitude: 0 }),
    /nome/,
  );
  assert.throws(
    () => validatePin({ name: 'Teste', description: 'Teste', latitude: 91, longitude: 0 }),
    /latitude/,
  );
});
