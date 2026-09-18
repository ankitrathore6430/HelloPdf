import React, { useState } from 'react';
import { ToolItem } from '../types';
import { protectPDF, unlockPDF, textToPDF } from '../services/pdfEngine';
import { makePdfBlob, downloadBlob, formatFileSize } from './shared/ToolWorkspaceHelper';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface ProtectUnlockToolProps {
  tool: ToolItem;
}

export const ProtectUnlockTool: React.FC<ProtectUnlockToolProps> = ({ tool }) => {
  const isUnlock = tool.id === 'unlock-pdf';
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setFile(selected[0]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  const handleUseDemo = async () => {
    try {
      const doc = await textToPDF(
        'CONFIDENTIAL INTELLECTUAL PROPERTY\n\nTitle: Patent Invention Disclosure\n\nThis confidential PDF document contains sensitive engineering schematics.\nSetting an encrypted user password locks access with standard 128-bit/256-bit cryptography.\n\nAll encryption operations run entirely inside the client sandbox without any remote keys.',
        'Confidential Disclosure'
      );
      const demoFile = new File([doc as any], 'HelloPDF_Protected_Patent.pdf', { type: 'application/pdf' });
      setFile(demoFile);
      setPassword('Hello2026!');
      setResultBlob(null);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Could not load sample file: ' + err.message);
    }
  };

  const handleExecute = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF document.');
      return;
    }
    if (!isUnlock && !password) {
      setErrorMessage('Please enter a password to protect your PDF.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (isUnlock) {
        const unlockedBytes = await unlockPDF(file, password);
        const blob = makePdfBlob(unlockedBytes);
        setResultBlob(blob);
      } else {
        const protectedBytes = await protectPDF(file, password);
        const blob = makePdfBlob(protectedBytes);
        setResultBlob(blob);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Security processing failed. Please verify password.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            {isUnlock ? 'Select Encrypted PDF to Unlock' : 'Select PDF Document to Password Protect'}
          </label>
          {!file && (
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try with Sample PDF</span>
            </button>
          )}
        </div>

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-2xs">
                {isUnlock ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Drop your PDF file here or click to browse
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {isUnlock
                  ? 'Remove password restrictions and decrypt PDF locally'
                  : 'Add strong password protection and restrict unauthorized viewing'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {file.name}
                </div>
                <div className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                  {formatFileSize(file.size)} • Ready
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg text-red-600 dark:text-red-400 font-semibold"
              title="Change document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Password Setting Controls */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-3 text-xs">
        <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
          {isUnlock ? 'Enter Current Password to Decrypt:' : 'Create Document Password:'}
        </label>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isUnlock ? 'Password...' : 'Set strong password (e.g. Secret#2026)'}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {!isUnlock && password && (
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>Strength:</span>
            <div className="h-1.5 flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  password.length > 8 ? 'w-full bg-emerald-500' : password.length > 4 ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-red-500'
                }`}
              />
            </div>
            <span className="font-bold">
              {password.length > 8 ? 'Strong' : password.length > 4 ? 'Medium' : 'Weak'}
            </span>
          </div>
        )}
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
              <span>{isUnlock ? 'Password removed successfully!' : 'Document locked and protected!'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {resultBlob ? (
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  resultBlob,
                  isUnlock
                    ? `HelloPDF_Unlocked_${file?.name || 'doc.pdf'}`
                    : `HelloPDF_Protected_${file?.name || 'doc.pdf'}`
                )
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download {isUnlock ? 'Unlocked' : 'Protected'} PDF ({formatFileSize(resultBlob.size)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecute}
              disabled={!file || isProcessing || (!isUnlock && !password)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                !file || isProcessing || (!isUnlock && !password)
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Security...</span>
                </>
              ) : (
                <>
                  {isUnlock ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{isUnlock ? 'Unlock PDF' : 'Protect PDF Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
