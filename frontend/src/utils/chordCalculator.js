// src/utils/chordCalculator.js

import { NOTES, NOTE_VALUES } from '../constants/notes';
import { TUNING } from '../constants/tuning';
import { COPEDENT, VALID_COMBINATIONS } from '../constants/copedent';
import { CHORD_TYPES } from '../constants/chords';
import { OVERRIDES } from '../constants/overrides';
import { TRIADS } from '../constants/triads';

// Helper function for array comparison
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

export class ChordCalculator {
  static noteToSemitone(noteName) {
    const note = noteName.replace(/\d+$/, '');
    return NOTE_VALUES[note];
  }

  static getNoteAtFret(openNote, fret) {
    const baseNote = openNote.replace(/\d+$/, '');
    const octaveMatch = openNote.match(/\d+$/);
    let octave = octaveMatch ? parseInt(octaveMatch[0]) : 2;
    
    const openSemitone = this.noteToSemitone(baseNote);
    const totalSemitones = openSemitone + fret;
    const newSemitone = (totalSemitones % 12 + 12) % 12; // Ensure positive value
    const octaveShift = Math.floor(totalSemitones / 12);
    
    return NOTES[newSemitone] + (octave + octaveShift);
  }

  static applyPedalChanges(openNotes, pedalCombination) {
    const modifiedNotes = { ...openNotes };
    
    // Apply standard pedal/lever changes
    pedalCombination.forEach(pedal => {
      const config = COPEDENT[pedal];
      if (config && config.changes) {
        config.changes.forEach(({ string, change }) => {
          const stringNum = string;
          if (modifiedNotes[stringNum]) {
            const openNote = modifiedNotes[stringNum];
            const baseNote = openNote.replace(/\d+$/, '');
            const octaveMatch = openNote.match(/\d+$/);
            let octave = octaveMatch ? parseInt(octaveMatch[0]) : 2;
            
            const openSemitone = this.noteToSemitone(baseNote);
            const totalSemitones = openSemitone + change;
            const newSemitone = (totalSemitones % 12 + 12) % 12; // Ensure positive value
            const octaveShift = Math.floor(totalSemitones / 12);
            
            modifiedNotes[stringNum] = NOTES[newSemitone] + (octave + octaveShift);
          }
        });
      }
    });
    
    // Apply override rules
    for (let stringNum = 1; stringNum <= 12; stringNum++) {
      // Find matching overrides for this string
      const matchingOverrides = OVERRIDES.filter(o => 
        o.string === stringNum && 
        o.combo.every(p => pedalCombination.includes(p))
      );
      
      if (matchingOverrides.length > 0) {
        // Apply the first matching override (should only be one per string)
        const override = matchingOverrides[0];
        const openNote = TUNING[stringNum];
        const baseNote = openNote.replace(/\d+$/, '');
        const octaveMatch = openNote.match(/\d+$/);
        let octave = octaveMatch ? parseInt(octaveMatch[0]) : 2;
        
        const openSemitone = this.noteToSemitone(baseNote);
        
        if (override.result !== null) {
          const totalSemitones = openSemitone + override.result;
          const newSemitone = (totalSemitones % 12 + 12) % 12; // Ensure positive value
          const octaveShift = Math.floor(totalSemitones / 12);
          modifiedNotes[stringNum] = NOTES[newSemitone] + (octave + octaveShift);
        }
      }
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

    // Precompute pedal combination effects for performance
    const combinationEffects = {};
    VALID_COMBINATIONS.forEach(combo => {
      combinationEffects[combo.join('')] = this.applyPedalChanges(TUNING, combo);
    });

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
          const comboKey = pedalCombo.join('');
          const modifiedTuning = combinationEffects[comboKey];
          
          // Get notes for all strings at this fret
          const allStringNotes = {};
          for (let stringNum = 1; stringNum <= 12; stringNum++) {
            allStringNotes[stringNum] = this.getNoteAtFret(modifiedTuning[stringNum], fret);
          }

          const soundingNotes = {};
          const foundIntervals = new Set();

          for (let stringNum = 1; stringNum <= 12; stringNum++) {
            const noteAtFret = allStringNotes[stringNum];
            const noteBase = noteAtFret.replace(/\d+$/, ''); // Remove octave for semitone calculation
            const noteSemitone = NOTE_VALUES[noteBase];

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

          // Enhanced triad filtering
          if (isTriad) {
            const hasAllIntervals = chordTones.every(interval => 
              foundIntervals.has(interval)
            );
            if (!hasAllIntervals) return;
          } else {
            if (foundIntervals.size < minUniqueNotes) return;
          }

          fretVoicings.push({
            fret,
            pedalCombo,
            notes: soundingNotes,
            allStringNotes,  // Store complete string data
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