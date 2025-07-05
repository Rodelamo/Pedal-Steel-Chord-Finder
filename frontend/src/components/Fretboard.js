// src/components/Fretboard.js
import React, { useState } from 'react'; // Added useState
import { OVERRIDES } from '../constants/overrides';
import { COPEDENT } from '../constants/copedent';
import { TUNING } from '../constants/tuning';
import { INTERVAL_NAMES } from '../constants/notes';
import { useSelectedVoicings } from '../context/SelectedVoicingsContext';
import SoundService from '../utils/soundService'; // Added sound service

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

const Fretboard = ({ voicing, chordRoot, chordType }) => {
  if (!voicing) return null;
  
  const [isPlaying, setIsPlaying] = useState(false); // Added play state
  const { fret, pedalCombo, notes, allStringNotes, playedStringsCount } = voicing;
  const { addVoicing, removeVoicing, selectedVoicings } = useSelectedVoicings();

  const isOverrideString = (stringNum) => {
    return OVERRIDES.some(override => 
      override.string === stringNum && 
      override.combo.every(p => pedalCombo.includes(p))
    );
  };

  const getOverrideDescription = (stringNum) => {
    const override = OVERRIDES.find(o => 
      o.string === stringNum && 
      o.combo.every(p => pedalCombo.includes(p))
    );
    return override ? override.note : 'Special pitch change applied';
  };

  const getPedalsForString = (stringNum) => {
    const affectingPedals = [];
    pedalCombo.forEach(pedal => {
      const config = COPEDENT[pedal];
      if (config && config.changes) {
        const hasChange = config.changes.some(change => change.string === stringNum);
        if (hasChange) {
          affectingPedals.push(pedal);
        }
      }
    });
    return affectingPedals;
  };

  const getPedalDescription = (pedal) => {
    return COPEDENT[pedal]?.description || 'No description available';
  };

  // Check if this voicing is already selected
  const isSelected = selectedVoicings.some(item => 
    item.voicing.fret === voicing.fret && 
    arraysEqual(item.voicing.pedalCombo, voicing.pedalCombo) &&
    item.chordRoot === chordRoot &&
    item.chordType === chordType
  );

  const handleToggle = () => {
    if (isSelected) {
      // Find and remove this voicing
      const index = selectedVoicings.findIndex(item => 
        item.voicing.fret === voicing.fret && 
        arraysEqual(item.voicing.pedalCombo, voicing.pedalCombo) &&
        item.chordRoot === chordRoot &&
        item.chordType === chordType
      );
      if (index !== -1) {
        removeVoicing(index);
      }
    } else if (selectedVoicings.length < 30) {
      addVoicing({
        voicing,
        chordRoot,
        chordType
      });
    }
  };

  // Play entire chord (lowest to highest string)
  const playChord = () => {
    setIsPlaying(true);
    
    // Get notes from lowest (string 12) to highest (string 1)
    const notesToPlay = [];
    for (let stringNum = 12; stringNum >= 1; stringNum--) {
      if (voicing.notes[stringNum]) {
        notesToPlay.push(voicing.notes[stringNum].note);
      }
    }
    
    // Play each note sequentially
    notesToPlay.forEach((note, index) => {
      setTimeout(() => {
        const frequency = SoundService.noteNameToFrequency(note);
        SoundService.playTone(frequency, 0.33);
      }, index * 400); // 400ms = note duration (333ms) + gap (67ms)
    });
    
    // Reset play state after all notes
    setTimeout(() => setIsPlaying(false), notesToPlay.length * 400);
  };

  // Play single note
  const playSingleNote = (note) => {
    const frequency = SoundService.noteNameToFrequency(note);
    SoundService.playTone(frequency, 0.33);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={handleToggle}
            className={`flex items-center justify-center mr-4 px-4 py-2 rounded-lg font-medium transition-all ${
              isSelected 
                ? 'bg-green-500 text-white' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {isSelected ? (
              <>
                <span className="mr-2">✓</span> Exported
              </>
            ) : (
              'Export to PDF'
            )}
          </button>
          <h3 className="font-bold text-xl text-gray-900">
            {chordRoot} {chordType} - Fret {fret}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-base font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
            {pedalCombo.length === 0 ? 'Open' : pedalCombo.join(' + ')}
          </div>
          
          {/* Play Chord Button */}
          <button
            onClick={playChord}
            disabled={isPlaying}
            className={`play-button flex items-center px-3 py-1 rounded-md ${
              isPlaying 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            {isPlaying ? 'Playing...' : 'Play'}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="mb-4 p-3 bg-blue-100 rounded-lg text-center">
          <span className="text-base font-medium text-blue-800">
            Tone Bar at Fret {fret} • {playedStringsCount} Strings Used
          </span>
        </div>

        <div className="space-y-4 relative">
          {Array.from({ length: 12 }, (_, i) => {
            const stringNum = i + 1;
            const note = notes[stringNum];
            const isChordTone = !!note;
            const actualNote = allStringNotes[stringNum];
            const affectingPedals = getPedalsForString(stringNum);
            const isOverride = isChordTone && isOverrideString(stringNum);
            const overrideDescription = isOverride ? getOverrideDescription(stringNum) : '';
            const openNote = TUNING[stringNum].replace(/\d+$/, '');

            return (
              <div key={stringNum} className="flex items-center space-x-4 h-8">
                <div className="w-20 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded flex justify-between">
                  <span>S{stringNum}</span>
                  <span>•</span>
                  <span>{openNote}</span>
                </div>

                <div className="flex-1 relative h-2 rounded-sm bg-gradient-to-r from-gray-200 to-gray-300 shadow-inner">
                  <div
                    className="absolute top-0 w-0.5 h-full bg-gray-400"
                    style={{ 
                      left: `${(fret / 12) * 100}%`,
                      boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                    }}
                  ></div>

                  {isChordTone && (
                    <div
                      onClick={() => playSingleNote(actualNote)} // Added click handler
                      className="absolute top-1/2 transform -translate-y-1/2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform duration-200"
                      style={{ 
                        left: `${(fret / 12) * 100}%`,
                        marginLeft: '-0.875rem'
                      }}
                    >
                      {INTERVAL_NAMES[note.interval]}
                    </div>
                  )}
                </div>

                <div className="flex items-center w-28">
                  {isChordTone ? (
                    <div className="flex w-full">
                      <div 
                        className="text-xs font-medium px-2 py-1 rounded-l flex-grow bg-green-100 border border-green-300 text-green-800 flex justify-between"
                        title={affectingPedals.length > 0 ? 
                          affectingPedals.map(p => getPedalDescription(p)).join('\n') : 
                          'No pedals affect this string'}
                      >
                        <span>{actualNote}</span>
                        {affectingPedals.length > 0 && (
                          <span className="ml-1">
                            {affectingPedals.map(pedal => (
                              <span key={pedal} className="border-b border-dashed border-green-700">
                                {pedal}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                      
                      {isOverride && (
                        <div 
                          className="text-xs font-bold px-2 py-1 rounded-r bg-yellow-100 border border-yellow-300 text-yellow-800 border-l-0 w-1/4 text-center flex items-center justify-center"
                          title={overrideDescription}
                        >
                          OR!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-medium px-2 py-1 rounded flex justify-center items-center w-full bg-red-100 border border-red-300 text-red-800">
                      ✗
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-between relative" style={{ 
          marginLeft: '5.5rem',
          marginRight: '7rem'
        }}>
          {Array.from({ length: 13 }, (_, i) => (
            <div
              key={i}
              className={`text-xs w-4 text-center font-medium ${i === fret ? 'text-blue-700 font-bold' : 'text-gray-500'}`}
              style={{
                position: 'absolute',
                left: i === 0 ? '0' : i === 12 ? '100%' : `${(i / 12) * 100}%`,
                transform: i === 0 ? 'none' : i === 12 ? 'translateX(-100%)' : 'translateX(-50%)'
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fretboard;