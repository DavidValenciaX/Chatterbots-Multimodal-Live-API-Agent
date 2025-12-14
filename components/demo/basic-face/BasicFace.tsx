/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { RefObject, useEffect, useState, useRef } from 'react';

import { renderFaceBackground } from './basic-face-render';
import MouthSprite from './MouthSprite';

import useFace from '../../../hooks/demo/use-face';
import useHover from '../../../hooks/demo/use-hover';
import useTilt from '../../../hooks/demo/use-tilt';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

// Minimum volume level that indicates audio output is occurring
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

// Amount of delay between end of audio output and setting talking state to false
const TALKING_STATE_COOLDOWN_MS = 2000;

type BasicFaceProps = {
  /** The canvas element on which to render the face. */
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The radius of the face. */
  readonly radius?: number;
  /** The color of the face. */
  readonly color?: string;
};

export default function BasicFace({
  canvasRef,
  radius = 250,
  color,
}: BasicFaceProps) {
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio output volume
  const { volume } = useLiveAPIContext();

  // Talking state
  const [isTalking, setIsTalking] = useState(false);

  const [scale, setScale] = useState(0.1);

  // Face state
  const { eyeScale, mouthShape } = useFace();
  const hoverPosition = useHover();
  const tiltAngle = useTilt({
    maxAngle: 5,
    speed: 0.075,
    isActive: isTalking,
  });

  useEffect(() => {
    function calculateScale() {
      setScale(Math.min(window.innerWidth, window.innerHeight) / 1000);
    }
    window.addEventListener('resize', calculateScale);
    calculateScale();
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Detect whether the agent is talking based on audio output volume
  // Set talking state when volume is detected
  useEffect(() => {
    if (volume > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
      setIsTalking(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Enforce a slight delay between end of audio output and setting talking state to false
      timeoutRef.current = setTimeout(
        () => setIsTalking(false),
        TALKING_STATE_COOLDOWN_MS
      );
    }
  }, [volume]);

  // Render the face background and eyes on the canvas (no mouth)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')!;
    renderFaceBackground({ ctx, eyeScale, color });
  }, [canvasRef, volume, eyeScale, color, scale]);

  // Update CSS custom properties for dynamic transform values
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--hover-position', `${hoverPosition}px`);
      containerRef.current.style.setProperty('--tilt-angle', `${tiltAngle}deg`);
    }
  }, [containerRef, hoverPosition, tiltAngle]);

  const canvasSize = radius * 2 * scale;

  // Calculate mouth position and size relative to face
  const mouthWidth = canvasSize * 0.45; // Mouth width relative to face
  const mouthLeft = (canvasSize - mouthWidth) / 2;
  const mouthTop = canvasSize * 0.52; // Position mouth in lower half of face

  return (
    <div
      ref={containerRef}
      className="basic-face"
      style={{
        position: 'relative',
        width: canvasSize,
        height: canvasSize,
        transform: `translateX(var(--hover-position, 0)) rotate(var(--tilt-angle, 0deg))`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <MouthSprite
        viseme={mouthShape.wawaViseme}
        style={{
          position: 'absolute',
          left: mouthLeft,
          top: mouthTop,
          width: mouthWidth,
          height: 'auto',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

