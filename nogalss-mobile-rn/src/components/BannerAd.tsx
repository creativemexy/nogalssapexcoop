import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface BannerAdComponentProps {
  /**
   * Ad unit ID. Use TestIds.BANNER for testing, or your actual ad unit ID for production
   * Format: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
   */
  adUnitId?: string;
  
  /**
   * Banner ad size. Defaults to BANNER
   */
  size?: BannerAdSize;
  
  /**
   * Position of the banner. 'top' or 'bottom'. Defaults to 'bottom'
   */
  position?: 'top' | 'bottom';
  
  /**
   * Callback when ad loads successfully
   */
  onAdLoaded?: () => void;
  
  /**
   * Callback when ad fails to load
   */
  onAdFailedToLoad?: (error: Error) => void;
}

/**
 * Banner Ad Component for Google Mobile Ads
 * 
 * Usage:
 * ```tsx
 * <BannerAdComponent 
 *   adUnitId="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
 *   position="bottom"
 * />
 * ```
 * 
 * For testing, use TestIds.BANNER:
 * ```tsx
 * <BannerAdComponent adUnitId={TestIds.BANNER} />
 * ```
 */
export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  adUnitId = TestIds.BANNER, // Default to test ID
  size = BannerAdSize.BANNER,
  position = 'bottom',
  onAdLoaded,
  onAdFailedToLoad,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Google Mobile Ads
    const initializeAds = async () => {
      try {
        await mobileAds().initialize();
        setIsInitialized(true);
        console.log('Google Mobile Ads initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google Mobile Ads:', error);
        setAdError('Failed to initialize ads');
      }
    };

    initializeAds();
  }, []);

  if (!isInitialized) {
    // Don't render anything while initializing
    return null;
  }

  if (adError) {
    // Silently fail - don't show error to users
    return null;
  }

  const containerStyle = position === 'top' 
    ? [styles.container, styles.topContainer]
    : [styles.container, styles.bottomContainer];

  return (
    <View style={containerStyle}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
          onAdLoaded?.();
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
          setAdError(error.message);
          onAdFailedToLoad?.(error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  topContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

