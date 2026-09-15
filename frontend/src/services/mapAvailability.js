const VALID_MAP_STATES = new Set(['loading', 'available', 'unavailable']);

function hasInternetConnection(networkState) {
  return networkState?.isConnected === true && networkState.isInternetReachable !== false;
}

function shouldReloadExternalMap(previousConnection, currentConnection) {
  return previousConnection === false && currentConnection === true;
}

function getMapStatusPresentation(isOnline, mapState) {
  const unavailable = isOnline === false || mapState === 'unavailable';
  const label = unavailable
    ? isOnline === false
      ? 'Sem internet • mapa externo indisponível'
      : 'Mapa externo indisponível • dados locais preservados'
    : mapState === 'loading'
      ? 'Carregando mapa externo…'
      : 'Mapa externo disponível';

  return { label, unavailable };
}

module.exports = {
  VALID_MAP_STATES,
  getMapStatusPresentation,
  hasInternetConnection,
  shouldReloadExternalMap,
};
