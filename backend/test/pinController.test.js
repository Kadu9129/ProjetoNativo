const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePinPayload } = require('../src/controllers/pinController');

const validPin = {
  name: 'Saquarema Beach',
  description: 'Great surf spot at sunrise',
  latitude: -22.9199,
  longitude: -42.5083,
};

test('accepts and trims a valid pin payload', () => {
  const result = validatePinPayload({ ...validPin, name: '  Saquarema Beach  ' });
  assert.equal(result.error, undefined);
  assert.equal(result.value.name, 'Saquarema Beach');
});

test('rejects empty required text fields', () => {
  assert.match(validatePinPayload({ ...validPin, name: '   ' }).error, /Name is required/);
  assert.match(validatePinPayload({ ...validPin, description: '' }).error, /Description is required/);
});

test('rejects invalid coordinate types and ranges', () => {
  assert.match(validatePinPayload({ ...validPin, latitude: 91 }).error, /Latitude/);
  assert.match(validatePinPayload({ ...validPin, longitude: -181 }).error, /Longitude/);
  assert.match(validatePinPayload({ ...validPin, latitude: '-22.9' }).error, /Latitude/);
});

test('accepts a client id used for idempotent offline synchronization', () => {
  const result = validatePinPayload({ ...validPin, clientId: 'device-123-operation-456' });
  assert.equal(result.error, undefined);
  assert.equal(result.value.clientId, 'device-123-operation-456');
});

test('rejects an invalid client id', () => {
  assert.match(validatePinPayload({ ...validPin, clientId: '   ' }).error, /Client id/);
});

