import { BookList, listsApi } from '@/src/api/client';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (list: BookList) => void;
  token: string;
}

export default function CreateListModal({ visible, onClose, onCreated, token }: Props) {
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState(true); // true = public
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setVisibility(true);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const created = await listsApi.createList(
        trimmedTitle,
        description.trim() || null,
        visibility,
        token,
      );
      reset();
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create list.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
          <Text variant="titleLarge" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            Create List
          </Text>

          {/* Title */}
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Title *</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.background,
              },
            ]}
            placeholder="e.g. My Favourites"
            placeholderTextColor={theme.colors.onSurface + '66'}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* Description */}
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Description (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              {
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.background,
              },
            ]}
            placeholder="What's this list about?"
            placeholderTextColor={theme.colors.onSurface + '66'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Visibility */}
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {/* Visible button */}
            <Pressable
              style={[
                styles.visibilityBtn,
                visibility
                  ? { backgroundColor: theme.colors.primary }
                  : { borderColor: theme.colors.outline, borderWidth: 1 },
              ]}
              onPress={() => setVisibility(true)}
            >
              <Text style={[styles.visibilityBtnText, { color: visibility ? '#FFFFFF' : theme.colors.onSurface + '80' }]}>
                Visible
              </Text>
            </Pressable>

            {/* Hidden button */}
            <Pressable
              style={[
                styles.visibilityBtn,
                !visibility
                  ? { backgroundColor: theme.colors.primary }
                  : { borderColor: theme.colors.outline, borderWidth: 1 },
              ]}
              onPress={() => setVisibility(false)}
            >
              <Text style={[styles.visibilityBtnText, { color: !visibility ? '#FFFFFF' : theme.colors.onSurface + '80' }]}>
                Hidden
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.actionBtn}
              textColor="#ef5350"
              labelStyle={styles.actionBtnLabel}
            >
              Cancel
            </Button>
            <Button
              mode="outlined"
              onPress={handleCreate}
              loading={creating}
              disabled={creating}
              style={styles.actionBtn}
              textColor="#43a047"
              labelStyle={styles.actionBtnLabel}
            >
              Create
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.75,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  visibilityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  visibilityBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnLabel: {
    fontWeight: 'bold',
  },
});
