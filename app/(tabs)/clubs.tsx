import { BookClubResponse, clubMembersApi, clubsApi } from '@/src/api/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Appbar, Button, Divider, Modal, Portal, Searchbar, Switch, Text, TextInput, useTheme } from 'react-native-paper';

// ─── Club card ─────────────────────────────────────────────────────────────

function ClubCard({
  club,
  isMember,
  onPress,
}: {
  club: BookClubResponse;
  isMember: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.clubCard,
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.clubCardHeader}>
        {club.privacy && (
          <MaterialCommunityIcons name="lock" size={15} color={theme.colors.onSurface} style={{ opacity: 0.5, marginRight: 4 }} />
        )}
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {club.name}
        </Text>
        {isMember && (
          <View style={[styles.memberBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={{ color: theme.colors.onPrimary, fontSize: 11, fontWeight: '700' }}>Joined</Text>
          </View>
        )}
      </View>

      {club.description ? (
        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={{ color: theme.colors.onSurface, opacity: 0.7, marginTop: 4 }}
        >
          {club.description}
        </Text>
      ) : null}

      <View style={styles.clubCardFooter}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.5 }}>
          {club.memberCount ?? 0} {(club.memberCount ?? 0) === 1 ? 'member' : 'members'}
        </Text>
        {club.ownerUsername ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.45 }}>
            Owner: {club.ownerUsername}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Create Club modal ─────────────────────────────────────────────────────

function CreateClubModal({
  visible,
  onClose,
  onCreated,
  token,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (club: BookClubResponse) => void;
  token: string;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Club name is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const club = await clubsApi.createClub(name.trim(), description.trim() || null, isPrivate, token);
      reset();
      onCreated(club);
    } catch (e: any) {
      setError(e?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => { reset(); onClose(); }}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 16 }}>
          Create a Book Club
        </Text>

        <TextInput
          label="Club Name *"
          mode="outlined"
          value={name}
          onChangeText={setName}
          disabled={loading}
          style={{ marginBottom: 12 }}
        />

        <TextInput
          label="Description (optional)"
          mode="outlined"
          value={description}
          onChangeText={setDescription}
          multiline
          submitBehavior="blurAndSubmit"
          numberOfLines={3}
          disabled={loading}
          style={{ marginBottom: 12 }}
        />

        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Private club</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} disabled={loading} />
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.5, marginBottom: 16 }}>
          {isPrivate ? 'Only members can see this club.' : 'Anyone can discover and join this club.'}
        </Text>

        {error ? <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button mode="outlined" onPress={() => { reset(); onClose(); }} disabled={loading} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleCreate} loading={loading} disabled={loading || !name.trim()} style={{ flex: 1 }} buttonColor="#000">
            Create
          </Button>
        </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Portal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function ClubsScreen() {
  const theme = useTheme();
  const { user, token } = useAuth();

  const [publicClubs, setPublicClubs] = useState<BookClubResponse[]>([]);
  const [myClubs, setMyClubs] = useState<BookClubResponse[]>([]);
  const [myClubIds, setMyClubIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookClubResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createVisible, setCreateVisible] = useState(false);
  const [alreadyOwnsClub, setAlreadyOwnsClub] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;

      async function load() {
        try {
          setLoading(true);
          setError(null);
          const [clubs, fetchedMyClubs] = await Promise.all([
            clubsApi.getPublicClubs(token!),
            clubsApi.getMyClubs(token!),
          ]);
          if (cancelled) return;
          setPublicClubs(clubs);
          setMyClubs(fetchedMyClubs);
          setMyClubIds(new Set(fetchedMyClubs.map(c => c.bookClubId)));
          // Check if user already owns a club
          const myMemberships = await clubMembersApi.getMyMemberships(token!);
          if (cancelled) return;
          setAlreadyOwnsClub(myMemberships.some(m => m.role === 'OWNER'));
        } catch (e: any) {
          if (!cancelled) setError(e?.message || 'Failed to load clubs');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [token])
  );

  // Debounced search
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await clubsApi.searchAllClubs(q.trim(), token!);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
  };

  const handleClubCreated = (club: BookClubResponse) => {
    setCreateVisible(false);
    if (!club.privacy) setPublicClubs(prev => [club, ...prev]);
    setMyClubs(prev => [club, ...prev]);
    setMyClubIds(prev => new Set([...prev, club.bookClubId]));
    setAlreadyOwnsClub(true);
    router.push({ pathname: '/club/[id]', params: { id: String(club.bookClubId) } } as any);
  };

  const isSearching = searchQuery.trim().length > 0;
  const displayClubs = isSearching ? searchResults : publicClubs;

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, marginBottom: 8 }}>Book Clubs</Text>
        <Text style={{ color: theme.colors.onSurface, opacity: 0.6, marginBottom: 24, textAlign: 'center' }}>
          Sign in to discover and join book clubs.
        </Text>
        <Button mode="contained" buttonColor="#000" onPress={() => router.push('/auth/welcome')}>
          Sign In
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
        <Appbar.Content
          title="Book Clubs"
          titleStyle={{ fontWeight: '700', fontSize: 22, color: theme.colors.onBackground }}
        />
        <Appbar.Action
          icon="plus"
          color={theme.colors.onBackground}
          onPress={() => {
            if (alreadyOwnsClub) {
              setError('You already own a book club. Delete it first to create a new one.');
            } else {
              setCreateVisible(true);
            }
          }}
        />
      </Appbar.Header>

      {error ? (
        <Text style={{ color: theme.colors.error, paddingHorizontal: 16, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {/* Search */}
      <Searchbar
        placeholder="Search clubs..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ color: theme.colors.onSurface }}
        loading={searchLoading}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* My Clubs — hidden while searching; uses full list including private clubs */}
          {!isSearching && myClubs.length > 0 ? (
            <View style={styles.section}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                My Clubs
              </Text>
              {myClubs.map(club => (
                <ClubCard
                  key={club.bookClubId}
                  club={club}
                  isMember={true}
                  onPress={() => router.push({ pathname: '/club/[id]', params: { id: String(club.bookClubId) } } as any)}
                />
              ))}
              <Divider style={{ marginTop: 8, marginBottom: 4 }} />
            </View>
          ) : null}

          {/* Discover / Search results */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              {isSearching ? 'Search Results' : 'Discover'}
            </Text>

            {isSearching && searchLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
            ) : displayClubs.length === 0 ? (
              <Text style={{ color: theme.colors.onSurface, opacity: 0.5, paddingVertical: 16 }}>
                {isSearching ? 'No clubs found.' : 'No public clubs yet — be the first to create one!'}
              </Text>
            ) : (
              <FlatList
                data={displayClubs}
                keyExtractor={item => String(item.bookClubId)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <ClubCard
                    club={item}
                    isMember={myClubIds.has(item.bookClubId)}
                    onPress={() => router.push({ pathname: '/club/[id]', params: { id: String(item.bookClubId) } } as any)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            )}
          </View>
        </ScrollView>
      )}

      <CreateClubModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={handleClubCreated}
        token={token!}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  searchBar: { marginHorizontal: 16, marginBottom: 12, borderRadius: 10, elevation: 0 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },
  clubCard: {
    borderRadius: 12,
    padding: 14,
  },
  clubCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  clubCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalContainer: {
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
