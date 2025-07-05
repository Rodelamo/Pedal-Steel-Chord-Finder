import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INTERVAL_NAMES } from '../constants/notes';
import { OVERRIDES } from '../constants/overrides';
import { COPEDENT } from '../constants/copedent';
import { TUNING } from '../constants/tuning';

// ---- Layout constants from playground ----
const CHORD_LAYOUT = {
  headerText:    { x: 28, y: 1,   w: 361, h: 31,  font: 17 },
  pedalsBg:      { x: 18, y: 28,  w: 373, h: 26,  borderRadius: 10 },
  pedalsText:    { x: 25, y: 28,  w: 365, h: 26,  font: 14 },
  tonebarBg:     { x: 18, y: 58,  w: 372, h: 26,  borderRadius: 7 },
  tonebarText:   { x: 22, y: 58,  w: 368, h: 25,  font: 13 },
  stringsBlock:  { x: 16, y: 87,  w: 373, h: 371 },
  fretNumbers:   { x: 77, y: 449, w: 258, h: 32,  font: 13 },
};
const FONT_SIZES = {
  headerText: 17,
  pedalsText: 14,
  tonebarText: 13,
  fretNumbers: 13
};
// Playground base size
const PLAYGROUND_BASE_W = 410;
const PLAYGROUND_BASE_H = 480;

// Helper function for placeholders
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

const createChordDiagram = (voicing, chordRoot, chordType, index, cellWidthPx, cellHeightPx) => {
  // Scale to fit cell
  const scale = Math.min(cellWidthPx / PLAYGROUND_BASE_W, cellHeightPx / PLAYGROUND_BASE_H);

  // Wrapper for scaling
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    width: ${cellWidthPx}px;
    height: ${cellHeightPx}px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: white;
  `;

  // Main diagram at base size, scaled
  const diagram = document.createElement('div');
  diagram.style.cssText = `
    width: ${PLAYGROUND_BASE_W}px;
    height: ${PLAYGROUND_BASE_H}px;
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%) scale(${scale});
    transform-origin: top left;
    background: none;
    overflow: visible;
  `;

  // HEADER TEXT
  const header = document.createElement('div');
  header.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.headerText.x}px;
    top: ${CHORD_LAYOUT.headerText.y}px;
    width: ${CHORD_LAYOUT.headerText.w}px;
    height: ${CHORD_LAYOUT.headerText.h}px;
    font-size: ${FONT_SIZES.headerText}px;
    font-weight: bold;
    color: #111827;
    line-height: ${CHORD_LAYOUT.headerText.h}px;
    text-align: center;
    white-space: nowrap;
    z-index: 10;
  `;
  header.textContent = `${chordRoot} ${chordType} - Fret ${voicing.fret}`;
  diagram.appendChild(header);

  // PEDALS BG (behind pedals text)
  const pedalsBg = document.createElement('div');
  pedalsBg.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.pedalsBg.x}px;
    top: ${CHORD_LAYOUT.pedalsBg.y}px;
    width: ${CHORD_LAYOUT.pedalsBg.w}px;
    height: ${CHORD_LAYOUT.pedalsBg.h}px;
    background: #dbeafe;
    border-radius: ${CHORD_LAYOUT.pedalsBg.borderRadius}px;
    z-index: 1;
  `;
  diagram.appendChild(pedalsBg);

  // PEDALS TEXT
  const pedalsText = document.createElement('div');
  pedalsText.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.pedalsText.x}px;
    top: ${CHORD_LAYOUT.pedalsText.y}px;
    width: ${CHORD_LAYOUT.pedalsText.w}px;
    height: ${CHORD_LAYOUT.pedalsText.h}px;
    font-size: ${FONT_SIZES.pedalsText}px;
    font-weight: bold;
    color: #1d4ed8;
    line-height: ${CHORD_LAYOUT.pedalsText.h}px;
    text-align: center;
    white-space: nowrap;
    z-index: 2;
  `;
  pedalsText.textContent = voicing.pedalCombo.length === 0 ? 'Open' : voicing.pedalCombo.join(' + ');
  diagram.appendChild(pedalsText);

  // TONEBAR BG (behind tonebar text)
  const tonebarBg = document.createElement('div');
  tonebarBg.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.tonebarBg.x}px;
    top: ${CHORD_LAYOUT.tonebarBg.y}px;
    width: ${CHORD_LAYOUT.tonebarBg.w}px;
    height: ${CHORD_LAYOUT.tonebarBg.h}px;
    background: #dbeafe;
    border-radius: ${CHORD_LAYOUT.tonebarBg.borderRadius}px;
    z-index: 1;
  `;
  diagram.appendChild(tonebarBg);

  // TONEBAR TEXT
  const tonebarText = document.createElement('div');
  tonebarText.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.tonebarText.x}px;
    top: ${CHORD_LAYOUT.tonebarText.y}px;
    width: ${CHORD_LAYOUT.tonebarText.w}px;
    height: ${CHORD_LAYOUT.tonebarText.h}px;
    font-size: ${FONT_SIZES.tonebarText}px;
    color: #1e40af;
    line-height: ${CHORD_LAYOUT.tonebarText.h}px;
    text-align: center;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 2;
  `;
  tonebarText.textContent = `Tone Bar at Fret ${voicing.fret} • ${voicing.playedStringsCount} Strings Used`;
  diagram.appendChild(tonebarText);

  // STRINGS BLOCK (everything inside scales proportionally)
  const stringsBlock = document.createElement('div');
  stringsBlock.style.cssText = `
    position: absolute;
    left: ${CHORD_LAYOUT.stringsBlock.x}px;
    top: ${CHORD_LAYOUT.stringsBlock.y}px;
    width: ${CHORD_LAYOUT.stringsBlock.w}px;
    height: ${CHORD_LAYOUT.stringsBlock.h}px;
    background: rgba(0,0,0,0.01);
    border-radius: 8px;
    z-index: 5;
    overflow: visible;
  `;
  // All elements below will be scaled relative to block size:
  const baseW = 373, baseH = 371; // match playground
  const scaleX = CHORD_LAYOUT.stringsBlock.w / baseW;
  const scaleY = CHORD_LAYOUT.stringsBlock.h / baseH;
  const stringCount = 12;
  const labelW = 52 * scaleX;
  const rowH = CHORD_LAYOUT.stringsBlock.h / stringCount;
  const noteR = 11 * scaleX;
  const infoBoxW = 44 * scaleX;
  const stringNames = ["F#","D#","G#","E","B","G#","F#","E","B","G#","E","B"];
  for (let i = 0; i < stringCount; ++i) {
    const y = rowH * i;

    // Label
    const label = document.createElement('div');
    label.style.position = "absolute";
    label.style.left = 0 + "px";
    label.style.top = y + "px";
    label.style.width = labelW + "px";
    label.style.height = rowH + "px";
    label.style.background = '#f3f4f6';
    label.style.color = '#374151';
    label.style.fontSize = (10 * scaleX) + "px";
    label.style.borderRadius = '3px';
    label.style.display = 'flex';
    label.style.justifyContent = 'space-between';
    label.style.alignItems = 'center';
    label.style.padding = '2px 6px';
    label.textContent = `S${i+1} • ${stringNames[i]}`;
    stringsBlock.appendChild(label);

    // Fret line
    const fretLine = document.createElement('div');
    fretLine.style.position = 'absolute';
    fretLine.style.left = (labelW+6) + "px";
    fretLine.style.top = (y+rowH/2-3*scaleY) + "px";
    fretLine.style.width = (CHORD_LAYOUT.stringsBlock.w-labelW-infoBoxW-20*scaleX) + "px";
    fretLine.style.height = (6*scaleY) + "px";
    fretLine.style.background = 'linear-gradient(to right, #d1d5db, #9ca3af)';
    fretLine.style.borderRadius = (3*scaleY) + 'px';
    fretLine.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.1)';
    stringsBlock.appendChild(fretLine);

    // Note indicator (some rows)
    if([1,2,4,5,7,9,10].includes(i)) {
      const note = document.createElement('div');
      note.style.position = "absolute";
      note.style.left = (labelW+60*scaleX) + "px";
      note.style.top = (y+rowH/2-noteR) + "px";
      note.style.width = (noteR*2) + "px";
      note.style.height = (noteR*2) + "px";
      note.style.background = "#3b82f6";
      note.style.color = "#fff";
      note.style.borderRadius = "50%";
      note.style.display = "flex";
      note.style.alignItems = "center";
      note.style.justifyContent = "center";
      note.style.fontWeight = "bold";
      note.style.fontSize = (12 * scaleX) + "px";
      note.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)';
      note.textContent = ["5","R","3","R","5","R","5"][[1,2,4,5,7,9,10].indexOf(i)];
      stringsBlock.appendChild(note);
    }
    // Info box (green)
    const info = document.createElement('div');
    info.style.position = "absolute";
    info.style.left = (CHORD_LAYOUT.stringsBlock.w-infoBoxW) + "px";
    info.style.top = y + "px";
    info.style.width = infoBoxW + "px";
    info.style.height = rowH + "px";
    info.style.background = '#dcfce7';
    info.style.color = '#166534';
    info.style.display = 'flex';
    info.style.justifyContent = 'center';
    info.style.alignItems = 'center';
    info.style.fontWeight = 'bold';
    info.style.fontSize = (11 * scaleX) + 'px';
    info.style.border = '1px solid #16a34a';
    info.style.borderRadius = '4px';
    info.textContent = "G";
    stringsBlock.appendChild(info);
  }
  diagram.appendChild(stringsBlock);

  // FRET NUMBERS (bottom)
  const fretNumbers = document.createElement('div');
  fretNumbers.style.position = "absolute";
  fretNumbers.style.left = CHORD_LAYOUT.fretNumbers.x + "px";
  fretNumbers.style.top = CHORD_LAYOUT.fretNumbers.y + "px";
  fretNumbers.style.width = CHORD_LAYOUT.fretNumbers.w + "px";
  fretNumbers.style.height = CHORD_LAYOUT.fretNumbers.h + "px";
  fretNumbers.style.display = "flex";
  fretNumbers.style.justifyContent = "space-between";
  fretNumbers.style.alignItems = "center";
  fretNumbers.style.fontSize = (FONT_SIZES.fretNumbers || 13) + "px";
  fretNumbers.style.color = "#6b7280";
  fretNumbers.style.textAlign = "center";
  fretNumbers.style.zIndex = 10;
  for(let i=0;i<=12;i++) {
    const num = document.createElement('div');
    num.style.flex = '0 0 auto';
    num.style.width = 'auto';
    num.style.textAlign = 'center';
    num.style.fontWeight = i === voicing.fret ? "bold" : "500";
    num.style.color = i === voicing.fret ? "#1d4ed8" : "#6b7280";
    num.textContent = i;
    fretNumbers.appendChild(num);
  }
  diagram.appendChild(fretNumbers);

  wrapper.appendChild(diagram);
  return wrapper;
};

