// src/utils/chordCalculator.js

import { NOTES, NOTE_VALUES } from '../constants/notes';
import { TUNING } from '../constants/tuning';
import { COPEDENT, VALID_COMBINATIONS } from '../constants/copedent';
import { CHORD_TYPES } from '../constants/chords';
import { OVERRIDES } from '../constants/overrides.js';

// Override Lookup Function Helper

function getOverrideResult(stringNumber, combo) {
  const sortedCombo = [...combo].sort();
  const found = OVERRIDES.find(
    o => o.string === stringNumber &&
         JSON.stringify(o.combo.sort()) === JSON.stringify(sortedCombo)
  );
  return found ? found.result : null;
}

export class ChordCalculator {
  static noteToSemitone(noteName) {
    const note = noteName.replace(/\d+$/, '');
    return NOTE_VALUES[note];
  }

  static getNoteAtFret(openNote, fret) {
    const openSemitone = this.noteToSemitone(openNote);
    const newSemitone = (openSemitone + fret) % 12;
    return NOTES[newSemitone];
  }

  static applyPedalChanges(openNotes, pedalCombination) {
    const modifiedNotes = {};

    for (let stringNum = 1; stringNum <= 12; stringNum++) {
      const override = getOverrideResult(stringNum, pedalCombination);
      const openNote = openNotes[stringNum];
      if (!openNote) continue;
      let newSemitone, changeSources = [];

      if (override !== null) {
        const openSemitone = this.noteToSemitone(openNote);
        newSemitone = (openSemitone + override + 12) % 12;
        changeSources = [...pedalCombination];
      } else {
        let totalChange = 0;
        let affecting = [];
        pedalCombination.forEach(pedal => {
          if (COPEDENT[pedal]) {
            if (COPEDENT[pedal].changes && COPEDENT[pedal].changes[stringNum]) {
              totalChange += COPEDENT[pedal].changes[stringNum];
              affecting.push(pedal);
            } else if (
              COPEDENT[pedal].strings &&
              COPEDENT[pedal].strings.includes(parseInt(stringNum))
            ) {
              totalChange += COPEDENT[pedal].change;
              affecting.push(pedal);
            }
          }
        });
        const openSemitone = this.noteToSemitone(openNote);
        newSemitone = (openSemitone + totalChange + 12) % 12;
        changeSources = affecting;
      }
      const octave = openNote.match(/\d+$/)?.[0] || '2';
      modifiedNotes[stringNum] = {
        note: NOTES[newSemitone] + octave,
        changedBy: changeSources
      };
    }

    return modifiedNotes;
  }
  

  static findChordVoicings(chordRoot, chordType, maxFret = 12) {
  const chordTones = CHORD_TYPES[chordType];
  if (!chordTones) return [];

  const rootSemitone = NOTE_VALUES[chordRoot];
  const targetNotes = chordTones.map(interval => (rootSemitone + interval) % 12);

  const triads = [
    'Major Triad',
    'Minor Triad',
    'Diminished Triad',
    'Augmented Triad',
    'sus2 Triad',
    'sus4 Triad',
    'Lydian Triad no 5th',
    'Lydian Triad no 3rd'
  ];
  const isTriad = triads.includes(chordType);
  const minUniqueNotes = isTriad ? 3 : 2;

  // Helper: checks if two voicings differ on any played string note
  function isDistinctVoicing(existingNotes, newNotes) {
    const allStrings = new Set([...Object.keys(existingNotes), ...Object.keys(newNotes)]);
    for (const str of allStrings) {
      const oldNote = existingNotes[str]?.note;
      const newNote = newNotes[str]?.note;
      if (!oldNote && !newNote) continue;
      if (oldNote !== newNote) return true;
    }
    return false;
  }

  // First gather all valid voicings for each fret
  const allVoicingsByFret = {};

  for (let fret = 0; fret <= maxFret; fret++) {
    const fretVoicings = [];

    VALID_COMBINATIONS.forEach(pedalCombo => {
      try {
        const modifiedTuning = this.applyPedalChanges(TUNING, pedalCombo);

        const soundingNotes = {};
        const foundIntervals = new Set();

        for (let stringNum = 1; stringNum <= 12; stringNum++) {
          const noteObj = modifiedTuning[stringNum];
          if (!noteObj) continue;
          const noteAtFret = this.getNoteAtFret(noteObj.note, fret);
          const noteSemitone = NOTE_VALUES[noteAtFret];

          if (targetNotes.includes(noteSemitone)) {
            const intervalIndex = targetNotes.indexOf(noteSemitone);
            const interval = chordTones[intervalIndex];

            soundingNotes[stringNum] = {
              note: noteAtFret,
              interval,
              semitone: noteSemitone,
              changedBy: noteObj.changedBy, // <-- Pass pedal/knee info for UI
            };

            foundIntervals.add(interval);
          }
        }

        if (foundIntervals.size < minUniqueNotes) return;

        fretVoicings.push({
          fret,
          pedalCombo,
          notes: soundingNotes,
          uniqueIntervals: foundIntervals.size,
          pedalCount: pedalCombo.length,
          playedStringsCount: Object.keys(soundingNotes).length,
        });
      } catch (error) {
        console.warn('Error processing pedal combination:', pedalCombo, error);
      }
    });

    allVoicingsByFret[fret] = fretVoicings;
  }

  // Now filter each fret's voicings to only those with max played strings and deduplicate by notes on played strings
  const filteredVoicings = [];

  for (const fret in allVoicingsByFret) {
    const fretVoicings = allVoicingsByFret[fret];
    if (!fretVoicings.length) continue;

    // Find max played strings count on this fret
    const maxPlayedStrings = Math.max(...fretVoicings.map(v => v.playedStringsCount));

    // Keep only voicings with max played strings
    const maxVoicings = fretVoicings.filter(v => v.playedStringsCount === maxPlayedStrings);

    const distinctVoicings = [];

    maxVoicings.forEach(voicing => {
      const isRedundant = distinctVoicings.some(existing =>
        !isDistinctVoicing(existing.notes, voicing.notes)
      );
      if (!isRedundant) {
        distinctVoicings.push(voicing);
      }
    });

    filteredVoicings.push(...distinctVoicings);
  }

  filteredVoicings.sort((a, b) => a.fret - b.fret);

    return filteredVoicings;
  }
}