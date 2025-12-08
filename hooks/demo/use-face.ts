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

export default function useFace() {
  const { audioStreamer } = useLiveAPIContext();
  const eyeScale = useBlink({ speed: 0.0125 });
  const [mouthShape, setMouthShape] = useState({
    open: 0,
    spread: 0,
    round: 0,
  });

  useEffect(() => {
    if (!audioStreamer) return;

    const analyser = audioStreamer.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const analyze = () => {
      animationFrameId = requestAnimationFrame(analyze);
      analyser.getByteFrequencyData(dataArray);

      // Calculate energy in frequency bands
      // FFT size 512 -> 256 bins. Sample rate ~24kHz.
      // Resolution approx 46Hz per bin.

      let lowEnergy = 0; // ~0-500Hz (Bins 0-10)
      let midEnergy = 0; // ~500-2500Hz (Bins 11-54)
      let highEnergy = 0; // ~2500Hz+ (Bins 55-255)

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255.0;
        if (i < 10) lowEnergy += val;
        else if (i < 55) midEnergy += val;
        else highEnergy += val;
      }

      // Normalize roughly by bin count width
      lowEnergy /= 10;
      midEnergy /= 45;
      highEnergy /= 200;

      // Map to specific shapes
      // Simple heuristic:
      // Open (Jaw drop): Driven by volume (overall) and low frequencies
      // Spread (E/S): Driven by high frequencies
      // Round (O/U): Driven by mid-low dominance without high

      // Amplify for visual effect
      const gain = 2.5;
      lowEnergy = Math.min(1, lowEnergy * gain);
      midEnergy = Math.min(1, midEnergy * gain);
      highEnergy = Math.min(1, highEnergy * gain);

      setMouthShape({
        open: lowEnergy * 0.8 + midEnergy * 0.2, // Open mainly on bass
        spread: highEnergy * 1.5, // Spread on treble (sibilance)
        round: (midEnergy > highEnergy * 1.5 ? midEnergy : 0) * 0.5, // Round if mid is dominant
      });
    };

    analyze();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioStreamer]);

  return { eyeScale, mouthShape };
}
