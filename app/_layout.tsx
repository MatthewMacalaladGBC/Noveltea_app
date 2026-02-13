import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
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
  },
};

function RootLayoutContent() {
  const { isDark } = useThemeContext();
  const currentTheme = isDark ? NovelteaTheme : lightTheme;
  
  return (
    <PaperProvider theme={currentTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <RootLayoutContent />
    </ThemeContextProvider>
  );
}