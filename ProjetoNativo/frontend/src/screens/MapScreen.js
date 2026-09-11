import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlatformMap from '../components/MapView';
import PinFormModal from '../components/PinFormModal';
import ThemeToggleButton from '../components/ThemeToggleButton';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function MapScreen() {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('Finding your location…');
  const [pins, setPins] = useState([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [pendingCoordinate, setPendingCoordinate] = useState(null);

  const loadPins = useCallback(async () => {
    try {
      setPinsLoading(true);
      setApiError('');
      const existingPins = await api.getPins();
      setPins(existingPins);
    } catch (error) {
      setApiError(error.message || 'Unable to load pins.');
    } finally {
      setPinsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (permission.status !== 'granted') {
          setLocationMessage('Location permission denied. You can still explore the map.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationMessage('');
      } catch (_error) {
        if (active) setLocationMessage('Your location is unavailable. You can still explore the map.');
      }
    }

    loadLocation();
    loadPins();
    return () => {
      active = false;
    };
  }, [loadPins]);

  const createPin = useCallback(async (values) => {
    const createdPin = await api.createPin(values);
    setPins((current) => [createdPin, ...current]);
    setPendingCoordinate(null);
  }, []);

  const deletePin = useCallback(async (id) => {
    try {
      setApiError('');
      await api.deletePin(id);
      setPins((current) => current.filter((pin) => pin._id !== id));
    } catch (error) {
      setApiError(error.message || 'Unable to delete the pin.');
    }
  }, []);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <PlatformMap
          location={location}
          onDeletePin={deletePin}
          onMapPress={setPendingCoordinate}
          pins={pins}
        />

        <View pointerEvents="box-none" style={styles.topBar}>
          <View style={[styles.brand, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]} />
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>MapPin</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>Tap the map to save a place</Text>
            </View>
          </View>
          <ThemeToggleButton />
        </View>

        {locationMessage ? (
          <View style={[styles.message, styles.locationMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.textMuted }]}>{locationMessage}</Text>
          </View>
        ) : null}

        {apiError ? (
          <View style={[styles.message, styles.apiMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.danger }]}>{apiError}</Text>
            <Pressable accessibilityRole="button" onPress={loadPins}>
              <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {pinsLoading ? (
          <View style={[styles.loadingBadge, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading pins</Text>
          </View>
        ) : null}
      </View>

      <PinFormModal
        coordinate={pendingCoordinate}
        onCancel={() => setPendingCoordinate(null)}
        onSubmit={createPin}
        visible={Boolean(pendingCoordinate)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapContainer: { flex: 1, overflow: 'hidden' },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 14,
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 1100,
  },
  brand: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    maxWidth: 270,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  brandMark: { borderRadius: 10, height: 20, marginRight: 9, transform: [{ rotate: '45deg' }], width: 20 },
  brandTitle: { fontSize: 17, fontWeight: '800', lineHeight: 19 },
  brandSubtitle: { fontSize: 11, marginTop: 2 },
  message: {
    borderRadius: 12,
    borderWidth: 1,
    left: 14,
    maxWidth: 430,
    paddingHorizontal: 13,
    paddingVertical: 10,
    position: 'absolute',
    right: 14,
    zIndex: 1100,
  },
  locationMessage: { bottom: 18 },
  apiMessage: { bottom: 74, flexDirection: 'row', justifyContent: 'space-between' },
  messageText: { flex: 1, fontSize: 13 },
  retry: { fontSize: 13, fontWeight: '700', marginLeft: 14 },
  loadingBadge: {
    alignItems: 'center',
    borderRadius: 18,
    bottom: 18,
    flexDirection: 'row',
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    zIndex: 1100,
  },
  loadingText: { fontSize: 12, marginLeft: 7 },
});
