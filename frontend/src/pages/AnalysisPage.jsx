import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import bloodCellsImg from '../assets/blood-cells.png';

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState('');

  const extractedData = location.state?.extractedData || {};
  const entries = Object.entries(extractedData);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleRunDiagnosis = async () => {
    setIsPredicting(true);
    setError('');
    
    const mappedData = {};
    const requiredFields = ['WBC', 'LYMp', 'NEUTp', 'LYMn', 'NEUTn', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT', 'PDW', 'PCT'];
    
    for (const field of requiredFields) {
      let val = extractedData[field]?.value;
      
      // Map RDW to PDW and MPV to PCT if they were extracted under the new aliases
      if (val === undefined && field === 'PDW') val = extractedData['RDW']?.value;
      if (val === undefined && field === 'PCT') val = extractedData['MPV']?.value;
      
      mappedData[field] = val !== undefined ? val : 0.0; // Provide default 0.0 to prevent 422 Unprocessable Entity
    }

    try {
      const res = await api.predict(mappedData);
      navigate('/results', { state: { prediction: res.data } });
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        setError(`Missing or invalid fields: ${errorDetail.map(e => e.loc[e.loc.length - 1]).join(', ')}`);
      } else {
        setError(errorDetail || 'An error occurred during prediction.');
      }
    } finally {
      setIsPredicting(false);
    }
  };

  const calculateStatus = (val, low, high) => {
    if (val === undefined || val === null || low === undefined || low === null || high === undefined || high === null) {
      return { status: 'Unknown', color: 'text-on-surface', barColor: 'bg-surface-container-highest', percentage: 50 };
    }
    const value = parseFloat(val);
    const min = parseFloat(low);
    const max = parseFloat(high);
    
    if (isNaN(value) || isNaN(min) || isNaN(max)) {
      return { status: 'Unknown', color: 'text-on-surface', barColor: 'bg-surface-container-highest', percentage: 50 };
    }

    const range = max - min;
    let percentage = ((value - min) / range) * 100;
    percentage = Math.max(-20, Math.min(120, percentage));
    
    const uiPercentage = 25 + ((value - min) / range) * 50;
    const clampedUiPercentage = Math.max(5, Math.min(95, uiPercentage));
    const buffer = range * 0.15; 

    if (value < min) {
      return { status: 'Low', color: 'text-rose-400', barColor: 'bg-rose-400', percentage: clampedUiPercentage };
    } else if (value > max) {
      return { status: 'High', color: 'text-rose-400', barColor: 'bg-rose-400', percentage: clampedUiPercentage };
    } else if (value <= min + buffer || value >= max - buffer) {
      return { status: 'Borderline', color: 'text-amber-400', barColor: 'bg-amber-400', percentage: clampedUiPercentage };
    } else {
      return { status: 'Normal', color: 'text-emerald-400', barColor: 'bg-emerald-400', percentage: clampedUiPercentage };
    }
  };

  const getBorderColor = (status) => {
    if (status === 'Normal') return 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
    if (status === 'Borderline') return 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
    if (status === 'High' || status === 'Low') return 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
    return 'border-white/10';
  };

  const nextSlide = () => {
    if (currentIndex + 2 < entries.length) {
      setCurrentIndex(currentIndex + 2);
    }
  };

  const prevSlide = () => {
    if (currentIndex - 2 >= 0) {
      setCurrentIndex(currentIndex - 2);
    }
  };

  const currentCards = entries.slice(currentIndex, currentIndex + 2);

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="floating-blob top-[-10%] left-[-10%] opacity-40"></div>
        <div className="floating-blob bottom-[-20%] right-[-10%] opacity-30" style={{ animationDelay: '-5s' }}></div>
      </div>

      <nav className="w-full h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-primary/15 flex items-center justify-between px-margin-desktop z-50">
        <div className="flex items-center gap-unit">
          <Link to="/" className="font-display-hero text-headline-md text-primary tracking-tight">MedCura</Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/">Home</Link>
          <Link className="font-data-label text-data-label text-primary border-b-2 border-primary" to="/upload">Upload Report</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 w-full px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Phase 02</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Biomarker Analysis</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Review your extracted clinical data. Use the arrows to browse the parameters.</p>
        </div>

        {entries.length === 0 ? (
          <div className="max-w-2xl mx-auto glass-card rounded-xl p-12 text-center">
            <p className="text-on-surface-variant">No data found or extraction failed. Please try again.</p>
          </div>
        ) : (
          <div className="relative w-full max-w-[1000px] mx-auto flex items-center justify-center gap-8">
            
            <button 
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-container hover:bg-primary-container text-on-surface hover:text-on-primary-container transition-all disabled:opacity-30 disabled:hover:bg-surface-container disabled:hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>

            <div className="flex gap-6 w-full justify-center min-h-[420px]">
              {currentCards.map(([key, data]) => {
                const { status, color, barColor, percentage } = calculateStatus(data.value, data.ref_low, data.ref_high);
                const borderColor = getBorderColor(status);
                
                return (
                  <div key={key} className={`glass-card rounded-2xl p-8 w-[400px] flex flex-col justify-between transition-all duration-300 border-2 ${borderColor}`}>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-headline-md text-3xl font-bold text-on-surface mb-1">{key}</h3>
                        <p className="font-body-md text-sm text-on-surface-variant uppercase tracking-wider">Biomarker</p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg text-sm font-data-label uppercase tracking-wider font-bold ${
                        status === 'Normal' ? 'bg-emerald-500/20 text-emerald-400' : 
                        status === 'Borderline' ? 'bg-amber-500/20 text-amber-400' : 
                        status === 'High' || status === 'Low' ? 'bg-rose-500/20 text-rose-400' : 
                        'bg-surface-container text-on-surface'
                      }`}>
                        {status.toUpperCase()}
                      </div>
                    </div>

                    <div className="mb-8 text-center bg-surface-container/30 rounded-xl p-6 border border-white/5">
                      <p className="font-data-label text-xs text-on-surface-variant uppercase tracking-widest mb-2">Your Value</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={`font-display-hero text-7xl font-bold tracking-tight ${color}`}>
                          {data.value}
                        </span>
                        <span className="font-body-md text-lg text-on-surface-variant">{data.unit || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between font-data-label text-sm text-on-surface uppercase tracking-wider bg-surface-container-highest/50 py-2 px-4 rounded-md">
                        <span>Healthy Range</span>
                        <span className="font-bold">{data.ref_low !== null && data.ref_high !== null ? `${data.ref_low} - ${data.ref_high} ${data.unit || ''}` : 'Unknown'}</span>
                      </div>
                      
                      <div className="relative w-full h-3 bg-surface-container-highest rounded-full mt-4">
                        <div className="absolute top-0 left-[25%] right-[25%] bottom-0 bg-emerald-500/20 rounded-full border border-emerald-500/30"></div>
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${barColor} shadow-[0_0_15px_currentColor] border-2 border-white transition-all duration-1000 ease-out z-10`}
                          style={{ left: `calc(${percentage}% - 10px)` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-on-surface-variant font-data-label uppercase pt-1">
                        <span className="w-1/3 text-left">Low</span>
                        <span className="w-1/3 text-center text-emerald-400/70">Normal</span>
                        <span className="w-1/3 text-right">High</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={nextSlide}
              disabled={currentIndex + 2 >= entries.length}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-container hover:bg-primary-container text-on-surface hover:text-on-primary-container transition-all disabled:opacity-30 disabled:hover:bg-surface-container disabled:hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>
            
          </div>
        )}

        <div className="text-center mt-6 text-on-surface-variant font-data-label text-sm">
          Showing {currentIndex + 1} - {Math.min(currentIndex + 2, entries.length)} of {entries.length} parameters
        </div>

        {error && <p className="text-error mt-6 text-center font-data-label">{error}</p>}

        <div className="flex justify-center mt-12 pb-20">
          <button 
            onClick={handleRunDiagnosis}
            disabled={isPredicting || entries.length === 0}
            className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary px-10 py-5 rounded-xl text-sm font-data-label transition-all active:scale-95 shadow-[0_0_40px_rgba(183,62,84,0.3)] disabled:opacity-50 disabled:active:scale-100 flex items-center gap-3 uppercase tracking-widest"
          >
            {isPredicting ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">analytics</span>}
            {isPredicting ? 'Executing Clinical Models...' : 'Run AI Diagnosis'}
          </button>
        </div>
      </main>
    </div>
  );
}
