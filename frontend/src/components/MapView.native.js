import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, CalloutSubview, Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_REGION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

export default function PlatformMap({ location, pins, onMapPress, onDeletePin }) {
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

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={location ? { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 } : DEFAULT_REGION}
        mapType="standard"
        onPress={(event) => onMapPress(event.nativeEvent.coordinate)}
        ref={mapRef}
        rotateEnabled={false}
        showsCompass
        style={styles.map}
      >
        {location ? (
          <Marker coordinate={location} pinColor="#2676ff" title="You are here" />
        ) : null}

        {pins.map((pin) => (
          <Marker
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            key={pin._id}
            pinColor={colors.primary}
          >
            <Callout tooltip>
              <View style={[styles.callout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.calloutTitle, { color: colors.text }]}>{pin.name}</Text>
                <Text style={[styles.calloutDescription, { color: colors.textMuted }]}>{pin.description}</Text>
                <CalloutSubview onPress={() => onDeletePin(pin._id)}>
                  <Pressable accessibilityLabel={`Delete ${pin.name}`} accessibilityRole="button">
                    <Text style={[styles.deleteText, { color: colors.danger }]}>Delete pin</Text>
                  </Pressable>
                </CalloutSubview>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {theme === 'dark' ? <View pointerEvents="none" style={styles.darkOverlay} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 13, 35, 0.22)',
  },
  callout: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 190,
    padding: 13,
  },
  calloutTitle: { fontSize: 16, fontWeight: '700' },
  calloutDescription: { fontSize: 14, marginBottom: 11, marginTop: 5, maxWidth: 240 },
  deleteText: { fontSize: 13, fontWeight: '700', paddingVertical: 3 },
});
