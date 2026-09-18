import {
  textToPDF,
  mergePDFs,
  splitPDF,
  rotatePDF,
  compressPDF,
  watermarkPDF,
  addPageNumbers,
  protectPDF,
  applyBatesNumbering,
  createPhotoAlbumPDF,
} from '../src/services/pdfEngine';

import {
  reversePDFPages,
  duplicatePDFPages,
  extractOddEvenPages,
  extractFirstOrLastPage,
  removeFirstOrLastPage,
  addBlankPageToPDF,
  nUpPDF,
  flattenPDF,
  cleanAllMetadata,
  stripAnnotations,
  darkModePDF,
  grayscalePDF,
  cropPDF,
  resizePageDimensions,
  barcodeStamper,
  stampDateTime,
  addPageBorder,
  redactPDF,
  highlightArea,
  addCopyrightNotice,
  gridOverlay,
} from '../src/services/pdfAdvancedOps';

import {
  generateReceiptPDF,
  generateNDAPDF,
  generateResumePDF,
  generateMeetingNotesPDF,
  generatePurchaseOrderPDF,
  generateTodoListPDF,
  generateRentalAgreementPDF,
  generateJobOfferPDF,
  generatePrescriptionPadPDF,
  generateTimesheetPDF,
  generateInventoryOrPackingSlipPDF,
} from '../src/services/documentGenerators';

import {
  csvToPDF,
  jsonToPDF,
  markdownToPDF,
  base64ToPDF,
  pdfToBase64,
} from '../src/services/pdfConvert';

import { PDFDocument } from 'pdf-lib';
import { inspectComprehensivePDF } from '../src/services/pdfInspect';

