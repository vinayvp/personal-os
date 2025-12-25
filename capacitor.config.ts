import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vinayvp.myapp',
  appName: 'MyApp',
  webDir: 'dist',
  server: {
    // This tells the app to start at a specific route
    url: 'https://vinayvp.netlify.app/app',
    cleartext: true
  }
};

export default config;
