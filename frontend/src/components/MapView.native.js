import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_REGION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

const MAP_LOAD_TIMEOUT_MS = 12000;

function LocalCoordinateMap({
  description = 'Os lugares continuam disponíveis. Toque na grade para salvar coordenadas locais.',
  location,
  pins,
  onMapPress,
  onEditPin,
  title = 'Mapa externo indisponível',
}) {
  const { colors } = useTheme();
  const [layout, setLayout] = useState({ height: 0, width: 0 });
  const region = useMemo(
    () => ({
      latitude: location?.latitude ?? DEFAULT_REGION.latitude,
      longitude: location?.longitude ?? DEFAULT_REGION.longitude,
      latitudeDelta: location ? 0.08 : DEFAULT_REGION.latitudeDelta,
      longitudeDelta: location ? 0.08 : DEFAULT_REGION.longitudeDelta,
    }),
    [location],
  );

  function coordinateFromTouch(event) {
    if (!layout.width || !layout.height) return;
    const { locationX, locationY } = event.nativeEvent;
    onMapPress({
      latitude: region.latitude + (0.5 - locationY / layout.height) * region.latitudeDelta,
      longitude: region.longitude + (locationX / layout.width - 0.5) * region.longitudeDelta,
    });
  }

  function markerPosition(pin) {
    const left = ((pin.longitude - region.longitude) / region.longitudeDelta + 0.5) * layout.width;
    const top = (0.5 - (pin.latitude - region.latitude) / region.latitudeDelta) * layout.height;
    if (left < 0 || left > layout.width || top < 0 || top > layout.height) return null;
    return { left, top };
  }

  return (
    <Pressable
      accessibilityHint="Cria um lugar nas coordenadas selecionadas"
      accessibilityLabel="Área local de coordenadas"
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
      onPress={coordinateFromTouch}
      style={[styles.localMap, { backgroundColor: colors.background }]}
    >
      {[20, 40, 60, 80].map((position) => (
        <React.Fragment key={position}>
          <View pointerEvents="none" style={[styles.gridVertical, { backgroundColor: colors.border, left: `${position}%` }]} />
          <View pointerEvents="none" style={[styles.gridHorizontal, { backgroundColor: colors.border, top: `${position}%` }]} />
        </React.Fragment>
      ))}

      <View pointerEvents="none" style={[styles.localMapMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.localMapSymbol, { borderColor: colors.warning }]}>
          <View style={[styles.localMapSymbolCenter, { backgroundColor: colors.warning }]} />
        </View>
        <Text style={[styles.localMapTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.localMapDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>

      {location && layout.width ? (
        <View pointerEvents="none" style={[styles.localLocation, { backgroundColor: colors.info, left: layout.width / 2 - 8, top: layout.height / 2 - 8 }]} />
      ) : null}

      {layout.width
        ? pins.map((pin) => {
            const position = markerPosition(pin);
            if (!position) return null;
            return (
              <Pressable
                accessibilityLabel={`Editar ${pin.name}`}
                key={pin._id}
                onPress={(event) => {
                  event.stopPropagation();
                  onEditPin(pin);
                }}
                style={[styles.localMarkerHitArea, { left: position.left - 22, top: position.top - 40 }]}
              >
                <View style={[styles.localMarker, { backgroundColor: colors.primary }]}>
                  <View style={styles.localMarkerCenter} />
                </View>
                <Text numberOfLines={1} style={[styles.localMarkerLabel, { backgroundColor: colors.surface, color: colors.text }]}>{pin.name}</Text>
              </Pressable>
            );
          })
        : null}
    </Pressable>
  );
}

function serializeForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildOpenStreetMapHtml({ colors, location, pins, theme }) {
  const center = location ?? pins[0] ?? DEFAULT_REGION;
  const zoom = location ? 14 : pins.length ? 12 : 2;
  const config = serializeForHtml({
    center: [center.latitude, center.longitude],
    location,
    pins,
    primary: colors.primary,
    theme,
    zoom,
  });

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
    <style>
      * { box-sizing: border-box; }
      html, body, #map { height: 100%; margin: 0; overflow: hidden; width: 100%; }
      body { background: ${colors.background}; font-family: system-ui, sans-serif; }
      #map { position: relative; touch-action: none; }
      #tiles, #markers { inset: 0; overflow: hidden; position: absolute; }
      .tile { height: 256px; position: absolute; user-select: none; width: 256px; }
      .dark-tile { filter: brightness(.72) contrast(1.18) saturate(.65); }
      .marker-wrap { align-items: center; display: flex; flex-direction: column; position: absolute; transform: translate(-50%, -100%); }
      .mappin-pin {
        background: ${colors.primary};
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        box-shadow: 0 2px 7px rgba(0,0,0,.35);
        height: 22px;
        transform: rotate(-45deg);
        width: 22px;
      }
      .mappin-pin::after {
        background: #fff;
        border-radius: 50%;
        content: "";
        height: 6px;
        left: 5px;
        position: absolute;
        top: 5px;
        width: 6px;
      }
      .marker-label {
        background: ${colors.surface};
        border-radius: 7px;
        box-shadow: 0 2px 5px rgba(0,0,0,.2);
        color: ${colors.text};
        font-size: 10px;
        font-weight: 700;
        margin-top: 5px;
        max-width: 120px;
        overflow: hidden;
        padding: 3px 7px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mappin-location {
        background: #2676ff;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 5px rgba(38,118,255,.24);
        height: 14px;
        width: 14px;
      }
      .location-wrap { position: absolute; transform: translate(-50%, -50%); }
      .zoom-controls {
        background: ${colors.surface};
        border: 1px solid ${colors.border};
        border-radius: 10px;
        box-shadow: 0 2px 7px rgba(0,0,0,.2);
        left: 10px;
        overflow: hidden;
        position: absolute;
        top: 190px;
      }
      .zoom-button {
        align-items: center;
        background: ${colors.surface};
        border: 0;
        color: ${colors.text};
        display: flex;
        font-size: 24px;
        height: 40px;
        justify-content: center;
        width: 40px;
      }
      .zoom-button + .zoom-button { border-top: 1px solid ${colors.border}; }
      .attribution {
        background: rgba(255,255,255,.88);
        bottom: 0;
        color: #25324a;
        font-size: 10px;
        padding: 3px 5px;
        position: absolute;
        right: 0;
      }
      .attribution a { color: #2056a8; }
    </style>
  </head>
  <body>
    <div id="map">
      <div id="tiles"></div>
      <div id="markers"></div>
      <div class="zoom-controls">
        <button class="zoom-button" id="zoom-in" aria-label="Aumentar zoom">+</button>
        <button class="zoom-button" id="zoom-out" aria-label="Diminuir zoom">−</button>
      </div>
      <div class="attribution">&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</div>
    </div>
    <script>
      const send = (payload) => window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      (() => {
        const config = ${config};
        const map = document.getElementById('map');
        const tilePane = document.getElementById('tiles');
        const markerPane = document.getElementById('markers');
        const tileSize = 256;
        let center = { latitude: config.center[0], longitude: config.center[1] };
        let zoom = config.zoom;
        let ready = false;
        let generation = 0;
        let drag = null;
        let frame = null;

        function clampLatitude(latitude) {
          return Math.max(-85.05112878, Math.min(85.05112878, latitude));
        }

        function project(latitude, longitude, atZoom = zoom) {
          const scale = tileSize * Math.pow(2, atZoom);
          const lat = clampLatitude(latitude) * Math.PI / 180;
          return {
            x: (longitude + 180) / 360 * scale,
            y: (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * scale,
          };
        }

        function unproject(x, y, atZoom = zoom) {
          const scale = tileSize * Math.pow(2, atZoom);
          const longitude = x / scale * 360 - 180;
          const n = Math.PI - 2 * Math.PI * y / scale;
          return {
            latitude: 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
            longitude: ((longitude + 540) % 360) - 180,
          };
        }

        function addPin(pin, topLeft) {
          const point = project(pin.latitude, pin.longitude);
          const marker = document.createElement('button');
          marker.className = 'marker-wrap';
          marker.style.background = 'transparent';
          marker.style.border = '0';
          marker.style.left = (point.x - topLeft.x) + 'px';
          marker.style.padding = '0';
          marker.style.top = (point.y - topLeft.y) + 'px';
          marker.innerHTML = '<span class="mappin-pin"></span>';
          const label = document.createElement('span');
          label.className = 'marker-label';
          label.textContent = pin.name;
          marker.appendChild(label);
          marker.addEventListener('pointerdown', (event) => event.stopPropagation());
          marker.addEventListener('click', (event) => {
            event.stopPropagation();
            send({ type: 'edit', id: pin._id });
          });
          markerPane.appendChild(marker);
        }

        function addLocation(topLeft) {
          if (!config.location) return;
          const point = project(config.location.latitude, config.location.longitude);
          const marker = document.createElement('div');
          marker.className = 'location-wrap';
          marker.style.left = (point.x - topLeft.x) + 'px';
          marker.style.top = (point.y - topLeft.y) + 'px';
          marker.innerHTML = '<div class="mappin-location"></div>';
          markerPane.appendChild(marker);
        }

        function render() {
          frame = null;
          const currentGeneration = ++generation;
          const width = map.clientWidth;
          const height = map.clientHeight;
          const worldCenter = project(center.latitude, center.longitude);
          const topLeft = { x: worldCenter.x - width / 2, y: worldCenter.y - height / 2 };
          const tileCount = Math.pow(2, zoom);
          const startX = Math.floor(topLeft.x / tileSize);
          const endX = Math.floor((topLeft.x + width) / tileSize);
          const startY = Math.max(0, Math.floor(topLeft.y / tileSize));
          const endY = Math.min(tileCount - 1, Math.floor((topLeft.y + height) / tileSize));
          let pending = 0;
          let failures = 0;

          tilePane.innerHTML = '';
          markerPane.innerHTML = '';
          if (!ready) send({ type: 'loading' });

          function finishTile(success) {
            if (currentGeneration !== generation) return;
            pending -= 1;
            if (success && !ready) {
              ready = true;
              send({ type: 'ready' });
            }
            if (!success) failures += 1;
            if (!pending && failures > 0 && !ready) send({ type: 'unavailable' });
          }

          for (let x = startX; x <= endX; x += 1) {
            const wrappedX = ((x % tileCount) + tileCount) % tileCount;
            for (let y = startY; y <= endY; y += 1) {
              pending += 1;
              const tile = document.createElement('img');
              tile.alt = '';
              tile.className = 'tile' + (config.theme === 'dark' ? ' dark-tile' : '');
              tile.draggable = false;
              tile.onload = () => finishTile(true);
              tile.onerror = () => finishTile(false);
              tile.style.left = (x * tileSize - topLeft.x) + 'px';
              tile.style.top = (y * tileSize - topLeft.y) + 'px';
              tile.src = 'https://tile.openstreetmap.org/' + zoom + '/' + wrappedX + '/' + y + '.png';
              tilePane.appendChild(tile);
            }
          }

          addLocation(topLeft);
          config.pins.forEach((pin) => addPin(pin, topLeft));
        }

        function scheduleRender() {
          if (!frame) frame = requestAnimationFrame(render);
        }

        function setZoom(nextZoom) {
          zoom = Math.max(2, Math.min(19, nextZoom));
          scheduleRender();
        }

        map.addEventListener('pointerdown', (event) => {
          if (event.target.closest('.zoom-controls, .attribution, .marker-wrap')) return;
          const point = project(center.latitude, center.longitude);
          drag = { moved: false, startX: event.clientX, startY: event.clientY, worldX: point.x, worldY: point.y };
          map.setPointerCapture(event.pointerId);
        });

        map.addEventListener('pointermove', (event) => {
          if (!drag) return;
          const dx = event.clientX - drag.startX;
          const dy = event.clientY - drag.startY;
          if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
          center = unproject(drag.worldX - dx, drag.worldY - dy);
          scheduleRender();
        });

        map.addEventListener('pointerup', (event) => {
          if (!drag) return;
          const wasMoved = drag.moved;
          drag = null;
          if (!wasMoved) {
            const rect = map.getBoundingClientRect();
            const centerPoint = project(center.latitude, center.longitude);
            const coordinate = unproject(
              centerPoint.x + event.clientX - rect.left - rect.width / 2,
              centerPoint.y + event.clientY - rect.top - rect.height / 2,
            );
            send({ type: 'press', latitude: coordinate.latitude, longitude: coordinate.longitude });
          }
        });

        map.addEventListener('pointercancel', () => { drag = null; });
        document.getElementById('zoom-in').addEventListener('click', (event) => {
          event.stopPropagation();
          setZoom(zoom + 1);
        });
        document.getElementById('zoom-out').addEventListener('click', (event) => {
          event.stopPropagation();
          setZoom(zoom - 1);
        });
        window.addEventListener('resize', scheduleRender);
        render();
      })();
    </script>
  </body>
</html>`;
}

export default function PlatformMap({
  location,
  pins,
  onMapPress,
  onEditPin,
  onExternalMapStatusChange,
  reloadToken,
}) {
  const { theme, colors } = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const loadTimeoutRef = useRef(null);
  const pinVersion = pins.map((pin) => `${pin._id}:${pin.updatedAt ?? ''}`).join('|');
  const documentKey = `${reloadToken}:${theme}:${location?.latitude ?? ''}:${location?.longitude ?? ''}:${pinVersion}`;
  const mapHtml = useMemo(
    () => buildOpenStreetMapHtml({ colors, location, pins, theme }),
    [colors, location, pins, theme],
  );

  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setMapReady(false);
    setMapUnavailable(false);
    onExternalMapStatusChange('loading');

    loadTimeoutRef.current = setTimeout(() => {
      setMapUnavailable(true);
      onExternalMapStatusChange('unavailable');
    }, MAP_LOAD_TIMEOUT_MS);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    };
  }, [documentKey, onExternalMapStatusChange]);

  function clearLoadTimeout() {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = null;
  }

  function handleMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'ready') {
        clearLoadTimeout();
        setMapReady(true);
        setMapUnavailable(false);
        onExternalMapStatusChange('available');
        return;
      }

      if (message.type === 'loading') {
        onExternalMapStatusChange('loading');
        return;
      }

      if (message.type === 'unavailable') {
        clearLoadTimeout();
        setMapUnavailable(true);
        onExternalMapStatusChange('unavailable');
        return;
      }

      if (message.type === 'press') {
        onMapPress({ latitude: message.latitude, longitude: message.longitude });
        return;
      }

      if (message.type === 'edit') {
        const selectedPin = pins.find((pin) => pin._id === message.id);
        if (selectedPin) onEditPin(selectedPin);
      }
    } catch (_error) {
      clearLoadTimeout();
      setMapUnavailable(true);
      onExternalMapStatusChange('unavailable');
    }
  }

  function handleWebViewError() {
    clearLoadTimeout();
    setMapUnavailable(true);
    onExternalMapStatusChange('unavailable');
  }

  return (
    <View style={styles.container}>
      <WebView
        applicationNameForUserAgent="MapPin/1.0 (com.mappin.app)"
        cacheEnabled
        cacheMode="LOAD_DEFAULT"
        domStorageEnabled
        javaScriptEnabled
        key={documentKey}
        mixedContentMode="never"
        onError={handleWebViewError}
        onMessage={handleMessage}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        source={{ html: mapHtml, baseUrl: 'https://www.openstreetmap.org/' }}
        style={[styles.webMap, { backgroundColor: colors.background }]}
      />

      {!mapReady ? (
        <View style={StyleSheet.absoluteFill}>
          <LocalCoordinateMap
            description={
              mapUnavailable
                ? 'Seus lugares continuam disponíveis. Toque na grade para usar coordenadas locais.'
                : 'Você já pode usar seus lugares enquanto o mapa gratuito carrega.'
            }
            location={location}
            onEditPin={onEditPin}
            onMapPress={onMapPress}
            pins={pins}
            title={mapUnavailable ? 'OpenStreetMap indisponível' : 'Carregando OpenStreetMap…'}
          />
          {!mapUnavailable ? (
            <View pointerEvents="none" style={[styles.loadingPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.info} size="small" />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Mapa gratuito, sem chave de API</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webMap: { flex: 1 },
  localMap: { flex: 1, overflow: 'hidden' },
  gridVertical: { bottom: 0, opacity: 0.55, position: 'absolute', top: 0, width: 1 },
  gridHorizontal: { height: 1, left: 0, opacity: 0.55, position: 'absolute', right: 0 },
  localMapMessage: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 300,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'absolute',
    top: '42%',
  },
  localMapSymbol: { alignItems: 'center', borderRadius: 16, borderWidth: 2, height: 32, justifyContent: 'center', width: 32 },
  localMapSymbolCenter: { borderRadius: 4, height: 8, width: 8 },
  localMapTitle: { fontSize: 15, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  localMapDescription: { fontSize: 12, lineHeight: 17, marginTop: 5, textAlign: 'center' },
  localLocation: { borderColor: '#ffffff', borderRadius: 10, borderWidth: 3, height: 18, position: 'absolute', width: 18 },
  localMarkerHitArea: { alignItems: 'center', minHeight: 58, position: 'absolute', width: 100 },
  localMarker: { borderColor: '#ffffff', borderRadius: 12, borderWidth: 3, height: 24, transform: [{ rotate: '45deg' }], width: 24 },
  localMarkerCenter: { alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: 3, height: 6, marginTop: 6, width: 6 },
  localMarkerLabel: { borderRadius: 7, elevation: 2, fontSize: 10, fontWeight: '700', marginTop: 5, maxWidth: 96, paddingHorizontal: 7, paddingVertical: 3 },
  loadingPill: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    bottom: 132,
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 9,
    position: 'absolute',
  },
  loadingText: { fontSize: 11, fontWeight: '600', marginLeft: 8 },
});
