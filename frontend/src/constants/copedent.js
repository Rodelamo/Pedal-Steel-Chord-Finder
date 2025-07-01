// src/constants/copedent.js

export const COPEDENT = {
  A: { strings: [5, 9], change: 2 },
  B: { strings: [3, 6, 10], change: 1 },
  C: { strings: [4, 5], changes: { 4: 2, 5: 2 } },
  LKL: { strings: [4, 8], change: 1 },
  LKR: { strings: [4, 8], change: -1 }
};

export const VALID_COMBINATIONS = [
  [],
  ['A'],
  ['B'],
  ['C'],
  ['LKL'],
  ['LKR'],
  ['A', 'B'],
  ['B', 'C'],
  ['A', 'LKL'],
  ['A', 'LKR'],
  ['B', 'LKL'],
  ['B', 'LKR'],
  ['C', 'LKL'],
  ['C', 'LKR'],
  ['A', 'B', 'LKL'],
  ['A', 'B', 'LKR'],
  ['B', 'C', 'LKL'],
  ['B', 'C', 'LKR']
];
