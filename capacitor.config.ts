import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campanhaviva.app',
  appName: 'CampanhaViva',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
