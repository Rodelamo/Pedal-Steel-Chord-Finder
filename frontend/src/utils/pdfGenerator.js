// src/utils/pdfGenerator.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INTERVAL_NAMES } from '../constants/notes';
import { OVERRIDES } from '../constants/overrides';
import { COPEDENT } from '../constants/copedent';
import { TUNING } from '../constants/tuning';

// Helper function to get override information
const isOverrideString = (stringNum, pedalCombo) => {
  return OVERRIDES.some(override => 
    override.string === stringNum && 
    override.combo.every(p => pedalCombo.includes(p))
  );
};

const getOverrideDescription = (stringNum, pedalCombo) => {
  const override = OVERRIDES.find(o => 
    o.string === stringNum && 
    o.combo.every(p => pedalCombo.includes(p))
  );
  return override ? override.note : 'Special pitch change applied';
};

const getPedalsForString = (stringNum, pedalCombo) => {
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

// Create a chord diagram that exactly matches the web GUI styling
const createChordDiagram = (voicing, chordRoot, chordType, index) => {
  const container = document.createElement('div');
  
  // Main container styling to exactly match Fretboard.js
  container.style.cssText = `
    width: 100%;
    height: 100%;
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
    overflow: visible;
    display: flex;
    flex-direction: column;
  `;
  
  // Index number in top-left corner (order number)
  const indexNumber = document.createElement('div');
  indexNumber.style.cssText = `
    position: absolute;
    top: -10px;
    left: -10px;
    width: 24px;
    height: 24px;
    background: #000000;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    z-index: 10;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `;
  indexNumber.textContent = index + 1;
  
  // Header section matching Fretboard.js
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-shrink: 0;
  `;
  
  // Chord title
  const chordTitle = document.createElement('h3');
  chordTitle.style.cssText = `
    font-weight: bold;
    font-size: 16px;
    color: #111827;
    margin: 0;
  `;
  chordTitle.textContent = `${chordRoot} ${chordType} - Fret ${voicing.fret}`;
  
  // Pedal combination badge
  const pedalBadge = document.createElement('div');
  pedalBadge.style.cssText = `
    font-size: 12px;
    font-weight: bold;
    color: #1d4ed8;
    background: #dbeafe;
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap;
  `;
  pedalBadge.textContent = voicing.pedalCombo.length === 0 ? 'Open' : voicing.pedalCombo.join(' + ');
  
  header.appendChild(chordTitle);
  header.appendChild(pedalBadge);
  
  // Tone bar info section
  const toneBarInfo = document.createElement('div');
  toneBarInfo.style.cssText = `
    margin-bottom: 12px;
    padding: 8px;
    background: #dbeafe;
    border-radius: 6px;
    text-align: center;
    flex-shrink: 0;
  `;
  
  const toneBarText = document.createElement('span');
  toneBarText.style.cssText = `
    font-size: 12px;
    font-weight: 500;
    color: #1e40af;
  `;
  toneBarText.textContent = `Tone Bar at Fret ${voicing.fret} • ${voicing.playedStringsCount} Strings Used`;
  
  toneBarInfo.appendChild(toneBarText);
  
  // Fretboard section
  const fretboardSection = document.createElement('div');
  fretboardSection.style.cssText = `
    position: relative;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  `;
  
  // Strings container
  const stringsContainer = document.createElement('div');
  stringsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    flex-grow: 1;
  `;
  
  // Create strings (1-12)
  for (let stringNum = 1; stringNum <= 12; stringNum++) {
    const note = voicing.notes[stringNum];
    const actualNote = voicing.allStringNotes[stringNum];
    const isChordTone = !!note;
    const affectingPedals = getPedalsForString(stringNum, voicing.pedalCombo);
    const isOverride = isChordTone && isOverrideString(stringNum, voicing.pedalCombo);
    const openNote = TUNING[stringNum].replace(/\d+$/, '');
    
    // String row container
    const stringRow = document.createElement('div');
    stringRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      height: 24px;
      flex-shrink: 0;
    `;
    
    // String label
    const stringLabel = document.createElement('div');
    stringLabel.style.cssText = `
      width: 60px;
      font-size: 10px;
      font-weight: 500;
      color: #374151;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;
    stringLabel.innerHTML = `<span>S${stringNum}</span><span>•</span><span>${openNote}</span>`;
    
    // String line container
    const stringLineContainer = document.createElement('div');
    stringLineContainer.style.cssText = `
      flex: 1;
      position: relative;
      height: 6px;
      background: linear-gradient(to right, #d1d5db, #9ca3af);
      border-radius: 3px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    `;
    
    // Fret marker
    const fretMarker = document.createElement('div');
    const fretPosition = Math.min(95, (voicing.fret / 12) * 100);
    fretMarker.style.cssText = `
      position: absolute;
      top: 0;
      width: 1px;
      height: 100%;
      background: #6b7280;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
      left: ${fretPosition}%;
    `;
    stringLineContainer.appendChild(fretMarker);
    
    // Note indicator
    if (isChordTone) {
      const noteIndicator = document.createElement('div');
      noteIndicator.style.cssText = `
        position: absolute;
        top: 50%;
        left: ${fretPosition}%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        border: 1px solid white;
      `;
      noteIndicator.textContent = INTERVAL_NAMES[note.interval];
      stringLineContainer.appendChild(noteIndicator);
    }
    
    // Note info section
    const noteInfo = document.createElement('div');
    noteInfo.style.cssText = `
      display: flex;
      align-items: center;
      width: 80px;
      flex-shrink: 0;
    `;
    
    if (isChordTone) {
      const noteInfoContainer = document.createElement('div');
      noteInfoContainer.style.cssText = `
        display: flex;
        width: 100%;
      `;
      
      const mainNote = document.createElement('div');
      mainNote.style.cssText = `
        font-size: 9px;
        font-weight: 500;
        padding: 2px 4px;
        border-radius: 2px 0 0 2px;
        flex-grow: 1;
        background: #dcfce7;
        border: 1px solid #16a34a;
        color: #166534;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      let noteContent = `<span>${actualNote}</span>`;
      if (affectingPedals.length > 0) {
        noteContent += `<span style="margin-left: 2px;">${affectingPedals.map(pedal => 
          `<span style="border-bottom: 1px dashed #166534; font-size: 8px;">${pedal}</span>`
        ).join('')}</span>`;
      }
      mainNote.innerHTML = noteContent;
      
      noteInfoContainer.appendChild(mainNote);
      
      if (isOverride) {
        const overrideIndicator = document.createElement('div');
        overrideIndicator.style.cssText = `
          font-size: 8px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 0 2px 2px 0;
          background: #fef3c7;
          border: 1px solid #d97706;
          border-left: 0;
          color: #92400e;
          width: 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        overrideIndicator.textContent = 'OR!';
        noteInfoContainer.appendChild(overrideIndicator);
      }
      
      noteInfo.appendChild(noteInfoContainer);
    } else {
      const noNote = document.createElement('div');
      noNote.style.cssText = `
        font-size: 9px;
        font-weight: 500;
        padding: 2px 4px;
        border-radius: 2px;
        width: 100%;
        text-align: center;
        background: #fee2e2;
        border: 1px solid #dc2626;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      noNote.textContent = '✗';
      noteInfo.appendChild(noNote);
    }
    
    stringRow.appendChild(stringLabel);
    stringRow.appendChild(stringLineContainer);
    stringRow.appendChild(noteInfo);
    stringsContainer.appendChild(stringRow);
  }
  
  // Fret numbers section
  const fretNumbers = document.createElement('div');
  fretNumbers.style.cssText = `
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    position: relative;
    margin-left: 68px;
    margin-right: 88px;
    height: 16px;
    flex-shrink: 0;
  `;
  
  for (let i = 0; i <= 12; i++) {
    const fretNumber = document.createElement('div');
    fretNumber.style.cssText = `
      font-size: 10px;
      font-weight: ${i === voicing.fret ? 'bold' : '500'};
      color: ${i === voicing.fret ? '#1d4ed8' : '#6b7280'};
      text-align: center;
      width: 12px;
      position: absolute;
      left: ${i === 0 ? '0' : i === 12 ? '100%' : `${(i / 12) * 100}%`};
      transform: ${i === 0 ? 'none' : i === 12 ? 'translateX(-100%)' : 'translateX(-50%)'};
      line-height: 1;
    `;
    fretNumber.textContent = i;
    fretNumbers.appendChild(fretNumber);
  }
  
  // Assemble the diagram
  container.appendChild(indexNumber);
  container.appendChild(header);
  container.appendChild(toneBarInfo);
  fretboardSection.appendChild(stringsContainer);
  fretboardSection.appendChild(fretNumbers);
  container.appendChild(fretboardSection);
  
  return container;
};

// Create placeholder for empty grid slots
const createPlaceholder = () => {
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
    width: 100%;
    height: 100%;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 14px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  placeholder.textContent = 'Empty';
  return placeholder;
};

export const generatePDF = async (voicings) => {
  if (!voicings || voicings.length === 0) {
    alert('No voicings selected for PDF export.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Grid configuration - exactly 2x3 with 1mm gaps
  const margin = 10;
  const gap = 1;
  const cols = 2;
  const rows = 3;
  const itemsPerPage = cols * rows;
  
  // Calculate exact cell dimensions
  const availableWidth = pageWidth - (margin * 2) - (gap * (cols - 1));
  const availableHeight = pageHeight - (margin * 2) - (gap * (rows - 1));
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;
  
  // Convert to pixels (assuming 96 DPI)
  const pixelRatio = 96 / 25.4; // pixels per mm
  const containerWidth = Math.round(pageWidth * pixelRatio);
  const containerHeight = Math.round(pageHeight * pixelRatio);
  const cellWidthPx = Math.round(cellWidth * pixelRatio);
  const cellHeightPx = Math.round(cellHeight * pixelRatio);
  const marginPx = Math.round(margin * pixelRatio);
  const gapPx = Math.round(gap * pixelRatio);
  
  // Create off-screen rendering container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${containerWidth}px;
    height: ${containerHeight}px;
    background: white;
    padding: ${marginPx}px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(${cols}, ${cellWidthPx}px);
    grid-template-rows: repeat(${rows}, ${cellHeightPx}px);
    gap: ${gapPx}px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;
  
  document.body.appendChild(container);
  
  try {
    const totalPages = Math.ceil(voicings.length / itemsPerPage);
    
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      
      const pageVoicings = voicings.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      container.innerHTML = '';
      
      // Create grid items - always 6 items per page
      for (let i = 0; i < itemsPerPage; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = `
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
          background: white;
        `;
        
        if (i < pageVoicings.length) {
          const globalIndex = page * itemsPerPage + i;
          const diagram = createChordDiagram(
            pageVoicings[i].voicing,
            pageVoicings[i].chordRoot,
            pageVoicings[i].chordType,
            globalIndex
          );
          cell.appendChild(diagram);
        } else {
          cell.appendChild(createPlaceholder());
        }
        
        container.appendChild(cell);
      }
      
      // Wait for DOM to be ready and fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Debug: Check if container is visible
      console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
      console.log('Container children:', container.children.length);
      
      // Render to canvas with optimized settings
      const canvas = await html2canvas(container, {
        scale: 2, // Reasonable scale for good quality
        useCORS: true,
        logging: false,
        backgroundColor: 'white',
        windowWidth: containerWidth,
        windowHeight: containerHeight,
        width: containerWidth,
        height: containerHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: false
      });
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      
      // Add image to PDF with exact dimensions
      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        'FAST'
      );
    }
    
    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`PedalSteel-ChordVoicings-${timestamp}.pdf`);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};