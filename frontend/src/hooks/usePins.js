import { useCallback, useEffect, useState } from 'react';
import {
  createPin as insertPin,
  deletePin as removePin,
  getDatabase,
  listPins,
  updatePin as savePin,
} from '../services/pinDatabase';

export default function usePins() {
  const [pins, setPins] = useState([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const storedPins = await listPins();
    setPins(storedPins);
    return storedPins;
  }, []);

  useEffect(() => {
    let active = true;
    getDatabase()
      .then(() => listPins())
      .then((storedPins) => {
        if (active) setPins(storedPins);
      })
      .catch(() => {
        if (active) setError('Não foi possível abrir o banco de dados local.');
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const runMutation = useCallback(async (operation, successMessage) => {
    setSaving(true);
    setError('');
    try {
      const result = await operation();
      const storedPins = await listPins();
      setPins(storedPins);
      setNotice(successMessage);
      return result;
    } catch (mutationError) {
      setError(mutationError.message || 'Não foi possível alterar o banco de dados local.');
      throw mutationError;
    } finally {
      setSaving(false);
    }
  }, []);

  const createPin = useCallback(
    (fields) => runMutation(() => insertPin(fields), 'Lugar salvo neste dispositivo.'),
    [runMutation],
  );

  const updatePin = useCallback(
    (id, fields) => runMutation(() => savePin(id, fields), 'Alterações salvas neste dispositivo.'),
    [runMutation],
  );

  const deletePin = useCallback(
    (id) => runMutation(() => removePin(id), 'Lugar excluído deste dispositivo.'),
    [runMutation],
  );

  const retry = useCallback(async () => {
    setError('');
    setSaving(true);
    try {
      await refresh();
    } catch (_error) {
      setError('Não foi possível ler o banco de dados local.');
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { pins, ready, saving, error, notice, createPin, updatePin, deletePin, retry };
}
