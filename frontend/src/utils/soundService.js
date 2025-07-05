// src/utils/soundService.js
class SoundService {
  constructor() {
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  playTone(frequency, duration = 0.33) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Configure volume envelope
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  noteNameToFrequency(noteName) {
    // A4 = 440Hz (standard tuning reference)
    const A4 = 440;
    const noteMap = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 
      'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    // Extract note and octave
    const match = noteName.match(/([A-Ga-g][#b]?)(\d+)/);
    if (!match) return A4;
    
    const note = match[1].toUpperCase();
    const octave = parseInt(match[2]);
    
    // Calculate semitones from A4
    const semitonesFromA4 = (octave - 4) * 12 + noteMap[note] - 9;
    return A4 * Math.pow(2, semitonesFromA4 / 12);
  }
}

// Export as singleton instance
export default new SoundService();