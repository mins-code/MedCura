import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import bloodCellsImg from '../assets/blood-cells.png';

export default function UploadReport() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState('Parsing PDF...');
  const [subStatus, setSubStatus] = useState('Analyzing document structure...');
  const [isDragOver, setIsDragOver] = useState(false);

  const steps = [
    { label: 'Parsing PDF...', sub: 'Analyzing document structure...' },
    { label: 'Extracting values...', sub: 'Identifying numerical data points...' },
    { label: 'Reading parameters...', sub: 'Cross-referencing with clinical database...' }
  ];

  const simulateUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    setProgress(0);
    setCurrentStep(0);
    
    let width = 0;
    let step = 0;
    
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setStatusText("Processing Complete");
            setSubStatus("Redirecting to Analysis Engine...");
            setTimeout(() => {
                alert('Report successfully analyzed. View Clinical Intelligence Dashboard?');
                window.location.reload(); // Reset simulation
            }, 1000);
        } else {
            width += Math.random() * 8;
            if (width > 100) width = 100;
            
            setProgress(width);
            
            if (width > 5 && step === 0) {
                setStatusText(steps[0].label);
                setSubStatus(steps[0].sub);
                setCurrentStep(1);
                step = 1;
            }
            if (width > 40 && step === 1) {
                setStatusText(steps[1].label);
                setSubStatus(steps[1].sub);
                setCurrentStep(2);
                step = 2;
            }
            if (width > 75 && step === 2) {
                setStatusText(steps[2].label);
                setSubStatus(steps[2].sub);
                setCurrentStep(3);
                step = 3;
            }
        }
    }, 300);
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
    simulateUpload();
  };

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="floating-blob top-[-10%] left-[-10%] opacity-40"></div>
        <div className="floating-blob bottom-[-20%] right-[-10%] opacity-30" style={{ animationDelay: '-5s' }}></div>
      </div>

      {/* Navigation Shell */}
      <nav className="w-full h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-primary/15 flex items-center justify-between px-margin-desktop z-50">
        <div className="flex items-center gap-unit">
          <Link to="/" className="font-display-hero text-headline-md text-primary tracking-tight">MedCura</Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/">Home</Link>
          <a className="font-data-label text-data-label text-primary border-b-2 border-primary" href="#">Upload Report</a>
          <a className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" href="#">Blood Analysis</a>
          <a className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" href="#">History</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">settings</span>
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Diagnostics Core</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Precision Data Entry</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Our MedCura AI parses complex clinical reports with molecular accuracy, extracting biomarkers to provide sophisticated intelligence on your hematological status.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Sidebar: Parameters List */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="glass-card rounded-xl p-8 sticky top-24">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-primary/10 pb-4">Supported Parameters</h3>
              <ul className="space-y-4">
                {[
                  'WBC (White Blood Cell)', 
                  'LYMp (Lymphocytes %)', 
                  'NEUTp (Neutrophils %)', 
                  'LYMn (Absolute Lymphocytes)', 
                  'NEUTn (Absolute Neutrophils)', 
                  'RBC (Red Blood Cell)',
                  'HGB (Hemoglobin)',
                  'HCT (Hematocrit)',
                  'MCV (Mean Corpuscular Volume)',
                  'MCH (Mean Corpuscular Hgb)',
                  'MCHC (Mean Corpuscular Hgb Conc.)',
                  'PLT (Platelet)',
                  'PDW (Platelet Distribution Width)',
                  'PCT (Plateletcrit)'
                ].map((param, idx) => (
                  <li key={idx} className="flex items-center justify-between group">
                    <span className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">{param}</span>
                    <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-secondary pulse-soft"></span>
                  <span className="font-data-label text-[12px] text-secondary uppercase tracking-tighter">AI Core Ready</span>
                </div>
                <p className="font-body-md text-[14px] text-on-surface-variant italic">Expecting PDF, JPG, or DICOM formats. All data is encrypted using clinical-grade security protocols.</p>
              </div>
            </div>
          </div>

          {/* Main Upload Area */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-8 md:p-12">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-8">Upload CBC Report</h2>
                
                {/* Drag & Drop Zone */}
                <div 
                  className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${isUploading ? 'opacity-40 pointer-events-none' : ''} ${isDragOver ? 'bg-primary/10 border-primary/60' : 'border-primary/20 hover:border-primary/50 hover:bg-primary/5'}`}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && simulateUpload()}
                >
                  <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-4xl">upload_file</span>
                  </div>
                  <p className="font-headline-md text-headline-md text-on-surface mb-2">Drop Clinical PDF Here</p>
                  <p className="font-body-md text-on-surface-variant mb-8 text-center">or browse files from your secure drive</p>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <button className="px-8 py-4 bg-primary-container text-on-primary-container font-data-label text-data-label rounded-lg transition-all active:scale-95 hover:bg-primary-container/80 shadow-[0_4px_20px_rgba(183,62,84,0.4)]" onClick={(e) => { e.stopPropagation(); simulateUpload(); }}>Browse Files</button>
                    <button className="px-8 py-4 border border-primary text-primary font-data-label text-data-label rounded-lg transition-all hover:bg-primary/10" onClick={(e) => e.stopPropagation()}>Manual Entry</button>
                  </div>
                  <input accept=".pdf" className="hidden" id="file-input" type="file" />
                </div>

                {/* Processing State */}
                {isUploading && (
                  <div className="mt-12 animate-fade-in" id="processing-state">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-1">{statusText}</span>
                        <span className="font-body-md text-on-surface-variant">{subStatus}</span>
                      </div>
                      <span className="font-data-value text-data-value text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden mb-8">
                      <div className="loading-bar h-full bg-primary shadow-[0_0_10px_rgba(255,178,186,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`flex items-center gap-3 p-4 bg-surface-container/40 rounded-lg transition-opacity ${currentStep >= 1 ? 'opacity-100 ring-1 ring-primary/40' : 'opacity-50'}`}>
                        <span className="material-symbols-outlined text-primary">description</span>
                        <span className="font-data-label text-[12px] text-on-surface">Extraction</span>
                      </div>
                      <div className={`flex items-center gap-3 p-4 bg-surface-container/40 rounded-lg transition-opacity ${currentStep >= 2 ? 'opacity-100 ring-1 ring-primary/40' : 'opacity-50'}`}>
                        <span className="material-symbols-outlined text-primary">biotech</span>
                        <span className="font-data-label text-[12px] text-on-surface">Mapping</span>
                      </div>
                      <div className={`flex items-center gap-3 p-4 bg-surface-container/40 rounded-lg transition-opacity ${currentStep >= 3 ? 'opacity-100 ring-1 ring-primary/40' : 'opacity-50'}`}>
                        <span className="material-symbols-outlined text-primary">clinical_notes</span>
                        <span className="font-data-label text-[12px] text-on-surface">Verification</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      </main>

      <footer className="w-full py-section-gap border-t border-primary/10 bg-surface z-10 relative">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-unit">
          <span className="font-display-hero text-body-lg text-primary">MedCura Intelligence</span>
          <div className="flex gap-8 my-6 md:my-0">
            <a className="font-data-label text-data-label text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Privacy Protocol</a>
            <a className="font-data-label text-data-label text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Medical Terms</a>
            <a className="font-data-label text-data-label text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Support</a>
          </div>
          <p className="font-data-label text-[12px] text-on-surface-variant">© 2024 MedCura Intelligence. For clinical research use only.</p>
        </div>
      </footer>
    </div>
  );
}
