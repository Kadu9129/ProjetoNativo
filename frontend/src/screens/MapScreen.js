import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlatformMap from '../components/MapView';
import PinFormModal from '../components/PinFormModal';
import ThemeToggleButton from '../components/ThemeToggleButton';
import { useTheme } from '../context/ThemeContext';
import useExternalMapStatus from '../hooks/useExternalMapStatus';
import usePins from '../hooks/usePins';

export default function MapScreen() {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('Buscando sua localização…');
  const [pendingCoordinate, setPendingCoordinate] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const {
    label: mapStatusLabel,
    mapState,
    reloadToken: mapReloadToken,
    reportMapState,
    unavailable: mapUnavailable,
  } = useExternalMapStatus();
  const {
    pins,
    ready,
    saving,
    error: databaseError,
    notice,
    createPin,
    updatePin,
    deletePin,
    retry,
  } = usePins();

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (permission.status !== 'granted') {
          setLocationMessage('Localização não permitida. Você ainda pode explorar o mapa.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!active) return;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage('');
      } catch (_error) {
        if (active) {
          setLocationMessage('Localização indisponível. Você ainda pode explorar o mapa.');
        }
      }
    }

    loadLocation();
    return () => {
      active = false;
    };
  }, []);

  const handleMapPress = useCallback((coordinate) => {
    setEditingPin(null);
    setPendingCoordinate(coordinate);
  }, []);

  const handleSubmit = useCallback(
    async (values) => {
      if (editingPin) {
        await updatePin(editingPin._id, values);
        setEditingPin(null);
      } else {
        await createPin(values);
        setPendingCoordinate(null);
      }
    },
    [createPin, editingPin, updatePin],
  );

  const requestDeletePin = useCallback(
    (pin) => {
      const performDelete = () => deletePin(pin._id).catch(() => {});
      const message = `O lugar “${pin.name}” será removido deste dispositivo.`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.confirm(message)) performDelete();
        return;
      }

      Alert.alert('Excluir lugar?', message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete },
      ]);
    },
    [deletePin],
  );

  const storageLabel = saving
    ? 'Salvando no banco local…'
    : `Banco local • ${pins.length} ${pins.length === 1 ? 'lugar' : 'lugares'}`;
  const modalCoordinate = editingPin
    ? { latitude: editingPin.latitude, longitude: editingPin.longitude }
    : pendingCoordinate;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <PlatformMap
          location={location}
          onExternalMapStatusChange={reportMapState}
          onDeletePin={requestDeletePin}
          onEditPin={setEditingPin}
          onMapPress={handleMapPress}
          pins={pins}
          reloadToken={mapReloadToken}
        />

        <View pointerEvents="box-none" style={styles.topBar}>
          <View style={[styles.brand, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]} />
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>MapPin</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                Toque no mapa para salvar um lugar
              </Text>
            </View>
          </View>
          <ThemeToggleButton />
        </View>

        <View
          accessibilityLabel={storageLabel}
          style={[
            styles.storageBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.info} size="small" />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: colors.info }]} />
          )}
          <Text style={[styles.storageText, { color: colors.text }]}>{storageLabel}</Text>
        </View>

        <View
          accessibilityLabel={mapStatusLabel}
          style={[
            styles.mapStatusBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {mapState === 'loading' && !mapUnavailable ? (
            <ActivityIndicator color={colors.info} size="small" />
          ) : (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: mapUnavailable ? colors.warning : colors.info },
              ]}
            />
          )}
          <View style={styles.mapStatusContent}>
            <Text style={[styles.mapStatusText, { color: colors.text }]}>{mapStatusLabel}</Text>
            {mapUnavailable ? (
              <Text style={[styles.mapStatusHint, { color: colors.textMuted }]}>
                Os marcadores e o CRUD continuam funcionando no SQLite local.
              </Text>
            ) : null}
          </View>
        </View>

        {locationMessage ? (
          <View
            style={[
              styles.message,
              styles.locationMessage,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.textMuted }]}>{locationMessage}</Text>
          </View>
        ) : null}

        {databaseError ? (
          <View
            style={[
              styles.message,
              styles.databaseMessage,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.danger }]}>{databaseError}</Text>
            <Pressable accessibilityRole="button" onPress={retry}>
              <Text style={[styles.retry, { color: colors.primary }]}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {notice ? (
          <View
            style={[
              styles.message,
              styles.noticeMessage,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.textMuted }]}>{notice}</Text>
          </View>
        ) : null}

        {!ready ? (
          <View style={[styles.loadingBadge, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Carregando dados locais
            </Text>
          </View>
        ) : null}
      </View>

      <PinFormModal
        coordinate={modalCoordinate}
        onCancel={() => {
          setPendingCoordinate(null);
          setEditingPin(null);
        }}
        onSubmit={handleSubmit}
        pin={editingPin}
        visible={Boolean(modalCoordinate)}
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
    maxWidth: 290,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  brandMark: {
    borderRadius: 10,
    height: 20,
    marginRight: 9,
    transform: [{ rotate: '45deg' }],
    width: 20,
  },
  brandTitle: { fontSize: 17, fontWeight: '800', lineHeight: 19 },
  brandSubtitle: { fontSize: 11, marginTop: 2 },
  storageBadge: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    left: 14,
    minHeight: 36,
    paddingHorizontal: 12,
    position: 'absolute',
    top: 82,
    zIndex: 1100,
  },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  storageText: { fontSize: 12, fontWeight: '700', marginLeft: 7 },
  mapStatusBadge: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    left: 14,
    maxWidth: 360,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 14,
    top: 126,
    zIndex: 1100,
  },
  mapStatusContent: { flex: 1, marginLeft: 7 },
  mapStatusText: { fontSize: 12, fontWeight: '700' },
  mapStatusHint: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  message: {
    borderRadius: 12,
    borderWidth: 1,
    left: 14,
    maxWidth: 520,
    paddingHorizontal: 13,
    paddingVertical: 10,
    position: 'absolute',
    right: 14,
    zIndex: 1100,
  },
  locationMessage: { bottom: 18 },
  databaseMessage: { bottom: 74, flexDirection: 'row', justifyContent: 'space-between' },
  noticeMessage: { bottom: 130 },
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
