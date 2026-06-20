import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import bloodCellsImg from '../assets/blood-cells.png';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prediction = location.state?.prediction;
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!prediction) {
      navigate('/upload');
    }
  }, [prediction, navigate]);

  if (!prediction) return null;

  const isHealthy = prediction.final_type === 0;
  const confidence = Math.round((prediction.bn_confidence || 0.8) * 100);

  const statusColor = isHealthy ? 'text-emerald-400' : 'text-rose-400';
  const statusBg = isHealthy ? 'bg-emerald-500/20' : 'bg-rose-500/20';
  const statusBorder = isHealthy ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]';

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`floating-blob top-[-10%] left-[-10%] opacity-40 transition-colors duration-1000 ${isHealthy ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
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

      <main className="relative z-10 max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        
        {/* Header Section */}
        <div className={`flex flex-col items-center text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Phase 03</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Diagnosis Complete</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Our ensemble AI models have finished analyzing your clinical parameters.</p>
        </div>

        {/* Main Result Hero Card */}
        <div className={`glass-card rounded-3xl p-8 md:p-12 mb-12 border-2 ${statusBorder} transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            
            {/* Status Conclusion */}
            <div className="flex-1 text-center md:text-left">
              <p className="font-data-label text-sm text-on-surface-variant uppercase tracking-widest mb-4">AI Conclusion</p>
              <h2 className={`font-display-hero text-6xl md:text-8xl font-bold tracking-tight mb-4 ${statusColor}`}>
                {isHealthy ? 'Healthy' : 'Abnormal'}
              </h2>
              <div className={`inline-flex px-6 py-2 rounded-full font-data-label uppercase tracking-widest text-sm font-bold ${statusBg} ${statusColor}`}>
                {prediction.best_model_name}
              </div>
            </div>

            {/* Confidence Score Circular UI */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-container-highest" />
                <circle 
                  cx="96" cy="96" r="88" 
                  stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray="552.92" 
                  strokeDashoffset={552.92 - (552.92 * confidence) / 100}
                  className={`${statusColor} transition-all duration-2000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className={`font-display-hero text-5xl font-bold ${statusColor}`}>{confidence}%</span>
                <p className="font-data-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">Confidence</p>
              </div>
            </div>

          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="font-data-label text-sm uppercase tracking-widest text-on-surface-variant mb-4">Clinical Explanation</h3>
            <p className="font-body-lg text-xl text-on-surface leading-relaxed">
              {prediction.explanation}
            </p>
          </div>
        </div>

        {/* Technical Breakdown */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">memory</span>
              Model Ensemble Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(prediction.model_predictions || {}).map(([model, output]) => (
                <div key={model} className="flex items-center justify-between p-4 bg-surface-container/30 rounded-xl">
                  <span className="font-body-md text-on-surface">{model}</span>
                  <span className={`font-data-label text-xs uppercase tracking-widest px-3 py-1 rounded-md font-bold ${output === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {output === 0 ? 'Healthy' : 'Abnormal'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">info</span>
              Disclaimer
            </h3>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              This analysis was generated by an artificial intelligence ensemble and is intended strictly for informational and educational purposes. It is <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
            <div className="mt-8 flex justify-end">
              <Link to="/upload" className="font-data-label text-sm uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2">
                Analyze Another Report
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
