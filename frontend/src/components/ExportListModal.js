// src/components/ExportListModal.js
import React from 'react';
import { useSelectedVoicings } from '../context/SelectedVoicingsContext';
import { generatePDF } from '../utils/pdfGenerator';

const ExportListModal = ({ onClose }) => {
  const { selectedVoicings, removeVoicing, clearVoicings } = useSelectedVoicings();
  
  const handleExport = async () => {
    await generatePDF(selectedVoicings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Export List</h2>
          <p className="text-gray-600 mt-1">
            {selectedVoicings.length} voicings selected for export
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chord</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fret</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pedals/Levers</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedVoicings.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.chordRoot} {item.chordType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.voicing.fret}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {item.voicing.pedalCombo.length === 0 ? 'Open' : item.voicing.pedalCombo.join(' + ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => removeVoicing(index)}
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Go Back
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                clearVoicings();
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear All and Close
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportListModal;