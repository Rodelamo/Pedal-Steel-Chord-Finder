// src/utils/pdfGenerator.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INTERVAL_NAMES } from '../constants/notes';

// Create a chord diagram with precise dimensions
const createChordDiagram = (voicing, chordRoot, chordType, index) => {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.padding = '2mm';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = 'white';
  container.style.position = 'relative';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.overflow = 'hidden';
  
  // Index number
  container.innerHTML = `
    <div style="position: absolute; top: 1mm; left: 1mm; width: 5mm; height: 5mm;
                background: #4b5563; color: white; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; font-size: 8px; z-index: 10;">
      ${index + 1}
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center;
                margin-top: 5px; margin-bottom: 3px;">
      <div style="font-size: 10px; font-weight: bold; color: #1e293b; line-height: 1.1;">
        ${chordRoot} ${chordType}<br>Fret ${voicing.fret}
      </div>
      <div style="font-size: 9px; font-weight: bold; color: #3b82f6;
                  background: #dbeafe; padding: 1px 3px; border-radius: 2px;">
        ${voicing.pedalCombo.length ? voicing.pedalCombo.join('+') : 'Open'}
      </div>
    </div>
    
    <div style="font-size: 8px; color: #3b82f6; text-align: center;
                background: #dbeafe; padding: 1px; border-radius: 2px; margin-bottom: 3px;">
      ${voicing.playedStringsCount} Strings
    </div>
    
    <div style="height: calc(100% - 25px); overflow-y: auto;">
  `;

  // Strings
  for (let i = 1; i <= 12; i++) {
    const stringNum = i;
    const note = voicing.notes[stringNum];
    const positionPercent = Math.min(100, (voicing.fret / 12) * 100);
    
    const bgColor = note ? '#dcfce7' : '#fee2e2';
    const borderColor = note ? '#16a34a' : '#dc2626';
    
    container.innerHTML += `
      <div style="display: flex; align-items: center; height: 8px; margin-bottom: 1px;">
        <div style="width: 25px; font-size: 8px; font-weight: 500; color: #334155;
                    background: ${bgColor}; border: 1px solid ${borderColor}; 
                    padding: 0 1px; border-radius: 2px; text-align: center;">
          S${stringNum}
        </div>
        <div style="flex-grow: 1; height: 1px; background: linear-gradient(to right, #d1d5db, #9ca3af);
                    position: relative; margin: 0 2px;">
          <div style="position: absolute; top: 0; width: 1px; height: 100%;
                      background: #6b7280; left: ${positionPercent}%;"></div>
          ${
            note 
              ? `<div style="position: absolute; top: 50%; transform: translate(-50%, -50%);
                        width: 14px; height: 14px; background: #3b82f6; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center; color: white;
                        font-weight: bold; font-size: 6px; border: 1px solid white;
                        left: ${positionPercent}%;">
                   ${INTERVAL_NAMES[note.interval]}
                 </div>`
              : `<div style="position: absolute; top: 50%; transform: translate(-50%, -50%);
                        left: ${positionPercent}%; color: #dc2626; font-size: 8px; font-weight: bold;">
                   ✗
                 </div>`
          }
        </div>
      </div>
    `;
  }
  
  container.innerHTML += '</div>';
  return container;
};

export const generatePDF = async (voicings) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 5; // mm
  
  // Cell dimensions
  const cellWidth = (pageWidth - margin * 2) / 2;
  const cellHeight = (pageHeight - margin * 2) / 3;
  
  // Create container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${pageWidth}mm`;
  container.style.height = `${pageHeight}mm`;
  container.style.backgroundColor = 'white';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `${cellWidth}mm ${cellWidth}mm`;
  container.style.gridTemplateRows = `${cellHeight}mm ${cellHeight}mm ${cellHeight}mm`;
  container.style.gap = '0';
  container.style.padding = `${margin}mm`;
  container.style.boxSizing = 'border-box';
  
  // Add thin black borders between cells
  container.style.borderCollapse = 'collapse';
  container.style.border = '0.2mm solid black';
  
  document.body.appendChild(container);
  
  try {
    const itemsPerPage = 6;
    
    for (let page = 0; page < Math.ceil(voicings.length / itemsPerPage); page++) {
      if (page > 0) pdf.addPage();
      
      const pageVoicings = voicings.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      container.innerHTML = '';
      
      // Create 6 cells (2x3 grid)
      for (let i = 0; i < itemsPerPage; i++) {
        const cell = document.createElement('div');
        cell.style.border = '0.2mm solid black';
        cell.style.boxSizing = 'border-box';
        cell.style.backgroundColor = i < pageVoicings.length ? 'white' : '#f3f4f6';
        cell.style.overflow = 'hidden';
        
        if (i < pageVoicings.length) {
          const globalIndex = page * itemsPerPage + i;
          const diagram = createChordDiagram(
            pageVoicings[i].voicing,
            pageVoicings[i].chordRoot,
            pageVoicings[i].chordType,
            globalIndex
          );
          cell.appendChild(diagram);
        }
        
        container.appendChild(cell);
      }
      
      // Render to canvas
      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: 'white'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Add to PDF
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pageWidth,
        pageHeight
      );
    }
    
    pdf.save('PedalSteel-ChordVoicings.pdf');
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    document.body.removeChild(container);
  }
};