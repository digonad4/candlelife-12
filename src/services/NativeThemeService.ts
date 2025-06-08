
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

class NativeThemeService {
  private static instance: NativeThemeService;
  
  static getInstance(): NativeThemeService {
    if (!NativeThemeService.instance) {
      NativeThemeService.instance = new NativeThemeService();
    }
    return NativeThemeService.instance;
  }

  // Mapeamento de temas para cores nativas
  private themeColors = {
    light: {
      statusBarStyle: Style.Dark,
      statusBarColor: '#FFFFFF',
      navigationBarColor: '#FFFFFF',
    },
    dark: {
      statusBarStyle: Style.Light,
      statusBarColor: '#0F0F0F',
      navigationBarColor: '#0F0F0F',
    },
    purple: {
      statusBarStyle: Style.Light,
      statusBarColor: '#8B5CF6',
      navigationBarColor: '#8B5CF6',
    },
    green: {
      statusBarStyle: Style.Light,
      statusBarColor: '#10B981',
      navigationBarColor: '#10B981',
    },
    ocean: {
      statusBarStyle: Style.Light,
      statusBarColor: '#0EA5E9',
      navigationBarColor: '#0EA5E9',
    },
    cyberpunk: {
      statusBarStyle: Style.Light,
      statusBarColor: '#FF00FF',
      navigationBarColor: '#FF00FF',
    },
    dracula: {
      statusBarStyle: Style.Light,
      statusBarColor: '#282A36',
      navigationBarColor: '#282A36',
    },
    nord: {
      statusBarStyle: Style.Light,
      statusBarColor: '#5E81AC',
      navigationBarColor: '#5E81AC',
    },
    sunset: {
      statusBarStyle: Style.Light,
      statusBarColor: '#F97316',
      navigationBarColor: '#F97316',
    },
    forest: {
      statusBarStyle: Style.Light,
      statusBarColor: '#059669',
      navigationBarColor: '#059669',
    },
    coffee: {
      statusBarStyle: Style.Light,
      statusBarColor: '#92400E',
      navigationBarColor: '#92400E',
    },
    pastel: {
      statusBarStyle: Style.Dark,
      statusBarColor: '#F3E8FF',
      navigationBarColor: '#F3E8FF',
    },
    neon: {
      statusBarStyle: Style.Light,
      statusBarColor: '#00FFFF',
      navigationBarColor: '#00FFFF',
    },
    vintage: {
      statusBarStyle: Style.Light,
      statusBarColor: '#D2691E',
      navigationBarColor: '#D2691E',
    },
    midnight: {
      statusBarStyle: Style.Light,
      statusBarColor: '#1E1B4B',
      navigationBarColor: '#1E1B4B',
    },
    royal: {
      statusBarStyle: Style.Light,
      statusBarColor: '#7C3AED',
      navigationBarColor: '#7C3AED',
    },
    'super-hacker': {
      statusBarStyle: Style.Light,
      statusBarColor: '#00FF00',
      navigationBarColor: '#000000',
    },
    supabase: {
      statusBarStyle: Style.Light,
      statusBarColor: '#3ECF8E',
      navigationBarColor: '#3ECF8E',
    },
  };

  async applyTheme(themeName: string) {
    if (!Capacitor.isNativePlatform()) {
      console.log('🎨 Theme applied (web mode):', themeName);
      return;
    }

    try {
      const themeConfig = this.themeColors[themeName as keyof typeof this.themeColors] || this.themeColors.light;
      
      // Aplicar estilo da status bar
      await StatusBar.setStyle({ style: themeConfig.statusBarStyle });
      
      // Aplicar cor de fundo da status bar
      await StatusBar.setBackgroundColor({ color: themeConfig.statusBarColor });

      console.log('🎨 Native theme applied:', {
        theme: themeName,
        statusBarStyle: themeConfig.statusBarStyle,
        statusBarColor: themeConfig.statusBarColor,
      });
    } catch (error) {
      console.error('❌ Error applying native theme:', error);
    }
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Configuração inicial da status bar
      await StatusBar.setOverlaysWebView({ overlay: true });
      
      console.log('🎨 Native theme service initialized');
    } catch (error) {
      console.error('❌ Error initializing native theme service:', error);
    }
  }
}

export const nativeThemeService = NativeThemeService.getInstance();
