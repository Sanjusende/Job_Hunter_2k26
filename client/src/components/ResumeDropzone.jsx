import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  X,
  Cpu,
  ShieldCheck,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { uploadResume } from '../services/api';

/**
 * Modern Hero Drag-and-Drop Resume Ingestion Zone
 * Features progressive parsing stages, glow hover effects, and success banner
 */
export default function ResumeDropzone({ onUploadSuccess, onError, currentProfile }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStep, setParsingStep] = useState('');
  const [lastUploadedProfile, setLastUploadedProfile] = useState(null);

  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(ext)) {
      return `Invalid format (${ext}). Only PDF, Word (.docx), or Text (.txt) documents are supported.`;
    }
    if (file.size > 5 * 1024 * 1024) {
      return `File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed upload size is 5MB.`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      if (onError) onError(errorMsg);
      return;
    }
    setSelectedFile(file);
    setLastUploadedProfile(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setParsingStep('Reading document & verifying file signature...');

    // Progress simulation checkpoints
    const timer1 = setTimeout(() => {
      setUploadProgress(45);
      setParsingStep('Extracting technical skills via Google Gemini ATS...');
    }, 900);

    const timer2 = setTimeout(() => {
      setUploadProgress(78);
      setParsingStep('Evaluating 70%+ job matches in MongoDB...');
    }, 2200);

    try {
      const result = await uploadResume(selectedFile, (percent) => {
        setUploadProgress(Math.max(15, Math.min(85, percent)));
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadProgress(100);
      setParsingStep('Match evaluation & ATS profile completed!');

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setParsingStep('');
        if (result.profile) {
          setLastUploadedProfile({
            ...result.profile,
            matchedJobsCount: result.matchedJobsCount || 0,
            instantAlertDispatched: result.instantAlertDispatched
          });
          if (onUploadSuccess) onUploadSuccess(result.profile);
        }
      }, 600);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Upload Error:', err);
      setIsUploading(false);
      setUploadProgress(0);
      setParsingStep('');

      const errMsg = err.response?.data?.error || err.message || 'Failed to upload and parse resume.';
      if (onError) onError(errMsg);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setLastUploadedProfile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        disabled={isUploading}
      />

      {/* Main Drag-and-Drop Area */}
      <motion.div
        whileHover={{ scale: isUploading ? 1 : 1.004 }}
        transition={{ duration: 0.2 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed ${isDragOver
          ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
          : selectedFile
            ? 'border-emerald-500/40 bg-emerald-950/20'
            : 'border-white/10 hover:border-emerald-500/40 bg-[#111827]/60 hover:bg-[#111827]/80'
          } backdrop-blur-xl p-8 sm:p-10`}
      >
        {/* Glow Accent Background Mesh */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Animated Status Icon */}
          <div className="mb-4">
            {isUploading ? (
              <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            ) : selectedFile ? (
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <FileText className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-cyan-500/15 border border-white/10 text-emerald-400 group-hover:scale-110 transition-transform duration-200">
                <UploadCloud className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Heading and Subtext */}
          {isUploading ? (
            <div className="space-y-3 w-full max-w-md">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  {parsingStep}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Processing ATS schema & instant email dispatch triggers...</p>
            </div>
          ) : selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{selectedFile.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <p className="text-xs text-slate-400">Document ready for automated Gemini ATS parsing and candidate matching.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                Drop your resume to trigger autonomous job matching
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Supports <span className="text-slate-200 font-medium">PDF, DOCX, or TXT</span> (Max 5MB). Direct candidate email extraction & 70%+ match guarantee.
              </p>
            </div>
          )}

          {/* Metadata Badges / Action Buttons */}
          {!isUploading && (
            <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
              {selectedFile ? (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadAndParse();
                    }}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                    Analyze & Match Jobs
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ATS auto-parsed by Gemini AI &bull; Delimiter injection protected</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {lastUploadedProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{lastUploadedProfile.name}</span>
                  {lastUploadedProfile.email && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                      {lastUploadedProfile.email}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {lastUploadedProfile.experienceLevel} Level
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lastUploadedProfile.matchedJobsCount > 0
                    ? `Found ${lastUploadedProfile.matchedJobsCount} openings with 70%+ match score. ${lastUploadedProfile.instantAlertDispatched ? 'Instant email alert dispatched to inbox!' : ''}`
                    : 'Candidate profile active. Monitoring new openings.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setLastUploadedProfile(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
