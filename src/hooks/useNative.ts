
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { nativeService } from '@/services/NativeService';
import { Network } from '@capacitor/network';

export const useNative = () => {
  const [isNative, setIsNative] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    const initializeNativeFeatures = async () => {
      if (Capacitor.isNativePlatform()) {
        // Obter informações do dispositivo
        const info = await nativeService.getDeviceInfo();
        setDeviceInfo(info);

        // Monitorar status da rede
        const status = await nativeService.getNetworkStatus();
        setNetworkStatus(status);

        // Listener para mudanças na rede
        Network.addListener('networkStatusChange', (status) => {
          setNetworkStatus(status);
        });
      }
    };

    initializeNativeFeatures();

    return () => {
      if (Capacitor.isNativePlatform()) {
        Network.removeAllListeners();
      }
    };
  }, []);

  const shareContent = async (title: string, text: string, url?: string) => {
    return nativeService.shareContent(title, text, url);
  };

  const showNativeToast = async (message: string, duration: 'short' | 'long' = 'short') => {
    return nativeService.showToast(message, duration);
  };

  const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    return nativeService.hapticFeedback(style);
  };

  const hideKeyboard = async () => {
    return nativeService.hideKeyboard();
  };

  const showKeyboard = async () => {
    return nativeService.showKeyboard();
  };

  return {
    isNative,
    networkStatus,
    deviceInfo,
    shareContent,
    showNativeToast,
    hapticFeedback,
    hideKeyboard,
    showKeyboard,
    isOnline: networkStatus?.connected ?? true,
    connectionType: networkStatus?.connectionType ?? 'unknown'
  };
};
