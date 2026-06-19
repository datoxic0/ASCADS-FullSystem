class AudioEngine {
  private context: AudioContext | null = null;
  private oscillators: Map<string, { osc: OscillatorNode, gain: GainNode }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.context = new AudioCtx();
    }
  }

  private init() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  playBuzzer(id: string, frequency: number = 1000) {
    this.init();
    if (!this.context) return;
    if (this.oscillators.has(id)) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);
    
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, this.context.currentTime + 0.01);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    this.oscillators.set(id, { osc, gain });
    console.log(`[AUDIO] Buzzer ${id} started at ${frequency}Hz`);
  }

  stopBuzzer(id: string) {
    const active = this.oscillators.get(id);
    if (!active || !this.context) return;

    // Fast but stable fade out
    const fadeOut = 0.04;
    active.gain.gain.setValueAtTime(active.gain.gain.value, this.context.currentTime);
    active.gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + fadeOut);
    
    setTimeout(() => {
      try {
        active.osc.stop();
        active.osc.disconnect();
        active.gain.disconnect();
        this.oscillators.delete(id);
      } catch (e) {
        // Safe catch
      }
    }, fadeOut * 1000 + 20);
  }

  stopAll() {
    if (!this.context) return;
    this.oscillators.forEach((_, id) => {
      this.stopBuzzer(id);
    });
  }
}

export const audioEngine = new AudioEngine();
