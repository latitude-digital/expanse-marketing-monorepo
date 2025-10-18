const IS_STAGING = process.env.APP_VARIANT === 'staging';

export default {
  expo: {
    name: IS_STAGING ? "Meridian Events (Staging)" : "Meridian Events",
    slug: "meridian-events",
    version: "1.0.0",
    runtimeVersion: {
      policy: "appVersion"
    },
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    updates: {
      url: "https://u.expo.dev/8c91d982-ab7b-48a5-81ef-6ef7c316b876",
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_STAGING ? "com.meridianeventtech.app.staging" : "com.meridianeventtech.app",
      buildNumber: "1",
      icon: "./assets/icon.png",
      googleServicesFile: IS_STAGING ? "./GoogleService-Info-Staging.plist" : "./GoogleService-Info.plist",
      infoPlist: {
        UILaunchStoryboardName: "SplashScreen",
        UIViewControllerBasedStatusBarAppearance: false,
        UIStatusBarHidden: false,
        UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown"],
        "UISupportedInterfaceOrientations~ipad": ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown", "UIInterfaceOrientationLandscapeLeft", "UIInterfaceOrientationLandscapeRight"],
        NSCameraUsageDescription: "This app needs access to the camera to scan QR codes and driver's licenses.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to help you find nearby events.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: IS_STAGING ? "com.meridianeventtech.surveyjs.staging" : "com.meridianeventtech.surveyjs",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_NETWORK_STATE",
        "INTERNET",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      intentFilters: [
        {
          action: "VIEW",
          category: ["DEFAULT", "BROWSABLE"],
          data: {
            scheme: "meridian-events"
          }
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    scheme: "meridian-events",
    plugins: [
      "expo-router",
      "expo-updates",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            buildReactNativeFromSource: true
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash.png",
          dark: {
            image: "./assets/splash.png",
            backgroundColor: "#000000"
          },
          imageWidth: 600
        }
      ],
      [
        "expo-sqlite", 
        {
          enableFTS: true,
          useSQLCipher: true
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to scan QR codes and driver's licenses."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "8c91d982-ab7b-48a5-81ef-6ef7c316b876"
      },
      NODE_ENV: IS_STAGING ? "staging" : "production",
      EXPO_PUBLIC_API_URL: IS_STAGING ? "https://staging-api.meridianeventtech.com" : "https://api.meridianeventtech.com",
      EXPO_PUBLIC_WEB_APP_URL: IS_STAGING ? "https://staging.meridianeventtech.com" : "https://app.meridianeventtech.com",
      EXPO_PUBLIC_APP_ENV: IS_STAGING ? "staging" : "production",
      EXPO_PUBLIC_DEBUG_MODE: IS_STAGING ? "true" : "false",
      EXPO_PUBLIC_ENABLE_LOGGING: IS_STAGING ? "true" : "false",
      EXPO_PUBLIC_SYNC_INTERVAL_MS: "30000",
      EXPO_PUBLIC_MAX_RETRY_ATTEMPTS: "3",
      EXPO_PUBLIC_OFFLINE_STORAGE_LIMIT_MB: "100",
      EXPO_PUBLIC_DB_ENCRYPTION_KEY: "default-dev-key-change-in-prod"
    }
  }
};