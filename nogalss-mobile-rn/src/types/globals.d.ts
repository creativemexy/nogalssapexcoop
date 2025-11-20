// Global type declarations for React Native

declare const __DEV__: boolean;

// Web-specific globals
declare const window: {
  confirm?: (message: string) => boolean;
} & typeof globalThis;

// Add other global type declarations as needed

// Error handling for Expo Go update errors
declare namespace Error {
  interface Error {
    message?: string;
  }
}

