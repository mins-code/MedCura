import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import bloodCellsImg from '../assets/blood-cells.png';

const MODEL_DISPLAY = {
  RandomForest: { label: 'Random Forest', icon: 'forest' },
  KNN:          { label: 'K-Nearest Neighbour', icon: 'hub' },
  SVM:          { label: 'Support Vector Machine', icon: 'linear_scale' },
  LogisticReg:  { label: 'Logistic Regression', icon: 'trending_up' },
};

function ProbabilityBar({ prob, isAnemic }) {
  const pct = Math.round((prob ?? 0) * 100);
  const color = isAnemic ? 'from-rose-500 to-rose-400' : 'from-emerald-500 to-emerald-400';
  return (
    <div className="w-full mt-auto">
      <div className="flex justify-between items-center mb-3">
        <span className="font-data-label text-xs uppercase tracking-widest text-on-surface-variant">
          Anemia Probability
        </span>
        <span className={`font-display-hero text-2xl font-bold ${isAnemic ? 'text-rose-400' : 'text-emerald-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prediction = location.state?.prediction;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!prediction) navigate('/upload');
  }, [prediction, navigate]);

  if (!prediction) return null;

  const isAnemic = prediction.is_anemic === true;
  const isHealthy = !isAnemic;
  const weightedProb = prediction.weighted_anemia_prob ?? 0;
  const weightedPct = Math.round(weightedProb * 100);
  const binaryProbs = prediction.binary_probabilities ?? {};
  const bnImputed = prediction.bayesian_imputed ?? {};
  const bnImputedEntries = Object.entries(bnImputed);

  const statusColor  = isHealthy ? 'text-emerald-400' : 'text-rose-400';
  const statusBg     = isHealthy ? 'bg-emerald-500/20' : 'bg-rose-500/20';
  const statusBorder = isHealthy
    ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    : 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]';

  const r = 88;
  const circ = 2 * Math.PI * r;
  const arcOffset = circ - (circ * weightedPct) / 100;

  return (
    <div className="bg-medical-mesh text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`floating-blob top-[-10%] left-[-10%] opacity-40 transition-colors duration-1000 ${isHealthy ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
        <div className="floating-blob bottom-[-20%] right-[-10%] opacity-30" style={{ animationDelay: '-5s' }}></div>
      </div>

      <nav className="w-full h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-primary/15 flex items-center justify-between px-margin-desktop z-50">
        <div className="flex items-center gap-unit">
          <Link to="/" className="font-display-hero text-headline-md text-primary tracking-tight">MedCura</Link>
        </div>
        <div className="hidden md:flex items-center gap-14">
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/">Home</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/upload">Upload Report</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/analysis">Analysis</Link>
          <span className="font-data-label text-data-label text-primary border-b-2 border-primary cursor-default">Results</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">

        {/* Header */}
        <div className={`flex flex-col items-center text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Phase 03</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Diagnosis Complete</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Our ensemble AI models have finished analyzing your clinical parameters.</p>
        </div>

        {/* ── Bayesian Network imputation notice (only shown when values were missing) ── */}
        {bnImputedEntries.length > 0 && (
          <div className={`mb-10 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-card rounded-2xl border border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.12)] overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center gap-3 px-8 py-5 border-b border-amber-500/20 bg-amber-500/5">
                <span className="material-symbols-outlined text-amber-400 text-xl">hub</span>
                <div>
                  <p className="font-data-label text-xs uppercase tracking-widest text-amber-400 font-bold">
                    Bayesian Network Imputation Active
                  </p>
                  <p className="font-body-md text-sm text-on-surface-variant mt-0.5">
                    {bnImputedEntries.length} biomarker{bnImputedEntries.length > 1 ? 's were' : ' was'} not found in your report.
                    The values below were inferred from your other blood parameters using a probabilistic graphical model
                    and used during AI classification.
                  </p>
                </div>
              </div>
              {/* Imputed value rows */}
              <div className="divide-y divide-white/5">
                {bnImputedEntries.map(([feat, meta]) => (
                  <div key={feat} className="flex items-center justify-between px-8 py-4 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-amber-400/60 text-base">analytics</span>
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">
                          {meta.name} <span className="font-data-label text-xs uppercase text-on-surface-variant ml-2">{feat}</span>
                        </p>
                        <p className="font-data-label text-xs text-on-surface-variant mt-0.5">
                          Source: <span className="text-amber-400">{meta.source}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display-hero text-xl font-bold text-amber-400">
                        {meta.value}
                      </span>
                      <span className="font-data-label text-xs text-on-surface-variant ml-1">{meta.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero card */}
        <div className={`glass-card rounded-3xl p-8 md:p-12 mb-12 border-2 ${statusBorder} transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <p className="font-data-label text-sm text-on-surface-variant uppercase tracking-widest mb-4">AI Conclusion</p>
              <h2 className={`font-display-hero text-6xl md:text-8xl font-bold tracking-tight mb-4 ${statusColor}`}>
                {isHealthy ? 'Healthy' : 'Anemic'}
              </h2>
              <div className={`inline-flex px-6 py-2 rounded-full font-data-label uppercase tracking-widest text-sm font-bold ${statusBg} ${statusColor}`}>
                {prediction.confidence_level} Confidence
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className="font-data-label text-xs uppercase tracking-widest text-on-surface-variant">Weighted Avg. Anemia Probability</p>
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r={r} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-surface-container-highest" />
                  <circle cx="96" cy="96" r={r} stroke="currentColor" strokeWidth="10" fill="transparent"
                    strokeDasharray={circ} strokeDashoffset={arcOffset}
                    className={`${statusColor} transition-all duration-2000 ease-out`} strokeLinecap="round" />
                </svg>
                <div className="text-center">
                  <span className={`font-display-hero text-5xl font-bold ${statusColor}`}>{weightedPct}%</span>
                  <p className="font-data-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">Probability</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="font-data-label text-sm uppercase tracking-widest text-on-surface-variant mb-4">Clinical Explanation</h3>
            <p className="font-body-lg text-xl text-on-surface leading-relaxed">{prediction.explanation}</p>
          </div>
        </div>

        {/* Per-model probability boxes — 2x2 grid */}
        <div className={`mb-12 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined">analytics</span>
            Binary Classifier Breakdown — Anemia Probability per Model
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Object.entries(binaryProbs).map(([model, prob]) => {
              const isModelAnemic = prob >= 0.5;
              const mColor  = isModelAnemic ? 'text-rose-400' : 'text-emerald-400';
              const mBorder = isModelAnemic
                ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                : 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]';
              const meta = MODEL_DISPLAY[model] ?? { label: model, icon: 'smart_toy' };
              return (
                <div key={model} className={`glass-card rounded-2xl p-8 border-2 ${mBorder} flex flex-col gap-6 min-h-[180px]`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isModelAnemic ? 'bg-rose-500/15' : 'bg-emerald-500/15'}`}>
                      <span className={`material-symbols-outlined text-2xl ${mColor}`}>{meta.icon}</span>
                    </div>
                    <div>
                      <p className="font-body-md text-lg font-semibold text-on-surface">{meta.label}</p>
                      <p className={`font-data-label text-xs uppercase font-bold tracking-widest ${mColor}`}>
                        {isModelAnemic ? '⚠ Anemic' : '✓ Healthy'}
                      </p>
                    </div>
                  </div>
                  <ProbabilityBar prob={prob} isAnemic={isModelAnemic} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Anemia Type CTA — only shown if anemic */}
        {isAnemic && (
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-card rounded-3xl p-10 border-2 border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.15)] flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="font-data-label text-xs uppercase tracking-widest text-rose-400 mb-2">Multi-Class Analysis Available</p>
                <h3 className="font-display-hero text-3xl font-bold text-on-surface mb-3">Identify Your Anemia Type</h3>
                <p className="font-body-md text-on-surface-variant max-w-xl">
                  Our ensemble multi-class classifiers have further categorised the type of anemia detected. Click below to view the full breakdown with clinical details.
                </p>
              </div>
              <button
                onClick={() => navigate('/anemia-type', { state: { prediction } })}
                className="shrink-0 flex items-center gap-3 bg-rose-500 hover:bg-rose-400 text-white font-data-label uppercase tracking-widest text-sm font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:scale-105"
              >
                <span className="material-symbols-outlined">biotech</span>
                View Anemia Type
              </button>
            </div>
          </div>
        )}

        {/* If healthy — simple footer */}
        {isHealthy && (
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} text-center`}>
            <div className="glass-card rounded-2xl p-8 border border-emerald-500/20 inline-flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-emerald-400 text-5xl">verified</span>
              <p className="font-body-md text-on-surface-variant max-w-md">No anemia detected. Maintain a balanced diet and regular check-ups.</p>
              <Link to="/upload" className="font-data-label text-sm uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2 mt-2">
                Analyze Another Report
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
