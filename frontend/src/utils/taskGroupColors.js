import { ACCENTS } from '../data/posts';

const PALETTE = [...ACCENTS, '#6c8ef5', '#e0685f'];

export function gradientFor(id) {
  const hash = String(id)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorA = PALETTE[hash % PALETTE.length];
  const colorB = PALETTE[(hash + 1) % PALETTE.length];
  return `linear-gradient(135deg, ${colorA}, ${colorB})`;
}
