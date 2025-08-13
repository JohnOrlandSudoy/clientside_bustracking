/**
 * Utility functions for notification sounds
 */

// Create audio context for notification sounds
let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (required for modern browsers)
 */
export function initAudioContext(): void {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }
}

/**
 * Play a simple notification sound
 */
export function playNotificationSound(): void {
  if (!audioContext) {
    initAudioContext();
  }

  if (!audioContext) return;

  try {
    // Create oscillator for notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // Drop to 600Hz
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2); // Back to 800Hz

    // Configure volume
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Play a different sound for urgent notifications
 */
export function playUrgentNotificationSound(): void {
  if (!audioContext) {
    initAudioContext();
  }

  if (!audioContext) return;

  try {
    // Create oscillator for urgent notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure urgent sound (higher frequency, longer duration)
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // 1000Hz
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.4);

    // Configure volume
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

  } catch (error) {
    console.warn('Failed to play urgent notification sound:', error);
  }
}

/**
 * Check if browser supports audio context
 */
export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && 
         (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
}

/**
 * Clean up audio context
 */
export function cleanupAudioContext(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
