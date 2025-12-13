/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

/**
 * Viseme types based on Rhubarb Lip Sync / Preston Blair standard
 * 
 * A: Closed mouth for M, B, P sounds - slight pressure between lips
 * B: Slightly open, teeth together for K, S, T, and EE sounds  
 * C: Open mouth for EH, AE vowels - medium opening
 * D: Wide open mouth for AA vowel (as in "father")
 * E: Rounded/oval mouth for AO, ER sounds
 * F: Puckered lips for OO, UW, W sounds
 * G: Upper teeth on lower lip for F, V sounds
 * H: Tongue visible for L sound
 * X: Neutral/idle closed mouth for silence
 */
export type Viseme = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

export type MouthShape = {
  /** Current viseme being displayed */
  viseme: Viseme;
  /** Intensity/weight of the current viseme (0-1) for smooth blending */
  intensity: number;
  /** Raw openness value for fine-tuning */
  open: number;
  /** Raw spread value for fine-tuning */
  spread: number;
  /** Raw roundness value for fine-tuning */
  round: number;
};

export type FaceResults = {
  /** A value that represents how open the eyes are. */
  eyesScale: number;
  /** A value that represents how open the mouth is. */
  mouthScale: number;
};

function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

// Constrain value between lower and upper limits
function clamp(x: number, lowerlimit: number, upperlimit: number) {
  if (x < lowerlimit) x = lowerlimit;
  if (x > upperlimit) x = upperlimit;
  return x;
}

// GLSL smoothstep implementation
function smoothstep(edge0: number, edge1: number, x: number) {
  // Scale, bias, and saturate to range [0,1]
  x = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  // Apply cubic polynomial smoothing
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

// Helper for linear interpolation smoothing
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

/**
 * Determines the appropriate viseme based on audio frequency analysis
 * Uses formant analysis to approximate phoneme categories
 */
function determineViseme(
  bass: number,
  mids: number,
  highs: number,
  open: number,
  spread: number,
  round: number
): Viseme {
  // Calculate total energy to detect silence
  const totalEnergy = bass + mids + highs;

  // X: Silence / Idle - very low or no audio
  if (totalEnergy < 0.08) {
    return 'X';
  }

  // Calculate ratios for better phoneme detection
  const bassToMidRatio = mids > 0.01 ? bass / mids : bass * 10;

  // G: F, V sounds - high frequency sibilance with moderate mids
  // These sounds have friction noise in high frequencies
  if (highs > 0.25 && spread > 0.4 && open < 0.3) {
    return 'G';
  }

  // B: S, T, K, EE sounds - high frequency with teeth together
  // Strong high frequencies, moderate spread, low opening
  if (highs > 0.2 && spread > 0.3 && open < 0.4) {
    return 'B';
  }

  // A: M, B, P sounds - closed mouth with nasal/bilabial
  // Strong bass (nasal resonance), low mids and highs
  if (bass > 0.15 && open < 0.15 && mids < 0.2) {
    return 'A';
  }

  // F: OO, UW, W sounds - puckered/rounded lips
  // Strong roundness, moderate opening, low spread
  if (round > 0.5 && spread < 0.2) {
    return 'F';
  }

  // E: AO, ER sounds - rounded but more open than F
  // Moderate roundness and opening
  if (round > 0.3 && open > 0.2 && open < 0.6 && spread < 0.3) {
    return 'E';
  }

  // D: AA sound (as in "father") - wide open mouth
  // Very high opening, strong mids (vowel formants)
  if (open > 0.6 && mids > 0.3) {
    return 'D';
  }

  // C: EH, AE sounds - medium open mouth
  // Moderate opening and mids
  if (open > 0.3 && open <= 0.6 && mids > 0.15) {
    return 'C';
  }

  // H: L sound - tongue visible (we approximate this)
  // L has specific formant pattern with moderate everything
  if (mids > 0.2 && bassToMidRatio > 0.8 && bassToMidRatio < 1.2 && open > 0.2 && open < 0.4) {
    return 'H';
  }

  // Default fallback based on opening level
  if (open > 0.4) return 'C';
  if (open > 0.15) return 'B';
  return 'X';
}

export default function useFace() {
  const { audioStreamer } = useLiveAPIContext();
  const eyeScale = useBlink({ speed: 0.0125 });

  // State for mouth shape with viseme
  const [mouthShape, setMouthShape] = useState<MouthShape>({
    viseme: 'X',
    intensity: 0,
    open: 0,
    spread: 0,
    round: 0,
  });

  // Refs for smoothing
  const currentShape = useRef({ open: 0, spread: 0, round: 0 });
  const currentViseme = useRef<Viseme>('X');
  const visemeHoldTime = useRef(0);

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
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      analyser.getByteFrequencyData(dataArray);

      // Frequency resolution: 24000Hz / 512 = ~46.8Hz per bin
      let bass = 0;   // ~60-500Hz (Fundamental voice pitch)
      let mids = 0;   // ~500-2500Hz (Vowel formants)
      let highs = 0;  // ~2500Hz+ (Consonants, sibilance)

      // Range summation (approximate bins)
      for (let i = 1; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        if (i <= 10) bass += val;      // ~450Hz
        else if (i <= 54) mids += val; // ~2500Hz
        else highs += val;             // >2500Hz
      }

      // Averaging
      bass /= 10;
      mids /= 44;
      highs /= (bufferLength - 55);

      // Noise gate / Threshold
      const threshold = 0.05;
      if (bass < threshold) bass = 0;
      if (mids < threshold) mids = 0;
      if (highs < threshold) highs = 0;

      // --- Shape Logic ---

      // 1. Openness (Jaw) - adjusted for better sensitivity
      const targetOpen = Math.min(1, (bass * 0.6 + mids * 1.2) * 0.6);

      // 2. Spread (Width) - for consonants and EE sounds
      const targetSpread = Math.min(1, highs * 3.5);

      // 3. Roundness (Pucker) - for O, U sounds
      const targetRound = Math.min(1, Math.max(0, (mids * 2.0) * (1 - highs * 3)));

      // --- Smoothing with different attack/decay ---
      // Faster attack (opening), slower decay (closing) for natural movement
      const attackFactor = 0.25;
      const decayFactor = 0.12;

      const openFactor = targetOpen > currentShape.current.open ? attackFactor : decayFactor;
      const spreadFactor = targetSpread > currentShape.current.spread ? attackFactor : decayFactor;
      const roundFactor = targetRound > currentShape.current.round ? attackFactor : decayFactor;

      currentShape.current.open = lerp(currentShape.current.open, targetOpen, openFactor);
      currentShape.current.spread = lerp(currentShape.current.spread, targetSpread, spreadFactor);
      currentShape.current.round = lerp(currentShape.current.round, targetRound, roundFactor);

      // Determine viseme based on current audio characteristics
      const newViseme = determineViseme(
        bass,
        mids,
        highs,
        currentShape.current.open,
        currentShape.current.spread,
        currentShape.current.round
      );

      // Viseme hold logic - prevent too rapid switching
      // Hold a viseme for at least 50ms before switching
      const MIN_VISEME_HOLD = 0.05; // 50ms
      visemeHoldTime.current += deltaTime;

      if (newViseme !== currentViseme.current && visemeHoldTime.current >= MIN_VISEME_HOLD) {
        currentViseme.current = newViseme;
        visemeHoldTime.current = 0;
      }

      // Calculate intensity based on total energy
      const totalEnergy = bass + mids + highs;
      const intensity = Math.min(1, totalEnergy * 2);

      setMouthShape({
        viseme: currentViseme.current,
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
