import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import bloodCellsImg from '../assets/blood-cells.png';

// Descriptions for each anemia type returned by the multi-class model
const ANEMIA_INFO = {
  'Healthy': {
    icon: 'verified',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    description: 'All blood parameters are within normal clinical ranges. No anemia detected.',
    causes: [],
    symptoms: [],
    recommendation: 'Maintain a healthy diet rich in iron, B12, and folate. Schedule routine check-ups.',
  },
  'Iron deficiency anemia': {
    icon: 'water_drop',
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    glow: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]',
    description: 'The most common form of anemia caused by insufficient iron to produce healthy red blood cells. Red cells become small (microcytic) and pale (hypochromic).',
    causes: ['Poor dietary iron intake', 'Chronic blood loss (GI bleed, menstruation)', 'Malabsorption (celiac disease)', 'Increased demand during pregnancy'],
    symptoms: ['Fatigue and weakness', 'Pale skin and conjunctiva', 'Shortness of breath', 'Brittle nails and hair loss', 'Pica (craving non-food substances)'],
    recommendation: 'Consult a haematologist. Iron supplementation and dietary modifications are typically prescribed. Investigate underlying blood loss.',
  },
  'Leukemia': {
    icon: 'science',
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.15)]',
    description: 'Anemia associated with leukemia occurs when cancerous white blood cells crowd out normal red blood cell production in the bone marrow.',
    causes: ['Bone marrow infiltration by malignant cells', 'Chemotherapy side effects', 'Bone marrow failure'],
    symptoms: ['Severe fatigue', 'Frequent infections', 'Easy bruising or bleeding', 'Bone pain', 'Enlarged lymph nodes'],
    recommendation: 'Urgent referral to an oncologist/haematologist is required. This requires immediate professional medical evaluation.',
  },
  'Leukemia with thrombocytopenia': {
    icon: 'emergency',
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    glow: 'shadow-[0_0_40px_rgba(251,146,60,0.15)]',
    description: 'A severe presentation of leukemia-associated anemia compounded by a critically low platelet count (thrombocytopenia), significantly increasing bleeding risk.',
    causes: ['Advanced bone marrow failure due to malignancy', 'Bone marrow infiltration'],
    symptoms: ['Spontaneous bleeding (petechiae, purpura)', 'Prolonged bleeding from minor cuts', 'Severe fatigue', 'High infection susceptibility'],
    recommendation: 'Requires urgent oncological intervention. Platelet transfusions may be necessary. Do not delay seeking emergency medical care.',
  },
  'Macrocytic anemia': {
    icon: 'bubble_chart',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    description: 'Characterized by abnormally large red blood cells (macrocytes). Usually caused by deficiencies in Vitamin B12 or folate, impairing DNA synthesis during cell division.',
    causes: ['Vitamin B12 deficiency (pernicious anemia)', 'Folate deficiency', 'Chronic alcohol use', 'Certain medications (methotrexate, hydroxyurea)', 'Hypothyroidism'],
    symptoms: ['Fatigue and weakness', 'Numbness or tingling in hands/feet (B12)', 'Smooth, sore tongue', 'Cognitive difficulties', 'Yellowing of skin (jaundice)'],
    recommendation: 'Vitamin B12 injections or oral supplements are standard treatment. Folate supplements for folate-deficiency type. Consult your doctor.',
  },
  'Normocytic hypochromic anemia': {
    icon: 'circle',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    glow: 'shadow-[0_0_40px_rgba(34,211,238,0.15)]',
    description: 'Red cells are of normal size (normocytic) but contain less hemoglobin than normal (hypochromic), resulting in pale cells with reduced oxygen-carrying capacity.',
    causes: ['Early or mild iron deficiency', 'Anemia of chronic disease', 'Thalassemia trait', 'Sideroblastic anemia'],
    symptoms: ['Mild to moderate fatigue', 'Pale appearance', 'Reduced exercise tolerance'],
    recommendation: 'Requires further investigation to identify the underlying cause. Consult a physician for a comprehensive blood panel.',
  },
  'Normocytic normochromic anemia': {
    icon: 'radio_button_unchecked',
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_40px_rgba(96,165,250,0.15)]',
    description: 'Red cells are normal in size and color but reduced in number. This is often a secondary manifestation of an underlying systemic disease.',
    causes: ['Anemia of chronic disease / inflammation', 'Renal failure (reduced EPO)', 'Acute blood loss', 'Hemolysis', 'Bone marrow suppression'],
    symptoms: ['Fatigue proportional to severity', 'Pallor', 'Shortness of breath on exertion'],
    recommendation: 'Treat the underlying condition. Erythropoietin therapy may be considered for renal-related cases. Seek medical evaluation.',
  },
  'Other microcytic anemia': {
    icon: 'grain',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    glow: 'shadow-[0_0_40px_rgba(244,114,182,0.15)]',
    description: 'Anemia characterised by small red blood cells (microcytes) not attributable to simple iron deficiency. Includes thalassemia and sideroblastic anemia.',
    causes: ['Thalassemia (alpha or beta)', 'Sideroblastic anemia', 'Lead poisoning', 'Hereditary conditions'],
    symptoms: ['Fatigue and pallor', 'Splenomegaly (in thalassemia)', 'Jaundice', 'Bone deformities (in severe thalassemia)'],
    recommendation: 'Hemoglobin electrophoresis and genetic testing may be required. Consult a specialist. Iron supplementation is not indicated without confirmed deficiency.',
  },
  'Thrombocytopenia': {
    icon: 'device_hub',
    color: 'text-red-400',
    border: 'border-red-500/40',
    glow: 'shadow-[0_0_40px_rgba(248,113,113,0.15)]',
    description: 'A condition with a dangerously low platelet count, impairing blood clotting. When occurring alongside anemia, it suggests significant bone marrow or systemic pathology.',
    causes: ['Immune thrombocytopenic purpura (ITP)', 'Drug-induced platelet destruction', 'Bone marrow failure', 'Viral infections (dengue, HIV)', 'Disseminated intravascular coagulation (DIC)'],
    symptoms: ['Easy bruising (ecchymoses)', 'Petechiae (pinpoint red spots)', 'Prolonged bleeding', 'Blood in urine or stool', 'Heavy menstrual periods'],
    recommendation: 'Requires prompt haematological assessment. Platelet transfusion, corticosteroids, or immunotherapy may be needed depending on the cause.',
  },
};

