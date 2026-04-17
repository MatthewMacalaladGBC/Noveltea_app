import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { AuthContextProvider } from '../src/context/AuthContext';
import { NovelteaTheme } from '../src/theme';
import { ThemeContextProvider, useThemeContext } from '../src/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Create a light theme
const lightTheme = {
  ...NovelteaTheme,
  colors: {
    ...NovelteaTheme.colors,
    background: '#FFFFFF',
    surface: '#F5F5F5',
    onBackground: '#000000',
    onSurface: '#000000',
    primary: '#000000',
    onPrimary: '#FFFFFF',
  },
};

function RootLayoutContent() {
  const { isDark } = useThemeContext();
  const currentTheme = isDark ? NovelteaTheme : lightTheme;
  
  return (
    <PaperProvider theme={currentTheme}>
        <Stack>
         <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: '' }} />
          <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="lists" options={{ headerShown: false }} />
          <Stack.Screen name="reviews" options={{ headerShown: false }} />
          <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
          <Stack.Screen name="follows/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="user-reviews/[username]" options={{ headerShown: false }} />
          <Stack.Screen name="club/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="club-chat" options={{ headerShown: false }} />
          <Stack.Screen name="achievements" options={{ headerShown: false }} />
          <Stack.Screen name="category/[genre]" options={{ headerShown: false }} />
          <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="settings" options={{ headerBackButtonDisplayMode: 'minimal' }} />
          <Stack.Screen name="edit-profile" options={{ headerBackButtonDisplayMode: 'minimal' }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <AuthContextProvider>
        <RootLayoutContent />
      </AuthContextProvider>
    </ThemeContextProvider>
  );
}