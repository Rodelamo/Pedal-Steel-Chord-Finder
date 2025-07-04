// src/components/ExportBubble.js
import React from 'react';
import { useSelectedVoicings } from '../context/SelectedVoicingsContext';

const ExportBubble = ({ onShowList }) => { // UPDATED: Added onShowList prop
  const { count } = useSelectedVoicings();
  
  if (count === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-indigo-600 text-white py-3 px-6 rounded-full shadow-lg flex items-center">
        <span className="font-bold text-xl mr-3">{count}</span>
        <span>Results chosen for PDF export</span>
        
        <div className="ml-4 flex space-x-2">
          <button 
            onClick={onShowList} // UPDATED: Use prop instead of direct DOM access
            className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-indigo-50 transition"
          >
            See List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportBubble;