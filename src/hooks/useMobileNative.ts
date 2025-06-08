
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface MobileNativeState {
  isNative: boolean;
  platform: string;
  safeAreaInsets: SafeAreaInsets;
  statusBarHeight: number;
  navigationBarHeight: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

export const useMobileNative = () => {
  const [state, setState] = useState<MobileNativeState>({
    isNative: false,
    platform: 'web',
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    statusBarHeight: 0,
    navigationBarHeight: 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    const initializeNativeFeatures = async () => {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      
      setState(prev => ({
        ...prev,
        isNative,
        platform,
      }));

      if (isNative) {
        try {
          // Get safe area insets using CSS environment variables
          const getSafeAreaInsets = () => {
            // Create a temporary element to read CSS env variables
            const testElement = document.createElement('div');
            testElement.style.position = 'fixed';
            testElement.style.top = '0';
            testElement.style.left = '0';
            testElement.style.width = '1px';
            testElement.style.height = '1px';
            testElement.style.opacity = '0';
            testElement.style.pointerEvents = 'none';
            document.body.appendChild(testElement);

            // Set styles to read env values
            testElement.style.paddingTop = 'env(safe-area-inset-top)';
            testElement.style.paddingBottom = 'env(safe-area-inset-bottom)';
            testElement.style.paddingLeft = 'env(safe-area-inset-left)';
            testElement.style.paddingRight = 'env(safe-area-inset-right)';

            const computedStyle = window.getComputedStyle(testElement);
            const insets = {
              top: parseInt(computedStyle.paddingTop) || 0,
              bottom: parseInt(computedStyle.paddingBottom) || 0,
              left: parseInt(computedStyle.paddingLeft) || 0,
              right: parseInt(computedStyle.paddingRight) || 0,
            };

            document.body.removeChild(testElement);
            return insets;
          };

          const insets = getSafeAreaInsets();
          
          // Get status bar info - just check if it's visible
          const statusBarInfo = await StatusBar.getInfo();
          const statusBarHeight = statusBarInfo.visible ? (insets.top || 24) : 0;
          
          setState(prev => ({
            ...prev,
            safeAreaInsets: insets,
            statusBarHeight,
          }));

          // Set up keyboard listeners
          const keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
            setState(prev => ({
              ...prev,
              keyboardHeight: info.keyboardHeight,
              isKeyboardOpen: true,
            }));
            
            // Apply CSS custom properties
            document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
            document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
          });

          const keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
            setState(prev => ({
              ...prev,
              keyboardHeight: 0,
              isKeyboardOpen: false,
            }));
            
            // Reset CSS custom properties
            document.documentElement.style.removeProperty('--keyboard-height');
            document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
          });

          // Set initial CSS custom properties for safe areas
          document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
          document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
          document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
          document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
          document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);

          console.log('🚀 Native features initialized:', {
            safeArea: insets,
            statusBarHeight,
            platform,
          });

          // Return cleanup function
          return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
          };
        } catch (error) {
          console.error('❌ Error initializing native features:', error);
        }
      } else {
        // Web fallback - set default values
        document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
        document.documentElement.style.setProperty('--status-bar-height', '0px');
      }
    };

    initializeNativeFeatures();
  }, []);

  const applySafeAreaPadding = (element: 'top' | 'bottom' | 'left' | 'right' | 'all') => {
    if (element === 'all') {
      return {
        paddingTop: `var(--safe-area-inset-top)`,
        paddingBottom: `var(--safe-area-inset-bottom)`,
        paddingLeft: `var(--safe-area-inset-left)`,
        paddingRight: `var(--safe-area-inset-right)`,
      };
    }
    
    return {
      [`padding${element.charAt(0).toUpperCase() + element.slice(1)}`]: `var(--safe-area-inset-${element})`,
    };
  };

  return {
    ...state,
    applySafeAreaPadding,
  };
};
