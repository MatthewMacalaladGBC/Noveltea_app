import { BookList, listsApi } from '@/src/api/client';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Divider, Text, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpdated: (list: BookList) => void;
  onDeleted: () => void;
  token: string;
  listId: number;
  initialTitle: string;
  initialDescription: string | null;
  initialVisibility: boolean;
}

export default function EditListModal({
  visible,
  onClose,
  onUpdated,
  onDeleted,
  token,
  listId,
  initialTitle,
  initialDescription,
  initialVisibility,
}: Props) {
  const theme = useTheme();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [visibility, setVisibility] = useState(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state whenever the modal opens with new initial values
  const handleOpen = () => {
    setTitle(initialTitle);
    setDescription(initialDescription ?? '');
    setVisibility(initialVisibility);
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await listsApi.updateList(
        listId,
        trimmedTitle,
        description.trim() || null,
        visibility,
        token,
      );
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete List',
      'This will permanently delete the list and all its books. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await listsApi.deleteList(listId, token);
              onClose();
              onDeleted();
            } catch (e: any) {
              setError(e?.message ?? 'Failed to delete list.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onShow={handleOpen}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
          <Text variant="titleLarge" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            Edit List
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
            placeholder="List title"
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

          {/* Save / Cancel */}
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
              onPress={handleSave}
              loading={saving}
              disabled={saving || deleting}
              style={styles.actionBtn}
              textColor="#43a047"
              labelStyle={styles.actionBtnLabel}
            >
              Save
            </Button>
          </View>

          {/* Delete section */}
          <Divider style={styles.divider} />
          <Button
            mode="text"
            onPress={handleDeletePress}
            loading={deleting}
            disabled={saving || deleting}
            textColor="#ef5350"
            labelStyle={styles.deleteBtnLabel}
          >
            Delete List
          </Button>
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
  divider: {
    marginTop: 20,
    marginBottom: 12,
  },
  deleteBtnLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
});
