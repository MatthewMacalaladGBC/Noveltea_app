import {
  BookClubItemResponse,
  BookClubMemberResponse,
  BookClubResponse,
  clubItemsApi,
  clubMembersApi,
  clubsApi,
} from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Chip,
  Divider,
  Modal,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

// ─── Open Library search result type ──────────────────────────────────────

interface OLBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

// ─── Add Book modal (Open Library search → add to club) ───────────────────

function AddBookModal({
  visible,
  clubId,
  token,
  onClose,
  onAdded,
}: {
  visible: boolean;
  clubId: number;
  token: string;
  onClose: () => void;
  onAdded: (item: BookClubItemResponse) => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OLBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q.trim())}&limit=15&fields=key,title,author_name,cover_i`
        );
        const data = res.ok ? await res.json().catch(() => null) : null;
        setResults(data?.docs ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleAdd = async (book: OLBook) => {
    const bookId = book.key.replace('/works/', '');
    const author = book.author_name?.[0] ?? 'Unknown Author';
    const coverImageUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : null;

    setAdding(book.key);
    setError(null);
    try {
      const item = await clubItemsApi.addBook(clubId, bookId, book.title, author, coverImageUrl, token);
      setQuery('');
      setResults([]);
      onAdded(item);
    } catch (e: any) {
      setError(e?.message || 'Failed to add book');
    } finally {
      setAdding(null);
    }
  };

  const dismiss = () => {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={dismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 12 }}>
          Add a Book
        </Text>

        <Searchbar
          placeholder="Search books..."
          value={query}
          onChangeText={handleQueryChange}
          style={{ backgroundColor: theme.colors.background, elevation: 0, marginBottom: 8 }}
          inputStyle={{ color: theme.colors.onSurface }}
          loading={searching}
        />

        {error ? <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text> : null}

        <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
          {results.map(book => {
            const coverUrl = book.cover_i
              ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
              : null;
            return (
              <Pressable
                key={book.key}
                style={({ pressed }) => [styles.searchResultRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleAdd(book)}
                disabled={adding !== null}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.searchResultCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.searchResultCover, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 8, color: theme.colors.onSurface }}>No Cover</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 13 }}>
                    {book.title}
                  </Text>
                  <Text numberOfLines={1} style={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12 }}>
                    {book.author_name?.[0] ?? 'Unknown Author'}
                  </Text>
                </View>
                {adding === book.key ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Button mode="outlined" onPress={dismiss} style={{ marginTop: 12 }}>
          Cancel
        </Button>
      </Modal>
    </Portal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function ClubHubScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clubId = Number(id);
  const { user, token } = useAuth();

  const [club, setClub] = useState<BookClubResponse | null>(null);
  const [members, setMembers] = useState<BookClubMemberResponse[]>([]);
  const [items, setItems] = useState<BookClubItemResponse[]>([]);
  const [myMembership, setMyMembership] = useState<BookClubMemberResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const [addBookVisible, setAddBookVisible] = useState(false);

  const isOwner = myMembership?.role === 'OWNER';
  const isModerator = myMembership?.role === 'MODERATOR';
  const canManage = isOwner || isModerator;
  const isMember = myMembership !== null;

  const activeItem = items.find(i => i.status === 'ACTIVE') ?? null;
  const upcomingItems = items.filter(i => i.status === 'UPCOMING');
  const completedItems = items.filter(i => i.status === 'COMPLETED');

  useEffect(() => {
    if (!token || !clubId) return;
    load();
  }, [token, clubId]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [clubData, membersData, myMemberships] = await Promise.all([
        clubsApi.getClubById(clubId, token!),
        clubMembersApi.getMembersByClub(clubId, token!),
        clubMembersApi.getMyMemberships(token!),
      ]);
      setClub(clubData);
      setMembers(membersData);
      const mine = myMemberships.find(m => m.bookClubId === clubId) ?? null;
      setMyMembership(mine);

      // Only load items if user is a member (or club is public — backend enforces)
      const itemsData = await clubItemsApi.getItemsByClub(clubId, token!);
      setItems(itemsData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load club');
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const membership = await clubMembersApi.joinClub(clubId, token);
      setMyMembership(membership);
      setMembers(prev => [...prev, membership]);
      setClub(prev => prev ? { ...prev, memberCount: (prev.memberCount ?? 0) + 1 } : prev);
      // Load items now that we're a member
      const itemsData = await clubItemsApi.getItemsByClub(clubId, token);
      setItems(itemsData);
      setSnackMessage(`Joined ${club?.name}!`);
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Club', `Leave "${club?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await clubMembersApi.leaveClub(clubId, token!);
            setMyMembership(null);
            setMembers(prev => prev.filter(m => m.userId !== user!.userId));
            setClub(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount ?? 1) - 1) } : prev);
            setItems([]);
            router.back();
          } catch (e: any) {
            setSnackMessage(e?.message || 'Failed to leave');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteClub = () => {
    Alert.alert(
      'Delete Club',
      `Permanently delete "${club?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setActionLoading(true);
            try {
              await clubsApi.deleteClub(clubId, token!);
              router.back();
            } catch (e: any) {
              setSnackMessage(e?.message || 'Failed to delete club');
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSetActive = async (item: BookClubItemResponse) => {
    setActionLoading(true);
    try {
      const updated = await clubItemsApi.updateItem(item.clubItemId, { status: 'ACTIVE' }, token!);
      setItems(prev => prev.map(i => {
        if (i.status === 'ACTIVE') return { ...i, status: 'COMPLETED' };
        if (i.clubItemId === updated.clubItemId) return updated;
        return i;
      }));
      setSnackMessage(`"${item.bookTitle}" is now the current read!`);
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetEndDate = async (item: BookClubItemResponse, endDate: string) => {
    setActionLoading(true);
    try {
      const updated = await clubItemsApi.updateItem(item.clubItemId, { endDate }, token!);
      setItems(prev => prev.map(i => i.clubItemId === updated.clubItemId ? updated : i));
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = (item: BookClubItemResponse) => {
    Alert.alert('Remove Book', `Remove "${item.bookTitle}" from the club?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await clubItemsApi.removeBook(item.clubItemId, token!);
            setItems(prev => prev.filter(i => i.clubItemId !== item.clubItemId));
          } catch (e: any) {
            setSnackMessage(e?.message || 'Failed to remove');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.floatingHeader, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !club) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.floatingHeader, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <Text style={{ color: theme.colors.error }}>{error || 'Club not found'}</Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={club.name} titleStyle={{ color: theme.colors.onBackground }} />
          {club.privacy ? <Chip style={{ marginRight: 8 }} compact>Private</Chip> : null}
        </Appbar.Header>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Club info */}
          <View style={styles.clubInfo}>
            {club.description ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, opacity: 0.8, marginBottom: 8 }}>
                {club.description}
              </Text>
            ) : null}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.5 }}>
              {club.memberCount ?? 0} {(club.memberCount ?? 0) === 1 ? 'member' : 'members'} · Created {club.creationDate}
            </Text>
          </View>

          {/* Join button — non-members of public clubs */}
          {!isMember && !club.privacy ? (
            <View style={styles.section}>
              <Button
                mode="contained"
                onPress={handleJoin}
                loading={actionLoading}
                disabled={actionLoading}
                buttonColor="#000"
                style={styles.joinButton}
              >
                Join Club
              </Button>
            </View>
          ) : null}

          {/* Private & not a member */}
          {!isMember && club.privacy ? (
            <View style={styles.section}>
              <Text style={{ color: theme.colors.onSurface, opacity: 0.6, textAlign: 'center' }}>
                This is a private club. Contact the owner to request an invite.
              </Text>
            </View>
          ) : null}

          {/* ── Content for members ───────────────────────────────────────── */}
          {isMember ? (
            <>
              <Divider style={{ marginVertical: 8 }} />

              {/* Currently Reading */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  Currently Reading
                </Text>
                {activeItem ? (
                  <CurrentReadCard item={activeItem} canManage={canManage} onRemove={() => handleRemoveItem(activeItem)} theme={theme} />
                ) : (
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.5 }}>
                    No book set yet.{canManage ? ' Add one below.' : ''}
                  </Text>
                )}
              </View>

              <Divider style={{ marginVertical: 8 }} />

              {/* Upcoming Reads */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    Upcoming
                  </Text>
                  {canManage ? (
                    <Pressable onPress={() => setAddBookVisible(true)}>
                      <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>+ Add Book</Text>
                    </Pressable>
                  ) : null}
                </View>

                {upcomingItems.length === 0 ? (
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.5 }}>No upcoming books.</Text>
                ) : (
                  upcomingItems.map(item => (
                    <UpcomingBookCard
                      key={item.clubItemId}
                      item={item}
                      canManage={canManage}
                      onSetActive={() => handleSetActive(item)}
                      onRemove={() => handleRemoveItem(item)}
                      theme={theme}
                    />
                  ))
                )}
              </View>

              {/* Completed */}
              {completedItems.length > 0 ? (
                <>
                  <Divider style={{ marginVertical: 8 }} />
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                      Previously Read
                    </Text>
                    {completedItems.map(item => (
                      <CompletedBookCard key={item.clubItemId} item={item} theme={theme} />
                    ))}
                  </View>
                </>
              ) : null}

              <Divider style={{ marginVertical: 8 }} />

              {/* Members */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  Members ({members.length})
                </Text>
                {members.map(m => (
                  <View key={m.clubMemberId} style={styles.memberRow}>
                    <Avatar.Text
                      size={36}
                      label={m.username.charAt(0).toUpperCase()}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onBackground, flex: 1 }}
                      onPress={() => router.push({ pathname: '/user/[username]', params: { username: m.username } } as any)}
                    >
                      {m.username}
                    </Text>
                    <Chip compact style={{ backgroundColor: theme.colors.surface }}>
                      {m.role}
                    </Chip>
                  </View>
                ))}
              </View>

              <Divider style={{ marginVertical: 8 }} />

              {/* Owner Management Panel */}
              {isOwner ? (
                <View style={styles.section}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    Manage Club
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setAddBookVisible(true)}
                    style={{ marginBottom: 10 }}
                    icon="book-plus"
                  >
                    Add Book to Reading List
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleDeleteClub}
                    loading={actionLoading}
                    disabled={actionLoading}
                    textColor={theme.colors.error}
                    style={{ borderColor: theme.colors.error, marginBottom: 10 }}
                    icon="delete"
                  >
                    Delete Club
                  </Button>
                </View>
              ) : null}

              {/* Leave Club — non-owner members */}
              {isMember && !isOwner ? (
                <View style={styles.section}>
                  <Button
                    mode="outlined"
                    onPress={handleLeave}
                    loading={actionLoading}
                    disabled={actionLoading}
                    textColor={theme.colors.error}
                    style={{ borderColor: theme.colors.error }}
                  >
                    Leave Club
                  </Button>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>

      <AddBookModal
        visible={addBookVisible}
        clubId={clubId}
        token={token!}
        onClose={() => setAddBookVisible(false)}
        onAdded={item => {
          setItems(prev => [...prev, item]);
          setAddBookVisible(false);
          setSnackMessage(`"${item.bookTitle}" added to upcoming reads!`);
        }}
      />

      <Portal>
        <Snackbar visible={snackMessage !== null} onDismiss={() => setSnackMessage(null)} duration={2500}>
          {snackMessage}
        </Snackbar>
      </Portal>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CurrentReadCard({
  item,
  canManage,
  onRemove,
  theme,
}: {
  item: BookClubItemResponse;
  canManage: boolean;
  onRemove: () => void;
  theme: any;
}) {
  const bookId = item.bookId.replace('/works/', '');
  return (
    <Pressable
      style={[styles.currentReadCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } } as any)}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.currentReadCover} resizeMode="cover" />
        ) : (
          <View style={[styles.currentReadCover, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 10, color: theme.colors.onSurface }}>No Cover</Text>
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }} numberOfLines={2}>
            {item.bookTitle}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.7 }}>
            {item.bookAuthor}
          </Text>
          {item.startDate ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.5 }}>
              Started: {item.startDate}{item.endDate ? ` · Ends: ${item.endDate}` : ''}
            </Text>
          ) : null}
        </View>
      </View>
      {canManage ? (
        <Pressable onPress={onRemove} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
          <Text style={{ color: theme.colors.error, fontSize: 12 }}>Remove</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function UpcomingBookCard({
  item,
  canManage,
  onSetActive,
  onRemove,
  theme,
}: {
  item: BookClubItemResponse;
  canManage: boolean;
  onSetActive: () => void;
  onRemove: () => void;
  theme: any;
}) {
  const bookId = item.bookId.replace('/works/', '');
  return (
    <View style={[styles.upcomingCard, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Pressable
        style={{ flexDirection: 'row', gap: 12, flex: 1 }}
        onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } } as any)}
      >
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.upcomingCover} resizeMode="cover" />
        ) : (
          <View style={[styles.upcomingCover, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 9, color: theme.colors.onSurface }}>No Cover</Text>
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
          <Text numberOfLines={2} style={{ color: theme.colors.onBackground, fontWeight: '600', fontSize: 14 }}>
            {item.bookTitle}
          </Text>
          <Text numberOfLines={1} style={{ color: theme.colors.onSurface, opacity: 0.65, fontSize: 12 }}>
            {item.bookAuthor}
          </Text>
        </View>
      </Pressable>
      {canManage ? (
        <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'center' }}>
          <Pressable onPress={onSetActive}>
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Set Active</Text>
          </Pressable>
          <Pressable onPress={onRemove}>
            <Text style={{ color: theme.colors.error, fontSize: 12 }}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CompletedBookCard({ item, theme }: { item: BookClubItemResponse; theme: any }) {
  const bookId = item.bookId.replace('/works/', '');
  return (
    <Pressable
      style={[styles.upcomingCard, { borderBottomColor: theme.colors.outlineVariant, opacity: 0.65 }]}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: bookId } } as any)}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.upcomingCover} resizeMode="cover" />
        ) : (
          <View style={[styles.upcomingCover, { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 9, color: theme.colors.onSurface }}>No Cover</Text>
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
          <Text numberOfLines={1} style={{ color: theme.colors.onBackground, fontWeight: '600', fontSize: 14 }}>
            {item.bookTitle}
          </Text>
          {item.endDate ? (
            <Text style={{ color: theme.colors.onSurface, opacity: 0.55, fontSize: 12 }}>
              Finished: {item.endDate}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  clubInfo: { paddingHorizontal: 16, paddingVertical: 12 },
  section: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },
  joinButton: { borderRadius: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  // Current read
  currentReadCard: { borderRadius: 12, padding: 14, marginBottom: 8 },
  currentReadCover: { width: 80, height: 120, borderRadius: 8 },
  // Upcoming / completed
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  upcomingCover: { width: 50, height: 70, borderRadius: 6, flexShrink: 0 },
  // Add book modal
  modalContainer: { margin: 16, borderRadius: 16, padding: 20 },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  searchResultCover: { width: 40, height: 56, borderRadius: 4, flexShrink: 0 },
});
