import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

const {
  VALID_MAP_STATES,
  getMapStatusPresentation,
  hasInternetConnection,
  shouldReloadExternalMap,
} = require('../services/mapAvailability');

export default function useExternalMapStatus() {
  const [isOnline, setIsOnline] = useState(null);
  const [mapState, setMapState] = useState('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const onlineRef = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const connected = hasInternetConnection(networkState);
      const previousValue = onlineRef.current;

      onlineRef.current = connected;
      setIsOnline(connected);

      if (!connected) {
        setMapState('unavailable');
      } else if (shouldReloadExternalMap(previousValue, connected)) {
        // Recarrega somente o provedor visual do mapa; o SQLite não é alterado.
        setMapState('loading');
        setReloadToken((current) => current + 1);
      }
    });

    return unsubscribe;
  }, []);

  const reportMapState = useCallback((nextState) => {
    if (!VALID_MAP_STATES.has(nextState)) return;
    if (onlineRef.current === false && nextState !== 'unavailable') return;
    setMapState(nextState);
  }, []);

  const { label, unavailable } = getMapStatusPresentation(isOnline, mapState);

  return {
    isOnline,
    mapState,
    reloadToken,
    reportMapState,
    unavailable,
    label,
  };
}
