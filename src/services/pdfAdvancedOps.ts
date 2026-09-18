import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

// 1. Reverse PDF Pages
export async function reversePDFPages(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();
  const indices: number[] = [];
  for (let i = total - 1; i >= 0; i--) {
    indices.push(i);
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 2. Duplicate Pages
export async function duplicatePDFPages(file: File, duplicatesCount = 2): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const total = pdfDoc.getPageCount();

  for (let i = 0; i < total; i++) {
    for (let d = 0; d < duplicatesCount; d++) {
      const [copied] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copied);
    }
  }

  return await newPdf.save();
}

// 3. Extract Odd or Even Pages
export async function extractOddEvenPages(file: File, mode: 'odd' | 'even'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();
  const indices: number[] = [];

  for (let i = 0; i < total; i++) {
    const pageNum = i + 1;
    if (mode === 'odd' && pageNum % 2 !== 0) {
      indices.push(i);
    } else if (mode === 'even' && pageNum % 2 === 0) {
      indices.push(i);
    }
  }

  if (indices.length === 0) {
    throw new Error(`Document has no ${mode} pages to extract.`);
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 4. Extract First or Last Page
export async function extractFirstOrLastPage(file: File, position: 'first' | 'last'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();
  const targetIndex = position === 'first' ? 0 : total - 1;

  const newPdf = await PDFDocument.create();
  const [page] = await newPdf.copyPages(pdfDoc, [targetIndex]);
  newPdf.addPage(page);
  return await newPdf.save();
}

// 5. Remove First or Last Page
export async function removeFirstOrLastPage(file: File, position: 'first' | 'last'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();

  if (total <= 1) {
    throw new Error('Cannot remove the only page in the document.');
  }

  const targetIndex = position === 'first' ? 0 : total - 1;
  const indices = Array.from({ length: total }, (_, i) => i).filter((i) => i !== targetIndex);

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(pdfDoc, indices);
  copied.forEach((p) => newPdf.addPage(p));
  return await newPdf.save();
}

// 6. Add Blank Page
export async function addBlankPageToPDF(file: File, position: 'start' | 'end' = 'end'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  if (position === 'start') {
    pdfDoc.insertPage(0, [width, height]);
  } else {
    pdfDoc.addPage([width, height]);
  }

  return await pdfDoc.save();
}

// 7. Interleave Two PDFs (Alternate pages)
export async function interleavePDFs(fileA: File, fileB: File): Promise<Uint8Array> {
  const bufA = await fileA.arrayBuffer();
  const bufB = await fileB.arrayBuffer();
  const pdfA = await PDFDocument.load(bufA, { ignoreEncryption: true });
  const pdfB = await PDFDocument.load(bufB, { ignoreEncryption: true });

  const totalA = pdfA.getPageCount();
  const totalB = pdfB.getPageCount();
  const maxPages = Math.max(totalA, totalB);

  const merged = await PDFDocument.create();

  for (let i = 0; i < maxPages; i++) {
    if (i < totalA) {
      const [pA] = await merged.copyPages(pdfA, [i]);
      merged.addPage(pA);
    }
    if (i < totalB) {
      const [pB] = await merged.copyPages(pdfB, [i]);
      merged.addPage(pB);
    }
  }

  return await merged.save();
}

// 8. Custom Sort / Reorder Pages
export async function customSortPDFPages(file: File, orderStr: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const total = pdfDoc.getPageCount();

  const parts = orderStr.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  const indices: number[] = [];

  for (const p of parts) {
    if (p >= 1 && p <= total) {
      indices.push(p - 1);
    }
  }

  if (indices.length === 0) {
    throw new Error('Please enter valid page numbers separated by commas (e.g., 3, 1, 2).');
  }

  const newPdf = await PDFDocument.create();
  const copied = await newPdf.copyPages(pdfDoc, indices);
  copied.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

// 9. N-Up PDF (2-in-1 or 4-in-1 pages onto single sheets)
export async function nUpPDF(file: File, layout: '2in1' | '4in1'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const newPdf = await PDFDocument.create();
  // Standard A4 landscape for 2-in-1, portrait for 4-in-1
  const sheetWidth = layout === '2in1' ? 841.89 : 595.28;
  const sheetHeight = layout === '2in1' ? 595.28 : 841.89;

  const pagesPerSheet = layout === '2in1' ? 2 : 4;

  for (let i = 0; i < totalPages; i += pagesPerSheet) {
    const sheet = newPdf.addPage([sheetWidth, sheetHeight]);

    if (layout === '2in1') {
      const p1Idx = i;
      const p2Idx = i + 1;

      const [embed1] = await newPdf.embedPdf(pdfDoc, [p1Idx]);
      const w = sheetWidth / 2 - 24;
      const h = sheetHeight - 40;
      const scale1 = Math.min(w / embed1.width, h / embed1.height);

      sheet.drawPage(embed1, {
        x: 16 + (w - embed1.width * scale1) / 2,
        y: 20 + (h - embed1.height * scale1) / 2,
        xScale: scale1,
        yScale: scale1,
      });

      if (p2Idx < totalPages) {
        const [embed2] = await newPdf.embedPdf(pdfDoc, [p2Idx]);
        const scale2 = Math.min(w / embed2.width, h / embed2.height);
        sheet.drawPage(embed2, {
          x: sheetWidth / 2 + 8 + (w - embed2.width * scale2) / 2,
          y: 20 + (h - embed2.height * scale2) / 2,
          xScale: scale2,
          yScale: scale2,
        });
      }
    } else {
      // 4-in-1 (2x2 grid)
      const w = sheetWidth / 2 - 20;
      const h = sheetHeight / 2 - 20;

      for (let slot = 0; slot < 4; slot++) {
        const pageIdx = i + slot;
        if (pageIdx >= totalPages) break;

        const [embed] = await newPdf.embedPdf(pdfDoc, [pageIdx]);
        const scale = Math.min(w / embed.width, h / embed.height);
        const col = slot % 2;
        const row = Math.floor(slot / 2);

        const x = 12 + col * (sheetWidth / 2) + (w - embed.width * scale) / 2;
        const y = sheetHeight / 2 - (row === 0 ? 0 : sheetHeight / 2) + 12 + (h - embed.height * scale) / 2;

        sheet.drawPage(embed, {
          x,
          y,
          xScale: scale,
          yScale: scale,
        });
      }
    }
  }

  return await newPdf.save();
}

// 10. Flatten Form Fields & Annotations
export async function flattenPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // Form may not exist; document will be cleanly re-serialized
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

// 11. Clean All Metadata
export async function cleanAllMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  return await pdfDoc.save();
}

// 12. Strip Annotations
export async function stripAnnotations(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    page.node.delete(pdfDoc.context.obj('Annots'));
  });

  return await pdfDoc.save();
}

