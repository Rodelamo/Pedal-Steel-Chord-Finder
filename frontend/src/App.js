// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { NOTES } from './constants/notes';
import { CHORD_TYPES, chords } from './constants/chords';
import { INTERVAL_NAMES } from './constants/notes';
import { TUNING } from './constants/tuning';
import { COPEDENT, VALID_COMBINATIONS } from './constants/copedent';
import { ChordCalculator } from './utils/chordCalculator';

// Fretboard component (unchanged)
const Fretboard = ({ voicing, chordRoot, chordType }) => {
  // ... keep your existing Fretboard component code ...
};

// ChordSearch component (unchanged)
const ChordSearch = ({ onSearch, loading }) => {
  // ... keep your existing ChordSearch component code ...
};

// Main App component with added real-time features
function App() {
  // Chord search states
  const [searchResults, setSearchResults] = useState([]);
  const [currentChord, setCurrentChord] = useState({ root: '', type: '' });
  const [loading, setLoading] = useState(false);
  
  // Real-time states (new)
  const [position, setPosition] = useState(0);
  const [engagedPeds, setEngagedPeds] = useState([]);
  const [engagedLevers, setEngagedLevers] = useState([]);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [currentChordName, setCurrentChordName] = useState('');

  // Real-time calculation effect (new)
  useEffect(() => {
    const notes = ChordCalculator.calculateCurrentNotes(
      position,
      engagedPeds,
      engagedLevers
    );
    setCurrentNotes(notes);
    
    const chordName = ChordCalculator.identifyChord(notes);
    setCurrentChordName(chordName);
  }, [position, engagedPeds, engagedLevers]);

  // Toggle functions for pedals/levers (new)
  const togglePedal = (pedal) => {
    setEngagedPeds(prev => 
      prev.includes(pedal) 
        ? prev.filter(p => p !== pedal) 
        : [...prev, pedal]
    );
  };

  const toggleLever = (lever) => {
    setEngagedLevers(prev => 
      prev.includes(lever) 
        ? prev.filter(l => l !== lever) 
        : [...prev, lever]
    );
  };

  // Chord search handler (unchanged)
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
    // ... keep your existing handleSearch logic ...
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

        {/* NEW: Real-time Controls Section */}
        <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border-2 border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Current Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Position Selector */}
            <div className="position-selector">
              <label className="block text-base font-bold text-gray-800 mb-3">
                Position (Fret):
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  value={position}
                  onChange={(e) => setPosition(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xl font-bold w-12">{position}</span>
              </div>
            </div>
            
            {/* Current Chord Display */}
            <div className="current-chord bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Current Chord</h3>
              <p className="text-2xl font-bold text-blue-700">{currentChordName}</p>
            </div>
          </div>
          
          {/* Pedal Controls */}
          <div className="pedal-controls mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Pedals</h3>
            <div className="flex flex-wrap gap-3">
              {Object.keys(COPEDENT.pedals).map(pedal => (
                <button
                  key={pedal}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    engagedPeds.includes(pedal) 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  onClick={() => togglePedal(pedal)}
                >
                  {pedal}
                </button>
              ))}
            </div>
          </div>
          
          {/* Lever Controls */}
          <div className="lever-controls mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Knee Levers</h3>
            <div className="flex flex-wrap gap-3">
              {Object.keys(COPEDENT.levers).map(lever => (
                <button
                  key={lever}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    engagedLevers.includes(lever) 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  onClick={() => toggleLever(lever)}
                >
                  {lever}
                </button>
              ))}
            </div>
          </div>
          
          {/* Notes Display */}
          <div className="notes-display mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">String Notes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentNotes.map((note, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">String {index + 1}</div>
                  <div className="text-xl font-bold">{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Existing Chord Search */}
        <ChordSearch onSearch={handleSearch} loading={loading} />

        {/* Search Results Display (unchanged) */}
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