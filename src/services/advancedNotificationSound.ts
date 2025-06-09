
class AdvancedNotificationSoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private currentSoundType: 'beep' | 'chime' | 'bell' | 'custom' = 'beep';
  private customSoundUrl: string | null = null;
  private isInitialized = false;
  private unlockAttempted = false;

  constructor() {
    this.initializeAudio();
    this.loadSettings();
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

  private loadSettings() {
    const savedSoundType = localStorage.getItem('notification_sound_type');
    const savedCustomUrl = localStorage.getItem('notification_custom_sound');
    const savedEnabled = localStorage.getItem('notification_sound_enabled');

    if (savedSoundType) {
      this.currentSoundType = savedSoundType as 'beep' | 'chime' | 'bell' | 'custom';
    }
    if (savedCustomUrl) {
      this.customSoundUrl = savedCustomUrl;
    }
    if (savedEnabled !== null) {
      this.isEnabled = savedEnabled === 'true';
    }
  }

  private saveSettings() {
    localStorage.setItem('notification_sound_type', this.currentSoundType);
    localStorage.setItem('notification_sound_enabled', this.isEnabled.toString());
    if (this.customSoundUrl) {
      localStorage.setItem('notification_custom_sound', this.customSoundUrl);
    }
  }

  private async createBeepSound() {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  private async createChimeSound() {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    for (let i = 0; i < notes.length; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(notes[i], this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + i * 0.2;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    }
  }

  private async createBellSound() {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gainNode.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1);
  }

  private async playCustomSound() {
    if (!this.customSoundUrl) {
      console.warn('No custom sound URL available');
      return;
    }

    try {
      const audio = new Audio(this.customSoundUrl);
      audio.volume = 0.5;
      await audio.play();
    } catch (error) {
      console.warn('Failed to play custom sound:', error);
      // Fallback to beep
      await this.createBeepSound();
    }
  }

  async play() {
    if (!this.isEnabled) {
      console.log('🔇 Notification sound disabled');
      return;
    }

    try {
      console.log(`🔊 Playing ${this.currentSoundType} notification sound`);
      
      switch (this.currentSoundType) {
        case 'beep':
          await this.createBeepSound();
          break;
        case 'chime':
          await this.createChimeSound();
          break;
        case 'bell':
          await this.createBellSound();
          break;
        case 'custom':
          await this.playCustomSound();
          break;
        default:
          await this.createBeepSound();
      }
      
      console.log('✅ Notification sound played successfully');
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  setSoundType(type: 'beep' | 'chime' | 'bell' | 'custom') {
    this.currentSoundType = type;
    this.saveSettings();
    console.log(`🔊 Sound type changed to: ${type}`);
  }

  setCustomSound(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('audio/')) {
        reject(new Error('Arquivo deve ser um áudio'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Arquivo muito grande (máximo 5MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.customSoundUrl = result;
        this.saveSettings();
        console.log('🎵 Custom sound uploaded successfully');
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.saveSettings();
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  getCurrentSoundType() {
    return this.currentSoundType;
  }

  isAudioEnabled() {
    return this.isEnabled;
  }

  hasCustomSound() {
    return !!this.customSoundUrl;
  }

  async testSound(type?: 'beep' | 'chime' | 'bell' | 'custom') {
    const originalType = this.currentSoundType;
    if (type) {
      this.currentSoundType = type;
    }
    await this.play();
    this.currentSoundType = originalType;
  }
}

export const advancedNotificationSoundService = new AdvancedNotificationSoundService();
