const PIN_SCHEMA_SQL = `
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
`;

const PIN_QUERIES = Object.freeze({
  list: `SELECT id, name, description, latitude, longitude, created_at, updated_at
           FROM pins
          ORDER BY created_at DESC`,
  byId: `SELECT id, name, description, latitude, longitude, created_at, updated_at
           FROM pins WHERE id = ?`,
  insert: `INSERT INTO pins
            (id, name, description, latitude, longitude, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
  insertOrIgnore: `INSERT OR IGNORE INTO pins
            (id, name, description, latitude, longitude, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
  update: `UPDATE pins
              SET name = ?, description = ?, latitude = ?, longitude = ?, updated_at = ?
            WHERE id = ?`,
  delete: 'DELETE FROM pins WHERE id = ?',
});

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

module.exports = { PIN_QUERIES, PIN_SCHEMA_SQL, rowToPin, validatePin };
