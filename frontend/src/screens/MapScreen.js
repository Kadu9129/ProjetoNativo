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
  const mapStatusColor = mapUnavailable
    ? colors.warning
    : mapState === 'loading'
      ? colors.info
      : colors.success;

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
          <View style={[styles.brand, styles.floatingShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <View style={styles.brandIconCenter} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>MapPin</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>Seus lugares, sempre com você</Text>
            </View>
          </View>
          <ThemeToggleButton />
        </View>

        <View
          accessibilityLabel={`${storageLabel}. ${mapStatusLabel}`}
          style={[
            styles.statusPanel,
            styles.floatingShadow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: colors.surfaceMuted }]}>
              {saving ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={[styles.statusCount, { color: colors.primary }]}>{pins.length}</Text>
              )}
            </View>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusEyebrow, { color: colors.textMuted }]}>BANCO LOCAL</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {saving ? 'Salvando neste dispositivo…' : `${pins.length} ${pins.length === 1 ? 'lugar salvo' : 'lugares salvos'}`}
              </Text>
            </View>
          </View>

          <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statusRow}>
            <View style={[styles.connectionIcon, { backgroundColor: colors.surfaceMuted }]}>
              {mapState === 'loading' && !mapUnavailable ? (
                <ActivityIndicator color={colors.info} size="small" />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: mapStatusColor }]} />
              )}
            </View>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusEyebrow, { color: colors.textMuted }]}>MAPA EXTERNO</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>{mapStatusLabel}</Text>
              {mapUnavailable ? (
                <Text style={[styles.statusHint, { color: colors.textMuted }]}>Seus lugares continuam disponíveis offline.</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.bottomStack}>
          {locationMessage ? (
            <View style={[styles.message, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.messageDot, { backgroundColor: colors.info }]} />
              <Text style={[styles.messageText, { color: colors.textMuted }]}>{locationMessage}</Text>
            </View>
          ) : null}

          {databaseError ? (
            <View style={[styles.message, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
              <View style={[styles.messageDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.messageText, { color: colors.danger }]}>{databaseError}</Text>
              <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
                <Text style={[styles.retry, { color: colors.primary }]}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {notice ? (
            <View style={[styles.message, { backgroundColor: colors.surface, borderColor: colors.success }]}>
              <View style={[styles.messageDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.messageText, { color: colors.text }]}>{notice}</Text>
            </View>
          ) : null}

          {!ready ? (
            <View style={[styles.message, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.messageText, styles.loadingText, { color: colors.textMuted }]}>Carregando dados locais</Text>
            </View>
          ) : null}

          <View pointerEvents="none" style={[styles.actionHint, styles.floatingShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.actionHintIcon, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionHintPlus, { color: colors.onPrimary }]}>+</Text>
            </View>
            <View style={styles.actionHintCopy}>
              <Text style={[styles.actionHintTitle, { color: colors.text }]}>Adicionar um lugar</Text>
              <Text style={[styles.actionHintSubtitle, { color: colors.textMuted }]}>Toque em qualquer ponto do mapa</Text>
            </View>
          </View>
        </View>
      </View>

      <PinFormModal
        coordinate={modalCoordinate}
        onCancel={() => {
          setPendingCoordinate(null);
          setEditingPin(null);
        }}
        onDelete={(pin) => {
          setEditingPin(null);
          requestDeletePin(pin);
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
    alignItems: 'center',
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
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    maxWidth: 320,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  floatingShadow: {
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  brandIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandIconCenter: { backgroundColor: '#ffffff', borderRadius: 5, height: 10, width: 10 },
  brandCopy: { marginLeft: 10 },
  brandTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, lineHeight: 20 },
  brandSubtitle: { fontSize: 11, marginTop: 2 },
  statusPanel: {
    borderRadius: 18,
    borderWidth: 1,
    left: 14,
    maxWidth: 390,
    paddingHorizontal: 13,
    paddingVertical: 11,
    position: 'absolute',
    right: 14,
    top: 82,
    zIndex: 1100,
  },
  statusRow: { alignItems: 'center', flexDirection: 'row', minHeight: 38 },
  statusIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  statusCount: { fontSize: 17, fontWeight: '800' },
  connectionIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  statusDot: { borderRadius: 6, height: 11, width: 11 },
  statusCopy: { flex: 1, marginLeft: 10 },
  statusEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  statusValue: { fontSize: 12, fontWeight: '700', lineHeight: 16, marginTop: 1 },
  statusHint: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  statusDivider: { height: 1, marginVertical: 8 },
  bottomStack: {
    bottom: 16,
    left: 14,
    maxWidth: 520,
    position: 'absolute',
    right: 14,
    zIndex: 1100,
  },
  message: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  messageDot: { borderRadius: 4, height: 8, marginRight: 9, width: 8 },
  messageText: { flex: 1, fontSize: 12, lineHeight: 17 },
  retryButton: { marginLeft: 10, paddingVertical: 3 },
  retry: { fontSize: 13, fontWeight: '700', marginLeft: 14 },
  loadingText: { marginLeft: 9 },
  actionHint: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    minWidth: 255,
    padding: 9,
  },
  actionHintIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  actionHintPlus: { fontSize: 26, fontWeight: '400', lineHeight: 28 },
  actionHintCopy: { marginLeft: 10 },
  actionHintTitle: { fontSize: 13, fontWeight: '800' },
  actionHintSubtitle: { fontSize: 11, marginTop: 2 },
});
