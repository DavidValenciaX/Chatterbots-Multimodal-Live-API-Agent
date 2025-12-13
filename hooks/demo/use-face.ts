/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

/**
 * Wawa-Lipsync inspired viseme types (15 visemes)
 * These represent specific mouth positions for different phonemes
 */
export type WawaViseme =
  | 'sil'  // Silence
  | 'PP'   // P, B, M - Bilabial plosives
  | 'FF'   // F, V - Labiodental fricatives  
  | 'TH'   // Th sounds
  | 'DD'   // D, T, N - Alveolar
  | 'kk'   // K, G - Velar
  | 'CH'   // Ch, J, Sh - Postalveolar
  | 'SS'   // S, Z - Sibilants
  | 'nn'   // N, L - Nasal/Lateral
  | 'RR'   // R sounds
  | 'aa'   // A vowel (open)
  | 'E'    // E vowel
  | 'I'    // I vowel (EE)
  | 'O'    // O vowel
  | 'U';   // U vowel (OO)

/**
 * Simplified rendering visemes based on Preston Blair / Rhubarb standard
 * Maps from the 15 wawa visemes to 9 render shapes
 */
export type Viseme = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

export type MouthShape = {
  /** Current viseme being displayed */
  viseme: Viseme;
  /** Wawa-lipsync viseme for debugging */
  wawaViseme: WawaViseme;
  /** Intensity/weight of the current viseme (0-1) */
  intensity: number;
  /** Raw openness value for fine-tuning */
  open: number;
  /** Raw spread value for fine-tuning */
  spread: number;
  /** Raw roundness value for fine-tuning */
  round: number;
};

export type FaceResults = {
  eyesScale: number;
  mouthScale: number;
};

function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

