import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadResume } from '../services/api';

export default function ResumeUpload({ onUploadSuccess, onError, currentProfile }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusPhase, setUploadStatusPhase] = useState('');
  const fileInputRef = useRef(null);

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

  const validateFile = (selectedFile) => {
    if (!selectedFile) return 'No file selected.';

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `Invalid file format (${ext}). Please select a PDF, Word, or Text document.`;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      return 'File size exceeds 10MB limit.';
    }

    return null;
  };

  const handleFileSelect = (selectedFile) => {
    const errorMsg = validateFile(selectedFile);
    if (errorMsg) {
      if (onError) onError(errorMsg);
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusPhase('Uploading document to ATS pipeline...');

    try {
      setUploadProgress(45);
      setUploadStatusPhase('Extracting text & analyzing via Gemini AI...');

      const result = await uploadResume(
        file,
        (progress) => {
          // Upload phase spans 0-50%, then AI parsing spans 50-100%
          setUploadProgress(Math.min(50, Math.round(progress / 2)));
        },
        currentProfile?.email
      );

      setUploadProgress(100);
      setUploadStatusPhase('Resume parsing complete!');

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatusPhase('');
        const extractedProfile = result.profile || result.data?.profile || result.data || result;
        const directMatches = result.matches || result.data?.matches || null;
        if (onUploadSuccess && extractedProfile) {
          onUploadSuccess(extractedProfile, directMatches);
        }
      }, 600);
    } catch (err) {
      console.error('Upload failed:', err);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusPhase('');
      const errorText = err.response?.data?.error || err.message || 'Failed to upload and parse resume.';
      if (onError) onError(errorText);
    }
  };

  return (
    <div className="bento-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          Resume ATS Analyzer
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Upload your resume (.pdf or .docx) to autonomously extract skills, calculate compatibility ratings, and match opportunities.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden bg-slate-50/50 hover:bg-white ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/40 scale-[1.01] shadow-lg shadow-indigo-100'
            : file
            ? 'border-indigo-400 bg-indigo-50/30'
            : 'border-indigo-200/80 hover:border-indigo-400 hover:shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3.5">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
              file
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-btn-glow'
                : 'bg-indigo-100/70 text-indigo-600'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            ) : file ? (
              <CheckCircle className="w-7 h-7 text-white" />
            ) : (
              <UploadCloud className="w-7 h-7 text-indigo-600" />
            )}
          </div>

          <div className="max-w-md mx-auto">
            {file ? (
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-slate-900 break-all">{file.name}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for ATS extraction
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  <span className="text-indigo-600 underline sm:no-underline font-bold hover:text-indigo-700">Choose a resume</span> or drop it here
                </p>
                <p className="text-xs text-slate-400">PDF or DOCX documents up to 10MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar & Real-time Skeleton Parsing Preview */}
      {isUploading && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                {uploadStatusPhase}
              </span>
              <span className="font-mono font-extrabold text-slate-900">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Skeleton Preview of Parsed Profile */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-44 rounded-md skeleton-shimmer" />
                <div className="h-3 w-60 rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="h-6 w-20 rounded-lg skeleton-shimmer" />
              <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
              <div className="h-6 w-16 rounded-lg skeleton-shimmer" />
              <div className="h-6 w-28 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Action Controls */}
      {file && !isUploading && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="btn-secondary-bento px-4 py-2.5 text-xs font-semibold rounded-xl text-center"
          >
            Clear Document
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            className="btn-primary-gradient px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-btn-glow"
          >
            <UploadCloud className="w-4 h-4" />
            Analyze &amp; Match Jobs
          </button>
        </div>
      )}
    </div>

  );
}

