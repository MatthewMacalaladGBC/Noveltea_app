import {
  BookClubItemResponse,
  BookClubMemberResponse,
  BookClubResponse,
  ClubJoinRequestResponse,
  clubItemsApi,
  clubJoinRequestsApi,
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
  TextInput,
  useTheme,
} from 'react-native-paper';

// ─── Open Library search result type ──────────────────────────────────────

interface OLBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

// ─── Edit Date modal (start date for upcoming, end date for active) ────────

function EditDateModal({
  visible,
  title,
  currentValue,
  minDate,
  maxDate,
  onSave,
  onClose,
}: {
  visible: boolean;
  title: string;
  currentValue: string | null;
  minDate?: string;  // inclusive lower bound (YYYY-MM-DD)
  maxDate?: string;  // inclusive upper bound (YYYY-MM-DD)
  onSave: (date: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(currentValue ?? '');
  const [error, setError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (visible) { setValue(currentValue ?? ''); setError(null); }
  }, [visible]);

  const handleSave = () => {
    if (!value.trim()) { setError('Please enter a date.'); return; }
    if (!isValidDate(value)) { setError('Use format YYYY-MM-DD (e.g. 2026-05-01).'); return; }
    if (minDate && value < minDate) {
      setError(`Date must be on or after ${minDate}.`);
      return;
    }
    if (maxDate && value > maxDate) {
      setError(`Date must be on or before ${maxDate}.`);
      return;
    }
    onSave(value);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 16 }}>
          {title}
        </Text>
        <TextInput
          label="Date (YYYY-MM-DD)"
          value={value}
          onChangeText={t => { setValue(t); setError(null); }}
          keyboardType="numeric"
          maxLength={10}
          mode="outlined"
          style={{ marginBottom: 4 }}
        />
        {minDate ? (
          <Text style={{ color: theme.colors.onSurface, opacity: 0.5, fontSize: 11, marginBottom: 4 }}>
            Earliest allowed: {minDate}
          </Text>
        ) : null}
        {error ? <Text style={{ color: theme.colors.error, fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Button mode="outlined" onPress={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>Save</Button>
        </View>
      </Modal>
    </Portal>
  );
}

// ─── Add Book modal (Open Library search → pick book → set dates → add) ───

function AddBookModal({
  visible,
  clubId,
  token,
  activeItemEndDate,
  onClose,
  onAdded,
}: {
  visible: boolean;
  clubId: number;
  token: string;
  activeItemEndDate: string | null;  // used to enforce start-date constraint
  onClose: () => void;
  onAdded: (item: BookClubItemResponse) => void;
}) {
  const theme = useTheme();

  // Step 1 — search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OLBook[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 — confirm dates
  const [pending, setPending] = useState<OLBook | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSelectBook = (book: OLBook) => {
    setPending(book);
    setStartDate('');
    setEndDate('');
    setDateError(null);
    setError(null);
  };

  const handleConfirmAdd = async () => {
    if (!pending) return;

    // Validate start date if provided
    if (startDate.trim()) {
      if (!isValidDate(startDate)) { setDateError('Start date must be YYYY-MM-DD.'); return; }
      if (activeItemEndDate && startDate < activeItemEndDate) {
        setDateError(`Start date must be on or after the active book's end date (${activeItemEndDate}).`);
        return;
      }
    }
    // Validate end date if provided
    if (endDate.trim()) {
      if (!isValidDate(endDate)) { setDateError('End date must be YYYY-MM-DD.'); return; }
      if (startDate.trim() && endDate < startDate) {
        setDateError('End date must be on or after the start date.');
        return;
      }
    }

    const bookId = pending.key.replace('/works/', '');
    const author = pending.author_name?.[0] ?? 'Unknown Author';
    const coverImageUrl = pending.cover_i
      ? `https://covers.openlibrary.org/b/id/${pending.cover_i}-M.jpg`
      : null;

    setAdding(true);
    setError(null);
    try {
      const item = await clubItemsApi.addBook(
        clubId, bookId, pending.title, author, coverImageUrl, token,
        startDate.trim() || undefined,
        endDate.trim() || undefined,
      );
      dismiss();
      onAdded(item);
    } catch (e: any) {
      setError(e?.message || 'Failed to add book');
    } finally {
      setAdding(false);
    }
  };

  const dismiss = () => {
    setQuery('');
    setResults([]);
    setPending(null);
    setStartDate('');
    setEndDate('');
    setDateError(null);
    setError(null);
    onClose();
  };

  const pendingCoverUrl = pending?.cover_i
    ? `https://covers.openlibrary.org/b/id/${pending.cover_i}-M.jpg`
    : null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={dismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 12 }}>
          {pending ? 'Set Reading Dates' : 'Add a Book'}
        </Text>

        {/* ── Step 2: date confirmation ─── */}
        {pending ? (
          <>
            {/* Selected book summary */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              {pendingCoverUrl ? (
                <Image source={{ uri: pendingCoverUrl }} style={styles.searchResultCover} resizeMode="cover" />
              ) : (
                <View style={[styles.searchResultCover, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 8, color: theme.colors.onSurface }}>No Cover</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: theme.colors.onSurface, fontWeight: '700', fontSize: 14 }}>
                  {pending.title}
                </Text>
                <Text style={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12 }}>
                  {pending.author_name?.[0] ?? 'Unknown Author'}
                </Text>
              </View>
            </View>

            <Text style={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12, marginBottom: 10 }}>
              Dates are optional — you can set them later.
            </Text>

            {activeItemEndDate ? (
              <Text style={{ color: theme.colors.onSurface, opacity: 0.5, fontSize: 11, marginBottom: 8 }}>
                Active book ends {activeItemEndDate} — start date must be on or after that.
              </Text>
            ) : null}

            <TextInput
              label="Start Date (YYYY-MM-DD) — optional"
              value={startDate}
              onChangeText={t => { setStartDate(t); setDateError(null); }}
              keyboardType="numeric"
              maxLength={10}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="End Date (YYYY-MM-DD) — optional"
              value={endDate}
              onChangeText={t => { setEndDate(t); setDateError(null); }}
              keyboardType="numeric"
              maxLength={10}
              mode="outlined"
              style={{ marginBottom: 4 }}
            />

            {dateError ? <Text style={{ color: theme.colors.error, fontSize: 12, marginBottom: 4 }}>{dateError}</Text> : null}
            {error ? <Text style={{ color: theme.colors.error, fontSize: 12, marginBottom: 4 }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button mode="outlined" onPress={() => setPending(null)} style={{ flex: 1 }} disabled={adding}>
                ← Back
              </Button>
              <Button mode="contained" onPress={handleConfirmAdd} loading={adding} disabled={adding} style={{ flex: 1 }}>
                Add Book
              </Button>
            </View>
          </>
        ) : (
          /* ── Step 1: search ─── */
          <>
            <Searchbar
              placeholder="Search books..."
              value={query}
              onChangeText={handleQueryChange}
              style={{ backgroundColor: theme.colors.background, elevation: 0, marginBottom: 8 }}
              inputStyle={{ color: theme.colors.onSurface }}
              loading={searching}
            />

            <FlatList
              data={results}
              keyExtractor={book => book.key}
              style={{ maxHeight: 300 }}
              keyboardShouldPersistTaps="always"
              renderItem={({ item: book }) => {
                const coverUrl = book.cover_i
                  ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
                  : null;
                return (
                  <Pressable
                    style={({ pressed }) => [styles.searchResultRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => handleSelectBook(book)}
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
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !searching && query.trim().length > 0 ? (
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.5, textAlign: 'center', paddingVertical: 16 }}>
                    No results found.
                  </Text>
                ) : null
              }
            />

            <Button mode="outlined" onPress={dismiss} style={{ marginTop: 12 }}>
              Cancel
            </Button>
          </>
        )}
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
  const [myJoinRequest, setMyJoinRequest] = useState<ClubJoinRequestResponse | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ClubJoinRequestResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const [addBookVisible, setAddBookVisible] = useState(false);
  const [editDateState, setEditDateState] = useState<{
    item: BookClubItemResponse;
    field: 'startDate' | 'endDate';
  } | null>(null);

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

      // Phase 1: always fetch club info + the user's own memberships
      const [clubData, myMemberships] = await Promise.all([
        clubsApi.getClubById(clubId, token!),
        clubMembersApi.getMyMemberships(token!),
      ]);
      setClub(clubData);
      const mine = myMemberships.find(m => m.bookClubId === clubId) ?? null;
      setMyMembership(mine);

      // Phase 2: member path vs non-member-of-private path
      if (mine || !clubData.privacy) {
        // Member, or public club anyone can browse
        const [membersData, itemsData] = await Promise.all([
          clubMembersApi.getMembersByClub(clubId, token!),
          clubItemsApi.getItemsByClub(clubId, token!),
        ]);
        setMembers(membersData);
        setItems(itemsData);

        // Owner/mods also fetch pending join requests
        if (mine?.role === 'OWNER' || mine?.role === 'MODERATOR') {
          const requests = await clubJoinRequestsApi.getPendingRequests(clubId, token!).catch(() => []);
          setPendingRequests(requests);
        }
      } else {
        // Non-member viewing a private club — fetch their join request status if any
        const myRequest = await clubJoinRequestsApi.getMyRequest(clubId, token!).catch(() => null);
        setMyJoinRequest(myRequest);
      }
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

  const handleRequestJoin = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const req = await clubJoinRequestsApi.requestJoin(clubId, token);
      setMyJoinRequest(req);
      setSnackMessage('Join request sent!');
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!token || !myJoinRequest) return;
    setActionLoading(true);
    try {
      await clubJoinRequestsApi.cancelRequest(myJoinRequest.requestId, token);
      setMyJoinRequest(null);
      setSnackMessage('Join request cancelled.');
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (req: ClubJoinRequestResponse) => {
    if (!token) return;
    try {
      const newMember = await clubJoinRequestsApi.approveRequest(req.requestId, token);
      setPendingRequests(prev => prev.filter(r => r.requestId !== req.requestId));
      setMembers(prev => [...prev, newMember]);
      setClub(prev => prev ? { ...prev, memberCount: (prev.memberCount ?? 0) + 1 } : prev);
      setSnackMessage(`@${req.username} approved.`);
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to approve');
    }
  };

  const handleRejectRequest = async (req: ClubJoinRequestResponse) => {
    if (!token) return;
    try {
      await clubJoinRequestsApi.rejectRequest(req.requestId, token);
      setPendingRequests(prev => prev.filter(r => r.requestId !== req.requestId));
      setSnackMessage(`@${req.username} rejected.`);
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to reject');
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

  const handleUpdateRole = (member: BookClubMemberResponse, newRole: 'MODERATOR' | 'MEMBER') => {
    const label = newRole === 'MODERATOR' ? 'Promote to Moderator' : 'Demote to Member';
    Alert.alert(label, `Promote member @${member.username} to Moderator?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            const updated = await clubMembersApi.updateRole(clubId, member.userId, newRole, token!);
            setMembers(prev => prev.map(m => m.clubMemberId === updated.clubMemberId ? updated : m));
            setSnackMessage(`@${member.username} is now a ${newRole.toLowerCase()}.`);
          } catch (e: any) {
            setSnackMessage(e?.message || 'Failed to update role');
          }
        },
      },
    ]);
  };

  const handleRemoveMember = (member: BookClubMemberResponse) => {
    Alert.alert('Remove Member', `Remove @${member.username} from the club?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await clubMembersApi.removeMember(clubId, member.userId, token!);
            setMembers(prev => prev.filter(m => m.clubMemberId !== member.clubMemberId));
            setClub(prev => prev ? { ...prev, memberCount: Math.max(0, (prev.memberCount ?? 1) - 1) } : prev);
            setSnackMessage(`@${member.username} removed from the club.`);
          } catch (e: any) {
            setSnackMessage(e?.message || 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleEditDate = async (item: BookClubItemResponse, field: 'startDate' | 'endDate', value: string) => {
    try {
      const updated = await clubItemsApi.updateItem(item.clubItemId, { [field]: value }, token!);
      setItems(prev => prev.map(i => i.clubItemId === updated.clubItemId ? updated : i));
      setSnackMessage('Date updated.');
    } catch (e: any) {
      setSnackMessage(e?.message || 'Failed to update date');
    } finally {
      setEditDateState(null);
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
              {myJoinRequest?.status === 'PENDING' ? (
                <>
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.6, textAlign: 'center', marginBottom: 12 }}>
                    Your join request is pending approval.
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handleCancelRequest}
                    loading={actionLoading}
                    disabled={actionLoading}
                    textColor={theme.colors.error}
                    style={{ borderColor: theme.colors.error }}
                  >
                    Cancel Request
                  </Button>
                </>
              ) : myJoinRequest?.status === 'REJECTED' ? (
                <Text style={{ color: theme.colors.onSurface, opacity: 0.6, textAlign: 'center' }}>
                  Your previous join request was declined.
                </Text>
              ) : (
                <>
                  <Text style={{ color: theme.colors.onSurface, opacity: 0.6, textAlign: 'center', marginBottom: 12 }}>
                    This is a private club.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleRequestJoin}
                    loading={actionLoading}
                    disabled={actionLoading}
                    buttonColor="#000"
                    style={styles.joinButton}
                  >
                    Request to Join
                  </Button>
                </>
              )}
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
                  <CurrentReadCard
                    item={activeItem}
                    canManage={canManage}
                    onRemove={() => handleRemoveItem(activeItem)}
                    onEditEndDate={() => setEditDateState({ item: activeItem, field: 'endDate' })}
                    theme={theme}
                  />
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
                      onEditStartDate={() => setEditDateState({ item, field: 'startDate' })}
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

              {/* Pending Join Requests — owner/mod only */}
              {canManage && pendingRequests.length > 0 ? (
                <>
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                      Join Requests ({pendingRequests.length})
                    </Text>
                    {pendingRequests.map(req => (
                      <View key={req.requestId} style={styles.memberRow}>
                        <Avatar.Text
                          size={36}
                          label={req.username.charAt(0).toUpperCase()}
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                        />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onBackground, flex: 1 }}>
                          @{req.username}
                        </Text>
                        <Pressable onPress={() => handleApproveRequest(req)}>
                          <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700', marginRight: 12 }}>
                            Accept
                          </Text>
                        </Pressable>
                        <Pressable onPress={() => handleRejectRequest(req)}>
                          <Text style={{ fontSize: 12, color: theme.colors.error, fontWeight: '700' }}>
                            Deny
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                  <Divider style={{ marginVertical: 8 }} />
                </>
              ) : null}

              {/* Members */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  Members ({members.length})
                </Text>
                {members.map(m => {
                  const isThisMe = m.userId === user?.userId;
                  const isThisOwner = m.role === 'OWNER';
                  const isThisMod = m.role === 'MODERATOR';
                  return (
                    <View key={m.clubMemberId} style={styles.memberRow}>
                      <Avatar.Text
                        size={36}
                        label={m.username.charAt(0).toUpperCase()}
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => router.push({ pathname: '/user/[username]', params: { username: m.username } } as any)}
                      >
                        <Text variant="bodyMedium" style={{ color: theme.colors.onBackground }}>
                          {m.username}{isThisMe ? ' (you)' : ''}
                        </Text>
                      </Pressable>
                      <Chip compact style={{ backgroundColor: theme.colors.surface }}>
                        {m.role}
                      </Chip>
                      {/* Owner-only role controls — hidden for own row and the owner row */}
                      {isOwner && !isThisMe && !isThisOwner ? (
                        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 4 }}>
                          <Pressable onPress={() => handleUpdateRole(m, isThisMod ? 'MEMBER' : 'MODERATOR')}>
                            <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '700' }}>
                              {isThisMod ? 'Demote' : 'Mod'}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => handleRemoveMember(m)}>
                            <Text style={{ fontSize: 11, color: theme.colors.error, fontWeight: '700' }}>
                              Remove
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
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
        activeItemEndDate={activeItem?.endDate ?? null}
        onClose={() => setAddBookVisible(false)}
        onAdded={item => {
          setItems(prev => [...prev, item]);
          setAddBookVisible(false);
          setSnackMessage(`"${item.bookTitle}" added to upcoming reads!`);
        }}
      />

      <EditDateModal
        visible={editDateState !== null}
        title={editDateState?.field === 'startDate' ? 'Set Start Date' : 'Set End Date'}
        currentValue={
          editDateState
            ? (editDateState.field === 'startDate'
                ? editDateState.item.startDate
                : editDateState.item.endDate) ?? null
            : null
        }
        minDate={
          editDateState?.field === 'startDate' && activeItem?.endDate
            ? activeItem.endDate
            : undefined
        }
        onSave={value => editDateState && handleEditDate(editDateState.item, editDateState.field, value)}
        onClose={() => setEditDateState(null)}
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
  onEditEndDate,
  theme,
}: {
  item: BookClubItemResponse;
  canManage: boolean;
  onRemove: () => void;
  onEditEndDate: () => void;
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
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 }}>
          <Pressable onPress={onEditEndDate}>
            <Text style={{ color: theme.colors.primary, fontSize: 12 }}>
              {item.endDate ? 'Edit End Date' : 'Set End Date'}
            </Text>
          </Pressable>
          <Pressable onPress={onRemove}>
            <Text style={{ color: theme.colors.error, fontSize: 12 }}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

function UpcomingBookCard({
  item,
  canManage,
  onSetActive,
  onRemove,
  onEditStartDate,
  theme,
}: {
  item: BookClubItemResponse;
  canManage: boolean;
  onSetActive: () => void;
  onRemove: () => void;
  onEditStartDate: () => void;
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
          {item.startDate ? (
            <Text style={{ color: theme.colors.onSurface, opacity: 0.5, fontSize: 11 }}>
              Starts: {item.startDate}{item.endDate ? ` · Ends: ${item.endDate}` : ''}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {canManage ? (
        <View style={{ flexDirection: 'column', gap: 6, alignSelf: 'center', alignItems: 'flex-end' }}>
          <Pressable onPress={onSetActive}>
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Set Active</Text>
          </Pressable>
          <Pressable onPress={onEditStartDate}>
            <Text style={{ color: theme.colors.primary, fontSize: 12 }}>
              {item.startDate ? 'Edit Start' : 'Set Start'}
            </Text>
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
