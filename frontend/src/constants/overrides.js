// src/constants/overrides.js

/**
 * OVERRIDES:
 * Each rule describes a specific string, a pedal+lever combo, and
 * what the resulting semitone change is (or null for "no change").
 * 
 * Format:
 * {
 *   string: number,
 *   combo: [ 'Pedal', 'Lever', ... ] (sorted alphabetically),
 *   result: number | null, // null means string stays at open pitch
 *   note: string (optional, for explanation)
 * }
 */
export const OVERRIDES = [
  // 4th string
  { string: 4, combo: ['C', 'LKL'], result: 2, note: 'LKL has no effect, C takes precedence' },
  { string: 4, combo: ['C', 'LKR'], result: 1, note: 'Additive: up 2 (C) + down 1 (LKR) = up 1' },
  { string: 4, combo: ['F', 'LKL'], result: 1, note: 'LKL has no effect, F takes precedence' },
  { string: 4, combo: ['F', 'LKR'], result: 0, note: 'Additive: up 1 (F) + down 1 (LKR) = 0 (no change)' },

  // 5th string
  { string: 5, combo: ['A', 'V'], result: 1, note: 'Additive: up 2 (A) + down 1 (V) = up 1' },
  { string: 5, combo: ['C', 'V'], result: 1, note: 'Additive: up 2 (C) + down 1 (V) = up 1' },
  { string: 5, combo: ['G', 'V'], result: 1, note: 'Additive: up 2 (G) + down 1 (V) = up 1' },

  // 7th string
  { string: 7, combo: ['E', 'RKL'], result: 0, note: 'Additive: down 1 (E) + up 1 (RKL) = 0 (no change)' },

  // 8th string
  { string: 8, combo: ['F', 'LKL'], result: -1, note: 'Additive: down 2 (F) + up 1 (LKL) = down 1' },
  { string: 8, combo: ['F', 'LKR'], result: -2, note: 'LKR has no effect, F takes precedence' },

  // 9th string
  { string: 9, combo: ['A', 'RKR'], result: 3, note: 'A has no effect, RKR takes precedence' },
  { string: 9, combo: ['D', 'RKR'], result: 3, note: 'D has no effect, RKR takes precedence' },

  // 11th string
  { string: 11, combo: ['D', 'E'], result: 0, note: 'Additive: down 1 (D) + up 1 (E) = 0 (no change)' },

  // 12th string
  { string: 12, combo: ['D', 'E'], result: -1, note: 'Additive: down 3 (D) + up 2 (E) = down 1' }
];