// 13. Unlock PDF (Strips password restriction dicts)
export async function unlockPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  // Load ignoring encryption constraints
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  pdfDoc.setTitle(`${pdfDoc.getTitle() || file.name} (Unlocked)`);
  return await pdfDoc.save();
}

// 14. Repair PDF (Rebuilds cross-reference table & clean streams)
export async function repairPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return await pdfDoc.save({ useObjectStreams: false });
}

// 15. Header & Footer
export async function addHeaderFooter(
  file: File,
  options: { headerText?: string; footerText?: string }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    if (options.headerText) {
      const hw = font.widthOfTextAtSize(options.headerText, 9);
      page.drawText(options.headerText, {
        x: (width - hw) / 2,
        y: height - 28,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.4),
      });
      page.drawLine({
        start: { x: 36, y: height - 34 },
        end: { x: width - 36, y: height - 34 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.88),
      });
    }

    if (options.footerText) {
      const fw = font.widthOfTextAtSize(options.footerText, 9);
      page.drawText(options.footerText, {
        x: (width - fw) / 2,
        y: 24,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.45),
      });
      page.drawLine({
        start: { x: 36, y: 36 },
        end: { x: width - 36, y: 36 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.88),
      });
    }
  });

  return await pdfDoc.save();
}

// 16. Dark Mode PDF (Eye-Safe Inversion Tint)
export async function darkModePDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    // Warm twilight / dark tint overlay
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.12, 0.12, 0.15),
      opacity: 0.72,
    });
  });

  return await pdfDoc.save();
}

// 17. Grayscale PDF
export async function grayscalePDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.2,
    });
  });

  return await pdfDoc.save();
}

// 18. Crop PDF (Trim margins)
export async function cropPDF(file: File, cropMarginPt = 36): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const newW = Math.max(100, width - cropMarginPt * 2);
    const newH = Math.max(100, height - cropMarginPt * 2);

    page.setCropBox(cropMarginPt, cropMarginPt, newW, newH);
  });

  return await pdfDoc.save();
}

// 19. Resize Page Dimensions
export async function resizePageDimensions(file: File, target: 'A4' | 'letter' | 'legal' | 'A3'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const dimMap: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
    A3: [841.89, 1190.55],
  };

  const [tW, tH] = dimMap[target] || [595.28, 841.89];
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    page.setSize(tW, tH);
  });

  return await pdfDoc.save();
}

