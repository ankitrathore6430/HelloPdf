import React from 'react';
import { ToolItem } from '../types';
import { ToolPageLayout } from './ToolPageLayout';
import { MergePdfTool } from './MergePdfTool';
import { SplitPdfTool } from './SplitPdfTool';
import { CompressPdfTool } from './CompressPdfTool';
import { ImageToPdfTool } from './ImageToPdfTool';
import { PdfToImageTool } from './PdfToImageTool';
import { DigitalSignatureTool } from './DigitalSignatureTool';
import { WatermarkTool } from './WatermarkTool';
import { PageNumberingTool } from './PageNumberingTool';
import { ProtectUnlockTool } from './ProtectUnlockTool';
import { OrganizePdfTool } from './OrganizePdfTool';
import { BusinessDocumentTool } from './BusinessDocumentTool';
import { ConverterTool } from './ConverterTool';
import { InspectRepairTool } from './InspectRepairTool';

interface ToolPageRouterProps {
  tool: ToolItem;
  onBackHome: () => void;
  onNavigateToTool: (toolOrId: ToolItem | string) => void;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
}

export const ToolPageRouter: React.FC<ToolPageRouterProps> = ({
  tool,
  onBackHome,
  onNavigateToTool,
  isFavorite,
  onToggleFavorite,
}) => {
  const id = tool.id;
  const cat = tool.category;

  const renderToolComponent = () => {
    // 1. Business Documents & Stationery (All 25 Tools in category 'business')
    if (
      cat === 'business' ||
      [
        'invoice-generator',
        'certificate-generator',
        'receipt-maker',
        'nda-generator',
        'resume-to-pdf',
        'dot-grid-paper',
        'lined-paper',
        'music-staff-paper',
        'meeting-notes',
        'purchase-order',
        'todo-list-pdf',
        'printable-calendar',
        'flashcard-generator',
        'expense-report',
        'attendance-sheet',
        'rental-agreement',
        'job-offer-letter',
        'printable-ledger',
        'inventory-sheet',
        'project-timesheet',
        'certificate-appreciation',
        'diploma-maker',
        'packing-slip',
        'medical-prescription-pad',
        'nda-freelance-contract',
      ].includes(id)
    ) {
      return <BusinessDocumentTool tool={tool} />;
    }

    // 2. Merge & Interleave
    if (['merge-pdf', 'interleave-pdfs', 'combine-pdf', 'append-pages'].includes(id)) {
      return <MergePdfTool tool={tool} />;
    }

    // 3. Split, Remove Pages & Page Extraction
    if (
      [
        'split-pdf',
        'remove-pages',
        'extract-pages',
        'extract-odd-pages',
        'extract-even-pages',
        'extract-first-page',
        'extract-last-page',
        'remove-first-page',
        'remove-last-page',
        'split-by-range',
      ].includes(id)
    ) {
      return <SplitPdfTool tool={tool} />;
    }

    // 4. Organize, Rotate & Page Geometry Layouts
    if (
      [
        'rotate-pdf',
        'organize-pdf',
        'reverse-pages',
        'duplicate-pages',
        'nup-2in1',
        'nup-4in1',
        'add-blank-page',
        'crop-pdf',
        'sort-pages-custom',
        'booklet-creator',
        'nup-pdf',
      ].includes(id)
    ) {
      return <OrganizePdfTool tool={tool} />;
    }

    // 5. Compress, Optimize & Grayscale
    if (
      [
        'compress-pdf',
        'grayscale-pdf',
        'strip-annotations',
        'cmyk-print-check',
        'optimize-pdf',
        'reduce-pdf-size',
        'shrink-pdf',
      ].includes(id)
    ) {
      return <CompressPdfTool tool={tool} />;
    }

    // 6. Image to PDF
    if (
      [
        'image-to-pdf',
        'png-to-pdf',
        'webp-to-pdf',
        'batch-image-to-pdf',
        'jpg-to-pdf',
        'heic-to-pdf',
      ].includes(id)
    ) {
      return <ImageToPdfTool tool={tool} />;
    }

    // 7. PDF to Image
    if (
      [
        'pdf-to-jpg',
        'pdf-to-png',
        'pdf-to-webp',
        'extract-images',
        'pdf-to-greyscale-images',
        'pdf-to-images',
      ].includes(id)
    ) {
      return <PdfToImageTool tool={tool} />;
    }

    // 8. Digital Signature
    if (['digital-signature', 'sign-pdf'].includes(id)) {
      return <DigitalSignatureTool tool={tool} />;
    }

    // 9. Watermark, Stamps & Annotations
    if (
      [
        'watermark-pdf',
        'confidential-stamp',
        'urgent-stamp',
        'expired-stamp',
        'approved-stamp',
        'qr-stamper',
        'barcode-stamper',
        'stamp-date-time',
        'add-copyright-notice',
        'add-text-annotation',
        'highlight-area',
        'stamp-pdf',
      ].includes(id)
    ) {
      return <WatermarkTool tool={tool} />;
    }

    // 10. Page Numbers, Headers, Footers & Margins
    if (
      [
        'page-numbers',
        'bates-numbering',
        'header-footer',
        'resize-page-size',
        'page-margins',
        'add-page-border',
        'pdf-page-scaler',
        'dark-mode-pdf',
        'add-page-numbers',
      ].includes(id)
    ) {
      return <PageNumberingTool tool={tool} />;
    }

    // 11. Security, Protect, Unlock, Flatten, Clean & Sanitize
    if (
      [
        'protect-pdf',
        'unlock-pdf',
        'flatten-pdf',
        'clean-metadata',
        'redact-pdf',
        'audit-pdf-security',
        'pdf-stream-sanitizer',
        'encrypt-pdf',
        'decrypt-pdf',
      ].includes(id)
    ) {
      return <ProtectUnlockTool tool={tool} />;
    }

    // 12. Converters (Data, Code, Text, Speech & Base64)
    if (
      [
        'markdown-to-pdf',
        'text-to-pdf',
        'csv-to-pdf',
        'json-to-pdf',
        'html-to-pdf',
        'pdf-to-text',
        'pdf-to-speech',
        'pdf-to-html-embed',
        'pdf-to-base64',
        'base64-to-pdf',
      ].includes(id)
    ) {
      return <ConverterTool tool={tool} />;
    }

    // 13. Advanced Inspection, Metrics, Color & Structure
    if (
      [
        'metadata-editor',
        'pdf-word-counter',
        'pdf-compare',
        'pdf-font-inspector',
        'pdf-hex-inspector',
        'pdf-linearization-check',
        'pdf-page-dimension',
        'pdf-color-analyzer',
        'pdf-presentation-mode',
        'pdf-link-checker',
        'pdf-grid-overlay',
        'pdf-to-json-metadata',
        'inspect-pdf',
        'edit-pdf-metadata',
      ].includes(id)
    ) {
      return <InspectRepairTool tool={tool} />;
    }

    // 14. Fallback by Category for Convert tools
    if (tool.category === 'convert-to-pdf') {
      if (['image-to-pdf', 'png-to-pdf', 'webp-to-pdf', 'batch-image-to-pdf', 'jpg-to-pdf', 'heic-to-pdf'].includes(id)) {
        return <ImageToPdfTool tool={tool} />;
      }
      return <ConverterTool tool={tool} />;
    }

    if (tool.category === 'convert-from-pdf') {
      if (['pdf-to-jpg', 'pdf-to-png', 'pdf-to-webp', 'extract-images', 'pdf-to-greyscale-images', 'pdf-to-images'].includes(id)) {
        return <PdfToImageTool tool={tool} />;
      }
      return <ConverterTool tool={tool} />;
    }

    // Safe fallback to inspect/repair if any future tool is added
    return <InspectRepairTool tool={tool} />;
  };

  return (
    <ToolPageLayout
      tool={tool}
      onBackHome={onBackHome}
      onNavigateToTool={onNavigateToTool}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    >
      {renderToolComponent()}
    </ToolPageLayout>
  );
};
