// src/context/SelectedVoicingsContext.js
import React, { createContext, useState, useContext } from 'react';

const SelectedVoicingsContext = createContext();

export const SelectedVoicingsProvider = ({ children }) => {
  const [selectedVoicings, setSelectedVoicings] = useState([]);
  
  const addVoicing = (voicing) => {
    if (selectedVoicings.length >= 30) return;
    setSelectedVoicings(prev => [...prev, voicing]);
  };
  
  const removeVoicing = (index) => {
    setSelectedVoicings(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearVoicings = () => {
    setSelectedVoicings([]);
  };
  
  return (
    <SelectedVoicingsContext.Provider 
      value={{ 
        selectedVoicings, 
        addVoicing, 
        removeVoicing, 
        clearVoicings,
        count: selectedVoicings.length
      }}
    >
      {children}
    </SelectedVoicingsContext.Provider>
  );
};

export const useSelectedVoicings = () => useContext(SelectedVoicingsContext);