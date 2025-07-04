// src/App.js
import React, { useState } from 'react';
import './App.css';
import { NOTES } from './constants/notes';
import { CHORD_TYPES } from './constants/chords';
import { ChordCalculator } from './utils/chordCalculator';
import { TRIADS } from './constants/triads';
import ChordSearch from './components/ChordSearch';
import Fretboard from './components/Fretboard';
import ExportBubble from './components/ExportBubble';
import ExportListModal from './components/ExportListModal';
import { SelectedVoicingsProvider } from './context/SelectedVoicingsContext';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [currentChord, setCurrentChord] = useState({ root: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); // NEW: Modal visibility state

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
    <SelectedVoicingsProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <ExportBubble onShowList={() => setShowExportModal(true)} /> {/* UPDATED */}
        {showExportModal && ( // UPDATED: Conditionally render modal
          <ExportListModal onClose={() => setShowExportModal(false)} />
        )}
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pedal Steel Chord Finder
            </h1>
            <p className="text-xl text-gray-700 font-medium">
              12-String Universal Tuning
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
    </SelectedVoicingsProvider>
  );
}

export default App;