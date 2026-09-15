import React, { useEffect, useState } from 'react';
import {
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

export default function PinFormModal({ visible, coordinate, pin, onCancel, onSubmit }) {
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
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? 'Editar lugar' : 'Novo lugar'}
          </Text>
          <Text style={[styles.coordinates, { color: colors.textMuted }]}>
            {coordinate ? `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}` : ''}
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
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

          <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
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

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <View style={styles.actions}>
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
              <Text style={[styles.saveText, { color: colors.onPrimary }]}>
                {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar'}
              </Text>
            </Pressable>
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
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 480,
    padding: 22,
    width: '100%',
  },
  title: { fontSize: 24, fontWeight: '700' },
  coordinates: { fontSize: 12, marginBottom: 17, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 16, minHeight: 46, paddingHorizontal: 13, paddingVertical: 10 },
  description: { minHeight: 105 },
  error: { fontSize: 13, marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  action: { alignItems: 'center', borderRadius: 10, justifyContent: 'center', minHeight: 44, minWidth: 90, paddingHorizontal: 16 },
  save: { marginLeft: 8 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveText: { fontSize: 15, fontWeight: '700' },
});

