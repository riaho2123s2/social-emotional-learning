export const COLS = 5;
export const ROWS = 4;
export const TOTAL = COLS * ROWS;
export const PW = 100;
export const PH = 100;
export const TAB = 18;
export const SNAP = 28;
export const PRE_PLACED = [3, 7, 14];
export const SESSION_PIECES = [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19];
export const PUZZLE_IMAGE = '/puzzles/puzzle1.png';

const H_EDGES = Array.from({ length: ROWS - 1 }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => ((r * COLS + c) % 2 === 0 ? 1 : -1))
);
const V_EDGES = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS - 1 }, (_, c) => ((r + c) % 2 === 0 ? 1 : -1))
);

export function getTabDirs(id) {
  const c = id % COLS;
  const r = Math.floor(id / COLS);
  return {
    top:    r === 0        ? 0 : -H_EDGES[r - 1][c],
    bottom: r === ROWS - 1 ? 0 :  H_EDGES[r][c],
    left:   c === 0        ? 0 : -V_EDGES[r][c - 1],
    right:  c === COLS - 1 ? 0 :  V_EDGES[r][c],
  };
}

export function targetPos(id) {
  return { x: (id % COLS) * PW, y: Math.floor(id / COLS) * PH };
}

export function drawPiecePath(ctx, bx, by, { top, right, bottom, left }) {
  const w = PW, h = PH, t = TAB;
  ctx.beginPath();
  ctx.moveTo(bx, by);

  ctx.lineTo(bx + w * 0.30, by);
  if (top !== 0) {
    ctx.bezierCurveTo(bx + w * 0.30, by - top * t * 0.5, bx + w * 0.20, by - top * t, bx + w * 0.50, by - top * t);
    ctx.bezierCurveTo(bx + w * 0.80, by - top * t, bx + w * 0.70, by - top * t * 0.5, bx + w * 0.70, by);
  } else { ctx.lineTo(bx + w * 0.70, by); }
  ctx.lineTo(bx + w, by);

  ctx.lineTo(bx + w, by + h * 0.30);
  if (right !== 0) {
    ctx.bezierCurveTo(bx + w + right * t * 0.5, by + h * 0.30, bx + w + right * t, by + h * 0.20, bx + w + right * t, by + h * 0.50);
    ctx.bezierCurveTo(bx + w + right * t, by + h * 0.80, bx + w + right * t * 0.5, by + h * 0.70, bx + w, by + h * 0.70);
  } else { ctx.lineTo(bx + w, by + h * 0.70); }
  ctx.lineTo(bx + w, by + h);

  ctx.lineTo(bx + w * 0.70, by + h);
  if (bottom !== 0) {
    ctx.bezierCurveTo(bx + w * 0.70, by + h + bottom * t * 0.5, bx + w * 0.80, by + h + bottom * t, bx + w * 0.50, by + h + bottom * t);
    ctx.bezierCurveTo(bx + w * 0.20, by + h + bottom * t, bx + w * 0.30, by + h + bottom * t * 0.5, bx + w * 0.30, by + h);
  } else { ctx.lineTo(bx + w * 0.30, by + h); }
  ctx.lineTo(bx, by + h);

  ctx.lineTo(bx, by + h * 0.70);
  if (left !== 0) {
    ctx.bezierCurveTo(bx - left * t * 0.5, by + h * 0.70, bx - left * t, by + h * 0.80, bx - left * t, by + h * 0.50);
    ctx.bezierCurveTo(bx - left * t, by + h * 0.20, bx - left * t * 0.5, by + h * 0.30, bx, by + h * 0.30);
  } else { ctx.lineTo(bx, by + h * 0.30); }
  ctx.lineTo(bx, by);

  ctx.closePath();
}

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
