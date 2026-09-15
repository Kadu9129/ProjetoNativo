import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

<<<<<<< HEAD
const { PIN_QUERIES, PIN_SCHEMA_SQL, rowToPin, validatePin } = require('./pinModel');

=======
>>>>>>> c231a7b (feat: frontend v2)
const DATABASE_NAME = 'mappin.db';
const LEGACY_STORAGE_KEY = '@mappin/offline-state/v1';
const LEGACY_MIGRATION_KEY = 'legacy_async_storage_imported';

let databasePromise;

function makePinId() {
  return `pin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

<<<<<<< HEAD
=======
function validatePin(fields) {
  const name = typeof fields?.name === 'string' ? fields.name.trim() : '';
  const description =
    typeof fields?.description === 'string' ? fields.description.trim() : '';
  const latitude = fields?.latitude;
  const longitude = fields?.longitude;

  if (!name || name.length > 100) {
    throw new Error('O nome deve ter entre 1 e 100 caracteres.');
  }
  if (!description || description.length > 500) {
    throw new Error('A descrição deve ter entre 1 e 500 caracteres.');
  }
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('A latitude informada é inválida.');
  }
  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('A longitude informada é inválida.');
  }

  return { name, description, latitude, longitude };
}

function rowToPin(row) {
  return {
    _id: row.id,
    name: row.name,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

>>>>>>> c231a7b (feat: frontend v2)
async function migrateLegacyPins(database) {
  const completed = await database.getFirstAsync(
    'SELECT value FROM app_metadata WHERE key = ?',
    LEGACY_MIGRATION_KEY,
  );
  if (completed) return;

  try {
    const serializedState = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    const legacyState = serializedState ? JSON.parse(serializedState) : null;
    const legacyPins = Array.isArray(legacyState?.pins) ? legacyState.pins : [];

    for (const legacyPin of legacyPins) {
      try {
        const pin = validatePin(legacyPin);
        const timestamp = new Date().toISOString();
        await database.runAsync(
<<<<<<< HEAD
          PIN_QUERIES.insertOrIgnore,
=======
          `INSERT OR IGNORE INTO pins
            (id, name, description, latitude, longitude, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
>>>>>>> c231a7b (feat: frontend v2)
          typeof legacyPin._id === 'string' && legacyPin._id ? legacyPin._id : makePinId(),
          pin.name,
          pin.description,
          pin.latitude,
          pin.longitude,
          legacyPin.createdAt || timestamp,
          legacyPin.updatedAt || timestamp,
        );
      } catch (_error) {
        // Um registro antigo inválido não impede a abertura do banco local.
      }
    }

    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (_error) {
    // Dados ausentes ou corrompidos são ignorados; o SQLite começa vazio.
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
    LEGACY_MIGRATION_KEY,
    new Date().toISOString(),
  );
}

async function initializeDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
<<<<<<< HEAD
  await database.execAsync(PIN_SCHEMA_SQL);
=======
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pins (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),
      description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 500),
      latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
      longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pins_updated_at_index ON pins(updated_at DESC);
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
>>>>>>> c231a7b (feat: frontend v2)
  await migrateLegacyPins(database);
  return database;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function listPins() {
  const database = await getDatabase();
<<<<<<< HEAD
  const rows = await database.getAllAsync(PIN_QUERIES.list);
=======
  const rows = await database.getAllAsync(
    `SELECT id, name, description, latitude, longitude, created_at, updated_at
       FROM pins
      ORDER BY created_at DESC`,
  );
>>>>>>> c231a7b (feat: frontend v2)
  return rows.map(rowToPin);
}

export async function createPin(fields) {
  const database = await getDatabase();
  const pin = validatePin(fields);
  const id = makePinId();
  const timestamp = new Date().toISOString();

  await database.runAsync(
<<<<<<< HEAD
    PIN_QUERIES.insert,
=======
    `INSERT INTO pins
      (id, name, description, latitude, longitude, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
>>>>>>> c231a7b (feat: frontend v2)
    id,
    pin.name,
    pin.description,
    pin.latitude,
    pin.longitude,
    timestamp,
    timestamp,
  );

  return { _id: id, ...pin, createdAt: timestamp, updatedAt: timestamp };
}

export async function updatePin(id, fields) {
  if (typeof id !== 'string' || !id) throw new Error('Lugar não encontrado.');
  const database = await getDatabase();
  const pin = validatePin(fields);
  const timestamp = new Date().toISOString();
  const result = await database.runAsync(
<<<<<<< HEAD
    PIN_QUERIES.update,
=======
    `UPDATE pins
        SET name = ?, description = ?, latitude = ?, longitude = ?, updated_at = ?
      WHERE id = ?`,
>>>>>>> c231a7b (feat: frontend v2)
    pin.name,
    pin.description,
    pin.latitude,
    pin.longitude,
    timestamp,
    id,
  );

  if (result.changes === 0) throw new Error('Lugar não encontrado.');
<<<<<<< HEAD
  const row = await database.getFirstAsync(PIN_QUERIES.byId, id);
=======
  const row = await database.getFirstAsync(
    `SELECT id, name, description, latitude, longitude, created_at, updated_at
       FROM pins WHERE id = ?`,
    id,
  );
>>>>>>> c231a7b (feat: frontend v2)
  return rowToPin(row);
}

export async function deletePin(id) {
  if (typeof id !== 'string' || !id) throw new Error('Lugar não encontrado.');
  const database = await getDatabase();
<<<<<<< HEAD
  const result = await database.runAsync(PIN_QUERIES.delete, id);
=======
  const result = await database.runAsync('DELETE FROM pins WHERE id = ?', id);
>>>>>>> c231a7b (feat: frontend v2)
  if (result.changes === 0) throw new Error('Lugar não encontrado.');
}