async function runVerification() {
  console.log('--- STARTING COMPREHENSIVE TOOLS VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<any>) {
    try {
      const start = Date.now();
      await fn();
      console.log(`✓ [PASS] ${name} (${Date.now() - start}ms)`);
      passed++;
    } catch (err: any) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Create base test PDF file with 4 distinct pages
  const multiDoc = await PDFDocument.create();
  for (let i = 1; i <= 4; i++) {
    const p = multiDoc.addPage([600, 800]);
    p.drawText(`Page ${i} of Hello PDF Test Suite Document`, { x: 50, y: 750 });
  }
  const basePdfBytes = await multiDoc.save();
  const basePdfFile = new File([basePdfBytes as any], 'test_doc.pdf', { type: 'application/pdf' });

  // 1. Core PDF Engine tests
  await test('textToPDF', async () => {
    const bytes = await textToPDF('Test text', 'Doc 1');
    if (!bytes || bytes.length === 0) throw new Error('Empty PDF bytes');
  });

  await test('splitPDF', async () => {
    const bytes = await splitPDF(basePdfFile, '1');
    if (!bytes || bytes.length === 0) throw new Error('Empty PDF bytes');
  });

  await test('rotatePDF', async () => {
    const bytes = await rotatePDF(basePdfFile, 90);
    if (!bytes || bytes.length === 0) throw new Error('Empty PDF bytes');
  });

  await test('compressPDF', async () => {
    const res = await compressPDF(basePdfFile, 'recommended');
    if (!res.data || res.data.length === 0) throw new Error('Compress failed');
  });

  await test('watermarkPDF', async () => {
    const bytes = await watermarkPDF(basePdfFile, 'CONFIDENTIAL');
    if (!bytes || bytes.length === 0) throw new Error('Watermark failed');
  });

  await test('addPageNumbers', async () => {
    const bytes = await addPageNumbers(basePdfFile, { position: 'bottom-center', format: 'page-of-total' });
    if (!bytes || bytes.length === 0) throw new Error('Page numbers failed');
  });

  await test('protectPDF', async () => {
    const bytes = await protectPDF(basePdfFile, 'secret123');
    if (!bytes || bytes.length === 0) throw new Error('Protect PDF failed');
  });

  await test('applyBatesNumbering', async () => {
    const bytes = await applyBatesNumbering(basePdfFile, 'LEGAL-', 100);
    if (!bytes || bytes.length === 0) throw new Error('Bates numbering failed');
  });

  // 2. Advanced Operations
  await test('reversePDFPages', async () => {
    const bytes = await reversePDFPages(basePdfFile);
    if (!bytes || bytes.length === 0) throw new Error('Reverse failed');
  });

  await test('duplicatePDFPages', async () => {
    const bytes = await duplicatePDFPages(basePdfFile, 2);
    if (!bytes || bytes.length === 0) throw new Error('Duplicate failed');
  });

  await test('extractOddEvenPages', async () => {
    const odd = await extractOddEvenPages(basePdfFile, 'odd');
    const even = await extractOddEvenPages(basePdfFile, 'even');
    if (!odd || !even) throw new Error('Extract odd/even failed');
  });

  await test('extractFirstOrLastPage', async () => {
    const first = await extractFirstOrLastPage(basePdfFile, 'first');
    const last = await extractFirstOrLastPage(basePdfFile, 'last');
    if (!first || !last) throw new Error('Extract first/last failed');
  });

  await test('removeFirstOrLastPage', async () => {
    const rFirst = await removeFirstOrLastPage(basePdfFile, 'first');
    if (!rFirst) throw new Error('Remove first failed');
  });

  await test('addBlankPageToPDF', async () => {
    const blank = await addBlankPageToPDF(basePdfFile, 'end');
    if (!blank) throw new Error('Add blank page failed');
  });

  await test('nUpPDF', async () => {
    const nup = await nUpPDF(basePdfFile, '2in1');
    if (!nup) throw new Error('N-up failed');
  });

  await test('flattenPDF', async () => {
    const flat = await flattenPDF(basePdfFile);
    if (!flat) throw new Error('Flatten failed');
  });

  await test('cleanAllMetadata', async () => {
    const clean = await cleanAllMetadata(basePdfFile);
    if (!clean) throw new Error('Clean metadata failed');
  });

  await test('stripAnnotations', async () => {
    const stripped = await stripAnnotations(basePdfFile);
    if (!stripped) throw new Error('Strip annotations failed');
  });

  await test('darkModePDF', async () => {
    const dark = await darkModePDF(basePdfFile);
    if (!dark) throw new Error('Dark mode failed');
  });

  await test('grayscalePDF', async () => {
    const gray = await grayscalePDF(basePdfFile);
    if (!gray) throw new Error('Grayscale failed');
  });

  await test('cropPDF', async () => {
    const cropped = await cropPDF(basePdfFile, 20);
    if (!cropped) throw new Error('Crop failed');
  });

  await test('resizePageDimensions', async () => {
    const a4 = await resizePageDimensions(basePdfFile, 'A4');
    if (!a4) throw new Error('Resize failed');
  });

  await test('barcodeStamper', async () => {
    const barcode = await barcodeStamper(basePdfFile, 'TEST-1234');
    if (!barcode) throw new Error('Barcode stamper failed');
  });

  await test('stampDateTime', async () => {
    const stamped = await stampDateTime(basePdfFile);
    if (!stamped) throw new Error('Timestamp failed');
  });

  await test('addPageBorder', async () => {
    const bordered = await addPageBorder(basePdfFile);
    if (!bordered) throw new Error('Border failed');
  });

  await test('redactPDF', async () => {
    const redacted = await redactPDF(basePdfFile);
    if (!redacted) throw new Error('Redact failed');
  });

  await test('highlightArea', async () => {
    const high = await highlightArea(basePdfFile);
    if (!high) throw new Error('Highlight failed');
  });

  await test('addCopyrightNotice', async () => {
    const copy = await addCopyrightNotice(basePdfFile, 'Hello PDF', '2026');
    if (!copy) throw new Error('Copyright failed');
  });

  await test('gridOverlay', async () => {
    const grid = await gridOverlay(basePdfFile);
    if (!grid) throw new Error('Grid failed');
  });

  // 3. Document Generators
  await test('generateReceiptPDF', async () => {
    const receipt = await generateReceiptPDF({ storeName: 'Tech Store' });
    if (!receipt) throw new Error('Receipt generator failed');
  });

  await test('generateNDAPDF', async () => {
    const nda = await generateNDAPDF({ disclosingParty: 'Acme Corp' });
    if (!nda) throw new Error('NDA generator failed');
  });

  await test('generateResumePDF', async () => {
    const resume = await generateResumePDF({ fullName: 'John Doe' });
    if (!resume) throw new Error('Resume generator failed');
  });

  await test('generateMeetingNotesPDF', async () => {
    const notes = await generateMeetingNotesPDF({});
    if (!notes) throw new Error('Meeting notes failed');
  });

  await test('generatePurchaseOrderPDF', async () => {
    const po = await generatePurchaseOrderPDF({});
    if (!po) throw new Error('PO generator failed');
  });

  await test('generateTodoListPDF', async () => {
    const todo = await generateTodoListPDF();
    if (!todo) throw new Error('Todo generator failed');
  });

  await test('generateRentalAgreementPDF', async () => {
    const rental = await generateRentalAgreementPDF({});
    if (!rental) throw new Error('Rental agreement failed');
  });

  await test('generateJobOfferPDF', async () => {
    const offer = await generateJobOfferPDF({ candidateName: 'Jane Smith' });
    if (!offer) throw new Error('Job offer failed');
  });

  await test('generatePrescriptionPadPDF', async () => {
    const rx = await generatePrescriptionPadPDF({ patientName: 'Bob' });
    if (!rx) throw new Error('Prescription pad failed');
  });

  await test('generateTimesheetPDF', async () => {
    const ts = await generateTimesheetPDF({});
    if (!ts) throw new Error('Timesheet failed');
  });

  await test('generateInventoryOrPackingSlipPDF (inventory)', async () => {
    const inv = await generateInventoryOrPackingSlipPDF('inventory');
    if (!inv) throw new Error('Inventory sheet failed');
  });

  await test('generateInventoryOrPackingSlipPDF (packing)', async () => {
    const packing = await generateInventoryOrPackingSlipPDF('packing-slip');
    if (!packing) throw new Error('Packing slip failed');
  });

  // 4. Data Converters
  await test('csvToPDF', async () => {
    const csv = await csvToPDF('ColA,ColB\n1,2\n3,4', 'Test CSV');
    if (!csv) throw new Error('CSV to PDF failed');
  });

  await test('jsonToPDF', async () => {
    const json = await jsonToPDF('{"name":"Hello PDF","version":"1.0"}', 'Test JSON');
    if (!json) throw new Error('JSON to PDF failed');
  });

  await test('markdownToPDF', async () => {
    const md = await markdownToPDF('# Title\n- Item 1\n- Item 2', 'Test MD');
    if (!md) throw new Error('Markdown to PDF failed');
  });

  await test('pdfToBase64 & base64ToPDF', async () => {
    const b64 = await pdfToBase64(basePdfFile);
    if (!b64.startsWith('data:application/pdf;base64,')) throw new Error('Invalid base64 string');
    const pdfBytes = await base64ToPDF(b64);
    if (!pdfBytes || pdfBytes.length === 0) throw new Error('Base64 to PDF failed');
  });

  // 5. PDF Inspection
  await test('inspectComprehensivePDF', async () => {
    const report = await inspectComprehensivePDF(basePdfFile);
    if (report.pageCount < 1) throw new Error('Inspection reported invalid page count');
  });

  // 6. Bulk Photo Album to PDF (#105)
  await test('createPhotoAlbumPDF (#105 - 1, 2, 4 per page & cover)', async () => {
    // Minimal valid JPEG binary
    const base64Jpeg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const binaryStr = Buffer.from(base64Jpeg, 'base64');
    const photoFile1 = new File([binaryStr], 'vacation_1.jpg', { type: 'image/jpeg' });
    const photoFile2 = new File([binaryStr], 'vacation_2.jpg', { type: 'image/jpeg' });
    const photoFile3 = new File([binaryStr], 'vacation_3.jpg', { type: 'image/jpeg' });
    const photoFile4 = new File([binaryStr], 'vacation_4.jpg', { type: 'image/jpeg' });

    const albumBytes = await createPhotoAlbumPDF(
      [photoFile1, photoFile2, photoFile3, photoFile4],
      {
        layout: '4-per-page',
        albumTitle: 'Summer Vacation Memories',
        addCoverPage: true,
        pageSize: 'A4',
        orientation: 'landscape',
        margin: 20,
      }
    );
    if (!albumBytes || albumBytes.length === 0) throw new Error('Photo album output was empty');
    const doc = await PDFDocument.load(albumBytes);
    // 1 cover page + 1 page with 4 photos in grid = 2 pages
    if (doc.getPageCount() !== 2) {
      throw new Error(`Expected 2 pages for 4-per-page layout with cover, got ${doc.getPageCount()}`);
    }
  });

  console.log(`\n--- VERIFICATION FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
