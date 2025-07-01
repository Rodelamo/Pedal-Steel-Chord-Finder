// src/utils/chordCalculator.js

import { NOTES, NOTE_VALUES } from '../constants/notes';
import { TUNING } from '../constants/tuning';
import { COPEDENT, VALID_COMBINATIONS } from '../constants/copedent';
import { CHORD_TYPES } from '../constants/chords';
import { OVERRIDES } from '../constants/overrides';

// Helper: Parse note with octave (e.g., "F#4" -> ["F#", 4])
const parseNoteWithOctave = (noteWithOctave) => {
  const notePart = noteWithOctave.replace(/\d/g, '');
  const octaveMatch = noteWithOctave.match(/\d+/);
  const octavePart = octaveMatch ? parseInt(octaveMatch[0]) : 0;
  return [notePart, octavePart];
};

// Helper: Calculate new octave based on semitone offset
const calculateNewOctave = (baseNote, baseOctave, semitoneOffset) => {
  const baseIndex = NOTE_VALUES[baseNote];
  if (baseIndex === undefined) return baseOctave;
  
  const totalSemitones = baseIndex + semitoneOffset;
  const octaveShift = Math.floor(totalSemitones / 12);
  return baseOctave + octaveShift;
};

// Helper: Apply semitone offset to a note name
const applyNoteOffset = (baseNote, semitones) => {
  const baseIndex = NOTE_VALUES[baseNote];
  if (baseIndex === undefined) return baseNote;
  
  const newIndex = (baseIndex + semitones) % 12;
  return newIndex >= 0 ? NOTES[newIndex] : NOTES[12 + newIndex];
};

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
    // Handle notes with octaves
    const [note, octave] = parseNoteWithOctave(noteName);
    const baseSemitone = NOTE_VALUES[note] || 0;
    return baseSemitone + (octave * 12);
  }

  static getNoteAtFret(openNote, fret) {
    const [baseNote, baseOctave] = parseNoteWithOctave(openNote);
    const openSemitone = NOTE_VALUES[baseNote];
    const newSemitone = (openSemitone + fret) % 12;
    const newNote = NOTES[newSemitone];
    
    // Calculate octave shift
    const octaveShift = Math.floor((openSemitone + fret) / 12);
    const newOctave = baseOctave + octaveShift;
    
    return `${newNote}${newOctave}`;
  }

  static applyPedalChanges(openNotes, pedalCombination) {
    const modifiedNotes = {};

    for (let stringNum = 1; stringNum <= 12; stringNum++) {
      const openNote = openNotes[stringNum - 1]; // Convert to 0-indexed
      if (!openNote) continue;
      
      const override = getOverrideResult(stringNum, pedalCombination);
      let newSemitone, changeSources = [];

      if (override !== null) {
        const [baseNote, baseOctave] = parseNoteWithOctave(openNote);
        const baseSemitone = NOTE_VALUES[baseNote];
        newSemitone = (baseSemitone + override + 12) % 12;
        const octaveShift = Math.floor((baseSemitone + override) / 12);
        const newOctave = baseOctave + octaveShift;
        changeSources = [...pedalCombination];
        modifiedNotes[stringNum] = {
          note: `${NOTES[newSemitone]}${newOctave}`,
          changedBy: changeSources
        };
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
        
        const [baseNote, baseOctave] = parseNoteWithOctave(openNote);
        const baseSemitone = NOTE_VALUES[baseNote];
        const newSemitone = (baseSemitone + totalChange + 12) % 12;
        const octaveShift = Math.floor((baseSemitone + totalChange) / 12);
        const newOctave = baseOctave + octaveShift;
        
        modifiedNotes[stringNum] = {
          note: `${NOTES[newSemitone]}${newOctave}`,
          changedBy: affecting
        };
      }
    }

    return modifiedNotes;
  }
  
  static calculateCurrentNotes(position, engagedPeds, engagedLevers) {
    return TUNING.map((openNote, stringIndex) => {
      const [baseNote, baseOctave] = parseNoteWithOctave(openNote);
      let semitoneOffset = position;
      
      // Apply pedal changes
      engagedPeds.forEach(pedal => {
        if (COPEDENT.pedals[pedal] && COPEDENT.pedals[pedal][stringIndex]) {
          semitoneOffset += COPEDENT.pedals[pedal][stringIndex];
        }
      });
      
      // Apply lever changes
      engagedLevers.forEach(lever => {
        if (COPEDENT.levers[lever] && COPEDENT.levers[lever][stringIndex]) {
          semitoneOffset += COPEDENT.levers[lever][stringIndex];
        }
      });
      
      // Apply overrides
      const override = OVERRIDES.find(o => 
        o.string === stringIndex &&
        o.pedals.some(p => engagedPeds.includes(p)) &&
        o.levers.some(l => engagedLevers.includes(l))
      );
      
      if (override) {
        semitoneOffset = override.result;
      }
      
      // Calculate new note name
      const newNote = applyNoteOffset(baseNote, semitoneOffset);
      
      // Calculate new octave
      const newOctave = calculateNewOctave(baseNote, baseOctave, semitoneOffset);
      
      return `${newNote}${newOctave}`;
    });
  }

  static findChordMatches(notes, chordType) {
    // Extract note names without octaves for chord matching
    const noteNames = notes.map(note => note.replace(/\d/g, ''));
    const noteSet = new Set(noteNames);
    
    return chordType.intervals.map(interval => {
      const intervalNotes = interval.notes;
      const matches = intervalNotes.every(note => noteSet.has(note));
      
      return {
        ...interval,
        matches,
        missingNotes: matches ? [] : intervalNotes.filter(n => !noteSet.has(n))
      };
    });
  }

  static identifyChord(notes) {
    // Extract note names without octaves
    const noteNames = notes.map(note => note.replace(/\d/g, ''));
    const uniqueNotes = [...new Set(noteNames)];
    
    // Try to identify chord type
    for (const chord of CHORD_TYPES) {
      for (const interval of chord.intervals) {
        if (interval.notes.every(note => uniqueNotes.includes(note))) {
          return `${uniqueNotes[0]} ${chord.name}`;
        }
      }
    }
    
    // Fallback: Show the unique notes
    return `${uniqueNotes.join('-')} Chord`;
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
            
            // Use the new octave-aware method
            const noteAtFret = this.getNoteAtFret(noteObj.note, fret);
            const noteName = noteAtFret.replace(/\d/g, '');
            const noteSemitone = NOTE_VALUES[noteName];

            if (targetNotes.includes(noteSemitone)) {
              const intervalIndex = targetNotes.indexOf(noteSemitone);
              const interval = chordTones[intervalIndex];

              soundingNotes[stringNum] = {
                note: noteAtFret, // Now includes octave
                interval,
                semitone: noteSemitone,
                changedBy: noteObj.changedBy,
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