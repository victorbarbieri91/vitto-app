import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vittoapp.financeiro',
  appName: 'Vitto App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Para desenvolvimento com live reload
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#102542'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#102542',
      showSpinner: false
    }
  }
};

export default config;
