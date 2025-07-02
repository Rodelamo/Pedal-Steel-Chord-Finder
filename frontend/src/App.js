// src/App.js

import React, { useState } from 'react';
import './App.css';
import { NOTES } from './constants/notes';
import { CHORD_TYPES } from './constants/chords';
import { INTERVAL_NAMES } from './constants/notes';
import { TUNING } from './constants/tuning';
import { COPEDENT } from './constants/copedent';
import { OVERRIDES } from './constants/overrides';
import { ChordCalculator } from './utils/chordCalculator';

const Fretboard = ({ voicing, chordRoot, chordType }) => {
  if (!voicing) return null;

  const { fret, pedalCombo, notes, allStringNotes, playedStringsCount } = voicing;

  // Check if a string has an override applied
  const isOverrideString = (stringNum) => {
    return OVERRIDES.some(override => 
      override.string === stringNum && 
      override.combo.every(p => pedalCombo.includes(p))
    );
  };

  // Get override description for a specific string
  const getOverrideDescription = (stringNum) => {
    const override = OVERRIDES.find(o => 
      o.string === stringNum && 
      o.combo.every(p => pedalCombo.includes(p))
    );
    return override ? override.note : 'Special pitch change applied';
  };

  // Get pedals affecting a specific string
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

  // Get pedal description for tooltips
  const getPedalDescription = (pedal) => {
    return COPEDENT[pedal]?.description || 'No description available';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl text-gray-900">
          {chordRoot} {chordType} - Fret {fret}
        </h3>
        <div className="text-base font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
          {pedalCombo.length === 0 ? 'Open' : pedalCombo.join(' + ')}
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
                {/* Increased width to prevent wrapping */}
                <div className="w-20 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded flex justify-between">
                  <span>S{stringNum}</span>
                  <span>•</span>
                  <span>{openNote}</span>
                </div>

                <div className="flex-1 relative h-2 rounded-sm bg-gradient-to-r from-gray-200 to-gray-300 shadow-inner">
                  {/* Fret position marker */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-gray-400"
                    style={{ 
                      left: `${(fret / 12) * 100}%`,
                      boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                    }}
                  ></div>

                  {/* Chord note indicator */}
                  {isChordTone && (
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white"
                      style={{ 
                        left: `${(fret / 12) * 100}%`,
                        marginLeft: '-0.875rem' // Half the circle width
                      }}
                    >
                      {INTERVAL_NAMES[note.interval]}
                    </div>
                  )}
                </div>

                <div className="flex items-center w-28">
                  {isChordTone ? (
                    <div className="flex w-full">
                      {/* Note and pedals box (75% width) */}
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
                      
                      {/* Override indicator (25% width) */}
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
                    // Non-chord tone string (always red, ignore overrides)
                    <div className="text-xs font-medium px-2 py-1 rounded flex justify-center items-center w-full bg-red-100 border border-red-300 text-red-800">
                      ✗
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fret Numbers - Fixed Alignment */}
        <div className="mt-6 flex justify-between relative" style={{ 
          marginLeft: '5.5rem', // Adjusted to match new string label width
          marginRight: '7rem' // Match note display width
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