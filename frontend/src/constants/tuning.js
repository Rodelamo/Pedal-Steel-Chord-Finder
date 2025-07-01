export const TUNING = Object.entries({
  1: 'F#4',
  2: 'D#4',
  3: 'G#4',
  4: 'E4',
  5: 'B3',
  6: 'G#3',
  7: 'F#3',
  8: 'E3',
  9: 'B2',
  10: 'G#2',
  11: 'E2',
  12: 'B1'
}).map(([stringNum, noteWithOctave]) => {
  const [note, octave] = noteWithOctave.match(/([A-G#]+)(\d)/).slice(1, 3);
  return {
    string: parseInt(stringNum),
    note,
    octave: parseInt(octave)
  };
});