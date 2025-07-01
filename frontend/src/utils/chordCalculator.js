// src/utils/chordCalculator.js

import { NOTES, NOTE_VALUES } from '../constants/notes';
import { TUNING } from '../constants/tuning';
import { COPEDENT, VALID_COMBINATIONS } from '../constants/copedent';
import { CHORD_TYPES } from '../constants/chords';

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
    const modifiedNotes = { ...openNotes };

    pedalCombination.forEach(pedal => {
      if (COPEDENT[pedal]) {
        if (pedal === 'C') {
          const changes = COPEDENT[pedal].changes;
          Object.keys(changes).forEach(stringNum => {
            const stringNumber = parseInt(stringNum);
            if (modifiedNotes[stringNumber]) {
              const openNote = modifiedNotes[stringNumber];
              const openSemitone = this.noteToSemitone(openNote);
              const newSemitone = (openSemitone + changes[stringNumber] + 12) % 12;
              const octave = openNote.match(/\d+$/)?.[0] || '2';
              modifiedNotes[stringNumber] = NOTES[newSemitone] + octave;
            }
          });
        } else {
          COPEDENT[pedal].strings.forEach(stringNum => {
            if (modifiedNotes[stringNum]) {
              const openNote = modifiedNotes[stringNum];
              const openSemitone = this.noteToSemitone(openNote);
              const newSemitone = (openSemitone + COPEDENT[pedal].change + 12) % 12;
              const octave = openNote.match(/\d+$/)?.[0] || '2';
              modifiedNotes[stringNum] = NOTES[newSemitone] + octave;
            }
          });
        }
      }
    });

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
            const noteAtFret = this.getNoteAtFret(modifiedTuning[stringNum], fret);
            const noteSemitone = NOTE_VALUES[noteAtFret];

            if (targetNotes.includes(noteSemitone)) {
              const intervalIndex = targetNotes.indexOf(noteSemitone);
              const interval = chordTones[intervalIndex];

              soundingNotes[stringNum] = {
                note: noteAtFret,
                interval,
                semitone: noteSemitone,
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

    // Now filter each fret's voicings to only those with max played strings
    // and deduplicate by notes on played strings
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
