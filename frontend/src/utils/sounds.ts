// Audio is loaded lazily because Expo Go clients may not include expo-av.

let isSoundEnabled = true;

/**
 * Play a short haptic-paired system sound.
 * Uses expo-av with very small inline WAV generation.
 */
async function playSystemSound(frequency: number, durationMs: number, volume = 0.3): Promise<void> {
  if (!isSoundEnabled) return;

  try {
    const { Audio } = await import('expo-av');

    // Configure audio session for mixing with other audio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Generate a simple sine wave as a WAV data URI
    const wavBase64 = generateSineWavBase64(frequency, durationMs, volume);
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/wav;base64,${wavBase64}` },
      { shouldPlay: true, volume },
    );

    // Auto-unload after playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Silently fail — sounds are non-critical UI polish
  }
}

/**
 * Generate a raw WAV file as base64 string.
 * Creates a pure sine wave tone — perfect for UI feedback sounds.
 */
function generateSineWavBase64(frequency: number, durationMs: number, volume: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numSamples * numChannels * bytesPerSample;

  // WAV Header (44 bytes)
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate sine wave samples with envelope (attack/decay for smooth sound)
  const attackSamples = Math.min(numSamples * 0.1, sampleRate * 0.01);
  const decaySamples = Math.min(numSamples * 0.3, sampleRate * 0.05);

  for (let i = 0; i < numSamples; i++) {
    let envelope = 1;
    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else if (i > numSamples - decaySamples) {
      envelope = (numSamples - i) / decaySamples;
    }

    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * volume * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * bytesPerSample, intSample, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Use Platform to handle base64 encoding
  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  // Fallback for environments without btoa
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;

    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < binary.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < binary.length ? chars[c & 63] : '=';
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ─── Public Sound API ──────────────────────────────────────────

/** Cheerful ascending two-tone "cha-ching!" for marking as repaid */
export async function playCelebrateSound(): Promise<void> {
  // Quick ascending arpeggio: C5 → E5 → G5
  await playSystemSound(523, 80, 0.25);   // C5
  setTimeout(() => playSystemSound(659, 80, 0.3), 80);  // E5
  setTimeout(() => playSystemSound(784, 150, 0.35), 160); // G5
}

/** Soft "pop" for button taps */
export async function playTapSound(): Promise<void> {
  await playSystemSound(880, 30, 0.15);
}

/** Subtle confirmation tone */
export async function playConfirmSound(): Promise<void> {
  await playSystemSound(660, 60, 0.2);
  setTimeout(() => playSystemSound(880, 80, 0.25), 60);
}

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
}
