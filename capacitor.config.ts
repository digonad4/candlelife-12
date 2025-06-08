
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.candlelife.app',
  appName: 'candle-life',
  webDir: 'dist',
  server: {
    url: 'https://63362bbe-d4d5-49b1-afbd-459ad33332f7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#8B5CF6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#8B5CF6'
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#8B5CF6"
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;
