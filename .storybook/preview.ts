import type { Preview } from '@storybook/react-vite';
import vittoTheme from './vitto-theme';
import '../src/index.css'; // Importar Tailwind CSS

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      theme: vittoTheme,
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f8fafc',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#102542',
        },
      ],
    },
  },
};

export default preview;