
class AdvancedNotificationSoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private isInitialized = false;
  private unlockAttempted = false;
  private customSounds: Map<string, string> = new Map();
  private currentSound = 'default';

  // Tipos de sons disponíveis
  private soundTypes = {
    message: 'Mensagem',
    system: 'Sistema',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso'
  };

  // Sons pré-definidos por tipo
  private predefinedSounds = {
    default: { name: 'Som Padrão', frequency: [800, 600], duration: 0.4 },
    gentle: { name: 'Som Suave', frequency: [440, 330], duration: 0.6 },
    alert: { name: 'Alerta', frequency: [1000, 800], duration: 0.3 },
    chime: { name: 'Sino', frequency: [523, 659, 784], duration: 0.8 },
    notification: { name: 'Notificação', frequency: [700, 900], duration: 0.5 },
    beep: { name: 'Beep', frequency: [1200], duration: 0.2 },
    pop: { name: 'Pop', frequency: [600, 800, 1000], duration: 0.3 }
  };

  constructor() {
    this.initializeAudio();
    this.loadCustomSounds();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.setupMobileAudioUnlock();
      this.isInitialized = true;
      console.log('🔊 Advanced notification sound service initialized');
    } catch (error) {
      console.warn('Failed to initialize advanced notification sound:', error);
    }
  }

  private setupMobileAudioUnlock() {
    if (this.unlockAttempted) return;

    const unlockAudio = async () => {
      this.unlockAttempted = true;
      
      try {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
          console.log('🔊 Audio context resumed for mobile');
        }
      } catch (error) {
        console.warn('Audio unlock failed:', error);
      }
      
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  }

  private loadCustomSounds() {
    try {
      const stored = localStorage.getItem('custom_notification_sounds');
      if (stored) {
        const sounds = JSON.parse(stored);
        this.customSounds = new Map(Object.entries(sounds));
        console.log('📁 Loaded custom sounds:', this.customSounds.size);
      }
      
      const selectedSound = localStorage.getItem('selected_notification_sound');
      if (selectedSound) {
        this.currentSound = selectedSound;
        console.log('🔧 Loaded current sound:', this.currentSound);
      }
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
    }
  }

  private saveCustomSounds() {
    try {
      const soundsObj = Object.fromEntries(this.customSounds);
      localStorage.setItem('custom_notification_sounds', JSON.stringify(soundsObj));
      localStorage.setItem('selected_notification_sound', this.currentSound);
      console.log('💾 Saved custom sounds and current sound:', this.currentSound);
    } catch (error) {
      console.warn('Failed to save custom sounds:', error);
    }
  }

  private async createSynthesizedSound(soundConfig: any) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const { frequency, duration } = soundConfig;
      const frequencies = Array.isArray(frequency) ? frequency : [frequency];
      
      // Criar múltiplos osciladores para tons mais complexos
      const oscillators = frequencies.map(() => this.audioContext!.createOscillator());
      const gainNodes = frequencies.map(() => this.audioContext!.createGain());
      const masterGain = this.audioContext.createGain();
      
      // Conectar osciladores aos nós de ganho
      oscillators.forEach((osc, i) => {
        osc.connect(gainNodes[i]);
        gainNodes[i].connect(masterGain);
      });
      
      masterGain.connect(this.audioContext.destination);
      
      // Configurar frequências e tipos de onda
      oscillators.forEach((osc, i) => {
        osc.frequency.setValueAtTime(frequencies[i], this.audioContext!.currentTime);
        osc.type = frequencies.length > 1 ? 'sine' : 'sine';
        
        if (frequencies.length > 2) {
          // Para sons com múltiplas frequências, criar uma progressão
          const timeStep = duration / frequencies.length;
          frequencies.forEach((freq, j) => {
            osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + (j * timeStep));
          });
        }
      });
      
      // Envelope de volume suave
      const volumePerOsc = 0.2 / frequencies.length;
      gainNodes.forEach(gain => {
        gain.gain.setValueAtTime(0, this.audioContext!.currentTime);
        gain.gain.linearRampToValueAtTime(volumePerOsc, this.audioContext!.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);
      });
      
      // Iniciar e parar osciladores
      const startTime = this.audioContext.currentTime;
      oscillators.forEach(osc => {
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
      
      return Promise.resolve();
    } catch (error) {
      console.warn('Failed to create synthesized sound:', error);
      throw error;
    }
  }

  private async playCustomSound(soundUrl: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🎵 Creating audio element for custom sound');
        const audio = new Audio(soundUrl);
        audio.volume = 0.6;
        audio.preload = 'auto';
        
        // Handlers para garantir que a Promise seja resolvida/rejeitada
        const handleSuccess = () => {
          console.log('✅ Custom sound played successfully');
          cleanup();
          resolve();
        };
        
        const handleError = (error: any) => {
          console.warn('❌ Failed to play custom sound:', error);
          cleanup();
          reject(error);
        };
        
        const cleanup = () => {
          audio.removeEventListener('ended', handleSuccess);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('canplaythrough', onCanPlay);
        };
        
        const onCanPlay = () => {
          audio.play().then(handleSuccess).catch(handleError);
        };
        
        audio.addEventListener('ended', handleSuccess);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplaythrough', onCanPlay);
        
        // Tentar reproduzir imediatamente se já carregado
        if (audio.readyState >= 3) {
          audio.play().then(handleSuccess).catch(handleError);
        }
        
        // Timeout para evitar travamento
        setTimeout(() => {
          if (audio.paused) {
            handleError(new Error('Audio playback timeout'));
          }
        }, 5000);
        
      } catch (error) {
        console.warn('Failed to create audio element:', error);
        reject(error);
      }
    });
  }

  async play(soundType: string = 'message') {
    if (!this.isEnabled) {
      console.log('🔇 Notification sound disabled');
      return;
    }

    try {
      console.log(`🔊 Playing notification sound: ${this.currentSound} for ${soundType}`);
      console.log(`📊 Available custom sounds:`, Array.from(this.customSounds.keys()));
      
      // Verificar se é um som customizado
      if (this.customSounds.has(this.currentSound)) {
        console.log(`🎵 Playing custom sound: ${this.currentSound}`);
        const soundUrl = this.customSounds.get(this.currentSound)!;
        console.log(`🔗 Sound URL:`, soundUrl.substring(0, 50) + '...');
        await this.playCustomSound(soundUrl);
      } else if (this.predefinedSounds[this.currentSound as keyof typeof this.predefinedSounds]) {
        // Som pré-definido
        console.log(`🎼 Playing predefined sound: ${this.currentSound}`);
        const soundConfig = this.predefinedSounds[this.currentSound as keyof typeof this.predefinedSounds];
        await this.createSynthesizedSound(soundConfig);
      } else {
        // Fallback para som padrão
        console.log(`🔄 Fallback to default sound`);
        await this.createSynthesizedSound(this.predefinedSounds.default);
      }
      
      console.log('✅ Notification sound played successfully');
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  async previewSound(soundId: string) {
    console.log(`🎵 Previewing sound: ${soundId}`);
    
    try {
      if (this.customSounds.has(soundId)) {
        const soundUrl = this.customSounds.get(soundId)!;
        await this.playCustomSound(soundUrl);
      } else if (this.predefinedSounds[soundId as keyof typeof this.predefinedSounds]) {
        const soundConfig = this.predefinedSounds[soundId as keyof typeof this.predefinedSounds];
        await this.createSynthesizedSound(soundConfig);
      }
    } catch (error) {
      console.warn('Failed to preview sound:', error);
      throw error;
    }
  }

  async uploadCustomSound(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('audio/')) {
        reject(new Error('Arquivo deve ser um áudio'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limite
        reject(new Error('Arquivo muito grande (máximo 5MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const soundId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.customSounds.set(soundId, result);
        this.saveCustomSounds();
        
        console.log(`📁 Custom sound uploaded: ${soundId}`);
        resolve(soundId);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  removeCustomSound(soundId: string) {
    if (this.customSounds.has(soundId)) {
      this.customSounds.delete(soundId);
      
      // Se o som removido era o selecionado, voltar para o padrão
      if (this.currentSound === soundId) {
        this.currentSound = 'default';
      }
      
      this.saveCustomSounds();
      console.log(`🗑️ Custom sound removed: ${soundId}`);
    }
  }

  setCurrentSound(soundId: string) {
    this.currentSound = soundId;
    this.saveCustomSounds();
    console.log(`🔧 Current sound set to: ${soundId}`);
  }

  getCurrentSound() {
    return this.currentSound;
  }

  getPredefinedSounds() {
    return this.predefinedSounds;
  }

  getCustomSounds() {
    return Array.from(this.customSounds.entries()).map(([id, url]) => ({
      id,
      url,
      name: `Som Personalizado ${id.split('_')[1]}`
    }));
  }

  getSoundTypes() {
    return this.soundTypes;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`🔊 Advanced notification sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  isAudioEnabled() {
    return this.isEnabled;
  }

  async testSound() {
    console.log('🧪 Testing advanced notification sound');
    await this.play('system');
  }
}

export const advancedNotificationSoundService = new AdvancedNotificationSoundService();
