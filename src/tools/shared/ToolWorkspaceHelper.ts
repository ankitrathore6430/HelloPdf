import { downloadBlob, formatFileSize, textToPDF, inspectPDF, generateSamplePhotoFiles } from '../../services/pdfEngine';

export function makePdfBlob(data: Uint8Array | ArrayBuffer | Blob): Blob {
  if (data instanceof Blob) return data;
  return new Blob([data as any], { type: 'application/pdf' });
}

export { downloadBlob, formatFileSize, textToPDF, inspectPDF, generateSamplePhotoFiles };