// ...imports and CHORD_LAYOUT as before...

// PDF GENERATION
export const generatePDF = async (voicings) => {
  if (!voicings || voicings.length === 0) {
    alert('No voicings selected for PDF export.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Grid configuration
  const gap = 1; // 1mm black line
  const cols = 2;
  const rows = 3;
  const itemsPerPage = cols * rows;

  // Calculate exact cell dimensions (no margins)
  const totalGapW = gap * (cols - 1);
  const totalGapH = gap * (rows - 1);
  const cellWidth = (pageWidth - totalGapW) / cols;
  const cellHeight = (pageHeight - totalGapH) / rows;

  // Convert to pixels (96 DPI)
  const pixelRatio = 96 / 25.4;
  const containerWidth = Math.round(pageWidth * pixelRatio);
  const containerHeight = Math.round(pageHeight * pixelRatio);
  const cellWidthPx = Math.round(cellWidth * pixelRatio);
  const cellHeightPx = Math.round(cellHeight * pixelRatio);
  const gapPx = Math.max(1, Math.round(gap * pixelRatio));

  // Create off-screen rendering container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${containerWidth}px;
    height: ${containerHeight}px;
    background: white;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(${cols}, ${cellWidthPx}px);
    grid-template-rows: repeat(${rows}, ${cellHeightPx}px);
    gap: 0;
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

      for (let i = 0; i < itemsPerPage; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = `
          width: ${cellWidthPx}px;
          height: ${cellHeightPx}px;
          overflow: hidden;
          position: relative;
          background: white;
          box-sizing: border-box;
          border-right: ${((i % cols) < cols - 1) ? gapPx + 'px solid black' : 'none'};
          border-bottom: ${(i < (cols * (rows - 1))) ? gapPx + 'px solid black' : 'none'};
        `;

        if (i < pageVoicings.length) {
          const globalIndex = page * itemsPerPage + i;
          const diagram = createChordDiagram(
            pageVoicings[i].voicing,
            pageVoicings[i].chordRoot,
            pageVoicings[i].chordType,
            globalIndex,
            cellWidthPx,
            cellHeightPx
          );
          // FILL the cell, no centering
          diagram.style.position = "absolute";
          diagram.style.left = "0";
          diagram.style.top = "0";
          diagram.style.width = "100%";
          diagram.style.height = "100%";
          cell.appendChild(diagram);
        } else {
          cell.appendChild(createPlaceholder());
        }
        container.appendChild(cell);
      }

      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(container, {
        scale: 2,
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

      const imgData = canvas.toDataURL('image/png', 0.95);

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

    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`PedalSteel-ChordVoicings-${timestamp}.pdf`);

  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};