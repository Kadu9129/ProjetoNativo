import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PinFormModal({ visible, coordinate, pin, onCancel, onDelete, onSubmit }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(pin);

  useEffect(() => {
    if (visible) {
      setName(pin?.name || '');
      setDescription(pin?.description || '');
      setError('');
      setSaving(false);
    }
  }, [pin, visible]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      setError('Nome e descrição são obrigatórios.');
      return;
    }
    if (trimmedName.length > 100 || trimmedDescription.length > 500) {
      setError('O nome pode ter até 100 caracteres e a descrição até 500.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSubmit({ name: trimmedName, description: trimmedDescription, ...coordinate });
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível salvar o lugar.');
      setSaving(false);
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={saving ? undefined : onCancel}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerIconText, { color: colors.onPrimary }]}>{isEditing ? '✎' : '+'}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>SALVO NESTE DISPOSITIVO</Text>
              <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Editar lugar' : 'Novo lugar'}</Text>
            </View>
          </View>

          <View style={[styles.coordinateChip, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.coordinateDot, { backgroundColor: colors.info }]} />
            <Text style={[styles.coordinates, { color: colors.textMuted }]}>
              {coordinate ? `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` : ''}
            </Text>
          </View>

          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
            <Text style={[styles.counter, { color: colors.textMuted }]}>{name.length}/100</Text>
          </View>
          <TextInput
            accessibilityLabel="Nome do lugar"
            autoFocus
            editable={!saving}
            maxLength={100}
            onChangeText={setName}
            placeholder="Meu lugar favorito"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
            style={[
              styles.input,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text },
            ]}
            value={name}
          />

          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
            <Text style={[styles.counter, { color: colors.textMuted }]}>{description.length}/500</Text>
          </View>
          <TextInput
            accessibilityLabel="Descrição do lugar"
            editable={!saving}
            maxLength={500}
            multiline
            onChangeText={setDescription}
            placeholder="O que torna este lugar especial?"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.description,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text },
            ]}
            textAlignVertical="top"
            value={description}
          />

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.danger }]}>
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {isEditing ? (
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => onDelete(pin)}
                style={({ pressed }) => [styles.deleteAction, { opacity: pressed || saving ? 0.6 : 1 }]}
              >
                <Text style={[styles.deleteText, { color: colors.danger }]}>Excluir</Text>
              </Pressable>
            ) : null}
            <View style={styles.primaryActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onCancel}
              style={({ pressed }) => [styles.action, { opacity: pressed || saving ? 0.6 : 1 }]}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.action,
                styles.save,
                { backgroundColor: pressed ? colors.primaryPressed : colors.primary, opacity: saving ? 0.7 : 1 },
              ]}
            >
              {saving ? <ActivityIndicator color={colors.onPrimary} size="small" /> : null}
              <Text style={[styles.saveText, { color: colors.onPrimary, marginLeft: saving ? 8 : 0 }]}>
                {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar lugar'}
              </Text>
            </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 480,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: '100%',
  },
  header: { alignItems: 'center', flexDirection: 'row' },
  headerIcon: { alignItems: 'center', borderRadius: 15, height: 46, justifyContent: 'center', width: 46 },
  headerIconText: { fontSize: 25, fontWeight: '600', lineHeight: 28 },
  headerCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4, marginTop: 2 },
  coordinateChip: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 12, flexDirection: 'row', marginBottom: 17, marginTop: 15, paddingHorizontal: 10, paddingVertical: 7 },
  coordinateDot: { borderRadius: 4, height: 8, width: 8 },
  coordinates: { fontSize: 11, fontWeight: '600', marginLeft: 7 },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7, marginTop: 10 },
  label: { fontSize: 13, fontWeight: '700' },
  counter: { fontSize: 10, fontWeight: '600' },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 48, paddingHorizontal: 14, paddingVertical: 11 },
  description: { minHeight: 112 },
  errorBox: { borderLeftWidth: 3, borderRadius: 9, marginTop: 12, paddingHorizontal: 11, paddingVertical: 9 },
  error: { fontSize: 12, lineHeight: 17 },
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  primaryActions: { flexDirection: 'row', marginLeft: 'auto' },
  action: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', minHeight: 46, minWidth: 98, paddingHorizontal: 17 },
  save: { marginLeft: 9, minWidth: 126 },
  deleteAction: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  deleteText: { fontSize: 14, fontWeight: '700' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveText: { fontSize: 15, fontWeight: '700' },
});

