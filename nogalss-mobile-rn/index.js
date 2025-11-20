// Expo entry point - App.tsx is used directly
import { registerRootComponent } from 'expo';
import App from './App';

// Suppress update-related errors in development
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // Ignore update-related errors - they're not critical for development
    if (message.includes('remote update') || 
        message.includes('IOException') ||
        message.includes('Failed to download')) {
      // Silently ignore
      return;
    }
    originalError(...args);
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

