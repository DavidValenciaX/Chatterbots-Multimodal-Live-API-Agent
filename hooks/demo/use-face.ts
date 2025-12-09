/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

export type FaceResults = {
  /** A value that represents how open the eyes are. */
  eyesScale: number;
  /** A value that represents how open the mouth is. */
  mouthScale: number;
};

/*
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function easeInOutExpo(x: number): number {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2
}

function easeOutCirc(x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2))
}
*/

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
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
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
      frameId.current = window.requestAnimationFrame(() => {
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
      window.cancelAnimationFrame(frameId.current);
    };
  }, [speed, eyeScale, frame]);

  return eyeScale;
}

// Helper for linear interpolation smoothing
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export default function useFace() {
  const { audioStreamer } = useLiveAPIContext();
  const eyeScale = useBlink({ speed: 0.0125 });

  // State for smoothed values to prevent jitter
  const [mouthShape, setMouthShape] = useState({
    open: 0,
    spread: 0,
    round: 0,
  });

  // Refs for smoothing
  const currentShape = useRef({ open: 0, spread: 0, round: 0 });

  useEffect(() => {
    if (!audioStreamer) return;

    const analyser = audioStreamer.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const analyze = () => {
      animationFrameId = requestAnimationFrame(analyze);
      analyser.getByteFrequencyData(dataArray);

      // Wawa-Lipsync inspired logic
      // We look for energy in specific formant bands to detect phonemes

      // Frequency resolution: 24000Hz / 512 = ~46.8Hz per bin

      let bass = 0;   // ~60-500Hz (Fundamental voice pitch)
      let mids = 0;   // ~500-2500Hz (Vowel formants)
      let highs = 0;  // ~2500Hz+ (Consonants, sibilance)

      // Range summation (approximate bins)
      for (let i = 1; i < bufferLength; i++) {
        const val = dataArray[i] / 255.0;
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

      // 1. Openness (Jaw)
      // Driven primarily by volume (bass/mids)
      // "A" sound has high mid energy.
      // Reduced multiplier to prevent exaggerated opening
      const targetOpen = Math.min(1.0, (bass * 0.5 + mids) * 0.5);

      // 2. Spread (Width)
      // Driven by high frequencies (S, F, T)
      // Also slightly by "E" vowel which has high formants
      const targetSpread = Math.min(1.0, (highs * 4));

      // 3. Roundness (Pucker)
      // Driven by strong mids but LOW highs ("O", "U")
      // If we have high mids but low treble, it's likely a round vowel.
      // We subtract spread influence because you can't be spread and round.
      const targetRound = Math.min(1.0, (mids * 2.5) * (1 - highs * 2));

      // --- Smoothing ---
      // Use linear interpolation to smooth transitions (attack/decay)
      // Reduced factor for smoother transitions (0.15)
      const smoothFactor = 0.15; // 0.1 = slow/smooth, 0.9 = fast/jittery

      currentShape.current.open = lerp(currentShape.current.open, targetOpen, smoothFactor);
      currentShape.current.spread = lerp(currentShape.current.spread, targetSpread, smoothFactor);
      currentShape.current.round = lerp(currentShape.current.round, Math.max(0, targetRound), smoothFactor);

      setMouthShape({
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
