import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { validateMedicalFile } from '../../lib/storage';
import { formatFileSize } from '../../lib/utils';
import { Button } from '../common/Button';

interface FileUploaderProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
  allowedTypesLabel?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  selectedFile,
  allowedTypesLabel = 'PDF, JPG, or PNG (Max 10 MB)',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateMedicalFile(file);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid file.');
      onFileSelected(null);
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onFileSelected(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept=".pdf,image/png,image/jpeg,image/jpg"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
              : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop report
          </p>
          <p className="text-xs text-slate-400 mt-1">{allowedTypesLabel}</p>
        </div>
      ) : (
        <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                {selectedFile.name}
              </div>
              <div className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
