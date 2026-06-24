import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';
import bloodCellsImg from '../assets/blood-cells.png';

export default function UploadReport() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadError('');
      } else {
        setUploadError('Please select a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadError('');
      } else {
        setUploadError('Please select a valid PDF file.');
      }
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      // Add an artificial minimum delay of 1.5s for visual feedback of the loader
      const [res] = await Promise.all([
        api.extractPdf(selectedFile),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
      if (res.data && res.data.success) {
        sessionStorage.setItem('extractedData', JSON.stringify(res.data.data));
        navigate('/analysis', { state: { extractedData: res.data.data } });
      } else {
        setUploadError(res.data?.error || 'Extraction failed.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'An error occurred during extraction.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-medical-mesh text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="floating-blob top-[-10%] left-[-10%] opacity-40"></div>
        <div className="floating-blob bottom-[-20%] right-[-10%] opacity-30" style={{ animationDelay: '-5s' }}></div>
      </div>

      <nav className="w-full h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-primary/15 flex items-center justify-between px-margin-desktop z-50">
        <div className="flex items-center gap-unit">
          <Link to="/" className="font-display-hero text-headline-md text-primary tracking-tight">MedCura</Link>
        </div>
        <div className="hidden md:flex items-center gap-14">
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/">Home</Link>
          <span className="font-data-label text-data-label text-primary border-b-2 border-primary cursor-default">Upload Report</span>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/analysis">Analysis</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/results">Results</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 w-full px-margin-mobile md:px-margin-desktop py-section-gap flex flex-col items-center">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Diagnostics Core</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Precision Data Entry</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Securely upload your CBC report to extract clinical biomarkers for our AI ensemble analysis.</p>
        </div>

        {/* Main Content Area */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[400px] glass-card rounded-[32px] border border-primary/20 p-12 transition-all duration-1000 animate-fade-in shadow-[0_0_50px_rgba(183,62,84,0.15)]">
            <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-2 border-4 border-primary/30 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
              <div className="absolute inset-4 border-4 border-primary/60 rounded-full shadow-[0_0_30px_rgba(183,62,84,0.3)] animate-[spin_1.5s_linear_infinite]"></div>
              <span className="material-symbols-outlined text-primary text-5xl animate-pulse drop-shadow-[0_0_15px_rgba(183,62,84,0.8)]">troubleshoot</span>
            </div>
            
            <h2 className="font-display-hero text-4xl text-on-surface mb-6 tracking-tight animate-pulse text-center">
              Extracting Biomarkers
            </h2>
            
            <div className="w-full max-w-md h-1.5 bg-surface-container-highest rounded-full mb-8 overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-primary/80 rounded-full w-full origin-left animate-pulse"></div>
            </div>
            
            <p className="font-body-lg text-on-surface-variant text-center max-w-lg leading-relaxed">
              Our deterministic engine is mapping your clinical parameters to the AI ensemble...
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl mx-auto items-center justify-center animate-fade-in">
            
            {/* Upload Area */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className={`relative w-full max-w-lg glass-card rounded-[32px] transition-all duration-500 overflow-hidden ${isDragOver ? 'shadow-[0_0_50px_rgba(183,62,84,0.3)] scale-105' : 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'}`}>
                
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5 opacity-50 transition-opacity duration-500 ${isDragOver ? 'opacity-100' : ''}`}></div>
  
                <div 
                  className={`relative h-full bg-[#2a1b20]/80 rounded-[32px] p-12 flex flex-col items-center justify-center transition-all duration-300 border-2 border-dashed ${isDragOver ? 'border-primary/80 bg-primary/10' : 'border-[#b73e54]/30 hover:border-[#b73e54]/60 hover:bg-[#b73e54]/10'}`}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{ minHeight: '400px' }}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center animate-fade-in">
                      <div className="w-24 h-24 rounded-full border border-emerald-500/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <span className="material-symbols-outlined text-emerald-400 text-5xl">task</span>
                      </div>
                      <p className="font-headline-md text-2xl text-on-surface mb-2 font-bold">{selectedFile.name}</p>
                      <p className="font-data-label uppercase tracking-widest text-emerald-400/80 mb-8 font-bold">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                      </p>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleExtract(); }}
                        className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-on-primary px-10 py-4 rounded-full text-sm font-data-label transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest w-full justify-center"
                      >
                        <span className="material-symbols-outlined">memory</span>
                        Commence Extraction
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center group cursor-pointer">
                      <div className="w-20 h-20 rounded-full border border-[#b73e54]/40 flex items-center justify-center mb-8 bg-[#3d272e] group-hover:scale-110 transition-all duration-500">
                        <span className="material-symbols-outlined text-[#f2aab8] text-4xl group-hover:-translate-y-1 transition-transform">cloud_upload</span>
                      </div>
                      <h3 className="font-display-hero text-3xl text-on-surface mb-3 tracking-tight">Drop Clinical PDF Here</h3>
                      <p className="font-body-md text-on-surface-variant mb-8 max-w-[250px] leading-relaxed">Drag and drop your laboratory report, or click to browse files</p>
                      <span className="font-data-label text-[10px] uppercase tracking-[0.2em] text-[#f2aab8] border border-[#f2aab8]/30 px-6 py-2 rounded-full">PDF ONLY</span>
                    </div>
                  )}
                  <input ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" type="file" />
                </div>
              </div>
              {uploadError && <p className="text-rose-400 mt-6 text-sm font-data-label uppercase tracking-widest text-center animate-pulse">{uploadError}</p>}
            </div>
  
            {/* Info Panel */}
            <div className="w-full lg:w-1/2 max-w-lg">
              <div className="glass-card rounded-3xl p-10 border border-white/5">
                <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined">verified</span>
                  Supported Parameters
                </h3>
                
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-8">
                  Our deterministic extraction engine seamlessly parses complex laboratory formats. We currently support full extraction for the following 14 critical biomarkers:
                </p>
  
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'WBC (White Blood Cell)', 
                    'LYMp (Lymphocytes %)', 
                    'NEUTp (Neutrophils %)', 
                    'LYMn (Abs Lymphocytes)', 
                    'NEUTn (Abs Neutrophils)', 
                    'RBC (Red Blood Cell)',
                    'HGB (Hemoglobin)',
                    'HCT (Hematocrit)',
                    'MCV (Volume)',
                    'MCH (Hgb Mass)',
                    'MCHC (Hgb Conc.)',
                    'PLT (Platelet)',
                    'RDW (Distribution)',
                    'MPV (Mean Vol)'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_10px_rgba(183,62,84,0.8)]"></div>
                      <span className="font-data-label text-xs uppercase text-on-surface tracking-wider">{item}</span>
                    </div>
                  ))}
                </div>
  
                <div className="mt-10 pt-6 border-t border-white/10 flex items-start gap-4">
                   <span className="material-symbols-outlined text-amber-400/80 text-xl">shield_lock</span>
                   <div>
                     <p className="font-data-label text-xs uppercase tracking-widest text-amber-400/80 mb-1">Privacy First</p>
                     <p className="font-body-md text-sm text-on-surface-variant">Your reports are processed entirely in-memory. No patient data or PDFs are ever saved to disk.</p>
                   </div>
                </div>
              </div>
            </div>
  
          </div>
        )}
      </main>
    </div>
  );
}
