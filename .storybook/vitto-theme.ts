import { create } from '@storybook/theming/create';

export default create({
  base: 'light',

  // Brand
  brandTitle: 'Vitto Design System',
  brandUrl: 'https://vitto-app.vercel.app',
  brandImage: '/logo.Vitto.png',
  brandTarget: '_self',

  // Colors - Vitto Brand Colors
  colorPrimary: '#F87060', // Coral
  colorSecondary: '#102542', // Deep Blue

  // UI
  appBg: '#f8fafc', // Slate 50
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#e2e8f0', // Slate 200
  appBorderRadius: 16,

  // Text colors
  textColor: '#102542', // Deep Blue
  textInverseColor: '#ffffff',
  textMutedColor: '#64748b', // Slate 500

  // Toolbar default and active colors
  barTextColor: '#64748b',
  barSelectedColor: '#F87060', // Coral
  barHoverColor: '#F87060',
  barBg: '#ffffff',

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  inputTextColor: '#102542',
  inputBorderRadius: 12,

  // Font
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: 'monospace',
});
