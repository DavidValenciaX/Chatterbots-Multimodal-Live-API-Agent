/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Viseme, MouthShape } from '../../../hooks/demo/use-face';

type BasicFaceProps = {
  ctx: CanvasRenderingContext2D;
  mouthShape: MouthShape;
  eyeScale: number;
  color?: string;
};

const eye = (
  ctx: CanvasRenderingContext2D,
  pos: [number, number],
  radius: number,
  scaleY: number
) => {
  ctx.save();
  ctx.translate(pos[0], pos[1]);
  ctx.scale(1, scaleY);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.restore();
  ctx.fill();
};

/**
 * Draw teeth (upper row) - used for visemes B and G
 */
function drawTeeth(
  ctx: CanvasRenderingContext2D,
  _width: number,
  teethWidth: number,
  teethHeight: number,
  yOffset: number = 0
) {
  ctx.fillStyle = 'white';
  const teethCount = 6;
  const toothWidth = teethWidth / teethCount;
  const startX = -teethWidth / 2;

  for (let i = 0; i < teethCount; i++) {
    const x = startX + i * toothWidth + toothWidth * 0.1;
    ctx.fillRect(x, yOffset - teethHeight, toothWidth * 0.8, teethHeight);
  }
}

/**
 * Draw tongue - used for viseme H (L sound)
 */
function drawTongue(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  mouthHeight: number
) {
  ctx.fillStyle = '#e57373'; // Pinkish-red tongue color
  ctx.beginPath();
  ctx.ellipse(0, mouthHeight * 0.3, mouthWidth * 0.5, mouthHeight * 0.4, 0, 0, Math.PI);
  ctx.fill();
}

/**
 * Renders a specific viseme (mouth shape) based on the Preston Blair / Rhubarb standard
 * 
 * @param ctx - Canvas rendering context
 * @param viseme - The viseme to render (A-H, X)
 * @param baseWidth - Base width unit for scaling
 * @param baseHeight - Base height unit for scaling
 * @param intensity - Animation intensity (0-1)
 * @param mouthShape - Additional shape parameters for fine-tuning
 */
