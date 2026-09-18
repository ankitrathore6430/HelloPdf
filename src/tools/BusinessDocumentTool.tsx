import React, { useState, useEffect, useRef } from 'react';
import { ToolItem } from '../types';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  generateBusinessInvoiceReceiptPDF,
  generateLegalAgreementPDF,
  generateRichCertificatePDF,
  generateOperationsSheetPDF,
  generatePrescriptionPadPDF,
  generateCleanResumePDF,
  generateFlashcardsPDF,
  generateMonthlyCalendarPDF,
  generateTodoListPDF,
  generateMusicStaffPDF,
  generateIndianRentReceiptPDF,
} from '../services/businessPdfEngine';
import { generatePaperPDF } from '../services/pdfEngine';
import {
  Building2,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Calendar,
  ListTodo,
  Stethoscope,
  Briefcase,
  Award,
  Music,
  Layers,
  FileCheck,
  Eye,
} from 'lucide-react';

interface BusinessDocumentToolProps {
  tool: ToolItem;
}

export const BusinessDocumentTool: React.FC<BusinessDocumentToolProps> = ({ tool }) => {
  const id = tool.id;

  // Category mode detection
  const isFinance = [
    'invoice-generator',
    'receipt-maker',
    'purchase-order',
    'packing-slip',
    'expense-report',
    'printable-ledger',
  ].includes(id);
  const isAgreement = [
    'nda-generator',
    'rental-agreement',
    'job-offer-letter',
    'nda-freelance-contract',
  ].includes(id);
  const isAward = [
    'certificate-generator',
    'certificate-appreciation',
    'diploma-maker',
  ].includes(id);
  const isOperations = [
    'meeting-notes',
    'attendance-sheet',
    'inventory-sheet',
    'project-timesheet',
  ].includes(id);
  const isStationery = [
    'dot-grid-paper',
    'lined-paper',
    'music-staff-paper',
  ].includes(id);
  const isCalendar = id === 'printable-calendar';
  const isTodoList = id === 'todo-list-pdf';
  const isFlashcard = id === 'flashcard-generator';
  const isMedical = id === 'medical-prescription-pad';
  const isResume = id === 'resume-to-pdf';

  // 1. Finance State (Invoice / Receipt / PO / Packing Slip / Expense / Ledger)
  const [docType, setDocType] = useState<string>('INVOICE');
  const [docNumber, setDocNumber] = useState('INV-2026-001');
  const [companyName, setCompanyName] = useState('Bharat Infotech Solutions Pvt. Ltd.');
  const [companyAddress, setCompanyAddress] = useState('Plot 44, Electronic City Phase 1, Bengaluru, Karnataka - 560100');
  const [clientName, setClientName] = useState('Reliance Digital Enterprises Ltd.');
  const [clientEmail, setClientEmail] = useState('accounts@reliancedigital.in');
  const [currency, setCurrency] = useState('INR (₹)');
  const [taxPercent, setTaxPercent] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState('UPI / NEFT / IMPS Bank Transfer');
  const [notes, setNotes] = useState('Subject to Bengaluru jurisdiction. Payment requested within 15 days of issuance.');
  const [items, setItems] = useState<Array<{ desc: string; hsn?: string; qty: number; rate: number }>>([
    { desc: 'Cloud Architecture & High-Throughput Engineering', hsn: '998313', qty: 1, rate: 45000 },
    { desc: 'Client-Side PDF Engine Optimization & Testing', hsn: '998314', qty: 2, rate: 25000 },
    { desc: 'DPDP Act 2023 Compliance & Security Audit', hsn: '998315', qty: 1, rate: 30000 },
  ]);

  // Indian GST Specifics
  const [isGstInvoice, setIsGstInvoice] = useState(true);
  const [gstin, setGstin] = useState('29AAAAA0000A1Z5');
  const [pan, setPan] = useState('AAACA1234F');
  const [stateCode, setStateCode] = useState('29 - Karnataka');
  const [clientGstin, setClientGstin] = useState('27AAAAA0000A1Z2');
  const [cgstPercent, setCgstPercent] = useState(9);
  const [sgstPercent, setSgstPercent] = useState(9);

  // 2. Agreement State
  const [agreementTitle, setAgreementTitle] = useState('Mutual Non-Disclosure Agreement (NDA)');
  const [partyA, setPartyA] = useState('Bharat Digital Innovations Pvt. Ltd.');
  const [partyB, setPartyB] = useState('Apex Technologies India Pvt. Ltd.');
  const [jurisdiction, setJurisdiction] = useState('Bengaluru, Karnataka, India (Indian Contract Act, 1872)');
  const [termDuration, setTermDuration] = useState('2 Years from Execution Date');

  // Indian HRA Rent Receipt State (under Sec 10(13A))
  const [isHraReceipt, setIsHraReceipt] = useState(false);
  const [tenantName, setTenantName] = useState('Amit Kumar Verma');
  const [landlordName, setLandlordName] = useState('Shri Rajesh Sharma');
  const [landlordPan, setLandlordPan] = useState('ABCDE1234F');
  const [propertyAddress, setPropertyAddress] = useState('Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103');
  const [rentAmount, setRentAmount] = useState(28000);
  const [rentPeriod, setRentPeriod] = useState('October 2026');
  const [rentPaymentMode, setRentPaymentMode] = useState('UPI / Direct Bank Transfer');

  // 3. Award / Certificate State
  const [certType, setCertType] = useState<'CERTIFICATE OF ACHIEVEMENT' | 'CERTIFICATE OF APPRECIATION' | 'HONORARY DIPLOMA'>('CERTIFICATE OF ACHIEVEMENT');
  const [recipientName, setRecipientName] = useState('Dr. Sarah Jenkins, M.Sc.');
  const [achievementDesc, setAchievementDesc] = useState(
    'For successfully demonstrating master-level competency in Cloud Architecture & High-Performance Systems.'
  );
  const [certOrg, setCertOrg] = useState('Indian Institute of Technology (IIT) & Applied Sciences');
  const [signatory1, setSignatory1] = useState('Prof. Arthur Vance');
  const [signatory2, setSignatory2] = useState('Elena Rostova');

  // 4. Operations State
  const [opsTitle, setOpsTitle] = useState('Quarterly Board Meeting Minutes');
  const [opsAuthor, setOpsAuthor] = useState('Operations Management Dept');

  // 5. Medical Prescription State
  const [doctorName, setDoctorName] = useState('Dr. Ramesh Kumar, MBBS, MD');
  const [degrees, setDegrees] = useState('MBBS, MD (Medicine) - AIIMS New Delhi');
  const [regNumber, setRegNumber] = useState('DMC / MCI-481920');
  const [clinicName, setClinicName] = useState('Sanjivani Healthcare & Diagnostic Clinic');
  const [patientName, setPatientName] = useState('Pooja Verma');
  const [patientAgeGender, setPatientAgeGender] = useState('29 Yrs / Female');
  const [rxMeds, setRxMeds] = useState([
    'Paracetamol 650mg (Dolo) - 1 tablet SOS after meals for fever/body pain',
    'Pantoprazole 40mg (Pan-40) - 1 tablet empty stomach in morning (5 Days)',
    'Azithromycin 500mg (Azee) - 1 tablet once daily after dinner (3 Days)',
  ]);

  // 6. Resume State
  const [resumeName, setResumeName] = useState('PRIYA SUNDARAM');
  const [resumeTitle, setResumeTitle] = useState('Senior Full-Stack Software Engineer & Tech Lead');
  const [resumeEmail, setResumeEmail] = useState('priya.sundaram@techindia.com');
  const [resumePhone, setResumePhone] = useState('+91 98765 43210');
  const [resumeLocation, setResumeLocation] = useState('Bengaluru, Karnataka, India');
  const [resumeSummary, setResumeSummary] = useState(
    'Versatile software architect with 8+ years building high-throughput client-side applications, document processing engines, and distributed web platforms.'
  );
  const [resumeSkills, setResumeSkills] = useState('TypeScript, React, Node.js, WebAssembly, PDF-Lib, Canvas API, Tailwind CSS, Docker, Cloud Run');

  // 7. Stationery & Paper
  const [paperKind, setPaperKind] = useState<'dot' | 'lined' | 'graph' | 'music'>(
    id === 'music-staff-paper' ? 'music' : id === 'lined-paper' ? 'lined' : 'dot'
  );

  // 8. Calendar
  const [calMonth, setCalMonth] = useState('October');
  const [calYear, setCalYear] = useState(2026);

  // 9. Flashcards State
  const [flashcardTopic, setFlashcardTopic] = useState('Computer Science & Web Standards');
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([
    { front: 'DOM (Document Object Model)', back: 'Tree structure representation of HTML elements in web browsers.' },
    { front: 'TypedArray (Uint8Array)', back: 'Array of 8-bit unsigned integers representing raw binary buffer memory.' },
    { front: 'Pure Client-Side Computing', back: 'Processing data locally in browser memory without sending files to cloud.' },
    { front: 'PDF-Lib Engine', back: 'Pure JavaScript vector library for creating and modifying PDF byte streams.' },
    { front: 'CSS Grid & Flexbox', back: 'Two-dimensional and one-dimensional responsive layout systems.' },
    { front: 'Blob (Binary Large Object)', back: 'File-like object of immutable, raw data representing media or files.' },
  ]);

  // Common UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up object URL when component unmounts or blob changes
  useEffect(() => {
    if (resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [resultBlob]);

  // Synchronize state when tool.id changes
  useEffect(() => {
    if (id === 'invoice-generator') {
      setDocType('INVOICE');
      setDocNumber('INV-2026-001');
      setItems([
        { desc: 'Cloud Architecture & High-Throughput Engineering', hsn: '998313', qty: 1, rate: 45000 },
        { desc: 'Client-Side PDF Engine Optimization & Testing', hsn: '998314', qty: 2, rate: 25000 },
        { desc: 'DPDP Act 2023 Compliance & Security Audit', hsn: '998315', qty: 1, rate: 30000 },
      ]);
    } else if (id === 'receipt-maker') {
      setDocType('RECEIPT');
      setDocNumber('REC-2026-804');
      setItems([
        { desc: 'Annual Enterprise Software License & Maintenance', hsn: '997331', qty: 1, rate: 85000 },
        { desc: 'Dedicated Priority Technical Support (Annual SLA)', hsn: '998313', qty: 1, rate: 25000 },
      ]);
    } else if (id === 'purchase-order') {
      setDocType('PURCHASE ORDER');
      setDocNumber('PO-99104');
      setItems([
        { desc: 'Industrial Grade Rackmount Server Chassis 4U', hsn: '8471', qty: 4, rate: 42000 },
        { desc: 'Enterprise NVMe Solid-State Storage 4TB', hsn: '8471', qty: 8, rate: 26000 },
      ]);
    } else if (id === 'packing-slip') {
      setDocType('PACKING SLIP');
      setDocNumber('PKG-5512');
      setItems([
        { desc: 'Hardware Security Key (FIDO2 / U2F USB-C)', hsn: '8471', qty: 25, rate: 3200 },
        { desc: 'Shielded Gigabit Ethernet Cable (Cat6A 10m)', hsn: '8544', qty: 50, rate: 850 },
      ]);
    } else if (id === 'expense-report') {
      setDocType('EXPENSE REPORT');
      setDocNumber('EXP-7701');
      setItems([
        { desc: 'Travel: Mumbai to Bengaluru Flight (Tech Summit)', qty: 1, rate: 5800 },
        { desc: 'Hotel Stay: Bengaluru (3 Nights)', qty: 3, rate: 3200 },
        { desc: 'Local Conveyance & Business Meals', qty: 1, rate: 2400 },
      ]);
    } else if (id === 'printable-ledger') {
      setDocType('GENERAL LEDGER');
      setDocNumber('GL-2026-Q3');
      setItems([
        { desc: 'Starting Operating Capital Balance Forward', qty: 1, rate: 500000 },
        { desc: 'Client Retainer Deposit (Reliance Q3)', qty: 1, rate: 125000 },
        { desc: 'Office Lease & Utility Monthly Payment', qty: 1, rate: -85000 },
      ]);
    } else if (id === 'rental-agreement') {
      setAgreementTitle('Residential Tenancy Agreement (Under Model Tenancy Act)');
      setPartyA('Shri Rajesh Sharma (Landlord)');
      setPartyB('Amit Kumar Verma (Tenant)');
      setTermDuration('11 Months (Standard Indian Tenancy Period)');
      setJurisdiction('New Delhi, India');
    } else if (id === 'job-offer-letter') {
      setAgreementTitle('Letter of Appointment & Employment Offer');
      setPartyA('Hello PDF Technologies India Pvt. Ltd. (Employer)');
      setPartyB('Ananya Sharma (Candidate)');
      setTermDuration('Permanent Full-Time Employment');
      setJurisdiction('Bengaluru, Karnataka, India');
    } else if (id === 'nda-freelance-contract') {
      setAgreementTitle('Mutual Non-Disclosure & Confidentiality Agreement');
      setPartyA('Bharat Digital Innovations Pvt. Ltd. (Client)');
      setPartyB('Rohan Deshmukh (Consultant)');
      setTermDuration('2 Years from Effective Date');
      setJurisdiction('Mumbai, Maharashtra, India (Indian Contract Act, 1872)');
    } else if (id === 'certificate-appreciation') {
      setCertType('CERTIFICATE OF APPRECIATION');
      setAchievementDesc(
        'In sincere appreciation for outstanding dedication, leadership, and invaluable contribution to academic excellence.'
      );
    } else if (id === 'diploma-maker') {
      setCertType('HONORARY DIPLOMA');
      setAchievementDesc(
        'Having successfully completed the rigorous curriculum and conferred with all honors and privileges appertaining thereto.'
      );
    } else if (id === 'attendance-sheet') {
      setOpsTitle('Executive Workshop & Training Sign-In Roster');
    } else if (id === 'inventory-sheet') {
      setOpsTitle('Physical Stock Audit & Count Sheet');
    } else if (id === 'project-timesheet') {
      setOpsTitle('Weekly Project Timesheet Log');
    } else if (id === 'music-staff-paper') {
      setPaperKind('music');
    } else if (id === 'lined-paper') {
      setPaperKind('lined');
    } else if (id === 'dot-grid-paper') {
      setPaperKind('dot');
    }

    // Trigger document generation on tool change
    const timer = setTimeout(() => {
      handleGenerate();
    }, 50);
    return () => clearTimeout(timer);
  }, [id]);

  const handleAddItem = () => {
    setItems([...items, { desc: 'New Service / Deliverable item', qty: 1, rate: 150 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let outputBytes: Uint8Array;

      if (isFinance) {
        outputBytes = await generateBusinessInvoiceReceiptPDF({
          documentType: docType,
          documentNumber: docNumber,
          date: new Date().toLocaleDateString('en-IN'),
          dueDate: 'Net 15 Days',
          companyName,
          companyAddress,
          gstin: isGstInvoice ? gstin : undefined,
          pan: isGstInvoice ? pan : undefined,
          stateCode: isGstInvoice ? stateCode : undefined,
          clientName,
          clientEmail,
          clientGstin: isGstInvoice ? clientGstin : undefined,
          currency: currency.split(' ')[1] || '₹',
          items,
          taxPercent,
          cgstPercent: isGstInvoice ? cgstPercent : undefined,
          sgstPercent: isGstInvoice ? sgstPercent : undefined,
          isGstInvoice,
          paymentMethod,
          notes,
        });
      } else if (isAgreement) {
        if (isHraReceipt) {
          outputBytes = await generateIndianRentReceiptPDF({
            receiptNumber: 'HRR-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 900)),
            tenantName,
            landlordName,
            landlordPan,
            propertyAddress,
            rentAmount,
            rentPeriod,
            paymentMode: rentPaymentMode,
            date: new Date().toLocaleDateString('en-IN'),
          });
        } else {
          outputBytes = await generateLegalAgreementPDF({
            title: agreementTitle,
            partyA,
            partyB,
            effectiveDate: new Date().toLocaleDateString('en-IN'),
            jurisdiction,
            termDuration,
            purposeOrTerms: 'Execution of professional services, tenancy, or contractual commitments under Indian Law.',
            clauses: [
              {
                title: 'Scope of Obligations & Confidentiality',
                content:
                  'All proprietary intellectual property, commercial records, client databases, algorithms, and technical processes disclosed hereunder shall remain strictly confidential.',
              },
              {
                title: 'Non-Disclosure & Restrictive Covenants',
                content:
                  'The Receiving Party agrees not to disclose, duplicate, reverse engineer, or release any confidential materials to third parties without prior written authorization.',
              },
              {
                title: 'Governing Law and Dispute Resolution',
                content: `This agreement is governed by the laws of India, including the Indian Contract Act, 1872. The courts in ${jurisdiction} shall have exclusive jurisdiction.`,
              },
            ],
          });
        }
      } else if (isAward) {
        outputBytes = await generateRichCertificatePDF({
          certificateType: certType,
          recipientName,
          achievementDescription: achievementDesc,
          organization: certOrg,
          dateStr: new Date().toLocaleDateString('en-IN'),
          signatory1Name: signatory1,
          signatory1Title: 'Dean & Academic Chair',
          signatory2Name: signatory2,
          signatory2Title: 'Board Chairperson',
        });
      } else if (isOperations) {
        const cols =
          id === 'attendance-sheet'
            ? ['#', 'Participant Name', 'Department / Org', 'Sign-in Time', 'Signature']
            : id === 'inventory-sheet'
            ? ['SKU', 'Item Description', 'System Qty', 'Physical Count', 'Status']
            : id === 'project-timesheet'
            ? ['Day', 'Project / Task', 'Hours', 'Overtime', 'Approval']
            : ['#', 'Agenda Discussion Item', 'Lead Presenter', 'Key Decision', 'Action Owner'];

        const rows =
          id === 'attendance-sheet'
            ? [
                ['1', 'Aarav Patel', 'Engineering', '09:00 AM', '[Signed]'],
                ['2', 'Priya Sundaram', 'Product Architecture', '09:05 AM', '[Signed]'],
                ['3', 'Vikram Singh', 'Operations', '09:12 AM', '[Signed]'],
                ['4', 'Neha Sharma', 'Security & DPDP Compliance', '09:15 AM', '[Signed]'],
              ]
            : id === 'inventory-sheet'
            ? [
                ['SKU-8910', 'High-Speed NVMe Storage 2TB', '150', '150', 'Verified'],
                ['SKU-4412', 'Industrial USB-C Hub 8-Port', '85', '84', 'Minor -1'],
                ['SKU-1092', 'Cat6A Shielded Patch Cable 10m', '400', '400', 'Verified'],
                ['SKU-7721', 'Rackmount UPS Power Supply', '25', '25', 'Verified'],
              ]
            : id === 'project-timesheet'
            ? [
                ['Monday', 'Core PDF Engine Performance Tuning', '8.0', '0.0', 'Approved'],
                ['Tuesday', 'DPDP Act 2023 Security & Zero-Cloud Testing', '8.0', '0.0', 'Approved'],
                ['Wednesday', 'Offline Storage & IndexedDB Verification', '8.0', '1.5', 'Approved'],
                ['Thursday', 'Automated GST & Invoice Generation QA', '8.0', '0.0', 'Approved'],
                ['Friday', 'Release Verification & Documentation', '8.0', '0.0', 'Approved'],
              ]
            : [
                ['1', 'Review Q3 Performance & Scaling Goals', 'Aarav P.', 'Target achieved (+28%)', 'Dev Team'],
                ['2', 'Client-side PDF privacy protocol update', 'Vikram S.', 'Pure browser memory mandated', 'Security'],
                ['3', 'Indian Government Portal document presets', 'Priya S.', 'UPSC/SSC presets live', 'Frontend'],
                ['4', 'Open-source compliance verification', 'Neha S.', 'All licenses audited green', 'Legal'],
              ];

        outputBytes = await generateOperationsSheetPDF({
          sheetType: 'MEETING_MINUTES',
          title: opsTitle,
          subtitle: tool.name,
          date: new Date().toLocaleDateString('en-IN'),
          authorOrDept: opsAuthor,
          columns: cols,
          rows,
          summaryNotes: 'All participants agreed to deadlines. Next review scheduled for next week.',
        });
      } else if (isMedical) {
        outputBytes = await generatePrescriptionPadPDF({
          doctorName,
          degrees,
          regNumber,
          clinicName,
          clinicAddress: '12, Ring Road, Lajpat Nagar, New Delhi - 110024',
          phone: '+91 98100 12345',
          patientName,
          patientAgeGender,
          date: new Date().toLocaleDateString('en-IN'),
          rxItems: rxMeds,
          adviceNotes: 'Drink plenty of water. Take all doses strictly after meals. Review after 7 days.',
        });
      } else if (isResume) {
        outputBytes = await generateCleanResumePDF({
          fullName: resumeName,
          jobTitle: resumeTitle,
          email: resumeEmail,
          phone: resumePhone,
          location: resumeLocation,
          summary: resumeSummary,
          skills: resumeSkills,
          experience: [
            {
              role: 'Lead Systems Architect',
              company: 'Infosys Digital Labs',
              duration: '2022 - Present',
              bullet: 'Led modern engineering team delivering high-throughput client-side document processing architectures.',
            },
            {
              role: 'Senior Software Engineer',
              company: 'Tata Consultancy Services',
              duration: '2019 - 2022',
              bullet: 'Architected distributed web services and high-performance WebAssembly document pipelines.',
            },
          ],
          education: [
            {
              degree: 'B.Tech in Computer Science & Engineering',
              school: 'Indian Institute of Technology (IIT) Madras',
              year: 'First Class with Distinction',
            },
          ],
        });
      } else if (isFlashcard) {
        outputBytes = await generateFlashcardsPDF(flashcardTopic || 'Study Flashcards', flashcards);
      } else if (isCalendar) {
        outputBytes = await generateMonthlyCalendarPDF(calMonth, calYear);
      } else if (isTodoList) {
        outputBytes = await generateTodoListPDF('Daily Executive Checklist & Planner', [
          { task: 'Review quarterly revenue metrics & approve final projections', priority: 'HIGH' },
          { task: 'Lead product demonstration for enterprise partner summit', priority: 'HIGH' },
          { task: 'Audit client-side privacy architecture & test zero-cloud memory', priority: 'MED' },
          { task: 'Schedule 1-on-1 performance review sessions with team leads', priority: 'MED' },
          { task: 'Archive completed project tickets and update documentation', priority: 'LOW' },
        ]);
      } else if (id === 'music-staff-paper' || paperKind === 'music') {
        outputBytes = await generateMusicStaffPDF();
      } else {
        const pType = id === 'lined-paper' ? 'lined' : id === 'dot-grid-paper' ? 'dot' : 'graph';
        outputBytes = await generatePaperPDF(pType);
      }

      const blob = makePdfBlob(outputBytes);
      setResultBlob(blob);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const cleanFileName = `${tool.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    downloadBlob(resultBlob, cleanFileName);
  };

  const handleOpenNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-800/80 border border-red-200 dark:border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
            {isFinance ? (
              <Building2 className="w-5 h-5" />
            ) : isAgreement ? (
              <FileCheck className="w-5 h-5" />
            ) : isAward ? (
              <Award className="w-5 h-5" />
            ) : isMedical ? (
              <Stethoscope className="w-5 h-5" />
            ) : isResume ? (
              <Briefcase className="w-5 h-5" />
            ) : isCalendar ? (
              <Calendar className="w-5 h-5" />
            ) : isTodoList ? (
              <ListTodo className="w-5 h-5" />
            ) : id === 'music-staff-paper' ? (
              <Music className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{tool.name}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Live vector PDF generation • 100% Client-Side in browser memory • Zero telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isProcessing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Update Document</span>
              </>
            )}
          </button>

          {resultBlob && (
            <>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                title="Download PDF File"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition-colors"
                title="Open PDF in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Left Controls, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Form Controls (7 cols on large screens) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Document Configuration
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Preview</span>
              </button>
            </div>

            {/* 1. FINANCE / INVOICE / RECEIPT / EXPENSE FORM */}
            {isFinance && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Doc Type</label>
                    <input
                      type="text"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Doc #</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                    >
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="JPY (¥)">JPY (¥)</option>
                      <option value="CAD ($)">CAD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Issuer / From</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 mb-2 font-semibold"
                    />
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Address / Location"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Recipient / Client</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client / Recipient Name"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 mb-2 font-semibold"
                    />
                    <input
                      type="text"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Email / Contact"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">Document Line Items</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-red-600 dark:text-red-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => {
                            const copy = [...items];
                            copy[idx].desc = e.target.value;
                            setItems(copy);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const copy = [...items];
                            copy[idx].qty = parseFloat(e.target.value) || 0;
                            setItems(copy);
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-center"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const copy = [...items];
                            copy[idx].rate = parseFloat(e.target.value) || 0;
                            setItems(copy);
                          }}
                          className="w-20 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-right font-medium"
                          placeholder="Rate"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indian GST Details Section */}
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
                      <input
                        type="checkbox"
                        checked={isGstInvoice}
                        onChange={(e) => setIsGstInvoice(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>Indian GST Tax Invoice (CGST + SGST)</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                      India
                    </span>
                  </div>

                  {isGstInvoice && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            Supplier GSTIN
                          </label>
                          <input
                            type="text"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="e.g. 29AAAAA0000A1Z5"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 uppercase font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            Supplier PAN
                          </label>
                          <input
                            type="text"
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                            placeholder="e.g. AAACA1234F"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 uppercase font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            State & State Code
                          </label>
                          <input
                            type="text"
                            value={stateCode}
                            onChange={(e) => setStateCode(e.target.value)}
                            placeholder="e.g. 29 - Karnataka"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            Client / Buyer GSTIN
                          </label>
                          <input
                            type="text"
                            value={clientGstin}
                            onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                            placeholder="e.g. 27AAAAA0000A1Z2"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 uppercase font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            CGST (%)
                          </label>
                          <input
                            type="number"
                            value={cgstPercent}
                            onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-0.5 text-[11px]">
                            SGST (%)
                          </label>
                          <input
                            type="number"
                            value={sgstPercent}
                            onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Payment Method</label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Total Tax Rate (%)</label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Notes / Terms</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            )}

            {/* 2. AGREEMENT / CONTRACT FORM */}
            {isAgreement && (
              <div className="space-y-3 text-xs">
                {/* Agreement Mode Selector (Tenancy Agreement vs HRA Rent Receipt) */}
                <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setIsHraReceipt(false)}
                    className={`flex-1 py-1.5 px-3 rounded-md font-semibold text-xs transition-colors ${
                      !isHraReceipt
                        ? 'bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Legal Agreement
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHraReceipt(true)}
                    className={`flex-1 py-1.5 px-3 rounded-md font-semibold text-xs transition-colors ${
                      isHraReceipt
                        ? 'bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    HRA Rent Receipt (Sec 10(13A))
                  </button>
                </div>

                {isHraReceipt ? (
                  <div className="space-y-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Tenant Name (Employee)</label>
                        <input
                          type="text"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Landlord Name (Owner)</label>
                        <input
                          type="text"
                          value={landlordName}
                          onChange={(e) => setLandlordName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                          Landlord PAN (Required if &gt; Rs. 1 Lakh/yr)
                        </label>
                        <input
                          type="text"
                          value={landlordPan}
                          onChange={(e) => setLandlordPan(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 uppercase font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Monthly Rent Amount (Rs.)</label>
                        <input
                          type="number"
                          value={rentAmount}
                          onChange={(e) => setRentAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Rented House / Flat Address</label>
                      <input
                        type="text"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Rent Period (Month &amp; Year)</label>
                        <input
                          type="text"
                          value={rentPeriod}
                          onChange={(e) => setRentPeriod(e.target.value)}
                          placeholder="e.g. October 2026"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Payment Mode</label>
                        <input
                          type="text"
                          value={rentPaymentMode}
                          onChange={(e) => setRentPaymentMode(e.target.value)}
                          placeholder="UPI / NEFT / Cheque"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Agreement Title</label>
                      <input
                        type="text"
                        value={agreementTitle}
                        onChange={(e) => setAgreementTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Party A (First Party)</label>
                        <input
                          type="text"
                          value={partyA}
                          onChange={(e) => setPartyA(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Party B (Second Party)</label>
                        <input
                          type="text"
                          value={partyB}
                          onChange={(e) => setPartyB(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Governing Jurisdiction</label>
                        <input
                          type="text"
                          value={jurisdiction}
                          onChange={(e) => setJurisdiction(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Agreement Duration / Term</label>
                        <input
                          type="text"
                          value={termDuration}
                          onChange={(e) => setTermDuration(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. AWARD / CERTIFICATE / DIPLOMA FORM */}
            {isAward && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Award Type</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                  >
                    <option value="CERTIFICATE OF ACHIEVEMENT">Certificate of Achievement</option>
                    <option value="CERTIFICATE OF APPRECIATION">Certificate of Appreciation</option>
                    <option value="HONORARY DIPLOMA">Honorary Diploma / Graduate Award</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Recipient Full Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Achievement Description</label>
                  <textarea
                    rows={2}
                    value={achievementDesc}
                    onChange={(e) => setAchievementDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    value={certOrg}
                    onChange={(e) => setCertOrg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">First Signatory</label>
                    <input
                      type="text"
                      value={signatory1}
                      onChange={(e) => setSignatory1(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Second Signatory</label>
                    <input
                      type="text"
                      value={signatory2}
                      onChange={(e) => setSignatory2(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. OPERATIONS / MINUTES / ATTENDANCE / TIMESHEET FORM */}
            {isOperations && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Document Header Title</label>
                  <input
                    type="text"
                    value={opsTitle}
                    onChange={(e) => setOpsTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Department / Author</label>
                  <input
                    type="text"
                    value={opsAuthor}
                    onChange={(e) => setOpsAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            )}

            {/* 5. MEDICAL PRESCRIPTION FORM */}
            {isMedical && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Clinic Name</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Age & Gender</label>
                    <input
                      type="text"
                      value={patientAgeGender}
                      onChange={(e) => setPatientAgeGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Prescribed Medications (Rx)</label>
                  <div className="space-y-1.5">
                    {rxMeds.map((med, i) => (
                      <input
                        key={i}
                        type="text"
                        value={med}
                        onChange={(e) => {
                          const copy = [...rxMeds];
                          copy[i] = e.target.value;
                          setRxMeds(copy);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. RESUME / CV FORM */}
            {isResume && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeName}
                      onChange={(e) => setResumeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Professional Headline</label>
                    <input
                      type="text"
                      value={resumeTitle}
                      onChange={(e) => setResumeTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Email</label>
                    <input
                      type="text"
                      value={resumeEmail}
                      onChange={(e) => setResumeEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={resumePhone}
                      onChange={(e) => setResumePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Location</label>
                    <input
                      type="text"
                      value={resumeLocation}
                      onChange={(e) => setResumeLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Executive Summary</label>
                  <textarea
                    rows={2}
                    value={resumeSummary}
                    onChange={(e) => setResumeSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            )}

            {/* 7. CALENDAR FORM */}
            {isCalendar && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Month</label>
                  <select
                    value={calMonth}
                    onChange={(e) => setCalMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                  >
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Year</label>
                  <input
                    type="number"
                    value={calYear}
                    onChange={(e) => setCalYear(parseInt(e.target.value) || 2026)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                  />
                </div>
              </div>
            )}

            {/* 8. STATIONERY PATTERNS */}
            {isStationery && (
              <div className="text-xs space-y-2">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">Printable Paper Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dot', label: 'Dot Grid' },
                    { id: 'lined', label: 'Ruled Lined' },
                    { id: 'graph', label: 'Math Graph' },
                    { id: 'music', label: 'Music Staves' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaperKind(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-colors ${
                        paperKind === p.id
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 9. FLASHCARD MAKER FORM */}
            {isFlashcard && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">Study Deck / Topic Title</label>
                    <span className="text-[10px] text-neutral-400">Printable with Cut Lines</span>
                  </div>
                  <input
                    type="text"
                    value={flashcardTopic}
                    onChange={(e) => setFlashcardTopic(e.target.value)}
                    placeholder="e.g. Computer Science Terminology"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="font-bold text-neutral-500 dark:text-neutral-400 block mb-1.5 text-[11px]">
                    Quick Study Deck Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        name: 'Web & CS',
                        topic: 'Computer Science & Web Standards',
                        cards: [
                          { front: 'DOM (Document Object Model)', back: 'Tree structure representation of HTML elements in web browsers.' },
                          { front: 'TypedArray (Uint8Array)', back: 'Array of 8-bit unsigned integers representing raw binary buffer memory.' },
                          { front: 'Zero-Knowledge Client', back: 'Processing data locally in browser memory without sending files to cloud.' },
                          { front: 'PDF-Lib Engine', back: 'Pure JavaScript vector library for creating and modifying PDF byte streams.' },
                          { front: 'CSS Grid & Flexbox', back: 'Two-dimensional and one-dimensional responsive layout systems.' },
                          { front: 'Blob (Binary Large Object)', back: 'File-like object of immutable, raw data representing media or files.' },
                        ],
                      },
                      {
                        name: 'Spanish Basics',
                        topic: 'Spanish Vocabulary Essentials',
                        cards: [
                          { front: 'Hola / Buenos días', back: 'Hello / Good morning - standard daytime greeting.' },
                          { front: 'Por favor / Gracias', back: 'Please / Thank you - polite courtesy phrases.' },
                          { front: '¿Dónde está el baño?', back: 'Where is the bathroom? Essential travel inquiry.' },
                          { front: 'Mucho gusto', back: 'Nice to meet you - used when being introduced to someone.' },
                          { front: 'La cuenta, por favor', back: 'The check/bill, please - used at restaurants.' },
                          { front: 'Hasta luego', back: 'See you later / Until next time.' },
                        ],
                      },
                      {
                        name: 'Biology & Anatomy',
                        topic: 'Human Biology & Cellular Structure',
                        cards: [
                          { front: 'Mitochondria', back: 'The powerhouse of the cell, generating adenosine triphosphate (ATP).' },
                          { front: 'Endoplasmic Reticulum', back: 'Network of membranes involved in protein and lipid synthesis.' },
                          { front: 'Hemoglobin', back: 'Iron-rich protein in red blood cells that transports oxygen.' },
                          { front: 'Homeostasis', back: 'State of steady internal physical and chemical conditions in organisms.' },
                          { front: 'Synapse', back: 'Junction between two nerve cells across which impulses pass.' },
                          { front: 'Chloroplast', back: 'Organelle in plant cells that conducts photosynthesis.' },
                        ],
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFlashcardTopic(preset.topic);
                          setFlashcards(preset.cards);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-[11px] transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      Flashcards ({flashcards.length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFlashcards([
                          ...flashcards,
                          { front: `New Question #${flashcards.length + 1}`, back: 'Answer / definition text goes here.' },
                        ])
                      }
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      + Add Card
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {flashcards.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">Card #{i + 1}</span>
                          {flashcards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFlashcards(flashcards.filter((_, idx) => idx !== i))}
                              className="text-neutral-400 hover:text-red-500 text-xs transition-colors cursor-pointer"
                              title="Delete card"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">Front (Prompt / Term)</label>
                          <input
                            type="text"
                            value={c.front}
                            onChange={(e) => {
                              const copy = [...flashcards];
                              copy[i].front = e.target.value;
                              setFlashcards(copy);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-semibold text-neutral-900 dark:text-neutral-100 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-neutral-500 block mb-0.5">Back (Answer / Definition)</label>
                          <textarea
                            rows={2}
                            value={c.back}
                            onChange={(e) => {
                              const copy = [...flashcards];
                              copy[i].back = e.target.value;
                              setFlashcards(copy);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Vector PDF...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-Generate & Refresh Preview</span>
                </>
              )}
            </button>

            {resultBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" />
                <span>Download ({formatFileSize(resultBlob.size)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Live Interactive Document Viewer (5 cols on large screens) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Eye className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Interactive PDF Live View</span>
              {resultBlob && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px]">
                  Vector Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-700 hover:bg-neutral-50 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 shadow-2xs border border-neutral-200 dark:border-neutral-600 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Full Tab</span>
                </button>
              )}
              {resultBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Save</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-900 aspect-[1/1.414] min-h-[560px] shadow-sm flex items-center justify-center">
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                title={`${tool.name} Live Preview`}
                className="w-full h-full border-0 rounded-2xl"
              />
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Rendering crisp vector PDF...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-2 text-neutral-500">
                <FileText className="w-10 h-10 text-neutral-400" />
                <p className="text-xs font-semibold">Click "Update Document" to render live preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
