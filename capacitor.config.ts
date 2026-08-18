import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.campanhaviva.app',
  appName: 'Campanha Viva',
  webDir: 'public',
  server: {
    url: 'https://campanha-viva.onrender.com/app',
    cleartext: true,
    allowNavigation: ['campanha-viva.onrender.com']
  }
};

export default config;
