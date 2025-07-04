// src/components/ChordSearch.js

import React, { useState } from 'react';
import { NOTES } from '../constants/notes';
import { CHORD_TYPES } from '../constants/chords';

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

export default ChordSearch;