const MODEL_DISPLAY = {
  RandomForest: 'Random Forest',
  KNN: 'K-Nearest Neighbour',
  SVM: 'Support Vector Machine',
  LogisticReg: 'Logistic Regression',
};

// Map numeric class index to string labels (same order as label_classes.pkl)
const CLASS_LABELS = [
  'Healthy',
  'Iron deficiency anemia',
  'Leukemia',
  'Leukemia with thrombocytopenia',
  'Macrocytic anemia',
  'Normocytic hypochromic anemia',
  'Normocytic normochromic anemia',
  'Other microcytic anemia',
  'Thrombocytopenia',
];

export default function AnemiaTypePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prediction = location.state?.prediction;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!prediction) navigate('/upload');
  }, [prediction, navigate]);

  if (!prediction) return null;

  // The best model's multi-class prediction index
  const typeIndex = prediction.final_type ?? prediction.majority_type ?? 0;
  const diagnosisLabel = prediction.diagnosis || CLASS_LABELS[typeIndex] || 'Unknown';
  const info = ANEMIA_INFO[diagnosisLabel] || {
    icon: 'help',
    color: 'text-on-surface-variant',
    border: 'border-white/10',
    glow: '',
    description: 'Type details not available.',
    causes: [],
    symptoms: [],
    recommendation: 'Please consult a medical professional.',
  };

  // Per-model type votes
  const modelPredictions = prediction.model_predictions ?? {};

  return (
    <div className="bg-medical-mesh text-on-surface font-body-md min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="floating-blob top-[-10%] left-[-10%] opacity-30 bg-rose-500/20"></div>
        <div className="floating-blob bottom-[-20%] right-[-10%] opacity-20 bg-purple-500/20" style={{ animationDelay: '-5s' }}></div>
      </div>

      <nav className="w-full h-16 sticky top-0 bg-surface/60 backdrop-blur-3xl border-b border-primary/15 flex items-center justify-between px-margin-desktop z-50">
        <div className="flex items-center gap-unit">
          <Link to="/" className="font-display-hero text-headline-md text-primary tracking-tight">MedCura</Link>
        </div>
        <div className="hidden md:flex items-center gap-14">
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/">Home</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/upload">Upload Report</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/analysis">Analysis</Link>
          <Link className="font-data-label text-data-label text-on-surface-variant hover:text-primary transition-colors duration-300" to="/results" onClick={(e) => { e.preventDefault(); navigate('/results', { state: { prediction } }); }}>Results</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Profile" src={bloodCellsImg} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">

        {/* Back button */}
        <button
          onClick={() => navigate('/results', { state: { prediction } })}
          className={`flex items-center gap-2 font-data-label text-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-12 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Results
        </button>

        {/* Header */}
        <div className={`flex flex-col items-center text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="font-data-label text-data-label text-primary uppercase tracking-widest mb-4">Multi-Class Classification</span>
          <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-on-surface mb-6">Anemia Type Analysis</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Based on your CBC parameters, our models have identified the specific type of anemia present.</p>
        </div>

        {/* Primary diagnosis hero */}
        <div className={`glass-card rounded-3xl p-10 md:p-14 mb-12 border-2 ${info.border} ${info.glow} transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center shrink-0 bg-white/5 border ${info.border}`}>
              <span className={`material-symbols-outlined text-6xl ${info.color}`}>{info.icon}</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="font-data-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Detected Condition</p>
              <h2 className={`font-display-hero text-4xl md:text-5xl font-bold tracking-tight mb-4 ${info.color}`}>
                {diagnosisLabel}
              </h2>
              <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">{info.description}</p>
            </div>
          </div>
        </div>

        {/* Clinical details grid */}
        {(info.causes.length > 0 || info.symptoms.length > 0) && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {info.causes.length > 0 && (
              <div className="glass-card rounded-2xl p-8 border border-white/10">
                <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined">psychiatry</span>
                  Common Causes
                </h3>
                <ul className="space-y-3">
                  {info.causes.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 font-body-md text-on-surface-variant">
                      <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${info.color}`}>arrow_right</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {info.symptoms.length > 0 && (
              <div className="glass-card rounded-2xl p-8 border border-white/10">
                <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined">symptoms</span>
                  Typical Symptoms
                </h3>
                <ul className="space-y-3">
                  {info.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 font-body-md text-on-surface-variant">
                      <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${info.color}`}>arrow_right</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommendation banner */}
        <div className={`glass-card rounded-2xl p-8 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] mb-12 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-start gap-5">
            <span className="material-symbols-outlined text-amber-400 text-3xl shrink-0 mt-1">medical_information</span>
            <div>
              <h3 className="font-data-label text-sm uppercase tracking-widest text-amber-400 mb-2">Clinical Recommendation</h3>
              <p className="font-body-lg text-lg text-on-surface leading-relaxed">{info.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Per-model type votes */}
        <div className={`mb-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h3 className="font-data-label text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined">memory</span>
            Multi-Class Model Predictions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(modelPredictions).map(([model, typeIdx]) => {
              const label = CLASS_LABELS[typeIdx] ?? `Type ${typeIdx}`;
              const mInfo = ANEMIA_INFO[label];
              const mColor = mInfo?.color ?? 'text-on-surface-variant';
              return (
                <div key={model} className="glass-card rounded-xl p-6 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-body-md font-semibold text-on-surface">{MODEL_DISPLAY[model] ?? model}</p>
                    <p className={`font-data-label text-xs uppercase tracking-widest font-bold ${mColor} mt-1`}>{label}</p>
                  </div>
                  <span className={`material-symbols-outlined text-xl ${mColor}`}>{mInfo?.icon ?? 'help'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className={`transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed text-center">
              ⚠ This analysis is generated by an AI ensemble for <strong>informational purposes only</strong>. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified physician.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
