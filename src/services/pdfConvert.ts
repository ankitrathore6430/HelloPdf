import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Initialize PDF.js worker securely with fallback
try {
  // @ts-ignore
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch {
  // Silently proceed
}

export interface ConvertedImageResult {
  pageIndex: number;
  dataUrl: string;
  blob: Blob;
  filename: string;
}

export interface PDFToImagesOutput {
  images: ConvertedImageResult[];
  zipBlob?: Blob;
  singleBlob?: Blob;
  filename: string;
}

// 1. Render PDF Pages to Images (JPG, PNG, WebP, Grayscale)
export async function convertPDFToImages(
  file: File,
  options: {
    format: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
    grayscale?: boolean;
    scale?: number;
  } = { format: 'image/jpeg', quality: 0.92, scale: 2.0 }
): Promise<PDFToImagesOutput> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const scale = options.scale || 2.0; // 2x for sharp quality
  const ext = options.format === 'image/jpeg' ? 'jpg' : options.format === 'image/png' ? 'png' : 'webp';
  const images: ConvertedImageResult[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const zip = numPages > 1 ? new JSZip() : null;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // @ts-ignore
    await page.render({ canvasContext: ctx, viewport }).promise;

    // If grayscale requested, convert pixels
    if (options.grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL(options.format, options.quality || 0.92);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), options.format, options.quality || 0.92);
    });

    const filename = `${baseName}_page_${pageNum}.${ext}`;
    images.push({
      pageIndex: pageNum,
      dataUrl,
      blob,
      filename,
    });

    if (zip) {
      zip.file(filename, blob);
    }
  }

  if (numPages === 1) {
    return {
      images,
      singleBlob: images[0].blob,
      filename: images[0].filename,
    };
  } else {
    const zipBlob = await zip!.generateAsync({ type: 'blob' });
    return {
      images,
      zipBlob,
      filename: `${baseName}_converted_images.zip`,
    };
  }
}

// 2. Extract Plain Text from PDF
export async function extractPDFText(file: File): Promise<{
  fullText: string;
  pagesText: string[];
  wordCount: number;
  charCount: number;
  pageCount: number;
  blob: Blob;
  filename: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const pagesText: string[] = [];
  for (let p = 1; p <= pageCount; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      // @ts-ignore
      .map((item: any) => item.str || '')
      .filter((s: string) => s.trim().length > 0);
    pagesText.push(pageStrings.join(' '));
  }

  const fullText = pagesText.join('\n\n--- [ Page Break ] ---\n\n');
  const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const chars = fullText.length;
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });

  return {
    fullText,
    pagesText,
    wordCount: words,
    charCount: chars,
    pageCount,
    blob: textBlob,
    filename: `${baseName}_extracted_text.txt`,
  };
}

