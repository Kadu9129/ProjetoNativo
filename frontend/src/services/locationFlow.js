const LOCATION_TIMEOUT_MS = 15000;

function permissionFailure(permission) {
  if (permission.canAskAgain === false) {
    return {
      status: 'blocked',
      message: 'Localização bloqueada. Ative a permissão nas configurações para tentar novamente. Você ainda pode explorar o mapa.',
    };
  }
  return {
    status: 'denied',
    message: 'Localização não permitida. Você ainda pode explorar o mapa e salvar um ponto manualmente.',
  };
}

// O provedor é recebido para testar as alternativas sem depender de um GPS real.
async function locateUser(provider, { timeoutMs = LOCATION_TIMEOUT_MS } = {}) {
  let timeout;
  try {
    let permission = await provider.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      if (permission.canAskAgain === false) return permissionFailure(permission);
      permission = await provider.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return permissionFailure(permission);
    }

    if (!(await provider.hasServicesEnabledAsync())) {
      return {
        status: 'disabled',
        message: 'A localização do dispositivo está desligada. Ative o GPS e tente novamente, ou escolha um ponto no mapa.',
      };
    }

    const position = await Promise.race([
      provider.getCurrentPositionAsync({ accuracy: provider.Accuracy.Balanced }),
      new Promise((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    if (!position) {
      return {
        status: 'timeout',
        message: 'A localização demorou para responder. Tente novamente ou escolha um ponto no mapa.',
      };
    }

    const { latitude, longitude } = position.coords;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('Coordenadas inválidas.');
    }
    return { status: 'located', coordinate: { latitude, longitude } };
  } catch (_error) {
    return {
      status: 'unavailable',
      message: 'Localização indisponível. Tente novamente ou escolha um ponto no mapa.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { LOCATION_TIMEOUT_MS, locateUser };
