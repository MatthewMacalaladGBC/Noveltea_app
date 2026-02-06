import { MD3DarkTheme } from 'react-native-paper';

export const NovelteaTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#FFFFFF',
        secondary: '#000000',
        surface: '#1A1A1A',
        surfaceVariant: '#2A2A2A',

        //Text colors
        onBackground: '#FFFFFF',
        onSurface: '#FFFFFF',
        onSurfaceVariant: '#B0B0B0', //Dimmed text

        //Genre colors 
       genres: {
      romance: '#FF6B9D',         // Pink
      scifi: '#2196F3',           // Blue
      mystery: '#9C27B0',         // Purple
      thriller: '#1A1A1A',        // Dark gray/black
      historical: '#8D6E63',      // Brown
      kids: '#FFA726',            // Orange
      nonfiction: '#757575',      // Gray
      youngadult: '#E91E63',      // Hot pink
      horror: '#5E35B1',          // Deep purple
      fantasy: '#4CAF50',         // Green
    },

        //Accent colors
        primaryAccent: '#FF6B9D', //Pink
        secondaryAccent: '#4CAF50', //Green

        //Accent colors
        outline: '#404040',
        error: '#CF6679'
    },

};