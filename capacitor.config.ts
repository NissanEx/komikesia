import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.komiknet.app',
  appName: 'KomikNetwork',
  webDir: 'public',
  server: {
    url: 'https://komiknet.site',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: ['*'] // Mengizinkan semua navigasi di dalam WebView
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;