# Google Ads Setup Guide

This guide explains how to set up Google Mobile Ads (AdMob) in the Nogalss Mobile App.

## Prerequisites

1. **Google AdMob Account**: Create an account at [https://admob.google.com](https://admob.google.com)
2. **App Registration**: Register your app in the AdMob console
3. **Ad Unit IDs**: Create banner ad units for both Android and iOS

## Current Configuration

The app is currently configured with **test ad unit IDs** for development and testing:

- **Android Test App ID**: `ca-app-pub-3940256099942544~3347511713`
- **iOS Test App ID**: `ca-app-pub-3940256099942544~1458002511`
- **Test Banner Ad Unit ID**: `ca-app-pub-3940256099942544/6300978111` (used by default)

## Setup Steps

### 1. Get Your Ad Unit IDs

1. Log in to [Google AdMob Console](https://apps.admob.com)
2. Create a new app or select your existing app
3. Create a new ad unit:
   - Type: **Banner**
   - Name: e.g., "Nogalss Banner Ad"
   - Copy the Ad Unit ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`)

### 2. Update Configuration for Production

#### Option A: Environment Variables (Recommended)

Create a `.env` file in the project root:

```env
GOOGLE_MOBILE_ADS_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
GOOGLE_MOBILE_ADS_APP_ID_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
GOOGLE_MOBILE_ADS_BANNER_UNIT_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

#### Option B: Update app.json

Update the `app.json` file:

```json
{
  "expo": {
    "extra": {
      "googleMobileAdsAppId": {
        "android": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
        "ios": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
      }
    }
  }
}
```

### 3. Update Banner Ad Component

In your dashboard components, replace the test ad unit ID with your production ad unit ID:

```tsx
<BannerAdComponent 
  adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" // Your production ad unit ID
  position="bottom"
/>
```

Or create a config file:

```typescript
// src/config/ads.ts
export const AD_CONFIG = {
  BANNER_AD_UNIT_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test ID
    : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Production ID
};
```

Then use it:

```tsx
import { AD_CONFIG } from '../config/ads';

<BannerAdComponent 
  adUnitId={AD_CONFIG.BANNER_AD_UNIT_ID}
  position="bottom"
/>
```

## Testing

### Test Ad Unit IDs

Google provides test ad unit IDs that always return test ads:

- **Banner Test ID**: `ca-app-pub-3940256099942544/6300978111`
- **Android Test App ID**: `ca-app-pub-3940256099942544~3347511713`
- **iOS Test App ID**: `ca-app-pub-3940256099942544~1458002511`

These are currently configured in the app for development.

### Verify Test Ads

1. Build and run the app
2. Navigate to any dashboard (Finance, Member, or Leader)
3. You should see a test banner ad at the bottom
4. The ad should display "Test Ad" label

## Implementation Details

### Files Modified

1. **`app.json`**: Added Expo config plugin and Google Ads configuration
2. **`app.plugin.js`**: Custom Expo config plugin for Google Mobile Ads
3. **`src/components/BannerAd.tsx`**: Reusable banner ad component
4. **Dashboard Screens**: Integrated banner ads into:
   - `FinanceDashboard.tsx`
   - `MemberDashboard.tsx`
   - `LeaderDashboard.tsx`

### Banner Ad Placement

Banner ads are placed at the **bottom** of each dashboard screen:
- Non-intrusive placement
- Doesn't interfere with main content
- Easy to dismiss by scrolling

### Ad Loading Behavior

- Ads initialize automatically when the component mounts
- Failed ad loads are handled silently (no error shown to users)
- Ads are refreshed automatically by the Google Mobile Ads SDK

## Building for Production

### Development Build

Since Google Mobile Ads requires native modules, you need to create a **development build** (not Expo Go):

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Production Build

1. Update ad unit IDs to production values
2. Build the app:

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

## Important Notes

1. **Expo Go Limitation**: Google Mobile Ads **does not work** in Expo Go. You must use a development build or production build.

2. **AdMob Policies**: Ensure your app complies with [AdMob policies](https://support.google.com/admob/answer/6128543)

3. **Revenue Optimization**: 
   - Use adaptive banner sizes for better performance
   - Consider implementing interstitial ads for key actions
   - Monitor ad performance in AdMob console

4. **User Experience**:
   - Don't place ads too close to interactive elements
   - Ensure ads don't block important content
   - Consider ad frequency capping

## Troubleshooting

### Ads Not Showing

1. **Check Ad Unit IDs**: Verify you're using the correct ad unit IDs
2. **Check Network**: Ensure device has internet connection
3. **Check Logs**: Look for error messages in console/logcat
4. **Verify App ID**: Ensure App ID is correctly configured in `app.json`

### Build Errors

1. **Native Modules**: Ensure you're using a development build, not Expo Go
2. **Config Plugin**: Verify `app.plugin.js` is correctly referenced in `app.json`
3. **Dependencies**: Run `npm install` to ensure all packages are installed

### Test Ads Not Working

- Ensure you're using the test ad unit IDs provided by Google
- Test ads only work in development builds, not in production builds
- Check that the Google Mobile Ads SDK is properly initialized

## Support

For more information:
- [Google Mobile Ads Documentation](https://developers.google.com/admob)
- [React Native Google Mobile Ads](https://github.com/react-native-google-mobile-ads/react-native-google-mobile-ads)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

