import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateReceiptPDF(data: {
  storeName?: string;
  receiptNumber?: string;
  cashier?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  paymentMethod?: string;
  taxRate?: number;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Standard receipt dimension: 80mm width (approx 226 pt), 600 pt height
  const width = 240;
  const height = 500;
  const page = pdfDoc.addPage([width, height]);
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const margin = 18;
  let y = height - 28;

  const centerText = (text: string, size = 10, isBold = false) => {
    const f = isBold ? boldFont : font;
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 4;
  };

  centerText(data.storeName || 'HELLO PDF STORE', 14, true);
  centerText('123 Commerce Way, Suite 100', 8);
  centerText('Tel: (555) 019-2834', 8);
  y -= 4;
  centerText(`RECEIPT #${data.receiptNumber || 'RCP-84920'}`, 9, true);
  centerText(`DATE: ${new Date().toLocaleString()}`, 8);
  centerText(`CASHIER: ${data.cashier || 'Ankit / Term 01'}`, 8);

  // Dashed separator
  centerText('--------------------------------', 9);

  const items = data.items && data.items.length > 0 ? data.items : [
    { name: 'Document Processing Pro', qty: 1, price: 12.00 },
    { name: 'PDF Secure Export Pack', qty: 2, price: 4.50 },
    { name: 'High-Res OCR Engine', qty: 1, price: 8.00 },
  ];

  let subtotal = 0;
  for (const item of items) {
    const itemTotal = item.qty * item.price;
    subtotal += itemTotal;
    const lineLeft = `${item.name.slice(0, 16)}`;
    const lineRight = `$${itemTotal.toFixed(2)}`;
    page.drawText(lineLeft, { x: margin, y, size: 8, font });
    const rw = font.widthOfTextAtSize(lineRight, 8);
    page.drawText(lineRight, { x: width - margin - rw, y, size: 8, font });
    y -= 12;
    page.drawText(`  ${item.qty} x $${item.price.toFixed(2)}`, { x: margin, y, size: 7.5, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 12;
  }

  const tax = subtotal * (data.taxRate || 0.08);
  const total = subtotal + tax;

  centerText('--------------------------------', 9);
  
  const drawSummaryLine = (label: string, value: string, isBold = false) => {
    const f = isBold ? boldFont : font;
    page.drawText(label, { x: margin, y, size: 8.5, font: f });
    const vw = f.widthOfTextAtSize(value, 8.5);
    page.drawText(value, { x: width - margin - vw, y, size: 8.5, font: f });
    y -= 14;
  };

  drawSummaryLine('SUBTOTAL:', `$${subtotal.toFixed(2)}`);
  drawSummaryLine('TAX (8%):', `$${tax.toFixed(2)}`);
  y -= 2;
  drawSummaryLine('TOTAL DUE:', `$${total.toFixed(2)}`, true);
  y -= 4;
  drawSummaryLine('PAID VIA:', data.paymentMethod || 'Credit Card (**** 4821)');

  centerText('================================', 9);
  y -= 4;
  centerText('THANK YOU FOR YOUR BUSINESS!', 8, true);
  centerText('Retain this receipt for your records.', 7);
  centerText('www.hellopdf.app', 7);

  // Draw simple barcode graphic
  y -= 10;
  const barcodeY = y;
  for (let bx = margin + 15; bx < width - margin - 15; bx += 3) {
    const thick = (bx % 6 === 0) ? 1.8 : 0.8;
    page.drawLine({
      start: { x: bx, y: barcodeY },
      end: { x: bx, y: barcodeY - 18 },
      thickness: thick,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
  y -= 26;
  centerText('*84920-7481-9923*', 7.5);

  return await pdfDoc.save();
}

export async function generateNDAPDF(data: {
  disclosingParty?: string;
  receivingParty?: string;
  effectiveDate?: string;
  purpose?: string;
  jurisdiction?: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.15),
  });
  y -= 24;

  const dateStr = data.effectiveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const p1 = data.disclosingParty || 'Company Inc. ("Disclosing Party")';
  const p2 = data.receivingParty || 'Contractor / Partner LLC ("Receiving Party")';
  const purpose = data.purpose || 'evaluation of business opportunities, software development, and technical collaboration';
  const state = data.jurisdiction || 'Delaware, USA';

  const paragraphs = [
    `This Non-Disclosure Agreement (the "Agreement") is entered into on ${dateStr}, by and between ${p1} and ${p2}.`,
    `1. Purpose. The parties wish to explore a potential business engagement relating to ${purpose} (the "Purpose"). In connection with the Purpose, each party may disclose to the other confidential technical, business, and financial information.`,
    `2. Definition of Confidential Information. "Confidential Information" means all non-public information disclosed by one party ("Disclosing Party") to the other ("Receiving Party"), whether orally or in writing, that is designated as confidential or reasonably should be understood to be confidential.`,
    `3. Standard of Care. The Receiving Party agrees to protect the Disclosing Party's Confidential Information with the same degree of care it uses for its own confidential information, but in no event less than a reasonable degree of care.`,
    `4. Term & Termination. This Agreement and the confidentiality obligations herein shall remain in effect for a period of two (2) years from the Effective Date.`,
    `5. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of ${state}, without regard to conflicts of law principles.`,
  ];

  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, 10) > (pageWidth - margin * 2)) {
        page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
        y -= 15;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 22;
    }
  }

  y -= 20;
  // Signature blocks
  page.drawText('IN WITNESS WHEREOF, the parties have executed this Agreement.', {
    x: margin,
    y,
    size: 10,
    font: boldFont,
  });
  y -= 40;

  const colWidth = (pageWidth - margin * 2 - 40) / 2;
  // Left Column
  page.drawText(`DISCLOSING PARTY:\n${p1}`, { x: margin, y: y + 14, size: 9, font: boldFont });
  page.drawLine({ start: { x: margin, y }, end: { x: margin + colWidth, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Authorized Signature / Date', { x: margin, y: y - 14, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  // Right Column
  const rightX = margin + colWidth + 40;
  page.drawText(`RECEIVING PARTY:\n${p2}`, { x: rightX, y: y + 14, size: 9, font: boldFont });
  page.drawLine({ start: { x: rightX, y }, end: { x: rightX + colWidth, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Authorized Signature / Date', { x: rightX, y: y - 14, size: 8, font, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

export async function generateResumePDF(data: {
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{ title: string; company: string; period: string; desc: string }>;
  education?: Array<{ degree: string; school: string; year: string }>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 44;
  let y = pageHeight - margin;

  // Name & Title
  page.drawText(data.fullName || 'Alex Morgan', { x: margin, y, size: 24, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  y -= 20;
  page.drawText(data.jobTitle || 'Senior Full-Stack Engineer & Solutions Architect', { x: margin, y, size: 12, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
  y -= 16;

  // Contact Row
  const contact = `${data.email || 'alex.morgan@example.com'}  •  ${data.phone || '+1 (555) 234-5678'}  •  ${data.location || 'San Francisco, CA'}`;
  page.drawText(contact, { x: margin, y, size: 9, font, color: rgb(0.4, 0.45, 0.5) });
  y -= 14;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 18;

  // Section helper
  const drawSectionHeading = (title: string) => {
    page.drawText(title.toUpperCase(), { x: margin, y, size: 10, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
    y -= 14;
  };

  // Summary
  drawSectionHeading('Professional Summary');
  const summaryText = data.summary || 'Results-driven software engineer with 8+ years of expertise in designing distributed cloud systems, modern web applications, and high-volume data architectures. Passionate about craftsmanship, performance optimization, and developer productivity.';
  const summaryWords = summaryText.split(' ');
  let sLine = '';
  for (const w of summaryWords) {
    const test = sLine ? `${sLine} ${w}` : w;
    if (font.widthOfTextAtSize(test, 9.5) > (pageWidth - margin * 2)) {
      page.drawText(sLine, { x: margin, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.3) });
      y -= 13;
      sLine = w;
    } else {
      sLine = test;
    }
  }
  if (sLine) {
    page.drawText(sLine, { x: margin, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.3) });
    y -= 18;
  }

  // Experience
  drawSectionHeading('Work Experience');
  const expItems = data.experience || [
    {
      title: 'Lead Software Architect',
      company: 'TechCorp Global',
      period: '2022 - Present',
      desc: 'Spearheaded migration to microservices, reducing container latency by 42%. Mentored team of 12 engineers across web and DevOps disciplines.'
    },
    {
      title: 'Senior Full-Stack Developer',
      company: 'Innovate Labs',
      period: '2019 - 2022',
      desc: 'Built real-time collaboration tools serving 1.5M monthly active users. Implemented client-side document processing pipelines with WebAssembly.'
    }
  ];

  for (const exp of expItems) {
    page.drawText(exp.title, { x: margin, y, size: 10.5, font: boldFont, color: rgb(0.12, 0.12, 0.16) });
    const periodW = font.widthOfTextAtSize(exp.period, 9);
    page.drawText(exp.period, { x: pageWidth - margin - periodW, y, size: 9, font, color: rgb(0.45, 0.45, 0.5) });
    y -= 13;
    page.drawText(exp.company, { x: margin, y, size: 9.5, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
    y -= 13;
    page.drawText(`• ${exp.desc}`, { x: margin + 4, y, size: 9, font, color: rgb(0.3, 0.3, 0.35) });
    y -= 18;
  }

  // Education
  drawSectionHeading('Education');
  page.drawText('B.S. in Computer Science', { x: margin, y, size: 10, font: boldFont, color: rgb(0.12, 0.12, 0.16) });
  const yrW = font.widthOfTextAtSize('2015 - 2019', 9);
  page.drawText('2015 - 2019', { x: pageWidth - margin - yrW, y, size: 9, font, color: rgb(0.45, 0.45, 0.5) });
  y -= 13;
  page.drawText('University of California, Berkeley  •  GPA 3.85 / 4.0', { x: margin, y, size: 9, font, color: rgb(0.3, 0.3, 0.35) });
  y -= 18;

  // Skills
  drawSectionHeading('Skills & Technologies');
  const skillsList = data.skills || ['TypeScript', 'React 19', 'Node.js', 'WebAssembly', 'PDF Processing', 'Docker', 'PostgreSQL', 'Tailwind CSS', 'GraphQL'];
  const skillStr = skillsList.join('   •   ');
  page.drawText(skillStr, { x: margin, y, size: 9, font, color: rgb(0.2, 0.25, 0.3) });

  return await pdfDoc.save();
}

export async function generateMeetingNotesPDF(data: {
  meetingTitle?: string;
  date?: string;
  attendees?: string;
  agenda?: string;
  actionItems?: string[];
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  // Header
  page.drawText(data.meetingTitle || 'Project Sync & Architecture Review', { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  y -= 20;
  page.drawText(`Date & Time: ${data.date || new Date().toLocaleString()}`, { x: margin, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 14;
  page.drawText(`Attendees: ${data.attendees || 'Engineering Leads, Product Manager, UX Designer'}`, { x: margin, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 16;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 22;

  // Agenda & Discussion
  page.drawText('MEETING AGENDA & KEY POINTS', { x: margin, y, size: 10, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  y -= 16;

  const notes = data.agenda || '1. Review Q3 technical milestones and client deliverable schedules.\n2. In-browser client-side PDF execution benchmark evaluation.\n3. Security audits & GDPR zero-server-upload compliance.\n4. Open discussion and architectural trade-offs.';
  for (const line of notes.split('\n')) {
    page.drawText(line, { x: margin + 4, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.3) });
    y -= 16;
  }
  y -= 16;

  // Action Items
  page.drawText('ACTION ITEMS & NEXT STEPS', { x: margin, y, size: 10, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  y -= 16;

  const items = data.actionItems || [
    'Publish automated GitHub Actions deployment workflow (Owner: DevOps)',
    'Run end-to-end audit on all 108 PDF utility tools (Owner: QA / Core)',
    'Finalize high-resolution image rendering pipeline (Owner: Tech Lead)',
    'Conduct sprint retrospective and document release notes (Owner: Team)',
  ];

  for (const it of items) {
    // Checkbox square
    page.drawRectangle({
      x: margin + 4,
      y: y - 1,
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: rgb(0.4, 0.4, 0.45),
      color: rgb(1, 1, 1),
    });
    page.drawText(it, { x: margin + 20, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.25) });
    y -= 20;
  }

  // Notes area box
  y -= 10;
  page.drawText('ADDITIONAL SCRATCHPAD & NOTES:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.45) });
  y -= 14;
  page.drawRectangle({
    x: margin,
    y: y - 160,
    width: pageWidth - margin * 2,
    height: 160,
    borderWidth: 1,
    borderColor: rgb(0.85, 0.85, 0.88),
    color: rgb(0.98, 0.98, 0.99),
  });

  return await pdfDoc.save();
}

export async function generatePurchaseOrderPDF(data: {
  poNumber?: string;
  vendorName?: string;
  shipTo?: string;
  items?: Array<{ desc: string; qty: number; unitPrice: number }>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  // Header
  page.drawText('PURCHASE ORDER', { x: margin, y, size: 20, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`PO #: ${data.poNumber || 'PO-2026-9041'}`, { x: pageWidth - margin - 150, y, size: 11, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
  y -= 24;
  page.drawText(`Issue Date: ${new Date().toLocaleDateString()}`, { x: pageWidth - margin - 150, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 16;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 22;

  // Addresses
  const colW = (pageWidth - margin * 2 - 20) / 2;
  page.drawText('VENDOR DETAILS:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.5) });
  page.drawText('SHIP TO DESTINATION:', { x: margin + colW + 20, y, size: 9, font: boldFont, color: rgb(0.45, 0.45, 0.5) });
  y -= 14;

  page.drawText(data.vendorName || 'Apex Industrial Supplies LLC\n459 Innovation Parkway\nAustin, TX 78701', { x: margin, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.25) });
  page.drawText(data.shipTo || 'Central Receiving & Logistics\n780 Enterprise Way, Dock #4\nChicago, IL 60601', { x: margin + colW + 20, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.25) });
  y -= 44;

  // Table
  page.drawRectangle({
    x: margin,
    y: y - 6,
    width: pageWidth - margin * 2,
    height: 22,
    color: rgb(0.92, 0.94, 0.97),
  });
  page.drawText('ITEM DESCRIPTION', { x: margin + 8, y, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('QTY', { x: 330, y, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('UNIT PRICE', { x: 400, y, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.25) });
  page.drawText('TOTAL', { x: 480, y, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.25) });
  y -= 24;

  const items = data.items || [
    { desc: 'Commercial Cloud Server Blade Units (Rackmount)', qty: 4, unitPrice: 850.00 },
    { desc: 'Cat6A High-Speed Patch Cables (100-pack)', qty: 2, unitPrice: 95.00 },
    { desc: 'Managed Gigabit Network Switch (48-port PoE)', qty: 1, unitPrice: 420.00 },
  ];

  let subtotal = 0;
  for (const item of items) {
    const rowTot = item.qty * item.unitPrice;
    subtotal += rowTot;
    page.drawText(item.desc, { x: margin + 8, y, size: 9, font, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(String(item.qty), { x: 335, y, size: 9, font, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(`$${item.unitPrice.toFixed(2)}`, { x: 400, y, size: 9, font, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(`$${rowTot.toFixed(2)}`, { x: 480, y, size: 9, font, color: rgb(0.2, 0.2, 0.25) });
    y -= 20;
  }

  y -= 15;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 20;

  page.drawText(`SUBTOTAL: $${subtotal.toFixed(2)}`, { x: 400, y, size: 9.5, font, color: rgb(0.3, 0.3, 0.35) });
  y -= 16;
  page.drawText(`TOTAL PO AMOUNT: $${subtotal.toFixed(2)}`, { x: 370, y, size: 11, font: boldFont, color: rgb(0.85, 0.25, 0.2) });

  return await pdfDoc.save();
}

export async function generateTodoListPDF(title = 'DAILY TASK & FOCUS PLANNER'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 44;
  let y = pageHeight - margin;

  page.drawText(title, { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Date: ______________`, { x: pageWidth - margin - 140, y, size: 10, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 26;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 22;

  // Top 3 Priorities
  page.drawText('TOP 3 MUST-FINISH PRIORITIES', { x: margin, y, size: 10, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
  y -= 16;
  for (let i = 1; i <= 3; i++) {
    page.drawRectangle({ x: margin, y: y - 2, width: 12, height: 12, borderWidth: 1.5, borderColor: rgb(0.85, 0.25, 0.2), color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: margin + 20, y: y + 2 }, end: { x: pageWidth - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.85) });
    y -= 22;
  }
  y -= 10;

  // Checklist of 14 tasks
  page.drawText('TASK CHECKLIST', { x: margin, y, size: 10, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  y -= 16;
  for (let i = 1; i <= 14; i++) {
    page.drawRectangle({ x: margin, y: y - 2, width: 11, height: 11, borderWidth: 1, borderColor: rgb(0.5, 0.5, 0.55), color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: margin + 18, y: y + 2 }, end: { x: pageWidth - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.9) });
    y -= 22;
  }

  return await pdfDoc.save();
}

export async function generateRentalAgreementPDF(data: {
  landlordName?: string;
  tenantName?: string;
  propertyAddress?: string;
  monthlyRent?: string;
  securityDeposit?: string;
  startDate?: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  page.drawText('RESIDENTIAL LEASE AGREEMENT', { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  y -= 26;

  const landlord = data.landlordName || 'Jane Smith ("Landlord")';
  const tenant = data.tenantName || 'John Doe ("Tenant")';
  const address = data.propertyAddress || '450 Oak Avenue, Apt 3B, Seattle, WA 98101';
  const rent = data.monthlyRent || '$2,200.00';
  const deposit = data.securityDeposit || '$2,200.00';
  const start = data.startDate || 'October 1, 2026';

  const clauses = [
    `1. PARTIES: This Lease Agreement is entered into between ${landlord} and ${tenant}.`,
    `2. PREMISES: Landlord leases to Tenant the real property located at: ${address}.`,
    `3. TERM: The term of this lease begins on ${start} and shall continue for twelve (12) months.`,
    `4. RENT: Tenant agrees to pay monthly rent of ${rent}, due on or before the 1st day of each calendar month.`,
    `5. SECURITY DEPOSIT: Upon signing, Tenant shall deposit ${deposit} with Landlord as security for full performance.`,
    `6. USE OF PREMISES: The premises shall be used strictly as a private residential dwelling and for no unlawful purposes.`,
    `7. GOVERNING LAW: This Agreement shall be governed under the state and municipal housing laws of Washington State.`,
  ];

  for (const clause of clauses) {
    const words = clause.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, 10) > (pageWidth - margin * 2)) {
        page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
        y -= 15;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 22;
    }
  }

  y -= 30;
  page.drawText('SIGNATURES:', { x: margin, y, size: 11, font: boldFont });
  y -= 40;

  const colW = (pageWidth - margin * 2 - 40) / 2;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + colW, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText(`Landlord Signature / Date\n(${landlord})`, { x: margin, y: y - 14, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });

  const rightX = margin + colW + 40;
  page.drawLine({ start: { x: rightX, y }, end: { x: rightX + colW, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText(`Tenant Signature / Date\n(${tenant})`, { x: rightX, y: y - 14, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });

  return await pdfDoc.save();
}

export async function generateJobOfferPDF(data: {
  candidateName?: string;
  jobTitle?: string;
  salary?: string;
  startDate?: string;
  companyName?: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  const comp = data.companyName || 'Hello PDF Technologies Inc.';
  const candidate = data.candidateName || 'Jordan Vance';
  const role = data.jobTitle || 'Lead Software Engineer';
  const salary = data.salary || '$165,000 per annum';
  const start = data.startDate || 'November 1, 2026';

  page.drawText(comp.toUpperCase(), { x: margin, y, size: 16, font: boldFont, color: rgb(0.85, 0.25, 0.2) });
  y -= 22;
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: margin, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 18;
  page.drawText(`Dear ${candidate},`, { x: margin, y, size: 11, font: boldFont, color: rgb(0.15, 0.15, 0.2) });
  y -= 20;

  const letterText = `We are delighted to extend this formal offer of employment for the position of ${role} with ${comp}. We were deeply impressed with your technical background, domain problem-solving abilities, and culture alignment.\n\n` +
    `1. Position & Scope: You will serve in a full-time capacity reporting directly to the VP of Engineering.\n` +
    `2. Compensation: Your starting annual base salary will be ${salary}, paid semi-monthly in accordance with normal payroll procedures.\n` +
    `3. Effective Start Date: Your anticipated start date will be ${start}.\n` +
    `4. Benefits: You will be entitled to comprehensive medical, dental, 401(k) matching, and flexible paid time off.\n\n` +
    `Please indicate your acceptance of this offer by signing and returning a copy of this letter.\n\n` +
    `Sincerely,\n\nTalent Acquisition & Executive Team\n${comp}`;

  for (const block of letterText.split('\n')) {
    if (!block.trim()) {
      y -= 10;
      continue;
    }
    const words = block.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, 10) > (pageWidth - margin * 2)) {
        page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
        y -= 15;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 16;
    }
  }

  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText(`Candidate Signature (${candidate})  /  Date`, { x: margin, y: y - 14, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });

  return await pdfDoc.save();
}

export async function generatePrescriptionPadPDF(data: {
  doctorName?: string;
  clinicName?: string;
  regNumber?: string;
  patientName?: string;
  patientAge?: string;
  rxText?: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 44;
  let y = pageHeight - margin;

  // Clinic Header
  page.drawText(data.clinicName || 'METROPOLITAN HEALTH & WELLNESS CLINIC', { x: margin, y, size: 14, font: boldFont, color: rgb(0.1, 0.35, 0.65) });
  y -= 18;
  page.drawText(`Dr. ${data.doctorName || 'Robert Vance, MD, FACP'}  •  Reg No: ${data.regNumber || 'MED-90381-WA'}`, { x: margin, y, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.25) });
  y -= 14;
  page.drawText('500 Medical Plaza, Suite 400 • Tel: (555) 018-9234', { x: margin, y, size: 8.5, font, color: rgb(0.45, 0.45, 0.5) });
  y -= 12;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 2, color: rgb(0.1, 0.35, 0.65) });
  y -= 22;

  // Patient Info Bar
  page.drawText(`Patient: ${data.patientName || 'Alex Mercer'}`, { x: margin, y, size: 10, font: boldFont });
  page.drawText(`Age/Sex: ${data.patientAge || '34 Y / M'}`, { x: 300, y, size: 10, font });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: pageWidth - margin - 120, y, size: 10, font });
  y -= 14;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.85) });
  y -= 30;

  // Large Rx Symbol
  page.drawText('Rx', { x: margin, y, size: 36, font: timesBold, color: rgb(0.1, 0.35, 0.65) });
  y -= 34;

  const medications = data.rxText || '1. Tab. Amoxicillin 500mg - 1 capsule tid x 7 days (after food)\n2. Tab. Paracetamol 650mg - 1 tab sos for fever/pain\n3. Cap. Omeprazole 20mg - 1 cap once daily before breakfast x 7 days\n\nAdvice: Adequate rest, hydrate with minimum 2.5L water daily. Review after 7 days if symptoms persist.';

  for (const line of medications.split('\n')) {
    page.drawText(line, { x: margin + 14, y, size: 10, font, color: rgb(0.15, 0.15, 0.2) });
    y -= 18;
  }

  // Footer Doctor Signature
  y = 90;
  page.drawLine({ start: { x: pageWidth - margin - 180, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Doctor's Signature & Stamp", { x: pageWidth - margin - 165, y: y - 14, size: 9, font, color: rgb(0.4, 0.4, 0.45) });

  return await pdfDoc.save();
}

export async function generateTimesheetPDF(data: {
  employeeName?: string;
  weekEnding?: string;
  client?: string;
  days?: Array<{ day: string; task: string; hours: number }>;
  hourlyRate?: number;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  page.drawText('WEEKLY PROJECT TIMESHEET', { x: margin, y, size: 18, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  y -= 22;
  page.drawText(`Consultant: ${data.employeeName || 'Michael Chen'}   •   Week Ending: ${data.weekEnding || new Date().toLocaleDateString()}`, { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText(`Client / Account: ${data.client || 'Enterprise Cloud Transformation Project'}`, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 18;

  page.drawRectangle({ x: margin, y: y - 6, width: pageWidth - margin * 2, height: 22, color: rgb(0.92, 0.94, 0.97) });
  page.drawText('DAY', { x: margin + 8, y, size: 8.5, font: boldFont });
  page.drawText('DESCRIPTION / TASK', { x: margin + 90, y, size: 8.5, font: boldFont });
  page.drawText('HOURS', { x: pageWidth - margin - 60, y, size: 8.5, font: boldFont });
  y -= 24;

  const days = data.days || [
    { day: 'Monday', task: 'Sprint planning and architecture review for PDF pipelines', hours: 8.0 },
    { day: 'Tuesday', task: 'Client-side WebAssembly integration & testing', hours: 8.5 },
    { day: 'Wednesday', task: 'Zero-server upload privacy protocol verification', hours: 7.5 },
    { day: 'Thursday', task: 'UI optimization and responsiveness hardening', hours: 8.0 },
    { day: 'Friday', task: 'Release deployment and user acceptance verification', hours: 8.0 },
  ];

  let totalHours = 0;
  for (const d of days) {
    totalHours += d.hours;
    page.drawText(d.day, { x: margin + 8, y, size: 9, font: boldFont });
    page.drawText(d.task, { x: margin + 90, y, size: 9, font });
    page.drawText(`${d.hours.toFixed(1)} hrs`, { x: pageWidth - margin - 65, y, size: 9, font });
    y -= 22;
  }

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 22;

  const rate = data.hourlyRate || 85;
  const grossPay = totalHours * rate;
  page.drawText(`TOTAL BILLABLE HOURS: ${totalHours.toFixed(1)} hrs`, { x: pageWidth - margin - 220, y, size: 10, font: boldFont });
  y -= 16;
  page.drawText(`HOURLY RATE: $${rate.toFixed(2)}/hr  •  TOTAL PAY: $${grossPay.toFixed(2)}`, { x: pageWidth - margin - 260, y, size: 11, font: boldFont, color: rgb(0.85, 0.25, 0.2) });

  return await pdfDoc.save();
}

export async function generateInventoryOrPackingSlipPDF(type: 'packing-slip' | 'inventory' | 'ledger' | 'expense' | 'attendance'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const margin = 44;
  let y = pageHeight - margin;

  const titles: Record<string, string> = {
    'packing-slip': 'WAREHOUSE DISPATCH PACKING SLIP',
    'inventory': 'STOCK & INVENTORY AUDIT SHEET',
    'ledger': 'GENERAL ACCOUNTING TRANSACTION LEDGER',
    'expense': 'BUSINESS EXPENSE REIMBURSEMENT REPORT',
    'attendance': 'TEAM & STUDENT ATTENDANCE ROSTER',
  };

  page.drawText(titles[type] || 'OFFICIAL FORM', { x: margin, y, size: 16, font: boldFont, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: pageWidth - margin - 120, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.45) });
  y -= 24;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.88) });
  y -= 20;

  // Draw grid table
  const rowHeight = 22;
  const cols = 5;
  const colWidth = (pageWidth - margin * 2) / cols;

  page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 22, color: rgb(0.92, 0.94, 0.97) });
  const headers = ['REF / ID', 'DESCRIPTION', 'CATEGORY / DEPT', 'QTY / AMOUNT', 'STATUS / SIGN'];
  headers.forEach((h, idx) => {
    page.drawText(h, { x: margin + idx * colWidth + 6, y: y + 2, size: 8, font: boldFont });
  });
  y -= 22;

  // 18 rows
  for (let r = 1; r <= 18; r++) {
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.88, 0.88, 0.92) });
    page.drawText(`Item #${String(r).padStart(3, '0')}`, { x: margin + 6, y: y - 14, size: 8, font, color: rgb(0.5, 0.5, 0.55) });
    y -= rowHeight;
  }

  return await pdfDoc.save();
}