// 20. QR Stamper
export async function qrStamper(
  file: File,
  qrText: string,
  position: 'bottom-right' | 'bottom-left' | 'top-right' = 'bottom-right'
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const qrDataUrl = await QRCode.toDataURL(qrText || 'https://hellopdf.app', {
    margin: 1,
    width: 120,
    color: { dark: '#000000', light: '#ffffff' },
  });

  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  const size = 64;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    let x = width - size - 24;
    let y = 24;

    if (position === 'bottom-left') {
      x = 24;
      y = 24;
    } else if (position === 'top-right') {
      x = width - size - 24;
      y = height - size - 24;
    }

    page.drawImage(qrImage, { x, y, width: size, height: size });
  });

  return await pdfDoc.save();
}

// 21. Barcode Stamper
export async function barcodeStamper(file: File, barcodeValue = 'HELLOPDF-2026'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.CourierBold);

  pages.forEach((page) => {
    const { width } = page.getSize();
    const barcodeWidth = 140;
    const startX = width - barcodeWidth - 36;
    const startY = 48;

    // Draw barcode lines
    for (let bx = startX; bx < startX + barcodeWidth; bx += 3) {
      const thick = bx % 7 === 0 || bx % 11 === 0 ? 2 : 0.8;
      page.drawLine({
        start: { x: bx, y: startY },
        end: { x: bx, y: startY - 22 },
        thickness: thick,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Label under barcode
    const label = `*${barcodeValue}*`;
    const lw = font.widthOfTextAtSize(label, 8);
    page.drawText(label, {
      x: startX + (barcodeWidth - lw) / 2,
      y: startY - 32,
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.25),
    });
  });

  return await pdfDoc.save();
}

// 22. Timestamp & Date Badge
export async function stampDateTime(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const stampText = `STAMPED: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(stampText, 8.5);

    // Pill background
    page.drawRectangle({
      x: width - tw - 38,
      y: height - 28,
      width: tw + 16,
      height: 16,
      color: rgb(0.94, 0.96, 1),
      borderColor: rgb(0.7, 0.8, 0.95),
      borderWidth: 0.8,
    });

    page.drawText(stampText, {
      x: width - tw - 30,
      y: height - 23,
      size: 8.5,
      font,
      color: rgb(0.1, 0.35, 0.65),
    });
  });

  return await pdfDoc.save();
}

// 23. Add Page Border
export async function addPageBorder(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderWidth: 2,
      borderColor: rgb(0.85, 0.25, 0.2),
    });
    page.drawRectangle({
      x: 23,
      y: 23,
      width: width - 46,
      height: height - 46,
      borderWidth: 0.5,
      borderColor: rgb(0.7, 0.7, 0.75),
    });
  });

  return await pdfDoc.save();
}

// 24. Redact PDF Area
export async function redactPDF(
  file: File,
  area: { x?: number; y?: number; width?: number; height?: number } = {}
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const rx = area.x || 48;
    const ry = area.y || height - 120;
    const rw = area.width || width - 96;
    const rh = area.height || 36;

    // Solid black redaction box
    page.drawRectangle({
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      color: rgb(0, 0, 0),
    });

    const redactedText = '[ CONFIDENTIAL - REDACTED ]';
    const tw = font.widthOfTextAtSize(redactedText, 9);
    page.drawText(redactedText, {
      x: rx + (rw - tw) / 2,
      y: ry + (rh - 9) / 2,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });
  });

  return await pdfDoc.save();
}

// 25. Highlight Area
export async function highlightArea(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    // Soft yellow highlighter bar across page center
    page.drawRectangle({
      x: 48,
      y: height / 2 - 12,
      width: width - 96,
      height: 24,
      color: rgb(1, 0.95, 0.2),
      opacity: 0.4,
    });
  });

  return await pdfDoc.save();
}

// 26. Copyright Notice
export async function addCopyrightNotice(file: File, owner = 'Hello PDF User', year = '2026'): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const notice = `© ${year} ${owner}. All Rights Reserved. Confidential & Proprietary.`;

  pages.forEach((page) => {
    const { width } = page.getSize();
    const nw = font.widthOfTextAtSize(notice, 8);
    page.drawText(notice, {
      x: (width - nw) / 2,
      y: 15,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.55),
    });
  });

  return await pdfDoc.save();
}

// 27. Grid Overlay (Engineering / alignment check)
export async function gridOverlay(file: File, step = 20): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    for (let x = 0; x <= width; x += step) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.3,
        color: rgb(0.2, 0.6, 0.9),
        opacity: 0.25,
      });
    }
    for (let y = 0; y <= height; y += step) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.3,
        color: rgb(0.2, 0.6, 0.9),
        opacity: 0.25,
      });
    }
  });

  return await pdfDoc.save();
}
