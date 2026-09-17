import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  const [locating, setLocating] = useState(true);
  const [pendingCoordinate, setPendingCoordinate] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportCommand, setViewportCommand] = useState(null);
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

  const requestCurrentLocation = useCallback(async ({ focus = false } = {}) => {
    setLocating(true);
    setLocationMessage('Buscando sua localização…');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationMessage('Localização não permitida. Você ainda pode explorar o mapa.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(nextLocation);
      setLocationMessage('');
      if (focus) {
        setViewportCommand({
          coordinate: nextLocation,
          id: Date.now(),
          type: 'focus',
          zoom: 16,
        });
      }
      return nextLocation;
    } catch (_error) {
      setLocationMessage('Localização indisponível. Você ainda pode explorar o mapa.');
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

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

  const normalizedSearch = useMemo(
    () => searchQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    [searchQuery],
  );
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    return pins
      .filter((pin) => {
        const searchableText = `${pin.name} ${pin.description}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
      .slice(0, 5);
  }, [normalizedSearch, pins]);

  const focusPin = useCallback((pin) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setViewportCommand({
      coordinate: { latitude: pin.latitude, longitude: pin.longitude },
      id: Date.now(),
      type: 'focus',
      zoom: 16,
    });
  }, []);

  const fitSavedPlaces = useCallback(() => {
    const coordinates = pins.map((pin) => ({
      latitude: pin.latitude,
      longitude: pin.longitude,
    }));
    if (location) coordinates.push(location);
    if (!coordinates.length) return;
    setViewportCommand({ coordinates, id: Date.now(), type: 'fit' });
  }, [location, pins]);

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
          viewportCommand={viewportCommand}
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
          style={[
            styles.searchPanel,
            styles.floatingShadow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.searchRow}>
            <Text accessibilityElementsHidden style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
            <TextInput
              accessibilityLabel="Buscar lugares salvos"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Buscar nos meus lugares"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              selectionColor={colors.primary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
            />
            {searchQuery ? (
              <Pressable
                accessibilityLabel="Limpar busca"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSearchQuery('')}
                style={({ pressed }) => [styles.clearSearch, { backgroundColor: pressed ? colors.border : colors.surfaceMuted }]}
              >
                <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>×</Text>
              </Pressable>
            ) : null}
          </View>

          {normalizedSearch ? (
            <View style={[styles.searchResults, { borderTopColor: colors.border }]}>
              {searchResults.length ? (
                searchResults.map((pin) => (
                  <Pressable
                    accessibilityHint="Centraliza este lugar no mapa"
                    accessibilityRole="button"
                    key={pin._id}
                    onPress={() => focusPin(pin)}
                    style={({ pressed }) => [
                      styles.searchResult,
                      { backgroundColor: pressed ? colors.surfaceMuted : colors.surface },
                    ]}
                  >
                    <View style={[styles.resultPin, { backgroundColor: colors.primary }]} />
                    <View style={styles.resultCopy}>
                      <Text numberOfLines={1} style={[styles.resultName, { color: colors.text }]}>{pin.name}</Text>
                      <Text numberOfLines={1} style={[styles.resultDescription, { color: colors.textMuted }]}>{pin.description}</Text>
                    </View>
                    <Text style={[styles.resultAction, { color: colors.primary }]}>Ver</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={[styles.emptySearch, { color: colors.textMuted }]}>Nenhum lugar encontrado neste dispositivo.</Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={[styles.mapActions, styles.floatingShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityLabel="Ir para minha localização"
            accessibilityRole="button"
            disabled={locating}
            onPress={() => requestCurrentLocation({ focus: true })}
            style={({ pressed }) => [styles.mapAction, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}
          >
            {locating ? (
              <ActivityIndicator color={colors.info} size="small" />
            ) : (
              <Text style={[styles.mapActionIcon, { color: colors.info }]}>⌖</Text>
            )}
          </Pressable>
          <View style={[styles.mapActionDivider, { backgroundColor: colors.border }]} />
          <Pressable
            accessibilityLabel="Enquadrar todos os lugares"
            accessibilityRole="button"
            disabled={!pins.length && !location}
            onPress={fitSavedPlaces}
            style={({ pressed }) => [styles.mapAction, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}
          >
            <Text style={[styles.fitActionText, { color: pins.length || location ? colors.text : colors.textMuted }]}>Todos</Text>
          </Pressable>
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
              <Text style={[styles.actionHintTitle, { color: colors.text }]}>Seu mapa pessoal</Text>
              <Text style={[styles.actionHintSubtitle, { color: colors.textMuted }]}>Toque para salvar • faça pinça para ajustar</Text>
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
  searchPanel: {
    borderRadius: 16,
    borderWidth: 1,
    left: 14,
    maxWidth: 520,
    overflow: 'hidden',
    position: 'absolute',
    right: 14,
    top: 206,
    zIndex: 1200,
  },
  searchRow: { alignItems: 'center', flexDirection: 'row', minHeight: 48, paddingHorizontal: 12 },
  searchIcon: { fontSize: 25, lineHeight: 26, marginRight: 8, transform: [{ rotate: '-20deg' }] },
  searchInput: { flex: 1, fontSize: 14, minHeight: 46, paddingVertical: 9 },
  clearSearch: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', marginLeft: 8, width: 28 },
  clearSearchText: { fontSize: 22, lineHeight: 23 },
  searchResults: { borderTopWidth: 1, paddingVertical: 5 },
  searchResult: { alignItems: 'center', flexDirection: 'row', minHeight: 52, paddingHorizontal: 13, paddingVertical: 7 },
  resultPin: { borderColor: '#ffffff', borderRadius: 9, borderWidth: 2, height: 18, transform: [{ rotate: '-45deg' }], width: 18 },
  resultCopy: { flex: 1, marginLeft: 11 },
  resultName: { fontSize: 13, fontWeight: '800' },
  resultDescription: { fontSize: 11, marginTop: 2 },
  resultAction: { fontSize: 12, fontWeight: '800', marginLeft: 10 },
  emptySearch: { fontSize: 12, lineHeight: 17, paddingHorizontal: 14, paddingVertical: 12 },
  mapActions: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
    right: 14,
    top: 268,
    zIndex: 1100,
  },
  mapAction: { alignItems: 'center', height: 46, justifyContent: 'center', minWidth: 52, paddingHorizontal: 7 },
  mapActionIcon: { fontSize: 25, fontWeight: '700', lineHeight: 27 },
  fitActionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.1 },
  mapActionDivider: { height: 1 },
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
