/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
type BasicFaceProps = {
  ctx: CanvasRenderingContext2D;
  mouthShape: {
    open: number;
    spread: number;
    round: number;
  };
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

  // Draw the mouth
  const mouthCenter = [width / 2, height * 0.65];
  // Calculate mouth dimensions based on shape parameters
  // Base width + spread - roundness
  const w = width / 10 + (width / 15) * mouthShape.spread - (width / 25) * mouthShape.round;
  // Base height + openness (volume/jaw drop)
  const h = (height / 8) * mouthShape.open + 5;

  ctx.save();
  ctx.translate(mouthCenter[0], mouthCenter[1]);
  ctx.fillStyle = 'black';
  ctx.beginPath();
  // Vary parameters for more dynamic shapes
  if (mouthShape.round > 0.3) {
    // Rounded mouth (O/U)
    ctx.ellipse(0, 0, w, h * (1 + mouthShape.round * 0.5), 0, 0, Math.PI * 2);
  } else {
    // Normal/Spread mouth (A/E/S)
    // Top lip
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(0, -h * 0.2, w, 0);
    // Bottom lip
    ctx.quadraticCurveTo(0, h * 1.5, -w, 0);
  }
  ctx.fill();
  ctx.restore();
}
