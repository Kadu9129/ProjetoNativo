import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_REGION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

const HAS_ANDROID_MAP_KEY = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());

function LocalCoordinateMap({ location, pins, onMapPress, onEditPin }) {
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
        <Text style={[styles.localMapTitle, { color: colors.text }]}>Mapa externo não configurado</Text>
        <Text style={[styles.localMapDescription, { color: colors.textMuted }]}>Os lugares continuam disponíveis. Toque na grade para salvar coordenadas locais.</Text>
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

export default function PlatformMap({
  location,
  pins,
  onMapPress,
  onEditPin,
  onExternalMapStatusChange,
  reloadToken,
}) {
  const mapRef = useRef(null);
  const { theme, colors } = useTheme();

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    }
  }, [location]);

  useEffect(() => {
    onExternalMapStatusChange(
      Platform.OS === 'android' && !HAS_ANDROID_MAP_KEY ? 'unavailable' : 'loading',
    );
  }, [onExternalMapStatusChange, reloadToken]);

  if (Platform.OS === 'android' && !HAS_ANDROID_MAP_KEY) {
    return (
      <LocalCoordinateMap
        location={location}
        onEditPin={onEditPin}
        onMapPress={onMapPress}
        pins={pins}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={location ? { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 } : DEFAULT_REGION}
        key={`map-${reloadToken}`}
        mapType="standard"
        onMapLoaded={() => onExternalMapStatusChange('available')}
        onPress={(event) => onMapPress(event.nativeEvent.coordinate)}
        ref={mapRef}
        rotateEnabled={false}
        showsCompass
        style={styles.map}
      >
        {location ? (
          <Marker coordinate={location} pinColor="#2676ff" title="Você está aqui" />
        ) : null}

        {pins.map((pin) => (
          <Marker
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            key={pin._id}
            onPress={() => onEditPin(pin)}
            pinColor={colors.primary}
            stopPropagation
            title={pin.name}
          />
        ))}
      </MapView>
      {theme === 'dark' ? <View pointerEvents="none" style={styles.darkOverlay} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 13, 35, 0.22)',
  },
});
