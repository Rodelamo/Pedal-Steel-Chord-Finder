// src/constants/copedent.js

export const COPEDENT = {
  pedals: {
    A: [
      { string: 5, change: 2 },
      { string: 9, change: 2 }
    ],
    B: [
      { string: 3, change: 1 },
      { string: 6, change: 1 },
      { string: 10, change: 1 }
    ],
    C: [
      { string: 4, change: 2 },
      { string: 5, change: 2 }
    ],
    D: [
      { string: 9, change: 1 },
      { string: 11, change: -1 },
      { string: 12, change: -3 }
    ],
    E: [
      { string: 7, change: -1 },
      { string: 11, change: 1 },
      { string: 12, change: 2 }
    ],
    F: [
      { string: 4, change: 1 },
      { string: 8, change: -2 }
    ],
    G: [
      { string: 5, change: 2 },
      { string: 6, change: 2 }
    ]
  },
  levers: {
    LKL: [
      { string: 4, change: 1 },
      { string: 8, change: 1 }
    ],
    LKR: [
      { string: 4, change: -1 },
      { string: 8, change: -1 }
    ],
    V: [
      { string: 5, change: -1 }
    ],
    RKL: [
      { string: 1, change: 1 },
      { string: 7, change: 1 }
    ],
    RKR: [
      { string: 2, change: -1 },
      { string: 9, change: 3 }
    ]
  }
};

function generateValidPedalCombos(pedalNames) {
  const combos = [];
  pedalNames.forEach(name => combos.push([name]));
  for (let i = 0; i < pedalNames.length - 1; i++) {
    combos.push([pedalNames[i], pedalNames[i + 1]]);
  }
  return combos;
}

function generateValidLeverCombos(leverNames) {
  // Separate V from the rest
  const vLever = leverNames.filter(name => name === "V");
  const otherLevers = leverNames.filter(name => name !== "V");

  // All lever combos without same knee (L or R)
  function isValidCombo(combo) {
    const knees = combo
      .filter(name => name !== "V")
      .map(name => name[0]);
    return new Set(knees).size === knees.length;
  }

  const leverCombos = [[]];
  const n = otherLevers.length;
  for (let i = 1; i < (1 << n); i++) {
    const combo = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) combo.push(otherLevers[j]);
    }
    if (isValidCombo(combo)) leverCombos.push(combo);
  }
  // Add V to any combo
  const withV = [];
  if (vLever.length) {
    leverCombos.forEach(combo => {
      if (!combo.includes("V")) withV.push([...combo, "V"].sort());
    });
  }
  // Remove the empty set
  return leverCombos.concat(withV).filter(c => c.length > 0);
}

export function generateAllValidCombinations(copedent) {
  const pedalOrder = Object.keys(copedent.pedals);
  const leverNames = Object.keys(copedent.levers);

  const pedalCombos = generateValidPedalCombos(pedalOrder);
  const leverCombos = generateValidLeverCombos(leverNames);

  const allCombos = [ [] ];
  pedalCombos.forEach(p => allCombos.push([...p]));
  leverCombos.forEach(l => allCombos.push([...l]));
  pedalCombos.forEach(p => {
    leverCombos.forEach(l => {
      allCombos.push([...p, ...l].sort());
    });
  });

  const seen = new Set();
  return allCombos.filter(combo => {
    const key = combo.slice().sort().join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const VALID_COMBINATIONS = generateAllValidCombinations(COPEDENT);