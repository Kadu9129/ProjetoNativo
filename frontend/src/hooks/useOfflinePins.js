import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_PIN_STATE,
  enqueueCreate,
  enqueueDelete,
  enqueueUpdate,
  getPendingCount,
  loadPinState,
  persistPinState,
  synchronizePinState,
} from '../services/offlinePins';

export default function useOfflinePins() {
  const [pinState, setPinState] = useState(EMPTY_PIN_STATE);
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const stateRef = useRef(EMPTY_PIN_STATE);
  const onlineRef = useRef(false);
  const synchronizingRef = useRef(false);

  const commitState = useCallback(async (nextState) => {
    stateRef.current = nextState;
    setPinState(nextState);
    await persistPinState(nextState);
  }, []);

  const synchronize = useCallback(
    async ({ manual = false } = {}) => {
      if (synchronizingRef.current) return;
      if (!onlineRef.current) {
        setNotice('Sem internet. As alterações continuam salvas neste dispositivo.');
        return;
      }

      synchronizingRef.current = true;
      setSyncing(true);
      setError('');

      try {
        const result = await synchronizePinState(stateRef.current);
        await commitState(result.state);

        if (result.error) {
          setError('Não foi possível sincronizar agora. Os dados locais estão preservados.');
          return;
        }

        setLastSyncAt(new Date());
        if (result.synchronizedCount > 0) {
          setNotice(`${result.synchronizedCount} alteração(ões) sincronizada(s).`);
        } else if (manual) {
          setNotice('Dados atualizados. Nenhuma alteração pendente.');
        }
      } catch (_error) {
        setError('Falha ao salvar ou sincronizar. Tente novamente.');
      } finally {
        synchronizingRef.current = false;
        setSyncing(false);
      }
    },
    [commitState],
  );

  useEffect(() => {
    let active = true;
    loadPinState().then((storedState) => {
      if (!active) return;
      stateRef.current = storedState;
      setPinState(storedState);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const connected =
        networkState.isConnected === true && networkState.isInternetReachable !== false;
      onlineRef.current = connected;
      setIsOnline(connected);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isOnline) {
      synchronize();
    } else if (isOnline === false) {
      setNotice('Modo offline ativo. Você pode continuar alterando seus lugares.');
    }
  }, [isOnline, ready, synchronize]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const createPin = useCallback(
    async (fields) => {
      const nextState = enqueueCreate(stateRef.current, fields);
      await commitState(nextState);
      setNotice(
        onlineRef.current
          ? 'Lugar salvo no dispositivo. Sincronizando…'
          : 'Lugar salvo no dispositivo e aguardando conexão.',
      );
      if (onlineRef.current) synchronize();
      return nextState.pins[0];
    },
    [commitState, synchronize],
  );

  const updatePin = useCallback(
    async (pinId, fields) => {
      const nextState = enqueueUpdate(stateRef.current, pinId, fields);
      await commitState(nextState);
      setNotice(
        onlineRef.current
          ? 'Alteração salva no dispositivo. Sincronizando…'
          : 'Alteração salva no dispositivo e aguardando conexão.',
      );
      if (onlineRef.current) synchronize();
    },
    [commitState, synchronize],
  );

  const deletePin = useCallback(
    async (pinId) => {
      const nextState = enqueueDelete(stateRef.current, pinId);
      await commitState(nextState);
      setNotice(
        onlineRef.current
          ? 'Lugar removido do dispositivo. Sincronizando…'
          : 'Exclusão salva e aguardando conexão.',
      );
      if (onlineRef.current) synchronize();
    },
    [commitState, synchronize],
  );

  return {
    pins: pinState.pins,
    pendingCount: getPendingCount(pinState),
    ready,
    isOnline,
    syncing,
    error,
    notice,
    lastSyncAt,
    createPin,
    updatePin,
    deletePin,
    synchronize: () => synchronize({ manual: true }),
  };
}
