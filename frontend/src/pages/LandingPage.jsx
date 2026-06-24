import React from 'react';
import { Link } from 'react-router-dom';
import bloodCellsImg from '../assets/blood-cells.png';

export default function LandingPage() {
  return (
    <div className="bg-medical-mesh text-on-surface selection:bg-primary/30 min-h-screen font-body-md overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-margin-desktop w-full z-50 h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-outline-variant/30 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-4">
          <div className="h-8 text-primary font-display-hero text-3xl font-bold tracking-tight">MedCura</div>
        </div>
        <div className="hidden md:flex items-center gap-14 mx-auto">
          <span className="font-data-label text-data-label text-primary border-b-2 border-primary cursor-default">Home</span>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/upload">Upload Report</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/analysis">Analysis</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/results">Results</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer" data-icon="notifications">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer" data-icon="settings">settings</span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="max-w-container-max mx-auto pb-32">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between py-section-gap px-margin-desktop gap-16 min-h-[80vh] pt-12">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/30 relative pl-8 pulse-chip">
              <span className="font-data-label text-secondary uppercase tracking-widest text-[11px]">MedCura AI Active</span>
            </div>

            <div className="space-y-4">
              <div className="text-primary font-display-hero text-5xl font-bold tracking-tight mb-8">MedCura</div>

              <h1 className="font-display-hero text-display-hero text-on-surface">
                Context-Aware <br />
                Probabilistic <span className="text-primary italic">Blood</span> <br />
                <span className="italic text-on-surface">Diagnostics</span>
              </h1>

              <p className="font-body-md text-on-surface-variant max-w-xl leading-relaxed">
                Understand your blood report with high-precision AI analysis and advanced probabilistic reasoning based on the latest clinical research protocols.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4 justify-center lg:justify-start">
              <Link to="/upload" className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-on-primary px-8 py-3 rounded text-sm font-data-label transition-colors inline-block text-center">
                Analyze My Report
              </Link>
              <a href="#features" className="glass-card px-8 py-3 rounded text-sm font-data-label text-on-surface hover:bg-surface-container-highest transition-colors inline-block text-center">
                Learn More
              </a>
            </div>


          </div>

          <div className="flex-1 w-full max-w-2xl relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="relative glass-card overflow-hidden p-2 rounded-2xl">
              <img src={bloodCellsImg} alt="AI Diagnostics" className="w-full h-auto rounded-xl object-cover aspect-[4/3] opacity-90" />
            </div>
          </div>


        </section>

        {/* Precision Clinical Features */}
        <section id="features" className="py-24 px-margin-desktop flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="font-headline-lg text-4xl text-on-surface">Precision Clinical Features</h2>
            <p className="font-body-md text-on-surface-variant">
              Our engine treats every data point as high-value intelligence, ensuring no detail is overlooked in your diagnostic journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {[
              { icon: "water_drop", title: "Detects 4 anemia categories", desc: "Sophisticated classification across Microcytic, Macrocytic, and Normocytic conditions with deep etiology mapping." },
              { icon: "sensors", title: "Works with incomplete reports", desc: "Our probabilistic engine infers missing metrics using historical clinical models and demographic benchmarks." },
              { icon: "fact_check", title: "Confidence Scoring", desc: "Every insight is accompanied by a Bayesian confidence interval to provide transparent, reliable clinical data." },
              { icon: "upload_file", title: "PDF Upload Support", desc: "Native OCR engine specialized in structured laboratory data extraction from standard medical PDF documents." }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-8 flex flex-col gap-6 hover:bg-surface-container-high/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{feature.icon}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-headline-md text-xl text-on-surface">{feature.title}</h3>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Intelligence Flow */}
        <section className="py-24 px-margin-desktop flex flex-col items-center">
          <div className="text-center space-y-4 mb-20">
            <div className="font-data-label text-[11px] tracking-widest text-primary uppercase">Analytics Pipeline</div>
            <h2 className="font-headline-lg text-4xl text-on-surface">System Intelligence Flow</h2>
          </div>

          <div className="w-full max-w-4xl relative">
            {/* Connecting Line */}
            <div className="absolute top-8 left-10 right-10 h-[1px] bg-outline-variant/50"></div>

            <div className="grid grid-cols-5 gap-4 relative z-10">
              {[
                { icon: "upload", phase: "PHASE 01", title: "Upload Report" },
                { icon: "tune", phase: "PHASE 02", title: "Extract Parameters" },
                { icon: "science", phase: "PHASE 03", title: "Analyze Values" },
                { icon: "bolt", phase: "PHASE 04", title: "Generate Prediction" },
                { icon: "visibility", phase: "PHASE 05", title: "View Results" }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-surface glass-card flex items-center justify-center border border-outline-variant/50 relative">
                    <span className="material-symbols-outlined text-on-surface">{step.icon}</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="font-data-label text-[10px] text-on-surface-variant tracking-widest">{step.phase}</div>
                    <div className="font-body-md text-sm text-on-surface">{step.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-margin-desktop w-full">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-headline-md text-lg text-on-surface">MedCura Intelligence</div>
            <div className="font-body-md text-xs text-on-surface-variant">© 2024 MedCura Intelligence. For clinical research use only. All data encrypted.</div>
          </div>

          <div className="flex flex-wrap items-center gap-8 font-data-label text-xs tracking-wider text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-primary transition-colors">Medical Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
