
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.candlelife.app',
  appName: 'CandleLife',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher_foreground",
      iconColor: "#8B5CF6",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  },
  server: {
    url: "https://4928341b-6e69-4088-a6ef-178527030fde.lovableproject.com?forceHideBadge=true",
    cleartext: true,
    androidScheme: "https"
  }
};

export default config;
