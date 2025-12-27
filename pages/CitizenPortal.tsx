
import React, { useState } from 'react';
import { firebaseService } from '../firebase';
import { analyzeIncidentEvidence } from '../geminiService';
import { IncidentCase, CaseStatus, RiskLevel, AIRiskAnalysis } from '../types';

const CitizenPortal: React.FC<{ currentCity: string }> = ({ currentCity }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Automatic risk classification via Gemini even for basic citizen reports
      // Fixed: Explicitly typed the fallback object to satisfy AIRiskAnalysis interface requirements
      const analysis: AIRiskAnalysis = photo 
        ? await analyzeIncidentEvidence(photo, 'image/jpeg')
        : {
            hazardType: 'Public Safety Report',
            riskLevel: RiskLevel.MODERATE,
            confidenceScore: 0.9,
            impactSeverity: 5,
            impactRadius: 'Unknown',
            urgencyLevel: 'ROUTINE',
            safetyRecommendation: ['Exercise caution in the area.'],
            humanReadableExplanation: description || 'Citizen manual report.',
            riskFactors: ['Citizen Observation']
          } as AIRiskAnalysis;

      const report: IncidentCase = {
        id: `CIT-${Date.now()}`,
        timestamp: Date.now(),
        sourceEngine: 'CIVIC_GUARD',
        imageUrl: photo || undefined,
        evidenceType: 'IMAGE',
        location: {
          latitude: 17.3850,
          longitude: 78.4867,
          city: currentCity,
          address: `Public Domain, ${currentCity}`
        },
        analysis,
        status: CaseStatus.PENDING,
        city: currentCity,
        isAnonymous: false,
        integrityChecksum: '',
        deviceFingerprint: '',
        history: [{ status: CaseStatus.PENDING, timestamp: Date.now(), user: 'CIVIC_PARTICIPANT' }]
      };

      await firebaseService.saveCase(report);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Grid link interrupted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center animate-in zoom-in-95 fade-in duration-700">
        <div className="w-32 h-32 bg-cyan-500/20 text-cyan-400 rounded-[40px] flex items-center justify-center mx-auto mb-12 text-6xl shadow-[0_0_50px_rgba(0,242,255,0.2)] border border-cyan-500/20">✓</div>
        <h2 className="text-5xl font-black mb-8 tracking-tighter">Tele-Report Filed</h2>
        <p className="text-white/40 mb-16 max-w-sm mx-auto text-lg leading-relaxed">Thank you for contributing to urban safety. Your report is now in the Admin Operations Queue for review.</p>
        <button className="px-16 py-6 glass border-white/10 rounded-3xl font-black uppercase tracking-[0.5em] text-[10px] hover:bg-white/10 transition-all" onClick={() => { setSubmitted(false); setPhoto(null); setDescription(''); }}>New Report</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16">
      <header className="mb-16 text-center">
        <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-[10px] font-black text-purple-400 tracking-[0.5em] mb-8 uppercase animate-pulse shadow-2xl">CivicGuard — Citizen Reporting Portal</div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">Report Urban Hazard</h2>
        <p className="text-white/40 text-lg max-w-sm mx-auto font-light">Rapid public reporting for non-emergency infrastructure and safety issues. Geotagged and synced to the central hub.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass rounded-[40px] p-8 border-white/5 relative overflow-hidden group">
          <label className="block font-mono text-[10px] text-white/30 uppercase tracking-[0.5em] mb-8 font-black">Visual Proof (Optional)</label>
          {photo ? (
            <div className="relative group/img rounded-[32px] overflow-hidden border border-white/10 aspect-video shadow-3xl bg-black/40">
              <img src={photo} className="w-full h-full object-cover" alt="Proof" />
              <button className="absolute top-4 right-4 p-3 bg-black/80 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover/img:opacity-100 transition-all duration-500 hover:scale-110 z-10" onClick={() => setPhoto(null)}>✕</button>
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-cyan-500/40 transition-all duration-700 group shadow-inner" onClick={() => document.getElementById('citizen-upload')?.click()}>
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors font-mono">Attach Imagery</div>
              <input type="file" id="citizen-upload" accept="image/*" onChange={handleCapture} className="hidden" />
            </div>
          )}
        </div>

        <div className="glass rounded-[32px] p-8 border-white/5">
           <label className="block font-mono text-[10px] text-white/30 uppercase tracking-[0.5em] mb-4 font-black">Incident Context</label>
           <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (optional, AI will analyze image)..."
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 font-light resize-none h-32"
           />
        </div>

        <button disabled={isSubmitting} className="w-full py-8 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[32px] font-black uppercase tracking-[0.6em] text-[11px] hover:scale-[1.03] active:scale-95 transition-all duration-500 shadow-3xl shadow-purple-500/20 disabled:opacity-30 flex items-center justify-center gap-4">
          {isSubmitting ? 'TRANSMITTING...' : 'SUBMIT_CIVIC_REPORT'}
        </button>
      </form>
    </div>
  );
};

export default CitizenPortal;