function clamp(x: number, lowerlimit: number, upperlimit: number) {
  if (x < lowerlimit) x = lowerlimit;
  if (x > upperlimit) x = upperlimit;
  return x;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  x = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

type BlinkProps = {
  speed: number;
};

export function useBlink({ speed }: BlinkProps) {
  const [eyeScale, setEyeScale] = useState(1);
  const [frame, setFrame] = useState(0);
  const frameId = useRef(-1);

  useEffect(() => {
    function nextFrame() {
      frameId.current = globalThis.requestAnimationFrame(() => {
        setFrame(frame + 1);
        let s = easeOutQuint((Math.sin(frame * speed) + 1) * 2);
        s = smoothstep(0.1, 0.25, s);
        s = Math.min(1, s);
        setEyeScale(s);
        nextFrame();
      });
    }

    nextFrame();

    return () => {
      globalThis.cancelAnimationFrame(frameId.current);
    };
  }, [speed, eyeScale, frame]);

  return eyeScale;
}

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

/**
 * Feature extraction for audio analysis (inspired by wawa-lipsync)
 */
interface AudioFeatures {
  /** Frequency bands (normalized) */
  bands: number[];
  /** Rate of change in bands */
  deltaBands: number[];
  /** Overall volume */
  volume: number;
  /** Spectral centroid (brightness) */
  centroid: number;
}

/**
 * Maps 15 wawa visemes to 9 rendering visemes
 */
function mapWawaToRenderViseme(wawaViseme: WawaViseme): Viseme {
  switch (wawaViseme) {
    case 'sil': return 'X';  // Silence -> Neutral
    case 'PP': return 'A';   // P, B, M -> Closed lips
    case 'FF': return 'G';   // F, V -> Teeth on lip
    case 'TH': return 'B';   // TH -> Teeth visible
    case 'DD': return 'B';   // D, T -> Teeth visible
    case 'kk': return 'C';   // K, G -> Slightly open
    case 'CH': return 'B';   // CH, SH -> Teeth/spread
    case 'SS': return 'B';   // S, Z -> Teeth visible
    case 'nn': return 'H';   // N, L -> Tongue visible
    case 'RR': return 'E';   // R -> Rounded
    case 'aa': return 'D';   // A -> Wide open
    case 'E': return 'C';    // E -> Medium open
    case 'I': return 'B';    // I/EE -> Spread/teeth
    case 'O': return 'E';    // O -> Rounded
    case 'U': return 'F';    // U/OO -> Puckered
    default: return 'X';
  }
}

/**
 * Computes viseme scores based on audio features
 * Algorithm inspired by wawa-lipsync
 */
function computeVisemeScores(
  features: AudioFeatures,
  avgFeatures: AudioFeatures,
  deltaVolume: number,
  _deltaCentroid: number
): Record<WawaViseme, number> {
  const scores: Record<WawaViseme, number> = {
    sil: 0, PP: 0, FF: 0, TH: 0, DD: 0, kk: 0, CH: 0, SS: 0,
    nn: 0, RR: 0, aa: 0, E: 0, I: 0, O: 0, U: 0
  };

  const { bands, volume, centroid } = features;

  // Silence detection
  if (volume < 0.02) {
    scores.sil = 1;
    return scores;
  }

  // Normalize bands relative to average
  const normalizedBands = bands.map((b, i) =>
    avgFeatures.bands[i] > 0 ? b / avgFeatures.bands[i] : b
  );

  // Low frequencies (0-500Hz) - indices 0-2
  const lowEnergy = (normalizedBands[0] + normalizedBands[1] + normalizedBands[2]) / 3;

  // Mid frequencies (500-2000Hz) - indices 3-5
  const midEnergy = (normalizedBands[3] + normalizedBands[4] + normalizedBands[5]) / 3;

  // High frequencies (2000-8000Hz) - indices 6-7
  const highEnergy = (normalizedBands[6] + normalizedBands[7]) / 2;

  // --- Bilabials (P, B, M) ---
  // Sharp volume burst after silence, low frequencies dominate
  if (deltaVolume > 0.15 && lowEnergy > midEnergy * 0.8) {
    scores.PP = 0.6 + deltaVolume * 0.4;
  }

  // --- Labiodentals (F, V) ---
  // High frequency friction noise
  if (highEnergy > 0.4 && centroid > 3000) {
    scores.FF = 0.5 + highEnergy * 0.3;
  }

  // --- Dentals/Alveolars (TH, D, T, N) ---
  // Mid-high frequencies with moderate volume
  if (midEnergy > 0.3 && highEnergy > 0.2 && volume < 0.6) {
    scores.TH = 0.3 + midEnergy * 0.2;
    scores.DD = 0.4 + midEnergy * 0.3;
  }

  // --- Sibilants (S, Z) ---
  // Very strong high frequencies
  if (highEnergy > 0.6 && centroid > 4000) {
    scores.SS = 0.7 + highEnergy * 0.3;
  }

  // --- Postalveolars (CH, SH, J) ---
  // Moderate high frequencies, lower than sibilants
  if (highEnergy > 0.3 && highEnergy < 0.6 && centroid > 2500 && centroid < 4000) {
    scores.CH = 0.5 + highEnergy * 0.3;
  }

  // --- Velars (K, G) ---
  // Short burst with mid frequencies
  if (deltaVolume > 0.1 && midEnergy > lowEnergy) {
    scores.kk = 0.4 + deltaVolume * 0.3;
  }

  // --- Nasals/Laterals (N, L) ---
  // Low frequencies with resonance
  if (lowEnergy > 0.4 && midEnergy > 0.2 && highEnergy < 0.2) {
    scores.nn = 0.5 + lowEnergy * 0.3;
  }

  // --- R sounds ---
  // Mid frequencies, round
  if (midEnergy > 0.3 && lowEnergy > 0.2 && highEnergy < 0.25) {
    scores.RR = 0.4 + midEnergy * 0.3;
  }

  // --- Vowels ---
  // They have strong formants in specific frequency ranges

  // A (open) - strong low-mid, moderate high
  if (lowEnergy > 0.5 && midEnergy > 0.4 && highEnergy < 0.3) {
    scores.aa = 0.6 + volume * 0.3;
  }

  // E - balanced mid frequencies
  if (midEnergy > 0.4 && lowEnergy > 0.2 && lowEnergy < 0.5) {
    scores.E = 0.5 + midEnergy * 0.3;
  }

  // I (EE) - high formant, spread mouth
  if (highEnergy > 0.25 && midEnergy > 0.3 && centroid > 2000) {
    scores.I = 0.5 + highEnergy * 0.3;
  }

  // O - round, low-mid frequencies
  if (lowEnergy > 0.4 && midEnergy > 0.2 && midEnergy < 0.5 && highEnergy < 0.2) {
    scores.O = 0.5 + lowEnergy * 0.3;
  }

  // U (OO) - very low frequencies, puckered
  if (lowEnergy > 0.5 && midEnergy < 0.3 && highEnergy < 0.15 && centroid < 1000) {
    scores.U = 0.6 + lowEnergy * 0.3;
  }

  return scores;
}

/**
 * Select the winning viseme based on scores with consistency adjustment
 */
function selectViseme(
  scores: Record<WawaViseme, number>,
  currentViseme: WawaViseme,
  holdTime: number
): WawaViseme {
  // Find highest scoring viseme
  let maxScore = 0;
  let winningViseme: WawaViseme = 'sil';

  for (const [viseme, score] of Object.entries(scores)) {
    // Boost current viseme slightly to prevent jitter
    const adjustedScore = viseme === currentViseme ? score * 1.15 : score;
    if (adjustedScore > maxScore) {
      maxScore = adjustedScore;
      winningViseme = viseme as WawaViseme;
    }
  }

  // Only switch if held long enough and score is significant
  if (winningViseme !== currentViseme && holdTime < 0.04) {
    return currentViseme;
  }

  // Require minimum score to switch from current
  if (winningViseme !== currentViseme && maxScore < 0.35) {
    return currentViseme;
  }

  return winningViseme;
}

export default function useFace() {
  const { audioStreamer } = useLiveAPIContext();
  const eyeScale = useBlink({ speed: 0.0125 });

  const [mouthShape, setMouthShape] = useState<MouthShape>({
    viseme: 'X',
    wawaViseme: 'sil',
    intensity: 0,
    open: 0,
    spread: 0,
    round: 0,
  });

  // Refs for analysis state
  const currentShape = useRef({ open: 0, spread: 0, round: 0 });
  const currentViseme = useRef<WawaViseme>('sil');
  const visemeHoldTime = useRef(0);

  // History for averaging and deltas
  const featureHistory = useRef<AudioFeatures[]>([]);
  const avgFeatures = useRef<AudioFeatures>({
    bands: new Array(8).fill(0.1),
    deltaBands: new Array(8).fill(0),
    volume: 0.1,
    centroid: 1000
  });
  const lastVolume = useRef(0);
  const lastCentroid = useRef(0);

  useEffect(() => {
    if (!audioStreamer) return;

    const analyser = audioStreamer.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;
    let lastTime = performance.now();

    const analyze = () => {
      animationFrameId = requestAnimationFrame(analyze);

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      analyser.getByteFrequencyData(dataArray);

      // Extract frequency bands (8 bands for detailed analysis)
      // Sample rate is 24000Hz, FFT size 512 -> ~46.8Hz per bin
      const bandRanges = [
        [1, 3],     // ~47-140Hz (Low bass)
        [3, 6],     // ~140-280Hz (Bass/Fundamental)
        [6, 11],    // ~280-515Hz (Low mids)
        [11, 22],   // ~515-1030Hz (Mids)
        [22, 43],   // ~1030-2015Hz (Upper mids)
        [43, 86],   // ~2015-4030Hz (High mids)
        [86, 128],  // ~4030-6000Hz (Highs)
        [128, 170], // ~6000-8000Hz (Very high)
      ];

      const bands: number[] = [];
      let totalEnergy = 0;
      let weightedSum = 0;

      for (const [start, end] of bandRanges) {
        let sum = 0;
        const count = Math.min(end, bufferLength) - start;
        for (let i = start; i < Math.min(end, bufferLength); i++) {
          const val = dataArray[i] / 255;
          sum += val;
          totalEnergy += val;
          weightedSum += val * i * 46.8; // Weighted by frequency
        }
        bands.push(count > 0 ? sum / count : 0);
      }

      // Calculate volume and centroid
      const volume = Math.min(1, totalEnergy / bufferLength);
      const centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;

      // Calculate deltas
      const deltaVolume = volume - lastVolume.current;
      const deltaCentroid = centroid - lastCentroid.current;
      lastVolume.current = volume;
      lastCentroid.current = centroid;

      // Calculate delta bands from history
      const deltaBands = bands.map((b, i) => {
        const lastBands = featureHistory.current[featureHistory.current.length - 1]?.bands;
        return lastBands ? b - lastBands[i] : 0;
      });

      const features: AudioFeatures = { bands, deltaBands, volume, centroid };

      // Update history and running average
      featureHistory.current.push(features);
      if (featureHistory.current.length > 10) {
        featureHistory.current.shift();
      }

      // Update running average
      if (featureHistory.current.length > 0) {
        const avgBands = new Array(8).fill(0);
        let avgVol = 0;
        let avgCent = 0;
        for (const f of featureHistory.current) {
          f.bands.forEach((b, i) => avgBands[i] += b);
          avgVol += f.volume;
          avgCent += f.centroid;
        }
        const len = featureHistory.current.length;
        avgFeatures.current = {
          bands: avgBands.map(b => b / len),
          deltaBands: new Array(8).fill(0),
          volume: avgVol / len,
          centroid: avgCent / len
        };
      }

      // Compute viseme scores
      const scores = computeVisemeScores(features, avgFeatures.current, deltaVolume, deltaCentroid);

      // Update hold time
      visemeHoldTime.current += deltaTime;

      // Select winning viseme
      const newViseme = selectViseme(scores, currentViseme.current, visemeHoldTime.current);

      if (newViseme !== currentViseme.current) {
        currentViseme.current = newViseme;
        visemeHoldTime.current = 0;
      }

      // Calculate shape parameters based on features
      const targetOpen = Math.min(1, volume * 1.5 + (bands[2] + bands[3]) * 0.5);
      const targetSpread = Math.min(1, (bands[5] + bands[6]) * 1.5);
      const targetRound = Math.min(1, Math.max(0, bands[0] * 2 * (1 - targetSpread)));

      // Smooth shape transitions
      const attackFactor = 0.3;
      const decayFactor = 0.15;

      const openFactor = targetOpen > currentShape.current.open ? attackFactor : decayFactor;
      const spreadFactor = targetSpread > currentShape.current.spread ? attackFactor : decayFactor;
      const roundFactor = targetRound > currentShape.current.round ? attackFactor : decayFactor;

      currentShape.current.open = lerp(currentShape.current.open, targetOpen, openFactor);
      currentShape.current.spread = lerp(currentShape.current.spread, targetSpread, spreadFactor);
      currentShape.current.round = lerp(currentShape.current.round, targetRound, roundFactor);

      // Calculate intensity
      const intensity = Math.min(1, volume * 2);

      // Map wawa viseme to render viseme
      const renderViseme = mapWawaToRenderViseme(currentViseme.current);

      setMouthShape({
        viseme: renderViseme,
        wawaViseme: currentViseme.current,
        intensity,
        open: currentShape.current.open,
        spread: currentShape.current.spread,
        round: currentShape.current.round,
      });
    };

    analyze();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioStreamer]);

  return { eyeScale, mouthShape };
}
