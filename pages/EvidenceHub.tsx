
import React, { useState, useRef } from 'react';
import { firebaseService } from '../firebase';
import { analyzeIncidentEvidence } from '../geminiService';
import { IncidentCase, CaseStatus, EvidenceType } from '../types';

const EvidenceHub: React.FC<{ currentCity: string }> = ({ currentCity }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [media, setMedia] = useState<{ data: string; type: EvidenceType; mime: string } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => setMedia({ data: reader.result as string, type: 'VIDEO', mime: 'video/webm' });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Hardware access restricted.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const type: EvidenceType = file.type.includes('video') ? 'VIDEO' : 'IMAGE';
      reader.onload = () => setMedia({ data: reader.result as string, type, mime: file.type });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media) return;
    setIsSubmitting(true);

    try {
      const analysis = await analyzeIncidentEvidence(media.data, media.mime);
      
      const report: IncidentCase = {
        id: `WHIS-${Date.now()}`,
        timestamp: Date.now(),
        sourceEngine: 'EVIDENCE_HUB',
        imageUrl: media.type === 'IMAGE' ? media.data : undefined,
        videoUrl: media.type === 'VIDEO' ? media.data : undefined,
        evidenceType: media.type,
        location: {
          latitude: 17.3850,
          longitude: 78.4867,
          city: currentCity,
          address: `Protected Geotag, ${currentCity}`
        },
        analysis,
        status: CaseStatus.PENDING,
        city: currentCity,
        isAnonymous: isAnonymous,
        integrityChecksum: '',
        deviceFingerprint: '',
        history: [{ status: CaseStatus.PENDING, timestamp: Date.now(), user: 'WHISTLEBLOWER' }]
      };

      await firebaseService.saveCase(report);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Neural sync error. Evidence remains locally encrypted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center animate-in zoom-in-95 fade-in duration-700">
        <div className="w-32 h-32 bg-purple-500/20 text-purple-400 rounded-[40px] flex items-center justify-center mx-auto mb-12 text-6xl shadow-[0_0_50px_rgba(188,19,254,0.2)] border border-purple-500/20">🛡️</div>
        <h2 className="text-5xl font-black mb-8 tracking-tighter">Chain-Of-Custody Established</h2>
        <p className="text-white/40 mb-16 max-w-sm mx-auto text-lg leading-relaxed">Evidence is now secured in the Metadata Vault. Identity protection active. {isAnonymous ? 'Anonymity verified.' : ''}</p>
        <button className="px-16 py-6 glass border-white/10 rounded-3xl font-black uppercase tracking-[0.5em] text-[10px] hover:bg-white/10 transition-all" onClick={() => { setSubmitted(false); setMedia(null); }}>Submit New Proof</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16">
      <header className="mb-16 text-center">
        <div className="inline-block px-5 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-black text-red-400 tracking-[0.5em] mb-8 uppercase animate-pulse shadow-2xl">Evidence Hub — Protected Reports</div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">Secure Misconduct Submission</h2>
        <p className="text-white/40 text-lg max-w-sm mx-auto font-light">Whistleblower protection active. Submit video/photo evidence of negligence or misconduct via encrypted bit-stream.</p>
        <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-[10px] text-red-400/60 uppercase tracking-widest">
           ⚠️ ANONYMOUS MODE DEFAULT // DO NOT CONFRONT SUSPECTS
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="glass rounded-[48px] p-10 border-white/5 relative overflow-hidden group shadow-2xl">
          <label className="block font-mono text-[10px] text-white/30 uppercase tracking-[0.6em] mb-10 font-black">Multimedia Proof Capture</label>
          {media ? (
            <div className="relative group/img rounded-[32px] overflow-hidden border border-white/10 aspect-video shadow-3xl bg-black/40">
              {media.type === 'IMAGE' ? (
                <img src={media.data} className="w-full h-full object-cover" alt="Proof" />
              ) : (
                <video src={media.data} className="w-full h-full object-contain" controls />
              )}
              <button className="absolute top-6 right-6 p-4 bg-black/80 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover/img:opacity-100 transition-all duration-500 hover:scale-110 z-10" onClick={() => setMedia(null)}>✕</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div 
                className={`bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-red-500/40 transition-all duration-700 group shadow-inner ${isRecording ? 'border-red-500/50' : ''}`}
                onClick={() => isRecording ? stopRecording() : startRecording()}
              >
                {isRecording ? (
                   <>
                      <div className="text-7xl mb-6 animate-pulse text-red-500">⏹️</div>
                      <div className="text-[11px] font-black uppercase tracking-[0.5em] text-red-400 font-mono">RECORDING_STREAM_LIVE...</div>
                   </>
                ) : (
                   <>
                      <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🎥</div>
                      <div className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 group-hover:text-white transition-colors font-mono">Record Securely</div>
                   </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => document.getElementById('hub-img')?.click()} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">Upload IMAGE</button>
                <button type="button" onClick={() => document.getElementById('hub-vid')?.click()} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">Upload VIDEO</button>
              </div>
              <input type="file" id="hub-img" accept="image/*" onChange={handleFile} className="hidden" />
              <input type="file" id="hub-vid" accept="video/*" onChange={handleFile} className="hidden" />
            </div>
          )}
        </div>

        <div className="glass rounded-[32px] p-8 border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black text-red-400 tracking-[0.4em] uppercase">Whistleblower Anonymity</div>
            <button 
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${isAnonymous ? 'bg-red-500' : 'bg-white/10'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-all duration-500 ${isAnonymous ? 'ml-6' : 'ml-0'}`}></div>
            </button>
          </div>
          <p className="text-[9px] text-white/30 leading-relaxed font-mono uppercase tracking-widest">
            {isAnonymous 
              ? "ANONYMOUS_PROTOCOL_ACTIVE: Bit-stream will be sanitized of all device fingerprints." 
              : "PROFILE_UPLINK_ACTIVE: Verified identity will be disclosed only to Senior Command."}
          </p>
        </div>

        <button disabled={isSubmitting || !media} className="w-full py-8 bg-gradient-to-br from-red-600 to-red-900 rounded-[32px] font-black uppercase tracking-[0.6em] text-[11px] hover:scale-[1.03] active:scale-95 transition-all duration-500 shadow-3xl shadow-red-500/30 disabled:opacity-30 flex items-center justify-center gap-4">
          {isSubmitting ? 'DECRYPTING_UPLOAD...' : 'UPLOAD_PROTECTED_EVIDENCE'}
        </button>
      </form>
    </div>
  );
};

export default EvidenceHub;
