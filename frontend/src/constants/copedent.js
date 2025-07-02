// src/constants/copedent.js

export const COPEDENT = {
  A: {
    type: 'pedal',
    description: 'Raises strings 5 and 9 a whole step',
    changes: [
      { string: 5, change: 2 },
      { string: 9, change: 2 }
    ]
  },
  B: {
    type: 'pedal',
    description: 'Raises strings 3, 6, and 10 a half step',
    changes: [
      { string: 3, change: 1 },
      { string: 6, change: 1 },
      { string: 10, change: 1 }
    ]
  },
  C: {
    type: 'pedal',
    description: 'Raises strings 4 and 5 a whole step',
    changes: [
      { string: 4, change: 2 },
      { string: 5, change: 2 }
    ]
  },
  D: {
    type: 'pedal',
    description: 'Raises string 9 a half step, lowers 11 a half step, lowers 12 three half steps',
    changes: [
      { string: 9, change: 1 },
      { string: 11, change: -1 },
      { string: 12, change: -3 }
    ]
  },
  E: {
    type: 'pedal',
    description: 'Lowers string 7 a half step, raises 11 a half step, raises 12 two half steps',
    changes: [
      { string: 7, change: -1 },
      { string: 11, change: 1 },
      { string: 12, change: 2 }
    ]
  },
  F: {
    type: 'pedal',
    description: 'Raises string 4 a half step, lowers string 8 two half steps',
    changes: [
      { string: 4, change: 1 },
      { string: 8, change: -2 }
    ]
  },
  G: {
    type: 'pedal',
    description: 'Raises strings 5 and 6 a whole step',
    changes: [
      { string: 5, change: 2 },
      { string: 6, change: 2 }
    ]
  },
  LKL: {
    type: 'lever',
    description: 'Raises strings 4 and 8 a half step',
    changes: [
      { string: 4, change: 1 },
      { string: 8, change: 1 }
    ]
  },
  LKR: {
    type: 'lever',
    description: 'Lowers strings 4 and 8 a half step',
    changes: [
      { string: 4, change: -1 },
      { string: 8, change: -1 }
    ]
  },
  V: {
    type: 'lever',
    description: 'Lowers string 5 a half step',
    changes: [
      { string: 5, change: -1 }
    ]
  },
  RKL: {
    type: 'lever',
    description: 'Raises strings 1 and 7 a half step',
    changes: [
      { string: 1, change: 1 },
      { string: 7, change: 1 }
    ]
  },
  RKR: {
    type: 'lever',
    description: 'Lowers string 2 a half step, raises string 9 three half steps',
    changes: [
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
      .map(name => name[0]);  // First character (L or R)
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
  
  // Combine and filter out empty combo
  return [...leverCombos, ...withV].filter(c => c.length > 0);
}

export function generateAllValidCombinations() {
  const pedalNames = Object.keys(COPEDENT)
    .filter(name => COPEDENT[name].type === 'pedal')
    .sort();  // Ensure consistent order: A,B,C,D,E,F,G

  const leverNames = Object.keys(COPEDENT)
    .filter(name => COPEDENT[name].type === 'lever')
    .sort();  // Consistent order: LKL, LKR, RKL, RKR, V

  const pedalCombos = generateValidPedalCombos(pedalNames);
  const leverCombos = generateValidLeverCombos(leverNames);

  // Start with open position
  const allCombos = [ [] ]; 
  
  // Add pedal-only combos
  pedalCombos.forEach(p => allCombos.push([...p]));
  
  // Add lever-only combos
  leverCombos.forEach(l => allCombos.push([...l]));
  
  // Add pedal+lever combos
  pedalCombos.forEach(p => {
    leverCombos.forEach(l => {
      allCombos.push([...p, ...l].sort());
    });
  });

  // Deduplicate
  const seen = new Set();
  return allCombos.filter(combo => {
    const key = combo.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const VALID_COMBINATIONS = generateAllValidCombinations();