// 3. CSV to PDF Table
export async function csvToPDF(csvText: string, title = 'Data Export'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for wide table data
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const rowHeight = 22;

  const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error('CSV text is empty.');
  }

  // Parse CSV rows safely
  const parseCSVLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res;
  };

  const rows = lines.map(parseCSVLine);
  const colCount = Math.max(...rows.map((r) => r.length));
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / Math.min(colCount, 12);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Title
  page.drawText(title, { x: margin, y, size: 16, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Rows: ${rows.length - 1} | Exported: ${new Date().toLocaleDateString()}`, {
    x: pageWidth - margin - 220,
    y,
    size: 9.5,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });
  y -= 26;

  for (let r = 0; r < rows.length; r++) {
    if (y < margin + rowHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const isHeader = r === 0;
    const rowData = rows[r];

    if (isHeader) {
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.88, 0.92, 0.98),
      });
    } else if (r % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    for (let c = 0; c < rowData.length && c < 12; c++) {
      const cellText = rowData[c].slice(0, 24);
      page.drawText(cellText, {
        x: margin + c * colWidth + 6,
        y: y + 2,
        size: isHeader ? 8.5 : 8,
        font: isHeader ? boldFont : font,
        color: isHeader ? rgb(0.1, 0.2, 0.35) : rgb(0.2, 0.2, 0.25),
      });
    }

    page.drawLine({
      start: { x: margin, y: y - 4 },
      end: { x: margin + tableWidth, y: y - 4 },
      thickness: isHeader ? 1 : 0.5,
      color: rgb(0.82, 0.85, 0.9),
    });

    y -= rowHeight;
  }

  return await pdfDoc.save();
}

// 4. JSON to PDF
export async function jsonToPDF(jsonText: string, title = 'JSON Data Document'): Promise<Uint8Array> {
  let formatted: string;
  try {
    const parsed = JSON.parse(jsonText);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    formatted = jsonText;
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 44;
  const lineHeight = 13;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(title, { x: margin, y, size: 14, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  y -= 22;

  const lines = formatted.split('\n');
  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const trimmed = line.slice(0, 85);
    let color = rgb(0.2, 0.25, 0.3);
    if (trimmed.includes(':') && trimmed.includes('"')) {
      color = rgb(0.1, 0.35, 0.65);
    } else if (trimmed.includes('{') || trimmed.includes('}')) {
      color = rgb(0.7, 0.2, 0.2);
    }

    page.drawText(trimmed, { x: margin, y, size: 8.5, font, color });
    y -= lineHeight;
  }

  return await pdfDoc.save();
}

// 5. Markdown to PDF
export async function markdownToPDF(markdownText: string, title = 'Document'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const lines = markdownText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (y < margin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    if (!line.trim()) {
      y -= 12;
      continue;
    }

    // Header 1
    if (line.startsWith('# ')) {
      y -= 8;
      page.drawText(line.replace(/^#\s+/, ''), { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
      y -= 24;
      page.drawLine({ start: { x: margin, y: y + 6 }, end: { x: pageWidth - margin, y: y + 6 }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
    }
    // Header 2
    else if (line.startsWith('## ')) {
      y -= 6;
      page.drawText(line.replace(/^##\s+/, ''), { x: margin, y, size: 14, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
      y -= 20;
    }
    // Header 3
    else if (line.startsWith('### ')) {
      page.drawText(line.replace(/^###\s+/, ''), { x: margin, y, size: 11, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
      y -= 16;
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: margin, y: y - 8 }, thickness: 2.5, color: rgb(0.85, 0.25, 0.2) });
      page.drawText(line.replace(/^>\s+/, ''), { x: margin + 12, y, size: 9.5, font: timesItalic, color: rgb(0.35, 0.35, 0.4) });
      y -= 16;
    }
    // Code block
    else if (line.startsWith('```') || line.startsWith('    ')) {
      page.drawText(line.replace(/```/g, ''), { x: margin + 8, y, size: 8.5, font: courier, color: rgb(0.2, 0.2, 0.25) });
      y -= 14;
    }
    // Bullet item
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      page.drawText('•', { x: margin + 4, y, size: 12, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
      page.drawText(line.slice(2), { x: margin + 16, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 16;
    }
    // Standard paragraph
    else {
      page.drawText(line.slice(0, 95), { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 15;
    }
  }

  return await pdfDoc.save();
}

// 6. Base64 to PDF
export async function base64ToPDF(base64Str: string): Promise<Uint8Array> {
  const clean = base64Str.replace(/^data:application\/pdf;base64,/, '').trim();
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 7. PDF to Base64
export async function pdfToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } else {
    // Universal Node.js fallback
    const buffer = Buffer.from(arrayBuffer);
    return `data:application/pdf;base64,${buffer.toString('base64')}`;
  }
}

// 8. Invert / Dark Mode PDF Generator
export type DarkModeTheme = 'midnight' | 'sepia' | 'solarized' | 'charcoal';

export async function invertPDFToDarkMode(
  file: File,
  theme: DarkModeTheme = 'midnight'
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const outputDoc = await PDFDocument.create();

  // Color mappings
  let filterStr = 'invert(1) hue-rotate(180deg) contrast(0.95)';
  let bgFill = '#0f1117';

  if (theme === 'sepia') {
    filterStr = 'invert(0.9) sepia(0.7) hue-rotate(330deg) brightness(0.9)';
    bgFill = '#251c16';
  } else if (theme === 'solarized') {
    filterStr = 'invert(1) hue-rotate(200deg) brightness(0.85) contrast(1.1)';
    bgFill = '#00212b';
  } else if (theme === 'charcoal') {
    filterStr = 'invert(0.9) grayscale(0.8) brightness(0.85)';
    bgFill = '#1e2229';
  }

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, viewport.width, viewport.height);

    await (page.render as any)({
      canvasContext: tempCtx,
      viewport,
      canvas: tempCanvas,
    }).promise;

    const darkCanvas = document.createElement('canvas');
    darkCanvas.width = viewport.width;
    darkCanvas.height = viewport.height;
    const darkCtx = darkCanvas.getContext('2d')!;

    darkCtx.fillStyle = bgFill;
    darkCtx.fillRect(0, 0, viewport.width, viewport.height);
    darkCtx.filter = filterStr;
    darkCtx.drawImage(tempCanvas, 0, 0);

    const imgDataUrl = darkCanvas.toDataURL('image/jpeg', 0.88);
    const cleanB64 = imgDataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const binary = atob(cleanB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const embeddedImage = await outputDoc.embedJpg(bytes);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const newPage = outputDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  return await outputDoc.save();
}

// 9. Real PDF Color Scheme & Palette Analyzer
export interface PDFColorSwatch {
  hex: string;
  rgb: string;
  percentage: number;
  isDark: boolean;
  name: string;
}

export interface PDFColorAnalysis {
  dominantColors: PDFColorSwatch[];
  backgroundColor: { hex: string; rgb: string; name: string };
  contrastRatio: number;
  wcagStatus: 'AAA Pass' | 'AA Pass' | 'Warning';
  isDarkDoc: boolean;
  colorSpace: string;
  totalColorsDetected: number;
}

export async function analyzePDFColorPalette(file: File): Promise<PDFColorAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(800, viewport.width);
  canvas.height = (canvas.width / viewport.width) * viewport.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render as any)({
    canvasContext: ctx,
    viewport: page.getViewport({ scale: canvas.width / viewport.width }),
    canvas,
  }).promise;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Sample grid of pixels
  const colorBuckets: Record<string, number> = {};
  let totalSamples = 0;

  const step = 4; // Sample every 4th pixel for speed & accuracy
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    colorBuckets[key] = (colorBuckets[key] || 0) + 1;
    totalSamples++;
  }

  const sortedBuckets = Object.entries(colorBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const dominantColors: PDFColorSwatch[] = sortedBuckets.map(([rgbStr, count]) => {
    const [r, g, b] = rgbStr.split(',').map(Number);
    const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const pct = Math.round((count / totalSamples) * 100);

    let name = 'Document Tone';
    if (r > 230 && g > 230 && b > 230) name = 'Pure White';
    else if (r < 40 && g < 40 && b < 40) name = 'Charcoal Black';
    else if (r > g + 40 && r > b + 40) name = 'Crimson / Red Accent';
    else if (b > r + 30 && b > g + 30) name = 'Cobalt Blue';
    else if (g > r + 30 && g > b + 30) name = 'Forest Green';
    else if (r > 180 && g > 150 && b < 100) name = 'Amber Gold';
    else if (brightness > 180) name = 'Light Gray';
    else if (brightness < 100) name = 'Deep Navy';

    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      percentage: Math.max(1, pct),
      isDark: brightness < 128,
      name,
    };
  });

  // Background is usually the most prevalent color (index 0)
  const bg = dominantColors[0] || { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', name: 'Pure White', isDark: false };
  const textCandidate = dominantColors.find((c) => c.isDark !== bg.isDark) || dominantColors[1] || dominantColors[0];

  // Luminance calculation
  const getLum = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) / 255;
    const g = ((num >> 8) & 0xff) / 255;
    const b = (num & 0xff) / 255;
    const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const lum1 = getLum(bg.hex);
  const lum2 = getLum(textCandidate ? textCandidate.hex : '#000000');
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = Math.round(((brightest + 0.05) / (darkest + 0.05)) * 10) / 10;

  const wcagStatus: 'AAA Pass' | 'AA Pass' | 'Warning' =
    ratio >= 7.0 ? 'AAA Pass' : ratio >= 4.5 ? 'AA Pass' : 'Warning';

  return {
    dominantColors,
    backgroundColor: { hex: bg.hex, rgb: bg.rgb, name: bg.name },
    contrastRatio: ratio,
    wcagStatus,
    isDarkDoc: bg.isDark,
    colorSpace: 'DeviceRGB (sRGB calibrated)',
    totalColorsDetected: Object.keys(colorBuckets).length,
  };
}
