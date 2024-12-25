// src/styles/theme/index.js
import { colors } from './colors';
import { typography } from './typography';
import { effects } from './effects';
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors,
  ...typography,
  styles: {
    global: {
      body: {
        bg: 'background',
        color: 'text.primary'
      }
    }
  },
  components: {
    // Component specific theme overrides can go here
  }
});

export { colors, typography, effects };
export default theme;