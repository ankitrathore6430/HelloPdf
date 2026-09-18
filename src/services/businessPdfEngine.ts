import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Helper for standard A4 portrait dimensions
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const A4_LANDSCAPE_WIDTH = 841.89;
const A4_LANDSCAPE_HEIGHT = 595.28;

// 1. Invoices, Receipts, Purchase Orders & Packing Slips
export interface InvoiceReceiptData {
  documentType: 'INVOICE' | 'RECEIPT' | 'PURCHASE ORDER' | 'PACKING SLIP' | 'EXPENSE REPORT' | 'GENERAL LEDGER' | string;
  documentNumber: string;
  date: string;
  dueDate?: string;
  companyName: string;
  companyAddress?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  currency: string;
  items: Array<{ desc: string; qty: number; rate: number }>;
  taxPercent: number;
  paymentMethod?: string;
  notes?: string;
}

export async function generateBusinessInvoiceReceiptPDF(data: InvoiceReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 45;

  // Header Banner
  const isInvoice = data.documentType === 'INVOICE';
  const isReceipt = data.documentType === 'RECEIPT';
  const isPO = data.documentType === 'PURCHASE ORDER';
  const isExpense = data.documentType === 'EXPENSE REPORT';
  const isLedger = data.documentType === 'GENERAL LEDGER';
  const headerColor = isInvoice
    ? rgb(0.88, 0.15, 0.25)
    : isReceipt
    ? rgb(0.1, 0.6, 0.4)
    : isPO
    ? rgb(0.2, 0.4, 0.8)
    : isExpense
    ? rgb(0.55, 0.25, 0.75)
    : isLedger
    ? rgb(0.15, 0.45, 0.65)
    : rgb(0.3, 0.35, 0.45);

  page.drawRectangle({
    x: margin,
    y: A4_HEIGHT - margin - 50,
    width: A4_WIDTH - margin * 2,
    height: 50,
    color: headerColor,
  });

  page.drawText(data.documentType, {
    x: margin + 20,
    y: A4_HEIGHT - margin - 35,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`# ${data.documentNumber || '001'}`, {
    x: A4_WIDTH - margin - 160,
    y: A4_HEIGHT - margin - 35,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let currentY = A4_HEIGHT - margin - 80;

  // Company Details (Left) vs Client Details (Right)
  page.drawText('FROM / ISSUER:', { x: margin, y: currentY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('BILLED / DELIVERED TO:', { x: margin + 260, y: currentY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });

  currentY -= 16;
  page.drawText(data.companyName || 'Business Enterprise', { x: margin, y: currentY, size: 12, font: bold, color: rgb(0.1, 0.1, 0.15) });
  page.drawText(data.clientName || 'Client / Customer', { x: margin + 260, y: currentY, size: 12, font: bold, color: rgb(0.1, 0.1, 0.15) });

  currentY -= 14;
  if (data.companyAddress) {
    page.drawText(data.companyAddress.substring(0, 40), { x: margin, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  }
  if (data.clientEmail) {
    page.drawText(data.clientEmail.substring(0, 40), { x: margin + 260, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  }

  currentY -= 16;
  page.drawText(`Date: ${data.date || new Date().toLocaleDateString()}`, { x: margin, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  if (data.dueDate) {
    page.drawText(`Due Date: ${data.dueDate}`, { x: margin + 140, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  }
  if (data.paymentMethod) {
    page.drawText(`Payment Method: ${data.paymentMethod}`, { x: margin + 260, y: currentY, size: 9, font: bold, color: rgb(0.2, 0.2, 0.2) });
  }

  // Divider line
  currentY -= 20;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: A4_WIDTH - margin, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Table Header
  currentY -= 25;
  page.drawRectangle({
    x: margin,
    y: currentY - 5,
    width: A4_WIDTH - margin * 2,
    height: 24,
    color: rgb(0.95, 0.96, 0.98),
  });

  page.drawText('ITEM DESCRIPTION', { x: margin + 10, y: currentY + 3, size: 9, font: bold, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('QTY', { x: margin + 300, y: currentY + 3, size: 9, font: bold, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('RATE', { x: margin + 360, y: currentY + 3, size: 9, font: bold, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('AMOUNT', { x: A4_WIDTH - margin - 75, y: currentY + 3, size: 9, font: bold, color: rgb(0.2, 0.2, 0.25) });

  // Items
  let subtotal = 0;
  currentY -= 20;
  const items = data.items && data.items.length > 0 ? data.items : [{ desc: 'Professional Consulting Services', qty: 1, rate: 500 }];

  items.forEach((item, index) => {
    const amount = item.qty * item.rate;
    subtotal += amount;

    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: currentY - 5,
        width: A4_WIDTH - margin * 2,
        height: 20,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page.drawText(item.desc.substring(0, 48), { x: margin + 10, y: currentY, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(String(item.qty), { x: margin + 305, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`${data.currency} ${item.rate.toFixed(2)}`, { x: margin + 360, y: currentY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`${data.currency} ${amount.toFixed(2)}`, { x: A4_WIDTH - margin - 75, y: currentY, size: 9, font: bold, color: rgb(0.1, 0.1, 0.1) });

    currentY -= 22;
  });

  // Table Bottom Divider
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: A4_WIDTH - margin, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Totals Area
  currentY -= 25;
  const taxAmount = (subtotal * (data.taxPercent || 0)) / 100;
  const grandTotal = subtotal + taxAmount;

  const totalBoxX = A4_WIDTH - margin - 180;
  page.drawText('Subtotal:', { x: totalBoxX, y: currentY, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`${data.currency} ${subtotal.toFixed(2)}`, { x: totalBoxX + 80, y: currentY, size: 10, font, color: rgb(0.1, 0.1, 0.1) });

  if (data.taxPercent > 0) {
    currentY -= 16;
    page.drawText(`Tax (${data.taxPercent}%):`, { x: totalBoxX, y: currentY, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`${data.currency} ${taxAmount.toFixed(2)}`, { x: totalBoxX + 80, y: currentY, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
  }

  currentY -= 22;
  page.drawRectangle({
    x: totalBoxX - 10,
    y: currentY - 6,
    width: 190,
    height: 26,
    color: rgb(0.95, 0.97, 1),
    borderWidth: 1,
    borderColor: headerColor,
  });

  page.drawText('TOTAL AMOUNT:', { x: totalBoxX, y: currentY, size: 10, font: bold, color: headerColor });
  page.drawText(`${data.currency} ${grandTotal.toFixed(2)}`, { x: totalBoxX + 90, y: currentY, size: 11, font: bold, color: rgb(0.1, 0.1, 0.15) });

  // Notes & Payment terms
  if (data.notes) {
    currentY -= 40;
    page.drawText('TERMS & NOTES:', { x: margin, y: currentY, size: 9, font: bold, color: rgb(0.4, 0.4, 0.4) });
    currentY -= 14;
    page.drawText(data.notes.substring(0, 80), { x: margin, y: currentY, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  }

  // Signature Block
  const sigY = margin + 50;
  page.drawLine({
    start: { x: A4_WIDTH - margin - 180, y: sigY },
    end: { x: A4_WIDTH - margin, y: sigY },
    thickness: 1,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('Authorized Signatory', { x: A4_WIDTH - margin - 150, y: sigY - 14, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });

  // Footer Tagline
  page.drawText('Generated securely in browser with Hello PDF • 100% Client-Side Privacy', {
    x: margin,
    y: margin,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
}

// 2. Legal Agreements (NDA, Rental Agreement, Job Offer, Freelance Contract)
export interface LegalAgreementData {
  title: string;
  partyA: string;
  partyB: string;
  effectiveDate: string;
  jurisdiction: string;
  termDuration: string;
  purposeOrTerms: string;
  clauses: Array<{ title: string; content: string }>;
}

export async function generateLegalAgreementPDF(data: LegalAgreementData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 50;

  let y = A4_HEIGHT - margin - 20;

  // Title
  page.drawText(data.title.toUpperCase(), {
    x: margin + 30,
    y,
    size: 16,
    font: bold,
    color: rgb(0.12, 0.12, 0.15),
  });

  y -= 25;
  page.drawLine({
    start: { x: margin, y },
    end: { x: A4_WIDTH - margin, y },
    thickness: 1.5,
    color: rgb(0.2, 0.2, 0.25),
  });

  // Preamble
  y -= 24;
  page.drawText(`This Agreement is made and entered into effective as of ${data.effectiveDate || new Date().toLocaleDateString()}, by and between:`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 18;
  page.drawText(`Party 1 (Disclosing / Provider / Landlord): ${data.partyA || 'First Party'}`, {
    x: margin + 15,
    y,
    size: 10,
    font: bold,
    color: rgb(0.1, 0.1, 0.15),
  });

  y -= 16;
  page.drawText(`Party 2 (Receiving / Recipient / Tenant): ${data.partyB || 'Second Party'}`, {
    x: margin + 15,
    y,
    size: 10,
    font: bold,
    color: rgb(0.1, 0.1, 0.15),
  });

  y -= 24;
  page.drawText(`Jurisdiction / Governing Law: ${data.jurisdiction || 'State / Federal Laws'}`, {
    x: margin,
    y,
    size: 9.5,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 15;
  page.drawText(`Agreement Duration / Term: ${data.termDuration || '2 Years from Effective Date'}`, {
    x: margin,
    y,
    size: 9.5,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Clauses
  data.clauses.forEach((clause, idx) => {
    y -= 25;
    page.drawText(`${idx + 1}. ${clause.title.toUpperCase()}`, {
      x: margin,
      y,
      size: 10.5,
      font: bold,
      color: rgb(0.1, 0.1, 0.15),
    });

    y -= 16;
    // Multi-line wrap simulation
    const words = clause.content.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 80) {
        page.drawText(line, { x: margin + 15, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.25) });
        line = w;
        y -= 14;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line) {
      page.drawText(line, { x: margin + 15, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.25) });
    }
  });

  // Signature lines
  y = margin + 80;
  page.drawText('IN WITNESS WHEREOF, the parties hereto have executed this Agreement:', {
    x: margin,
    y,
    size: 9.5,
    font: bold,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 45;
  // Signature Box 1
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`For: ${data.partyA || 'Party A'}`, { x: margin, y: y - 14, size: 9, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Date: ____________________', { x: margin, y: y - 28, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });

  // Signature Box 2
  page.drawLine({ start: { x: A4_WIDTH - margin - 200, y }, end: { x: A4_WIDTH - margin, y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`For: ${data.partyB || 'Party B'}`, { x: A4_WIDTH - margin - 200, y: y - 14, size: 9, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Date: ____________________', { x: A4_WIDTH - margin - 200, y: y - 28, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

// 3. Certificates & Diplomas
export interface CertificateData {
  certificateType: 'CERTIFICATE OF ACHIEVEMENT' | 'CERTIFICATE OF APPRECIATION' | 'HONORARY DIPLOMA';
  recipientName: string;
  achievementDescription: string;
  organization: string;
  dateStr: string;
  signatory1Title: string;
  signatory1Name: string;
  signatory2Title?: string;
  signatory2Name?: string;
}

export async function generateRichCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);

  // Borders
  page.drawRectangle({
    x: 20,
    y: 20,
    width: A4_LANDSCAPE_WIDTH - 40,
    height: A4_LANDSCAPE_HEIGHT - 40,
    borderWidth: 3,
    borderColor: rgb(0.75, 0.6, 0.2),
    color: rgb(0.99, 0.99, 0.97),
  });

  page.drawRectangle({
    x: 30,
    y: 30,
    width: A4_LANDSCAPE_WIDTH - 60,
    height: A4_LANDSCAPE_HEIGHT - 60,
    borderWidth: 1,
    borderColor: rgb(0.75, 0.6, 0.2),
  });

  let y = A4_LANDSCAPE_HEIGHT - 90;

  // Issuing Organization
  page.drawText(data.organization.toUpperCase(), {
    x: A4_LANDSCAPE_WIDTH / 2 - (data.organization.length * 4.5),
    y,
    size: 13,
    font: bold,
    color: rgb(0.4, 0.35, 0.2),
  });

  y -= 45;
  // Main Title
  const titleText = data.certificateType;
  page.drawText(titleText, {
    x: A4_LANDSCAPE_WIDTH / 2 - (titleText.length * 6),
    y,
    size: 24,
    font: bold,
    color: rgb(0.15, 0.15, 0.2),
  });

  y -= 35;
  page.drawText('THIS IS PROUDLY PRESENTED TO', {
    x: A4_LANDSCAPE_WIDTH / 2 - 110,
    y,
    size: 11,
    font: italic,
    color: rgb(0.45, 0.45, 0.45),
  });

  y -= 45;
  // Recipient Name
  const recipient = data.recipientName || 'Honored Recipient';
  page.drawText(recipient, {
    x: A4_LANDSCAPE_WIDTH / 2 - (recipient.length * 9),
    y,
    size: 32,
    font: bold,
    color: rgb(0.75, 0.15, 0.2),
  });

  // Underline
  page.drawLine({
    start: { x: A4_LANDSCAPE_WIDTH / 2 - 200, y: y - 8 },
    end: { x: A4_LANDSCAPE_WIDTH / 2 + 200, y: y - 8 },
    thickness: 1.5,
    color: rgb(0.75, 0.6, 0.2),
  });

  y -= 45;
  // Achievement Text
  const desc = data.achievementDescription || 'For outstanding commitment, exceptional competence, and exemplary dedication.';
  page.drawText(desc, {
    x: Math.max(60, A4_LANDSCAPE_WIDTH / 2 - (desc.length * 3.5)),
    y,
    size: 12,
    font: italic,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Date
  y -= 35;
  page.drawText(`Awarded on this day: ${data.dateStr || new Date().toLocaleDateString()}`, {
    x: A4_LANDSCAPE_WIDTH / 2 - 100,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Signatures
  const sigY = 90;
  // Left Signature
  page.drawLine({
    start: { x: 120, y: sigY },
    end: { x: 300, y: sigY },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(data.signatory1Name || 'Dr. Arthur Vance', { x: 140, y: sigY - 16, size: 10, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(data.signatory1Title || 'Dean & Program Director', { x: 140, y: sigY - 30, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });

  // Right Signature
  page.drawLine({
    start: { x: A4_LANDSCAPE_WIDTH - 300, y: sigY },
    end: { x: A4_LANDSCAPE_WIDTH - 120, y: sigY },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(data.signatory2Name || 'Elena Rostova', { x: A4_LANDSCAPE_WIDTH - 280, y: sigY - 16, size: 10, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(data.signatory2Title || 'Board Chairperson', { x: A4_LANDSCAPE_WIDTH - 280, y: sigY - 30, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

// 4. Meeting Minutes & Expense Reports & Attendance Roster
export interface OperationsSheetData {
  sheetType: 'MEETING_MINUTES' | 'EXPENSE_REPORT' | 'ATTENDANCE_ROSTER' | 'INVENTORY_SHEET' | 'GENERAL_LEDGER' | 'PROJECT_TIMESHEET';
  title: string;
  subtitle: string;
  date: string;
  authorOrDept: string;
  columns: string[];
  rows: string[][];
  summaryNotes?: string;
}

export async function generateOperationsSheetPDF(data: OperationsSheetData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 45;

  let y = A4_HEIGHT - margin - 20;

  // Header Title
  page.drawText(data.title.toUpperCase(), {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.12, 0.16, 0.22),
  });

  page.drawText(`Date: ${data.date || new Date().toLocaleDateString()}`, {
    x: A4_WIDTH - margin - 120,
    y,
    size: 9.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 16;
  page.drawText(`${data.subtitle} • By: ${data.authorOrDept || 'Operations Department'}`, {
    x: margin,
    y,
    size: 9.5,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });

  y -= 15;
  page.drawLine({
    start: { x: margin, y },
    end: { x: A4_WIDTH - margin, y },
    thickness: 1.5,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Table
  y -= 25;
  const colCount = data.columns.length;
  const tableWidth = A4_WIDTH - margin * 2;
  const colWidth = tableWidth / colCount;

  // Table Header
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: tableWidth,
    height: 22,
    color: rgb(0.92, 0.94, 0.97),
  });

  data.columns.forEach((col, idx) => {
    page.drawText(col.toUpperCase(), {
      x: margin + idx * colWidth + 6,
      y: y + 2,
      size: 8.5,
      font: bold,
      color: rgb(0.2, 0.2, 0.25),
    });
  });

  // Table Rows
  y -= 18;
  data.rows.forEach((row, rowIdx) => {
    if (rowIdx % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: tableWidth,
        height: 20,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    row.forEach((cell, cellIdx) => {
      page.drawText(String(cell || '').substring(0, 30), {
        x: margin + cellIdx * colWidth + 6,
        y,
        size: 8.5,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    });

    y -= 20;
  });

  // Table bottom border
  page.drawLine({
    start: { x: margin, y },
    end: { x: A4_WIDTH - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Notes / Signoff
  if (data.summaryNotes) {
    y -= 25;
    page.drawText('NOTES / SUMMARY / ACTION ITEMS:', { x: margin, y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
    y -= 15;
    page.drawText(data.summaryNotes.substring(0, 95), { x: margin, y, size: 8.5, font, color: rgb(0.35, 0.35, 0.35) });
  }

  // Signature Block
  const sigY = margin + 45;
  page.drawLine({ start: { x: A4_WIDTH - margin - 180, y: sigY }, end: { x: A4_WIDTH - margin, y: sigY }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('Supervisor / Manager Approval', { x: A4_WIDTH - margin - 170, y: sigY - 14, size: 8.5, font: bold, color: rgb(0.3, 0.3, 0.3) });

  return await pdfDoc.save();
}

// 5. Medical Prescription Pad Generator
export interface PrescriptionPadData {
  doctorName: string;
  degrees: string;
  regNumber: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
  patientName: string;
  patientAgeGender: string;
  date: string;
  rxItems: string[];
  adviceNotes?: string;
}

export async function generatePrescriptionPadPDF(data: PrescriptionPadData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 45;

  // Clinic Header
  let y = A4_HEIGHT - margin - 20;
  page.drawText(data.clinicName.toUpperCase(), { x: margin, y, size: 16, font: bold, color: rgb(0.08, 0.45, 0.4) });
  page.drawText(`Phone: ${data.phone || '+1 555-0199'}`, { x: A4_WIDTH - margin - 140, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  y -= 16;
  page.drawText(`Dr. ${data.doctorName} • ${data.degrees}`, { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.25) });
  page.drawText(`Reg No: ${data.regNumber || 'MD-89241'}`, { x: A4_WIDTH - margin - 140, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  y -= 14;
  page.drawText(data.clinicAddress || '104 Wellness Boulevard, Medical Arts Center, Suite 400', { x: margin, y, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });

  y -= 15;
  page.drawLine({ start: { x: margin, y }, end: { x: A4_WIDTH - margin, y }, thickness: 2, color: rgb(0.08, 0.45, 0.4) });

  // Patient Info Box
  y -= 25;
  page.drawRectangle({
    x: margin,
    y: y - 10,
    width: A4_WIDTH - margin * 2,
    height: 32,
    color: rgb(0.96, 0.98, 0.98),
    borderWidth: 1,
    borderColor: rgb(0.85, 0.9, 0.9),
  });

  page.drawText(`Patient: ${data.patientName || 'Jane Doe'}`, { x: margin + 12, y: y + 6, size: 9.5, font: bold, color: rgb(0.15, 0.15, 0.2) });
  page.drawText(`Age/Sex: ${data.patientAgeGender || '34 Yrs / F'}`, { x: margin + 260, y: y + 6, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Date: ${data.date || new Date().toLocaleDateString()}`, { x: A4_WIDTH - margin - 110, y: y + 6, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });

  // Rx Symbol
  y -= 40;
  page.drawText('Rx', { x: margin + 10, y, size: 28, font: bold, color: rgb(0.08, 0.45, 0.4) });

  // Medicines List
  y -= 25;
  data.rxItems.forEach((item, idx) => {
    page.drawText(`${idx + 1}.  ${item}`, { x: margin + 25, y, size: 10.5, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 24;
  });

  // Advice
  if (data.adviceNotes) {
    y -= 20;
    page.drawText('GENERAL ADVICE & PRECAUTIONS:', { x: margin + 10, y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
    y -= 15;
    page.drawText(data.adviceNotes.substring(0, 85), { x: margin + 10, y, size: 8.5, font, color: rgb(0.35, 0.35, 0.35) });
  }

  // Signature Block
  const sigY = margin + 55;
  page.drawLine({ start: { x: A4_WIDTH - margin - 180, y: sigY }, end: { x: A4_WIDTH - margin, y: sigY }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Dr. ${data.doctorName}`, { x: A4_WIDTH - margin - 160, y: sigY - 14, size: 9.5, font: bold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Registered Medical Practitioner', { x: A4_WIDTH - margin - 175, y: sigY - 26, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

// 6. Resume / CV Maker to PDF
export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{ role: string; company: string; duration: string; bullet: string }>;
  education: Array<{ degree: string; school: string; year: string }>;
  skills: string;
}

export async function generateCleanResumePDF(data: ResumeData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 45;

  let y = A4_HEIGHT - margin - 20;

  // Name & Header
  page.drawText(data.fullName.toUpperCase() || 'ALEX RIVERA', { x: margin, y, size: 20, font: bold, color: rgb(0.1, 0.15, 0.25) });
  y -= 18;
  page.drawText(data.jobTitle || 'Senior Software Engineer & Cloud Architect', { x: margin, y, size: 11, font: bold, color: rgb(0.85, 0.2, 0.25) });

  y -= 14;
  page.drawText(`${data.email || 'alex@example.com'}  •  ${data.phone || '+1 (555) 234-5678'}  •  ${data.location || 'San Francisco, CA'}`, {
    x: margin,
    y,
    size: 8.5,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });

  y -= 12;
  page.drawLine({ start: { x: margin, y }, end: { x: A4_WIDTH - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.85) });

  // Summary
  y -= 20;
  page.drawText('PROFESSIONAL SUMMARY', { x: margin, y, size: 9.5, font: bold, color: rgb(0.1, 0.15, 0.25) });
  y -= 14;
  const summaryWords = (data.summary || 'Results-driven technology professional with 8+ years experience designing performant web applications, client-side tools, and distributed cloud microservices.').split(' ');
  let sumLine = '';
  for (const w of summaryWords) {
    if ((sumLine + ' ' + w).length > 85) {
      page.drawText(sumLine, { x: margin, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
      sumLine = w;
      y -= 12;
    } else {
      sumLine = sumLine ? sumLine + ' ' + w : w;
    }
  }
  if (sumLine) {
    page.drawText(sumLine, { x: margin, y, size: 8.5, font, color: rgb(0.25, 0.25, 0.25) });
  }

  // Work Experience
  y -= 22;
  page.drawText('WORK EXPERIENCE', { x: margin, y, size: 9.5, font: bold, color: rgb(0.1, 0.15, 0.25) });

  const exps = data.experience && data.experience.length > 0 ? data.experience : [
    { role: 'Lead Frontend Engineer', company: 'Nova Tech Labs', duration: '2022 - Present', bullet: 'Architected offline-first web workspace used by 2M+ active professionals.' },
    { role: 'Full Stack Engineer', company: 'Apex Solutions', duration: '2019 - 2022', bullet: 'Engineered high-throughput document processing pipelines with sub-second response times.' },
  ];

  exps.forEach((exp) => {
    y -= 16;
    page.drawText(exp.role, { x: margin, y, size: 9, font: bold, color: rgb(0.15, 0.15, 0.2) });
    page.drawText(`${exp.company}  |  ${exp.duration}`, { x: A4_WIDTH - margin - 170, y, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });
    y -= 12;
    page.drawText(`•  ${exp.bullet.substring(0, 85)}`, { x: margin + 10, y, size: 8.5, font, color: rgb(0.3, 0.3, 0.3) });
  });

  // Education
  y -= 22;
  page.drawText('EDUCATION', { x: margin, y, size: 9.5, font: bold, color: rgb(0.1, 0.15, 0.25) });
  y -= 14;
  page.drawText('B.S. in Computer Science', { x: margin, y, size: 9, font: bold, color: rgb(0.15, 0.15, 0.2) });
  page.drawText('University of California  |  Graduated with Honors', { x: A4_WIDTH - margin - 220, y, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });

  // Skills
  y -= 22;
  page.drawText('KEY SKILLS & COMPETENCIES', { x: margin, y, size: 9.5, font: bold, color: rgb(0.1, 0.15, 0.25) });
  y -= 14;
  page.drawText(data.skills || 'TypeScript, React, Node.js, WebAssembly, PDF-Lib, Canvas API, Tailwind CSS, Cloud Run', {
    x: margin,
    y,
    size: 8.5,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  return await pdfDoc.save();
}

// 7. Flashcards Generator
export async function generateFlashcardsPDF(title: string, cards: Array<{ front: string; back: string }>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 40;

  // Header
  page.drawText(`STUDY FLASHCARDS: ${title.toUpperCase()}`, { x: margin, y: A4_HEIGHT - margin - 15, size: 14, font: bold, color: rgb(0.15, 0.2, 0.3) });
  page.drawText('Cut along dashed lines to separate individual cards', { x: margin, y: A4_HEIGHT - margin - 30, size: 8.5, font, color: rgb(0.5, 0.5, 0.5) });

  // 6 cards (2 columns x 3 rows)
  const cardW = (A4_WIDTH - margin * 2 - 20) / 2;
  const cardH = (A4_HEIGHT - margin * 2 - 80) / 3;

  cards.slice(0, 6).forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardW + 20);
    const y = A4_HEIGHT - margin - 50 - (row + 1) * cardH;

    // Card boundary (cut guide)
    page.drawRectangle({
      x,
      y,
      width: cardW,
      height: cardH,
      borderWidth: 1,
      borderColor: rgb(0.75, 0.8, 0.85),
      color: rgb(0.99, 0.99, 1),
    });

    // Card Header Pill
    page.drawRectangle({
      x,
      y: y + cardH - 24,
      width: cardW,
      height: 24,
      color: rgb(0.92, 0.95, 0.98),
    });
    page.drawText(`CARD #${i + 1}`, { x: x + 10, y: y + cardH - 16, size: 9, font: bold, color: rgb(0.3, 0.4, 0.6) });

    // Front (Prompt / Question)
    page.drawText('FRONT / TERM:', { x: x + 12, y: y + cardH - 40, size: 8, font: bold, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(card.front.substring(0, 35), { x: x + 12, y: y + cardH - 55, size: 11, font: bold, color: rgb(0.1, 0.15, 0.25) });

    // Center divider
    page.drawLine({
      start: { x: x + 10, y: y + cardH / 2 },
      end: { x: x + cardW - 10, y: y + cardH / 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Back (Answer / Definition)
    page.drawText('BACK / DEFINITION:', { x: x + 12, y: y + cardH / 2 - 16, size: 8, font: bold, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(card.back.substring(0, 70), { x: x + 12, y: y + cardH / 2 - 32, size: 9.5, font, color: rgb(0.25, 0.25, 0.3) });
  });

  return await pdfDoc.save();
}

// 8. Printable Calendar Generator
export async function generateMonthlyCalendarPDF(monthName: string, year: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);
  const margin = 35;

  // Title
  page.drawText(`${monthName.toUpperCase()} ${year}`, {
    x: margin,
    y: A4_LANDSCAPE_HEIGHT - margin - 25,
    size: 24,
    font: bold,
    color: rgb(0.85, 0.2, 0.25),
  });

  page.drawText('Hello PDF Monthly Planner • Notes & Key Goals on Right', {
    x: margin + 300,
    y: A4_LANDSCAPE_HEIGHT - margin - 20,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const gridW = (A4_LANDSCAPE_WIDTH - margin * 2 - 160) / 7;
  const gridH = (A4_LANDSCAPE_HEIGHT - margin * 2 - 80) / 5;

  let y = A4_LANDSCAPE_HEIGHT - margin - 55;

  // Day Headers
  days.forEach((day, i) => {
    const x = margin + i * gridW;
    page.drawRectangle({
      x,
      y,
      width: gridW,
      height: 20,
      color: rgb(0.94, 0.95, 0.97),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });
    page.drawText(day, { x: x + gridW / 2 - 12, y: y + 6, size: 9, font: bold, color: rgb(0.3, 0.3, 0.35) });
  });

  // 35 Calendar Cells
  let dayNum = 1;
  for (let r = 0; r < 5; r++) {
    const cellY = y - (r + 1) * gridH;
    for (let c = 0; c < 7; c++) {
      const cellX = margin + c * gridW;
      page.drawRectangle({
        x: cellX,
        y: cellY,
        width: gridW,
        height: gridH,
        borderColor: rgb(0.82, 0.82, 0.85),
        borderWidth: 0.5,
        color: rgb(1, 1, 1),
      });

      if (dayNum <= 31) {
        page.drawText(String(dayNum), {
          x: cellX + 6,
          y: cellY + gridH - 14,
          size: 9,
          font: bold,
          color: rgb(0.3, 0.3, 0.35),
        });
        dayNum++;
      }
    }
  }

  // Side Notes Panel
  const notesX = margin + 7 * gridW + 15;
  const notesW = 145;
  const notesH = 5 * gridH + 20;

  page.drawRectangle({
    x: notesX,
    y: y - 5 * gridH,
    width: notesW,
    height: notesH,
    borderColor: rgb(0.8, 0.8, 0.85),
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1),
  });

  page.drawText('MONTHLY GOALS:', { x: notesX + 10, y: y + 6, size: 8.5, font: bold, color: rgb(0.2, 0.3, 0.5) });
  for (let l = 1; l <= 12; l++) {
    const lineY = y - l * 32;
    if (lineY > y - 5 * gridH + 10) {
      page.drawText('[  ]', { x: notesX + 8, y: lineY, size: 8, font: bold, color: rgb(0.6, 0.6, 0.6) });
      page.drawLine({
        start: { x: notesX + 26, y: lineY + 2 },
        end: { x: notesX + notesW - 10, y: lineY + 2 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
    }
  }

  return await pdfDoc.save();
}

// 9. Printable To-Do Checklist Planner
export async function generateTodoListPDF(title: string, items: Array<{ task: string; priority: 'HIGH' | 'MED' | 'LOW' }>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 45;

  let y = A4_HEIGHT - margin - 20;

  // Header
  page.drawText(title.toUpperCase() || 'DAILY ACTION PLAN & CHECKLIST', {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.85, 0.2, 0.25),
  });

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: A4_WIDTH - margin - 120,
    y,
    size: 9.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 16;
  page.drawLine({ start: { x: margin, y }, end: { x: A4_WIDTH - margin, y }, thickness: 1.5, color: rgb(0.2, 0.2, 0.25) });

  y -= 25;
  // Checklist Items
  const checklist = items && items.length > 0 ? items : [
    { task: 'Review quarterly revenue metrics and finalize projections', priority: 'HIGH' as const },
    { task: 'Prepare slide deck for leadership product demonstration', priority: 'HIGH' as const },
    { task: 'Conduct 1-on-1 team member sync meetings', priority: 'MED' as const },
    { task: 'Audit customer feedback reports and security logs', priority: 'MED' as const },
    { task: 'Review supplier contract renewals', priority: 'LOW' as const },
  ];

  checklist.forEach((item, idx) => {
    // Checkbox square
    page.drawRectangle({
      x: margin + 5,
      y: y - 2,
      width: 14,
      height: 14,
      borderWidth: 1.2,
      borderColor: rgb(0.3, 0.35, 0.45),
      color: rgb(1, 1, 1),
    });

    // Task text
    page.drawText(item.task.substring(0, 60), {
      x: margin + 28,
      y: y + 1,
      size: 9.5,
      font,
      color: rgb(0.15, 0.15, 0.2),
    });

    // Priority tag
    const priColor = item.priority === 'HIGH' ? rgb(0.85, 0.2, 0.2) : item.priority === 'MED' ? rgb(0.9, 0.55, 0.1) : rgb(0.3, 0.6, 0.3);
    page.drawText(`[${item.priority}]`, {
      x: A4_WIDTH - margin - 45,
      y: y + 1,
      size: 8,
      font: bold,
      color: priColor,
    });

    y -= 26;
  });

  // Blank lines for additional manual tasks
  for (let i = 0; i < 8; i++) {
    page.drawRectangle({
      x: margin + 5,
      y: y - 2,
      width: 14,
      height: 14,
      borderWidth: 1,
      borderColor: rgb(0.7, 0.7, 0.75),
      color: rgb(1, 1, 1),
    });
    page.drawLine({
      start: { x: margin + 28, y: y + 1 },
      end: { x: A4_WIDTH - margin, y: y + 1 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.88),
    });
    y -= 26;
  }

  // Notes Box at Bottom
  y -= 10;
  page.drawRectangle({
    x: margin,
    y: margin + 15,
    width: A4_WIDTH - margin * 2,
    height: y - (margin + 15),
    borderColor: rgb(0.8, 0.8, 0.85),
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1),
  });
  page.drawText('IMPORTANT NOTES & FOLLOW-UPS:', { x: margin + 12, y: y - 16, size: 8.5, font: bold, color: rgb(0.3, 0.35, 0.45) });

  return await pdfDoc.save();
}

// 10. Music Manuscript Staff Paper Generator
export async function generateMusicStaffPDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const margin = 40;

  // Header
  page.drawText('MUSIC MANUSCRIPT / SCORE SHEET', {
    x: margin,
    y: A4_HEIGHT - margin + 8,
    size: 13,
    font: bold,
    color: rgb(0.2, 0.2, 0.25),
  });

  page.drawText('Composer / Title: _________________________________________   Key / Tempo: ____________', {
    x: margin,
    y: A4_HEIGHT - margin - 14,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });

  // 10 staves per page, each stave has 5 lines
  const numStaves = 10;
  const lineSpacing = 7;
  const staveHeight = lineSpacing * 4; // 28pt
  const staveGap = 46; // gap between staves
  let startY = A4_HEIGHT - margin - 55;

  for (let s = 0; s < numStaves; s++) {
    const staveTop = startY - s * (staveHeight + staveGap);

    // Draw the 5 lines of each stave
    for (let l = 0; l < 5; l++) {
      const lineY = staveTop - l * lineSpacing;
      page.drawLine({
        start: { x: margin, y: lineY },
        end: { x: A4_WIDTH - margin, y: lineY },
        thickness: 0.75,
        color: rgb(0.15, 0.15, 0.2),
      });
    }

    // Left and right vertical bar lines
    page.drawLine({
      start: { x: margin, y: staveTop },
      end: { x: margin, y: staveTop - 4 * lineSpacing },
      thickness: 1.5,
      color: rgb(0.15, 0.15, 0.2),
    });
    page.drawLine({
      start: { x: A4_WIDTH - margin, y: staveTop },
      end: { x: A4_WIDTH - margin, y: staveTop - 4 * lineSpacing },
      thickness: 1.5,
      color: rgb(0.15, 0.15, 0.2),
    });

    // Clef start bar
    page.drawLine({
      start: { x: margin + 8, y: staveTop + 2 },
      end: { x: margin + 8, y: staveTop - 4 * lineSpacing - 2 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.25),
    });
    page.drawText('&', {
      x: margin + 12,
      y: staveTop - 21,
      size: 18,
      font: bold,
      color: rgb(0.25, 0.25, 0.3),
    });
  }

  return await pdfDoc.save();
}

