import React, { useState } from 'react';
import { ToolItem } from '../types';
import {
  generateInvoicePDF,
  generateCertificatePDF,
  generatePrintablePaperPDF,
  generateTimesheetPDF,
} from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  FileSpreadsheet,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface DocumentGeneratorToolProps {
  tool: ToolItem;
}

export const DocumentGeneratorTool: React.FC<DocumentGeneratorToolProps> = ({ tool }) => {
  const isInvoice = tool.id === 'invoice-generator' || tool.id === 'receipt-maker';
  const isCertificate = tool.id === 'certificate-maker';
  const isPaper = tool.id === 'printable-paper';
  const isTimesheet = tool.id === 'timesheet-generator';

  // State for Invoice
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-001');
  const [companyName, setCompanyName] = useState('Acme Digital Studio Ltd.');
  const [clientName, setClientName] = useState('Global Enterprises Inc.');
  const [totalAmount, setTotalAmount] = useState('1,250.00');
  const [currency, setCurrency] = useState('USD ($)');

  // State for Certificate
  const [recipientName, setRecipientName] = useState('Sarah Jenkins');
  const [certificateCourse, setCertificateCourse] = useState('Advanced Full-Stack Engineering & Cloud Architecture');
  const [issuerName, setIssuerName] = useState('Google AI Academy & Certification Board');

  // State for Printable Paper
  const [paperType, setPaperType] = useState<'dotgrid' | 'lined' | 'graph' | 'music'>('dotgrid');

  // State for Timesheet
  const [employeeName, setEmployeeName] = useState('Alex Rivera');
  const [period, setPeriod] = useState('October 2026');

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let bytes: Uint8Array;
      if (isCertificate) {
        bytes = await generateCertificatePDF({
          recipientName: recipientName.trim() || 'Certificate Recipient',
          achievement: certificateCourse.trim() || 'Professional Achievement',
          organization: issuerName.trim() || 'Certification Board',
          dateStr: new Date().toLocaleDateString(),
        });
      } else if (isPaper) {
        bytes = await generatePrintablePaperPDF(paperType);
      } else if (isTimesheet) {
        bytes = await generateTimesheetPDF({
          employeeName: employeeName.trim() || 'Team Member',
          period: period.trim() || 'Current Month',
        });
      } else {
        // Default: Invoice
        const numAmount = parseFloat(totalAmount.replace(/[^0-9.]/g, '')) || 1250;
        bytes = await generateInvoicePDF({
          invoiceNumber: invoiceNumber.trim() || 'INV-001',
          clientName: clientName.trim() || 'Client Name',
          clientEmail: 'billing@client.com',
          items: [
            { desc: 'Web & Document Application Development', qty: 1, rate: numAmount * 0.6 },
            { desc: 'Performance Optimization & Security Audit', qty: 1, rate: numAmount * 0.4 },
          ],
          taxPercent: 0,
        });
      }

      const blob = makePdfBlob(bytes);
      setResultBlob(blob);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate document PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Document Customization Parameters
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Default Document</span>
          </button>
        </div>

        {/* Dynamic Form based on Tool Type */}
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-4 text-xs">
          {isInvoice && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Invoice / Receipt Number:
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Currency:
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="INR (₹)">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Your Company / Biller Name:
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                    Client / Customer Name:
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Total Balance Due:
                </label>
                <input
                  type="text"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                />
              </div>
            </div>
          )}

          {isCertificate && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Recipient Full Name:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Course or Award Title:
                </label>
                <input
                  type="text"
                  value={certificateCourse}
                  onChange={(e) => setCertificateCourse(e.target.value)}
                  placeholder="e.g. Master of Software Architecture"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Issuing Organization / Authority:
                </label>
                <input
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="e.g. Global Tech Institute"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>
            </div>
          )}

          {isPaper && (
            <div className="space-y-3">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                Select Printable Pattern:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'dotgrid', label: 'Dot Grid', desc: '5mm bullet journal' },
                  { id: 'lined', label: 'College Lined', desc: 'Writing paper' },
                  { id: 'graph', label: 'Graph / Grid', desc: '5mm engineering grid' },
                  { id: 'music', label: 'Music Staff', desc: 'Sheet music staves' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaperType(item.id as any)}
                    className={`p-3 rounded-xl text-left border transition-colors ${
                      paperType === item.id
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border-red-500 font-bold'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isTimesheet && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Employee / Contractor Name:
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Pay Period:
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action and Download */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {resultBlob && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Document compiled and ready to download!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, `HelloPDF_${tool.id}.pdf`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Generated PDF ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all hover:scale-[1.02]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Document...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Generate {tool.name}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
