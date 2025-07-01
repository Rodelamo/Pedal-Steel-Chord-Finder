// src/App.js

import React, { useState } from 'react';
import './App.css';
import { NOTES } from './constants/notes';
import { CHORD_TYPES } from './constants/chords';
import { INTERVAL_NAMES } from './constants/notes';
import { TUNING } from './constants/tuning';
import { COPEDENT } from './constants/copedent';
import { ChordCalculator } from './utils/chordCalculator';

const Fretboard = ({ voicing, chordRoot, chordType }) => {
  if (!voicing) return null;

  const { fret, pedalCombo, notes } = voicing;
  const modifiedTuning = ChordCalculator.applyPedalChanges(TUNING, pedalCombo);

  const getPedalsForString = (stringNum) => {
    const affectingPedals = [];
    pedalCombo.forEach(pedal => {
      if (pedal === 'C') {
        if (COPEDENT[pedal].changes && COPEDENT[pedal].changes[stringNum]) {
          affectingPedals.push(pedal);
        }
      } else if (COPEDENT[pedal] && COPEDENT[pedal].strings.includes(stringNum)) {
        affectingPedals.push(pedal);
      }
    });
    return affectingPedals;
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-gray-300 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl text-gray-900">
          {chordRoot} {chordType} - Fret {fret}
        </h3>
        <div className="text-base font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
          {pedalCombo.length === 0 ? 'Open' : pedalCombo.join(' + ')}
        </div>
      </div>

      <div className="relative">
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-center">
          <span className="text-base font-bold text-white">
            🎸 Tone Bar at Fret {fret}
          </span>
        </div>

        <div className="space-y-3 relative">
          {Array.from({ length: 12 }, (_, i) => {
            const stringNum = i + 1;
            const note = notes[stringNum];
            const isChordTone = !!note;
            const noteInfo = modifiedTuning[stringNum];
            const actualNote = noteInfo ? ChordCalculator.getNoteAtFret(noteInfo.note, fret) : null;
            const affectingPedals = noteInfo ? noteInfo.changedBy : [];
            return (
              <div key={stringNum} className="flex items-center space-x-4 h-8">
                <div className="w-20 text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  S{stringNum} - {TUNING[stringNum].replace(/\d+$/, '')}
                </div>

                <div className="flex-1 relative bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full">
                  <div
                    className="absolute top-0 w-1 h-full bg-red-600 rounded-full shadow-md"
                    style={{ left: `${(fret / 12) * 100}%` }}
                  ></div>

                  {isChordTone && (
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white"
                      style={{ left: `${(fret / 12) * 100 - 4}%` }}
                    >
                      {INTERVAL_NAMES[note.interval]}
                    </div>
                  )}
                </div>

                <div className="w-36 text-sm flex items-center justify-end">
                  {isChordTone ? (
                    <div className="text-green-800 text-xs font-bold bg-green-50 px-3 py-1 rounded-lg border border-green-200 flex justify-between w-full">
                      <span>{actualNote}</span>
                      {affectingPedals.length > 0 && (
                        <span className="text-green-500">{affectingPedals.join('+')}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 text-xs font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-200 flex justify-center items-center w-full h-full">
                      ✗
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fret Numbers aligned with the fret markers */}
        <div className="relative mt-6" style={{ paddingLeft: '84px', paddingRight: '144px' }}>
          <div className="relative w-full h-6 flex justify-between">
            {Array.from({ length: 13 }, (_, i) => (
              <div
                key={i}
                className={`text-sm w-6 text-center font-bold ${i === fret ? 'text-red-600 bg-red-100 rounded px-1' : 'text-gray-600'}`}
                style={{ transform: 'translateX(-50%)' }}
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200">
          <div className="text-base font-bold text-amber-900 mb-2">
            <strong>Chord Tones ({voicing.totalChordTones} total):</strong>
          </div>
          <div className="text-sm text-amber-800 mb-3">
            {Object.values(notes)
              .map(n => `${n.note} (${INTERVAL_NAMES[n.interval]})`)
              .join(' • ')}
          </div>
          <div className="text-sm text-amber-700 flex flex-wrap gap-4">
            <span className="font-medium">
              Unique Intervals: <span className="font-bold">{voicing.uniqueIntervals}</span>
            </span>
            <span className="font-medium">
              Pedals Used: <span className="font-bold">{voicing.pedalCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Now takes loading as a prop!
const ChordSearch = ({ onSearch, loading }) => {
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('Major Triad');

  const handleSearch = () => {
    onSearch(chordRoot, chordType);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border-2 border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Chord Finder</h2>
      <div className="flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-base font-bold text-gray-800 mb-3">
            Root Note
          </label>
          <select
            value={chordRoot}
            onChange={(e) => setChordRoot(e.target.value)}
            className="block w-28 px-4 py-3 text-lg font-medium border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {NOTES.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-800 mb-3">
            Chord Type
          </label>
          <select
            value={chordType}
            onChange={(e) => setChordType(e.target.value)}
            className="block w-48 px-4 py-3 text-lg font-medium border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {Object.keys(CHORD_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition-opacity duration-200
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-800'}
          `}
        >
          {loading ? "Finding..." : "Find Chords"}
        </button>
      </div>
    </div>
  );
};

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [currentChord, setCurrentChord] = useState({ root: '', type: '' });
  const [loading, setLoading] = useState(false);

  const TRIADS = [
    'Major Triad',
    'Minor Triad',
    'Diminished Triad',
    'Augmented Triad',
    'sus2 Triad',
    'sus4 Triad',
    'Lydian Triad no 5th',
    'Lydian Triad no 3rd',
  ];

  const handleSearch = async (chordRoot, chordType) => {
    setLoading(true);
    setCurrentChord({ root: chordRoot, type: chordType });
    await new Promise(resolve => setTimeout(resolve, 500));

    const voicings = ChordCalculator.findChordVoicings(chordRoot, chordType);

    const filteredVoicings = TRIADS.includes(chordType)
      ? voicings.filter(voicing => {
          const intervalsInVoicing = Object.values(voicing.notes).map(n => n.interval);
          return CHORD_TYPES[chordType].every(i => intervalsInVoicing.includes(i));
        })
      : voicings;

    setSearchResults(filteredVoicings);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Pedal Steel Chord Finder
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            12-String Universal Tuning • E9th Setup
          </p>
        </div>

        {/* Pass loading to ChordSearch */}
        <ChordSearch onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-lg text-gray-700 font-medium">Finding chord voicings...</p>
          </div>
        )}

        {searchResults.length > 0 && !loading && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              {currentChord.root} {currentChord.type} - Found {searchResults.length} Voicings
            </h2>
            <div className="space-y-6">
              {searchResults.map((voicing, index) => (
                <Fretboard
                  key={`${voicing.fret}-${voicing.pedalCombo.join('')}-${index}`}
                  voicing={voicing}
                  chordRoot={currentChord.root}
                  chordType={currentChord.type}
                />
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && !loading && currentChord.root && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-gray-200">
            <p className="text-xl text-gray-600 font-medium">
              No chord voicings found for {currentChord.root} {currentChord.type}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try a different chord type or root note
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;