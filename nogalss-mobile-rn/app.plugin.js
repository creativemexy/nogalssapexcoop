const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo config plugin for Google Mobile Ads
 */
const withGoogleMobileAds = (config) => {
  // Android configuration
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add INTERNET permission if not already present
    const permissions = androidManifest.manifest.permission || [];
    const hasInternetPermission = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.INTERNET'
    );
    
    if (!hasInternetPermission) {
      androidManifest.manifest.permission = [
        ...permissions,
        { $: { 'android:name': 'android.permission.INTERNET' } },
      ];
    }

    // Add AdMob App ID meta-data
    const application = androidManifest.manifest.application[0];
    const metaData = application['meta-data'] || [];
    
    const hasAdMobAppId = metaData.some(
      (meta) => meta.$['android:name'] === 'com.google.android.gms.ads.APPLICATION_ID'
    );

    if (!hasAdMobAppId) {
      application['meta-data'] = [
        ...metaData,
        {
          $: {
            'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
            'android:value': config.extra?.googleMobileAdsAppId || 'ca-app-pub-3940256099942544~3347511713', // Test App ID
          },
        },
      ];
    }

    return config;
  });

  // iOS configuration
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // Add GADApplicationIdentifier for iOS
    if (!infoPlist.GADApplicationIdentifier) {
      infoPlist.GADApplicationIdentifier = 
        config.extra?.googleMobileAdsAppId || 'ca-app-pub-3940256099942544~1458002511'; // Test App ID for iOS
    }

    return config;
  });

  return config;
};

module.exports = withGoogleMobileAds;

