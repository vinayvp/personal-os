import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vinayvp.myapp',
  appName: 'MyApp',
  webDir: 'dist',
  server: {
    // This tells the app to start at a specific route
    url: 'https://vinayvp.netlify.app/app',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlay: false, // This is the key setting
      backgroundColor: '#ffffff', // Set this to match your header color
      style: 'DARK' // 'DARK' for dark text on light bg, 'LIGHT' for white text
    }
  }
};

export default config;