function renderViseme(
  ctx: CanvasRenderingContext2D,
  viseme: Viseme,
  baseWidth: number,
  baseHeight: number,
  intensity: number,
  mouthShape: MouthShape
) {
  ctx.fillStyle = 'black';
  ctx.beginPath();

  // Scale factors based on base dimensions
  const w = baseWidth * 0.12; // Base mouth width
  const h = baseHeight * 0.08; // Base mouth height

  switch (viseme) {
    case 'X': {
      // Neutral/Idle - closed relaxed mouth (slight smile line)
      const lineWidth = w * 0.8;
      ctx.moveTo(-lineWidth, 0);
      ctx.quadraticCurveTo(0, h * 0.15, lineWidth, 0);
      ctx.quadraticCurveTo(0, h * 0.3, -lineWidth, 0);
      ctx.fill();
      break;
    }

    case 'A': {
      // M, B, P - Closed mouth with slight pressure
      // Horizontal line with slight curves indicating lip pressure
      const lineWidth = w * 0.9;
      const pressure = 0.1 + intensity * 0.1;

      ctx.moveTo(-lineWidth, 0);
      // Upper lip slight bulge
      ctx.quadraticCurveTo(0, -h * pressure, lineWidth, 0);
      // Lower lip slight bulge
      ctx.quadraticCurveTo(0, h * pressure * 1.5, -lineWidth, 0);
      ctx.fill();
      break;
    }

    case 'B': {
      // K, S, T, EE - Teeth together, lips parted showing teeth
      const mouthWidth = w * (0.9 + mouthShape.spread * 0.3);
      const mouthHeight = h * (0.4 + intensity * 0.3);

      // Outer mouth shape (lips)
      ctx.ellipse(0, 0, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw teeth inside
      ctx.save();
      ctx.clip();
      drawTeeth(ctx, baseWidth, mouthWidth * 1.6, mouthHeight * 0.6, 0);
      ctx.restore();
      break;
    }

    case 'C': {
      // EH, AE - Medium open mouth, relaxed oval
      const mouthWidth = w * (0.85 + mouthShape.spread * 0.2);
      const mouthHeight = h * (0.8 + mouthShape.open * 0.6);

      // Slightly oval mouth
      ctx.ellipse(0, mouthHeight * 0.1, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'D': {
      // AA (father) - Wide open mouth, jaw dropped
      const mouthWidth = w * (0.9 + mouthShape.spread * 0.15);
      const mouthHeight = h * (1.2 + mouthShape.open * 0.8);

      // Wide open oval mouth
      ctx.ellipse(0, mouthHeight * 0.15, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Optional: Add slight tongue hint at bottom
      ctx.fillStyle = '#c62828';
      ctx.beginPath();
      ctx.ellipse(0, mouthHeight * 0.6, mouthWidth * 0.6, mouthHeight * 0.25, 0, 0, Math.PI);
      ctx.fill();
      break;
    }

    case 'E': {
      // AO, ER - Rounded but slightly open
      const mouthWidth = w * (0.6 + mouthShape.round * 0.2);
      const mouthHeight = h * (0.7 + mouthShape.open * 0.5);

      // Rounded vertical oval
      ctx.ellipse(0, 0, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'F': {
      // OO, UW, W - Puckered/pursed lips (small circle)
      const mouthWidth = w * (0.35 + mouthShape.round * 0.15);
      const mouthHeight = h * (0.5 + mouthShape.round * 0.3);

      // Small circular/oval pucker
      ctx.ellipse(0, 0, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'G': {
      // F, V - Upper teeth on lower lip
      const mouthWidth = w * 0.85;
      const mouthHeight = h * 0.5;

      // Draw the mouth opening
      ctx.moveTo(-mouthWidth, -mouthHeight * 0.3);
      ctx.quadraticCurveTo(0, -mouthHeight * 0.1, mouthWidth, -mouthHeight * 0.3);
      ctx.lineTo(mouthWidth, mouthHeight * 0.4);
      ctx.quadraticCurveTo(0, mouthHeight * 0.8, -mouthWidth, mouthHeight * 0.4);
      ctx.closePath();
      ctx.fill();

      // Draw upper teeth biting lower lip
      ctx.save();
      const teethWidth = mouthWidth * 1.6;
      const teethHeight = mouthHeight * 0.5;
      drawTeeth(ctx, baseWidth, teethWidth, teethHeight, -mouthHeight * 0.1);

      // Lower lip visible below teeth
      ctx.fillStyle = '#e57373';
      ctx.beginPath();
      ctx.ellipse(0, mouthHeight * 0.35, mouthWidth * 0.7, mouthHeight * 0.25, 0, 0, Math.PI);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'H': {
      // L sound - Tongue visible behind slightly open mouth
      const mouthWidth = w * 0.75;
      const mouthHeight = h * 0.65;

      // Draw mouth opening
      ctx.ellipse(0, 0, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw tongue touching roof of mouth
      ctx.save();
      ctx.clip();
      drawTongue(ctx, mouthWidth, mouthHeight);

      // Add slight teeth hint
      ctx.fillStyle = 'white';
      ctx.fillRect(-mouthWidth * 0.6, -mouthHeight * 0.8, mouthWidth * 1.2, mouthHeight * 0.3);
      ctx.restore();
      break;
    }

    default:
      // Fallback to X (neutral)
      const lineWidth = w * 0.7;
      ctx.moveTo(-lineWidth, 0);
      ctx.quadraticCurveTo(0, h * 0.1, lineWidth, 0);
      ctx.fill();
  }
}

export function renderBasicFace(props: BasicFaceProps) {
  const {
    ctx,
    eyeScale: eyesOpenness,
    mouthShape,
    color,
  } = props;
  const { width, height } = ctx.canvas;

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // Draw the background circle
  ctx.fillStyle = color ?? 'white';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, width / 2 - 20, 0, Math.PI * 2);
  ctx.fill();

  const eyesCenter = [width / 2, height / 2.425];
  const eyesOffset = width / 15;
  const eyeRadius = width / 30;
  const eyesPosition: Array<[number, number]> = [
    [eyesCenter[0] - eyesOffset, eyesCenter[1]],
    [eyesCenter[0] + eyesOffset, eyesCenter[1]],
  ];

  // Draw the eyes
  ctx.fillStyle = 'black';
  eye(ctx, eyesPosition[0], eyeRadius, eyesOpenness + 0.1);
  eye(ctx, eyesPosition[1], eyeRadius, eyesOpenness + 0.1);

  // Draw the mouth using the viseme system
  const mouthCenter = [width / 2, height * 0.65];

  ctx.save();
  ctx.translate(mouthCenter[0], mouthCenter[1]);

  // Render the appropriate viseme
  renderViseme(
    ctx,
    mouthShape.viseme,
    width,
    height,
    mouthShape.intensity,
    mouthShape
  );

  ctx.restore();
}
