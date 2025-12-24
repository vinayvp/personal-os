import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StatusBar, Style } from '@capacitor/status-bar';

// Wrap this in an async function or call it on app load
const setupStatusBar = async () => {
  await StatusBar.setOverlaysWebView({ overlay: false }); // Force no overlay
  await StatusBar.setBackgroundColor({ color: '#ffffff' }); // Use your hex color
  await StatusBar.setStyle({ style: Style.Light }); // 'Light' means dark text
};

setupStatusBar();
createRoot(document.getElementById("root")!).render(<App />);
