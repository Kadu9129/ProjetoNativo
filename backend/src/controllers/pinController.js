const mongoose = require('mongoose');
const Pin = require('../models/Pin');

function validatePinPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Request body must be a JSON object' };
  }

  const { clientId, name, description, latitude, longitude } = payload;

  if (
    clientId !== undefined &&
    (typeof clientId !== 'string' || !clientId.trim() || clientId.trim().length > 100)
  ) {
    return { error: 'Client id must contain 1 to 100 characters' };
  }

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return { error: 'Name is required and must contain 1 to 100 characters' };
  }

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    description.trim().length > 500
  ) {
    return { error: 'Description is required and must contain 1 to 500 characters' };
  }

  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: 'Latitude must be a number between -90 and 90' };
  }

  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { error: 'Longitude must be a number between -180 and 180' };
  }

  return {
    value: {
      name: name.trim(),
      description: description.trim(),
      latitude,
      longitude,
      ...(clientId === undefined ? {} : { clientId: clientId.trim() }),
    },
  };
}

async function getPins(_req, res, next) {
  try {
    const pins = await Pin.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(pins);
  } catch (error) {
    next(error);
  }
}

async function createPin(req, res, next) {
  const validation = validatePinPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    if (validation.value.clientId) {
      const existingPin = await Pin.findOne({ clientId: validation.value.clientId }).lean();
      if (existingPin) {
        return res.status(200).json(existingPin);
      }
    }

    const pin = await Pin.create(validation.value);
    return res.status(201).json(pin);
  } catch (error) {
    if (error?.code === 11000 && validation.value.clientId) {
      const existingPin = await Pin.findOne({ clientId: validation.value.clientId }).lean();
      if (existingPin) {
        return res.status(200).json(existingPin);
      }
    }
    return next(error);
  }
}

async function updatePin(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid pin id' });
  }

  const validation = validatePinPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const pin = await Pin.findByIdAndUpdate(req.params.id, validation.value, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    return res.status(200).json(pin);
  } catch (error) {
    return next(error);
  }
}

async function deletePin(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid pin id' });
  }

  try {
    const pin = await Pin.findByIdAndDelete(req.params.id);
    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = { createPin, deletePin, getPins, updatePin, validatePinPayload };

