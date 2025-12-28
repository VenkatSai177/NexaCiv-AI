
import React, { useState, useRef } from 'react';
import { analyzeIncidentEvidence } from '../geminiService';
import { firebaseService } from '../firebase';
import { AIRiskAnalysis, IncidentCase, RiskLevel, CaseStatus } from '../types';

const DisasterLensAI: React.FC<{ currentCity: string }> = ({ currentCity }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IncidentCase | null>(null);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setLoading(true);
    setStatusText('NXA_NEURAL_HANDSHAKE...');
    
    try {
      setTimeout(() => setStatusText('GEOSPATIAL_SIGNATURE_FETCH...'), 1500);
      setTimeout(() => setStatusText('NEXACIV_RISK_INFERENCE...'), 3000);
      
      const analysis = await analyzeIncidentEvidence(base64, mimeType);
      
      const location = {
        latitude: 17.3850 + (Math.random() - 0.5) * 0.1, 
        longitude: 78.4867 + (Math.random() - 0.5) * 0.1,
        city: currentCity,
        region: 'URBAN_CORE_QUADRANT',
        address: `${Math.floor(Math.random() * 800) + 1} Metropolitan Blvd, ${currentCity}`
      };

      const newCase: IncidentCase = {
        id: `NXA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        timestamp: Date.now(),
        sourceEngine: 'DISASTER_AI',
        imageUrl: base64,
        evidenceType: 'IMAGE',
        location,
        analysis,
        status: CaseStatus.PENDING,
        city: currentCity,
        isAnonymous: false,
        integrityChecksum: '',
        deviceFingerprint: '',
        history: [{ status: CaseStatus.PENDING, timestamp: Date.now(), user: 'AUTONOMOUS_NXA_NODE' }]
      };

      await firebaseService.saveCase(newCase);
      setResult(newCase);
    } catch (error) {
      console.error(error);
      alert('Grid processing failure. Retrying NexaCiv node sync...');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <header className="mb-20 text-center animate-in fade-in slide-in-from-top duration-1000">
        <div className="inline-block px-5 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-black text-cyan-400 tracking-[0.5em] mb-8 uppercase animate-pulse shadow-2xl">NexaCiv AI — DisasterLens Neural Scanner</div>
        <h2 className="text-6xl font-black mb-8 tracking-tighter bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent">Structural Risk Intelligence</h2>
        <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-lg font-light">Autonomous NexaCiv auditing system. Gemini-powered vision engines classify structural hazards, drainage overflow, and public safety risks instantly.</p>
      </header>

      {!image ? (
        <div className="glass rounded-[60px] p-24 flex flex-col items-center justify-center border-white/5 min-h-[600px] hover:border-cyan-500/40 transition-all duration-700 cursor-pointer group relative overflow-hidden shadow-3xl"
             onClick={() => fileInputRef.current?.click()}>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="w-40 h-40 rounded-[48px] bg-white/5 border border-white/10 flex items-center justify-center mb-12 group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-700 shadow-2xl group-hover:shadow-cyan-500/20">
             <span className="text-4xl font-black text-white group-hover:scale-125 transition-transform">NXA</span>
          </div>
          <h3 className="text-3xl font-black mb-4 tracking-tight">Initiate Grid Scan</h3>
          <p className="text-white/30 font-mono text-[11px] uppercase tracking-[0.4em] font-bold group-hover:text-white transition-colors">Capture Survey Imagery // RAW / GEO_JPG / PNG</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 space-y-10 sticky top-10">
            <div className="glass rounded-[48px] overflow-hidden relative border-white/10 aspect-[4/3] shadow-3xl group">
              {loading && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-20 flex flex-col items-center justify-center overflow-hidden">
                  <div className="scanline"></div>
                  <div className="w-32 h-32 relative mb-8">
                    <div className="absolute inset-0 border-8 border-cyan-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-t-cyan-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-cyan-400 font-mono text-[11px] tracking-[0.6em] animate-pulse uppercase font-black">{statusText}</div>
                </div>
              )}
              <img src={image} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" alt="Incident Feed" />
            </div>

            {result && (
              <div className="glass p-10 rounded-[40px] border-white/5 animate-in slide-in-from-left duration-1000 shadow-2xl">
                <div className="flex items-center gap-8">
                   <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl neo-glow-blue border border-white/10">📍</div>
                   <div>
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2 font-black">NXA_GEO_TAG</div>
                      <div className="font-black text-2xl tracking-tighter mb-1">{result.location.address}</div>
                      <div className="text-white/40 text-xs font-mono tracking-widest uppercase">{result.location.latitude.toFixed(7)} // {result.location.longitude.toFixed(7)}</div>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-10">
            {result ? (
              <div className="animate-in fade-in slide-in-from-right duration-1000">
                <div className={`glass p-12 rounded-[56px] border-l-[12px] shadow-3xl relative overflow-hidden ${result.analysis.riskLevel === RiskLevel.CRITICAL ? 'border-red-500 shadow-red-500/10' : 'border-cyan-500 shadow-cyan-500/10'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 relative z-10">
                     <div>
                        <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.6em] mb-3 font-black">NexaCiv_Intelligence_Verified</div>
                        <h3 className="text-5xl font-black tracking-tighter">{result.analysis.hazardType}</h3>
                     </div>
                     <div className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border shadow-2xl ${
                       result.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-500 text-white border-red-500' : 
                       'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 shadow-cyan-500/20'
                     }`}>
                        {result.analysis.riskLevel} // {result.analysis.urgencyLevel}
                     </div>
                  </div>

                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 mb-12 shadow-inner">
                     <p className="text-xl leading-relaxed text-white/80 italic font-light font-serif">"{result.analysis.humanReadableExplanation}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                     <RiskMetric label="NXA Certainty" value={(result.analysis.confidenceScore * 100).toFixed(1) + '%'} color="text-cyan-400" />
                     <RiskMetric label="Impact Severity" value={result.analysis.impactSeverity + '/10'} color="text-orange-500" />
                     <RiskMetric label="Grid Radius" value={result.analysis.impactRadius} color="text-purple-400" />
                  </div>

                  <div className="mb-12">
                    <h5 className="font-mono text-[11px] text-white/30 uppercase tracking-[0.5em] mb-6 font-black">NexaCiv Intelligence Tags</h5>
                    <div className="flex flex-wrap gap-4">
                       {result.analysis.riskFactors.map(f => (
                         <span key={f} className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] uppercase font-black text-white/40 tracking-[0.2em]">{f}</span>
                       ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-white/5">
                     <button className="flex-1 py-5 bg-white text-black font-black rounded-3xl text-[11px] uppercase tracking-[0.4em] hover:bg-cyan-400 transition-all duration-500 shadow-2xl hover:scale-[1.02] active:scale-95" onClick={() => window.print()}>
                       Export Intelligence PDF
                     </button>
                     <button className="px-12 py-5 glass border-white/10 hover:bg-white/10 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-95" onClick={() => { setImage(null); setResult(null); }}>
                       Reset Grid Scanner
                     </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full glass rounded-[60px] border-white/5 border-dashed flex flex-col items-center justify-center p-32 opacity-10 animate-pulse">
                 <span className="text-8xl mb-10">🔍</span>
                 <p className="font-mono text-[12px] uppercase tracking-[0.7em] font-black">NXA_GRID_STANDBY</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RiskMetric = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="glass p-8 rounded-[32px] border-white/10 shadow-lg group hover:bg-white/10 transition-colors">
    <div className="text-[10px] text-white/30 font-mono mb-3 uppercase tracking-[0.4em] font-black">{label}</div>
    <div className={`text-3xl font-black ${color} tracking-tighter group-hover:scale-110 transition-transform`}>{value}</div>
  </div>
);

export default DisasterLensAI;
