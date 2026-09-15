import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const STORAGE_KEY = '@mappin/offline-state/v1';

export const EMPTY_PIN_STATE = Object.freeze({ pins: [], queue: [] });

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toPayload(pin) {
  return {
    ...(pin.clientId ? { clientId: pin.clientId } : {}),
    name: pin.name,
    description: pin.description,
    latitude: pin.latitude,
    longitude: pin.longitude,
  };
}

function normalizeState(value) {
  return {
    pins: Array.isArray(value?.pins) ? value.pins : [],
    queue: Array.isArray(value?.queue) ? value.queue : [],
  };
}

function decorateState(value) {
  const state = normalizeState(value);
  const pendingPinIds = new Set(
    state.queue.flatMap((operation) => [operation.localId, operation.targetId].filter(Boolean)),
  );

  return {
    ...state,
    pins: state.pins.map((pin) => ({
      ...pin,
      _syncStatus: pendingPinIds.has(pin._id) ? 'pending' : 'synced',
    })),
  };
}

export async function loadPinState() {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    return decorateState(storedValue ? JSON.parse(storedValue) : EMPTY_PIN_STATE);
  } catch (_error) {
    return decorateState(EMPTY_PIN_STATE);
  }
}

export async function persistPinState(value) {
  const state = normalizeState(value);
  const serializableState = {
    pins: state.pins.map(({ _syncStatus, ...pin }) => pin),
    queue: state.queue,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
}

export function enqueueCreate(value, fields) {
  const state = normalizeState(value);
  const clientId = makeId('client');
  const localId = makeId('local');
  const timestamp = new Date().toISOString();
  const pin = {
    _id: localId,
    clientId,
    ...fields,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return decorateState({
    pins: [pin, ...state.pins],
    queue: [
      ...state.queue,
      { id: makeId('operation'), type: 'create', localId, payload: toPayload(pin) },
    ],
  });
}

export function enqueueUpdate(value, pinId, fields) {
  const state = normalizeState(value);
  const currentPin = state.pins.find((pin) => pin._id === pinId);
  if (!currentPin) return decorateState(state);

  const updatedPin = { ...currentPin, ...fields, updatedAt: new Date().toISOString() };
  const pendingCreate = state.queue.find(
    (operation) => operation.type === 'create' && operation.localId === pinId,
  );
  let queue;

  if (pendingCreate) {
    queue = state.queue.map((operation) =>
      operation.id === pendingCreate.id
        ? { ...operation, payload: toPayload(updatedPin) }
        : operation,
    );
  } else {
    queue = [
      ...state.queue.filter(
        (operation) => !(operation.type === 'update' && operation.targetId === pinId),
      ),
      {
        id: makeId('operation'),
        type: 'update',
        targetId: pinId,
        payload: toPayload(updatedPin),
      },
    ];
  }

  return decorateState({
    pins: state.pins.map((pin) => (pin._id === pinId ? updatedPin : pin)),
    queue,
  });
}

export function enqueueDelete(value, pinId) {
  const state = normalizeState(value);
  const pendingCreate = state.queue.some(
    (operation) => operation.type === 'create' && operation.localId === pinId,
  );
  const queueWithoutPinOperations = state.queue.filter(
    (operation) => operation.localId !== pinId && operation.targetId !== pinId,
  );

  return decorateState({
    pins: state.pins.filter((pin) => pin._id !== pinId),
    queue: pendingCreate
      ? queueWithoutPinOperations
      : [
          ...queueWithoutPinOperations,
          { id: makeId('operation'), type: 'delete', targetId: pinId },
        ],
  });
}

export function getPendingCount(value) {
  return normalizeState(value).queue.length;
}

export async function synchronizePinState(value) {
  let state = decorateState(value);
  let synchronizedCount = 0;
  let synchronizationError = null;

  for (const snapshotOperation of [...state.queue]) {
    const operation = state.queue.find((item) => item.id === snapshotOperation.id);
    if (!operation) continue;

    try {
      if (operation.type === 'create') {
        const remotePin = await api.createPin(operation.payload);
        state = {
          pins: state.pins.map((pin) => (pin._id === operation.localId ? remotePin : pin)),
          queue: state.queue.filter((item) => item.id !== operation.id),
        };
      } else if (operation.type === 'update') {
        const remotePin = await api.updatePin(operation.targetId, operation.payload);
        state = {
          pins: state.pins.map((pin) => (pin._id === operation.targetId ? remotePin : pin)),
          queue: state.queue.filter((item) => item.id !== operation.id),
        };
      } else if (operation.type === 'delete') {
        try {
          await api.deletePin(operation.targetId);
        } catch (error) {
          if (error.status !== 404) throw error;
        }
        state = {
          pins: state.pins,
          queue: state.queue.filter((item) => item.id !== operation.id),
        };
      }
      synchronizedCount += 1;
      state = decorateState(state);
    } catch (error) {
      synchronizationError = error;
      break;
    }
  }

  if (!synchronizationError) {
    try {
      const remotePins = await api.getPins();
      const pendingIds = new Set(
        state.queue.flatMap((operation) => [operation.localId, operation.targetId].filter(Boolean)),
      );
      const pendingClientIds = new Set(
        state.pins.filter((pin) => pendingIds.has(pin._id)).map((pin) => pin.clientId).filter(Boolean),
      );
      const pendingPins = state.pins.filter((pin) => pendingIds.has(pin._id));
      const freshRemotePins = remotePins.filter(
        (pin) => !pendingIds.has(pin._id) && !pendingClientIds.has(pin.clientId),
      );
      state = decorateState({ pins: [...pendingPins, ...freshRemotePins], queue: state.queue });
    } catch (error) {
      synchronizationError = error;
    }
  }

  return { state: decorateState(state), synchronizedCount, error: synchronizationError };
}
