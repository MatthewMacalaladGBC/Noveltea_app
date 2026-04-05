import { ChatMessageResponse, chatApi } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  AppStateStatus,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Appbar, ActivityIndicator, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

// ── Message bubble ────────────────────────────────────────────────────────────

const ChatBubble = React.memo(function ChatBubble({
  message,
  isOwn,
  theme,
}: {
  message: ChatMessageResponse;
  isOwn: boolean;
  theme: any;
}) {
  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      {!isOwn && (
        <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
            {message.senderUsername.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : null]}>
        {!isOwn && (
          <Text style={[styles.senderName, { color: theme.colors.primary }]}>
            {message.senderUsername}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwn ? theme.colors.primary : theme.colors.surfaceVariant,
              borderBottomRightRadius: isOwn ? 4 : 16,
              borderBottomLeftRadius: isOwn ? 16 : 4,
            },
          ]}
        >
          <Text style={{ color: isOwn ? theme.colors.onPrimary : '#E0E0E0', fontSize: 14, lineHeight: 20 }}>
            {message.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isOwn ? { alignSelf: 'flex-end' } : null, { color: theme.colors.onSurface }]}>
          {formatTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
});

// ── Book banner (Book Discussion room) ────────────────────────────────────────

function BookBanner({
  bookTitle,
  bookCoverUrl,
  theme,
}: {
  bookTitle: string;
  bookCoverUrl: string | null;
  theme: any;
}) {
  return (
    <Surface style={[styles.bookBanner, { backgroundColor: theme.colors.surface }]} elevation={1}>
      {bookCoverUrl ? (
        <Image source={{ uri: bookCoverUrl }} style={styles.bannerCover} resizeMode="cover" />
      ) : (
        <View style={[styles.bannerCover, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 9, color: theme.colors.onSurfaceVariant }}>No Cover</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Discussing
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '700', color: theme.colors.onSurface }}>
          {bookTitle}
        </Text>
      </View>
    </Surface>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;

export default function ClubChatScreen() {
  const theme = useTheme();
  const { user, token } = useAuth();
  const { clubId: clubIdParam, room: roomParam, clubName } = useLocalSearchParams<{
    clubId: string;
    room: string;
    clubName: string;
  }>();

  const clubId = Number(clubIdParam);
  const room = roomParam as 'GENERAL' | 'BOOK_DISCUSSION';
  const roomLabel = room === 'GENERAL' ? 'General Chat' : 'Book Discussion';

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [noMoreOlder, setNoMoreOlder] = useState(false);

  // Banner state — book context for the topmost visible message
  const [bannerBook, setBannerBook] = useState<{
    bookTitle: string;
    bookCoverUrl: string | null;
  } | null>(null);

  // Refs that survive re-renders and are safe inside interval closures
  const lastMessageIdRef = useRef<number | null>(null);
  const oldestMessageIdRef = useRef<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !clubId) return;
    loadInitial();
  }, [token, clubId, room]);

  async function loadInitial() {
    try {
      setLoading(true);
      const msgs = await chatApi.getMessages(clubId, room, token!);
      setMessages(msgs);
      if (msgs.length > 0) {
        lastMessageIdRef.current = msgs[msgs.length - 1].messageId;
        oldestMessageIdRef.current = msgs[0].messageId;
        // Seed the banner with the most recent book context
        const latest = [...msgs].reverse().find(m => m.bookTitle);
        if (latest?.bookTitle) setBannerBook({ bookTitle: latest.bookTitle, bookCoverUrl: latest.bookCoverUrl ?? null });
      }
      if (msgs.length < 50) setNoMoreOlder(true);
    } catch (e) {
      // silently fail — user sees empty chat
    } finally {
      setLoading(false);
    }
  }

  // ── Polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    startPolling();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current === 'active' && next !== 'active') {
        stopPolling();
      } else if (appStateRef.current !== 'active' && next === 'active') {
        startPolling();
      }
      appStateRef.current = next;
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [token, clubId, room]);

  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (lastMessageIdRef.current === null) return;
      try {
        const newMsgs = await chatApi.getMessagesSince(clubId, room, lastMessageIdRef.current, token!);
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
          lastMessageIdRef.current = newMsgs[newMsgs.length - 1].messageId;
          if (isAtBottomRef.current) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
          }
        }
      } catch {
        // ignore transient poll errors
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // ── Scroll to bottom after initial load ─────────────────────────────────────
  const handleContentSizeChange = useCallback(() => {
    if (loading) return;
    flatListRef.current?.scrollToEnd({ animated: false });
  }, [loading]);

  // ── Scroll-up pagination ─────────────────────────────────────────────────────
  const handleLoadOlder = async () => {
    if (loadingOlder || noMoreOlder || oldestMessageIdRef.current === null) return;
    setLoadingOlder(true);
    try {
      const older = await chatApi.getMessagesBefore(clubId, room, oldestMessageIdRef.current, token!);
      if (older.length === 0) {
        setNoMoreOlder(true);
        return;
      }
      if (older.length < 50) setNoMoreOlder(true);
      oldestMessageIdRef.current = older[0].messageId;
      setMessages(prev => [...older, ...prev]);
    } catch {
      // ignore
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText('');
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(clubId, room, text, token!);
      setMessages(prev => [...prev, sent]);
      lastMessageIdRef.current = sent.messageId;
      if (sent.bookTitle) setBannerBook({ bookTitle: sent.bookTitle, bookCoverUrl: sent.bookCoverUrl ?? null });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      setInputText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // ── Book banner tracking via viewable items ──────────────────────────────────
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (room !== 'BOOK_DISCUSSION' || viewableItems.length === 0) return;
    // Find the most recent book context among visible items (topmost first)
    for (const vi of viewableItems) {
      const msg = vi.item as ChatMessageResponse;
      if (msg.bookTitle) {
        setBannerBook({ bookTitle: msg.bookTitle, bookCoverUrl: msg.bookCoverUrl ?? null });
        return;
      }
    }
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={clubName ?? 'Chat'}
          subtitle={roomLabel}
          titleStyle={{ color: theme.colors.onBackground, fontSize: 16 }}
          subtitleStyle={{ color: theme.colors.onSurface, opacity: 0.6, fontSize: 12 }}
        />
      </Appbar.Header>

      {/* Book banner — Book Discussion only */}
      {room === 'BOOK_DISCUSSION' && bannerBook ? (
        <BookBanner
          bookTitle={bannerBook.bookTitle}
          bookCoverUrl={bannerBook.bookCoverUrl}
          theme={theme}
        />
      ) : null}

      {/* Message list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => String(m.messageId)}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isOwn={item.senderUserId === user?.userId}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={handleContentSizeChange}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            isAtBottomRef.current =
              contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
          }}
          scrollEventThrottle={100}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          onScrollBeginDrag={() => {
            if (!loadingOlder && !noMoreOlder) {
              // Check proximity to top inside scroll event for load-older trigger
            }
          }}
          onEndReachedThreshold={0}
          ListHeaderComponent={
            !noMoreOlder ? (
              <Pressable onPress={handleLoadOlder} style={styles.loadOlderBtn}>
                {loadingOlder
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Text style={{ color: theme.colors.primary, fontSize: 12 }}>Load earlier messages</Text>}
              </Pressable>
            ) : messages.length > 0 ? (
              <Text style={[styles.loadOlderBtn, { color: theme.colors.onSurface, opacity: 0.4, fontSize: 12, textAlign: 'center' }]}>
                Beginning of chat
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ color: theme.colors.onSurface, opacity: 0.4, textAlign: 'center', marginTop: 40 }}>
              No messages yet. Say hello!
            </Text>
          }
        />
      )}

      {/* Input bar */}
      <Surface style={[styles.inputBar, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message…"
          placeholderTextColor={theme.colors.onSurface + '80'}
          mode="outlined"
          dense
          style={[styles.textInput, { backgroundColor: theme.colors.background }]}
          outlineStyle={{ borderRadius: 20 }}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          multiline
          maxLength={1000}
        />
        <IconButton
          icon="send"
          size={22}
          iconColor={inputText.trim() ? theme.colors.primary : theme.colors.onSurface}
          style={{ opacity: inputText.trim() ? 1 : 0.3, marginLeft: 2 }}
          disabled={!inputText.trim() || sending}
          onPress={handleSend}
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },

  // Book banner
  bookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  bannerCover: { width: 36, height: 52, borderRadius: 4, flexShrink: 0 },

  // Bubbles
  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubbleWrap: { maxWidth: '78%' },
  bubbleWrapOwn: { alignItems: 'flex-end' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 3, marginLeft: 2 },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  timestamp: { fontSize: 10, opacity: 0.45, marginTop: 3, marginHorizontal: 4 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textInput: { flex: 1, maxHeight: 100, fontSize: 14 },

  // Load older button
  loadOlderBtn: { alignSelf: 'center', paddingVertical: 10 },
});
