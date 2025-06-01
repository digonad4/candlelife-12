
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4928341b6e694088a6ef178527030fde',
  appName: 'CandleLife',
  webDir: 'dist',
  server: {
    url: "https://4928341b-6e69-4088-a6ef-178527030fde.lovableproject.com?forceHideBadge=true",
    cleartext: true,
    androidScheme: "https"
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#8B5CF6",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6",
      showSpinner: false
    }
  }
};

export default config;
