
import React, { useState, useEffect } from 'react';
import { firebaseService, AdminActionLog } from '../firebase';
import { IncidentCase, CaseStatus, RiskLevel, SourceEngine } from '../types';
import { getAdminRecommendations } from '../geminiService';
import { exportCasesToCSV, exportCaseToPDF } from '../exportService';

const AdminCommandCenter: React.FC = () => {
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<IncidentCase | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loadingRec, setLoadingRec] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DISASTER' | 'CIVIC' | 'EVIDENCE'>('ALL');
  const [evidenceAuthorized, setEvidenceAuthorized] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([]);

  useEffect(() => { loadCases(); }, []);

  useEffect(() => {
    if (selectedCase) {
      loadAuditLogs(selectedCase.id);
    }
  }, [selectedCase]);

  const loadCases = async () => {
    const data = await firebaseService.getCases();
    setCases(data.sort((a, b) => b.timestamp - a.timestamp));
  };

  const loadAuditLogs = async (caseId: string) => {
    const logs = await firebaseService.getAdminLogs(caseId);
    setAuditLogs(logs);
  };

  const handleSelectCase = async (c: IncidentCase) => {
    setSelectedCase(c);
    setLoadingRec(true);
    setRecommendation('');
    setEvidenceAuthorized(false); // Reset authorization when changing cases
    try {
      const rec = await getAdminRecommendations(`${c.analysis.hazardType}: ${c.analysis.humanReadableExplanation}`);
      setRecommendation(rec);
    } finally {
      setLoadingRec(false);
    }
  };

  const handleUpdateStatus = async (status: CaseStatus, actionLabel?: string) => {
    if (!selectedCase) return;
    const user = firebaseService.getCurrentUser()?.displayName || 'SENIOR_CMD_OFFICER';
    const logMessage = actionLabel || `Status changed to ${status}`;
    
    await firebaseService.updateCaseStatus(selectedCase.id, status, user, logMessage);
    
    await loadCases();
    await loadAuditLogs(selectedCase.id);
    setSelectedCase({ 
      ...selectedCase, 
      status, 
      history: [...selectedCase.history, { status, timestamp: Date.now(), user }] 
    });
  };

  const authorizeEvidenceAccess = async () => {
    const user = firebaseService.getCurrentUser()?.displayName || 'SENIOR_CMD_OFFICER';
    setEvidenceAuthorized(true);
    if (selectedCase) {
      await firebaseService.logAdminAction(selectedCase.id, 'SECURE_ACCESS_GRANTED', user, {
        accessType: 'BIOMETRIC_ENCRYPTED_UPLINK',
        clearance: 'SENIOR_LEVEL_V'
      });
      await loadAuditLogs(selectedCase.id);
    }
  };

  const handleLogout = () => {
    firebaseService.logout();
    window.location.reload();
  };

  const filteredCases = cases.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'DISASTER') return c.sourceEngine === 'DISASTER_AI';
    if (filter === 'CIVIC') return c.sourceEngine === 'CIVIC_GUARD';
    if (filter === 'EVIDENCE') return c.sourceEngine === 'EVIDENCE_HUB';
    return true;
  });

  const handleBulkExport = () => {
    exportCasesToCSV(filteredCases);
  };

  const handleIndividualExport = () => {
    if (selectedCase) {
      exportCaseToPDF(selectedCase);
    }
  };

  const isEvidenceCase = selectedCase?.sourceEngine === 'EVIDENCE_HUB';

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Sidebar Navigation & Inbox */}
      <div className="w-[450px] flex flex-col gap-8">
        <header className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black tracking-tighter">Strategic Ops</h2>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] mt-2 font-black">Moderation_Command_Feed</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleBulkExport}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
                title="Export current view to CSV"
              >
                CSV_DUMP
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all active:scale-95 shadow-lg"
              >
                LOGOUT
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest font-black ml-1">Filter_Channel</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['ALL', 'DISASTER', 'CIVIC', 'EVIDENCE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    filter === f 
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                      : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                  }`}
                >
                  {f === 'EVIDENCE' ? 'PROTECTED_QUEUE' : f + '_FEED'}
                </button>
              ))}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
          {filteredCases.map(c => (
            <div 
              key={c.id} 
              className={`glass p-8 rounded-[32px] cursor-pointer transition-all duration-500 relative overflow-hidden border-l-8 ${selectedCase?.id === c.id ? 'border-l-cyan-400 bg-white/10 shadow-3xl scale-[1.02]' : 'border-l-white/5 hover:bg-white/5 hover:border-l-white/20'}`}
              onClick={() => handleSelectCase(c)}
            >
              {c.sourceEngine === 'EVIDENCE_HUB' && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-bl-xl z-10">
                  PROTECTED
                </div>
              )}
              <div className="flex justify-between items-start mb-5">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-black">{c.id}</span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-xl uppercase tracking-tighter shadow-2xl ${
                  c.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40 border border-white/10'
                }`}>
                  {c.analysis.riskLevel}
                </span>
              </div>
              <div className="font-black text-xl mb-3 tracking-tight group-hover:text-cyan-400 transition-colors leading-tight">
                {c.analysis.hazardType}
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.4em] text-white/15 border-t border-white/5 pt-5 font-black">
                 <span>{c.city} // {new Date(c.timestamp).toLocaleTimeString()}</span>
                 <span className={`flex items-center gap-2 font-black uppercase ${c.sourceEngine === 'EVIDENCE_HUB' ? 'text-purple-400' : 'text-cyan-400/60'}`}>
                   {c.status}
                 </span>
              </div>
            </div>
          ))}
          {filteredCases.length === 0 && (
            <div className="py-20 text-center text-white/10 font-mono text-[10px] uppercase tracking-widest italic">
              Empty_Channel_Stream
            </div>
          )}
        </div>
      </div>

      {/* Main Operations Console */}
      <div className="flex-1 glass rounded-[60px] overflow-hidden flex flex-col border-white/5 shadow-3xl relative">
        {selectedCase ? (
          <>
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-400 animate-gradient-x"></div>
              <div>
                <div className="text-[10px] font-mono text-white/30 mb-2 uppercase tracking-[0.6em] font-black">
                  Case_ID: {selectedCase.id} // Channel: {selectedCase.sourceEngine}
                  {selectedCase.isAnonymous && <span className="ml-4 text-purple-400">ANONYMOUS_PROTECTED</span>}
                </div>
                <h3 className="text-5xl font-black tracking-tighter leading-none">{selectedCase.analysis.hazardType}</h3>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleIndividualExport}
                  className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-cyan-400 transition-all shadow-2xl hover:scale-105 active:scale-95"
                >
                  Export Case File
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-16">
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-16">
                {/* Media Section */}
                <div className="space-y-10">
                   <div className="rounded-[40px] overflow-hidden aspect-[16/10] border border-white/10 shadow-3xl relative bg-black/60 group">
                      {isEvidenceCase && !evidenceAuthorized ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                          <div className="text-4xl mb-6">🔐</div>
                          <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em] mb-8 text-center px-10">Protected Misconduct Evidence: Authentication Required</div>
                          <button 
                            onClick={authorizeEvidenceAccess}
                            className="px-10 py-5 bg-red-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.4em] hover:bg-red-500 transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,0,60,0.4)] border border-red-500/50"
                          >
                            Perform Senior Authorization
                          </button>
                        </div>
                      ) : null}

                      {selectedCase.evidenceType === 'IMAGE' ? (
                        selectedCase.imageUrl ? (
                          <img src={selectedCase.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/10 font-mono tracking-widest uppercase">Visual_Data_Corrupt</div>
                        )
                      ) : (
                        <video src={selectedCase.videoUrl} className="w-full h-full object-contain" controls />
                      )}

                      <div className="absolute top-6 right-6 glass px-3 py-1 rounded-lg text-[8px] font-mono text-cyan-400/60 border border-cyan-400/20 pointer-events-none select-none">
                        AUTH_TAG: {selectedCase.id} // CRYPTO_SIGN_{selectedCase.timestamp}
                      </div>
                      
                      <div className="absolute bottom-6 left-6 glass px-5 py-2 rounded-2xl text-[10px] font-mono text-white/40 uppercase font-black tracking-widest shadow-2xl">Verified_Chain_Of_Custody</div>
                   </div>

                   <div className="grid grid-cols-3 gap-8">
                      <MetricWidget label="Impact Score" value={selectedCase.analysis.impactSeverity + '/10'} color="text-orange-500" />
                      <MetricWidget label="Certainty" value={(selectedCase.analysis.confidenceScore * 100).toFixed(0) + '%'} />
                      <MetricWidget label="Anonymity" value={selectedCase.isAnonymous ? 'PROTECTED' : 'PUBLIC'} />
                   </div>
                </div>

                {/* AI & Recommendations Section */}
                <div className="space-y-10">
                   <div className="p-10 bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                      <h4 className="text-[11px] font-black text-white/30 mb-8 uppercase tracking-[0.5em]">Neural_Evidence_Analysis</h4>
                      <p className="text-2xl leading-relaxed text-white/80 font-light italic mb-10 font-serif">"{selectedCase.analysis.humanReadableExplanation}"</p>
                      
                      {selectedCase.analysis.misconductPatterns && selectedCase.analysis.misconductPatterns.length > 0 && (
                        <div className="space-y-4">
                           <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Misconduct_Signature_Detected</div>
                           <div className="flex flex-wrap gap-3">
                             {selectedCase.analysis.misconductPatterns.map(p => (
                               <span key={p} className="text-[10px] font-black px-4 py-2 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 uppercase tracking-[0.2em]">{p}</span>
                             ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="p-10 bg-purple-900/10 border border-purple-500/30 rounded-[40px] relative overflow-hidden group shadow-2xl">
                      <h4 className="text-[11px] font-black text-purple-400 mb-8 uppercase tracking-[0.6em] flex items-center gap-4">
                        <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping"></span> SENIOR_TACTICAL_ADVISORY
                      </h4>
                      {loadingRec ? (
                        <div className="space-y-5 animate-pulse">
                           <div className="h-5 bg-white/5 rounded-full w-full"></div>
                           <div className="h-5 bg-white/5 rounded-full w-4/5"></div>
                        </div>
                      ) : (
                        <div className="text-base text-white/80 whitespace-pre-line leading-loose font-medium font-serif">{recommendation}</div>
                      )}
                   </div>
                </div>
              </div>

              {/* Enhanced Pipeline Actions */}
              <div className="space-y-10">
                 <div className="flex items-center gap-6">
                    <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.6em] font-mono">Moderation_Pipeline_State</label>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Universal Actions */}
                    <button 
                      className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 border shadow-xl ${selectedCase.status === CaseStatus.ACKNOWLEDGED ? 'bg-cyan-500 text-black border-cyan-500' : 'border-white/10 text-white/30 hover:bg-white/5 hover:border-white/30'}`}
                      onClick={() => handleUpdateStatus(CaseStatus.ACKNOWLEDGED, "Case Acknowledged by Command")}
                    >
                      Acknowledge
                    </button>

                    {/* Contextual Evidence Actions */}
                    {isEvidenceCase ? (
                      <>
                        <button 
                          className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 border shadow-xl ${selectedCase.status === CaseStatus.ESCALATED ? 'bg-red-600 text-white border-red-500 shadow-red-500/30' : 'border-red-500/20 text-red-400 hover:bg-red-500/10'}`}
                          onClick={() => handleUpdateStatus(CaseStatus.ESCALATED, "Evidence Escalated to External Authority")}
                        >
                          Escalate to Authority
                        </button>
                        <button 
                          className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 border shadow-xl ${selectedCase.status === CaseStatus.INVESTIGATING ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/30' : 'border-purple-500/20 text-purple-400 hover:bg-purple-500/10'}`}
                          onClick={() => handleUpdateStatus(CaseStatus.INVESTIGATING, "Assigned to Internal Investigation Cell")}
                        >
                          Investigate Cell
                        </button>
                      </>
                    ) : (
                      <button 
                        className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 border shadow-xl ${selectedCase.status === CaseStatus.ASSIGNED ? 'bg-cyan-500 text-black border-cyan-500 shadow-cyan-500/30' : 'border-white/10 text-white/30 hover:bg-white/5 hover:border-white/30'}`}
                        onClick={() => handleUpdateStatus(CaseStatus.ASSIGNED, "Field Unit Dispatched")}
                      >
                        Dispatch Unit
                      </button>
                    )}

                    <button 
                      className={`px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 border shadow-xl ${selectedCase.status === CaseStatus.FALSE_REPORT ? 'bg-red-500 text-white border-red-500 shadow-red-500/30' : 'border-red-500/20 text-red-400/40 hover:bg-red-500/10 hover:border-red-500/40'}`}
                      onClick={() => handleUpdateStatus(CaseStatus.FALSE_REPORT, "Marked as Malicious/False Report")}
                    >
                      False Report
                    </button>
                 </div>

                 <div className="flex flex-wrap gap-4 pt-4">
                    {[CaseStatus.RESOLVED, CaseStatus.ARCHIVED].map(s => (
                      <button 
                        key={s} 
                        className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all border ${selectedCase.status === s ? 'bg-white text-black border-white' : 'border-white/5 text-white/20 hover:text-white/40 hover:border-white/20'}`}
                        onClick={() => handleUpdateStatus(s)}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Enhanced Immutable Audit Log */}
              <div className="space-y-8 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.6em] font-mono">Immutable_Chain_Of_Moderation</label>
                  <span className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-widest">BLOCKCHAIN_SIM_ACTIVE</span>
                </div>
                <div className="space-y-4">
                   {auditLogs.length > 0 ? auditLogs.map((log) => (
                     <div key={log.id} className="p-6 glass rounded-[32px] border-white/10 bg-white/[0.02] flex justify-between items-start group hover:bg-white/[0.04] transition-all relative">
                        {log.action === 'SECURE_ACCESS_GRANTED' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-red-500 rounded-r-full"></div>}
                        <div className="space-y-2">
                           <div className="flex items-center gap-4">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${log.action === 'SECURE_ACCESS_GRANTED' ? 'text-red-400' : 'text-cyan-400'}`}>{log.action}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20"></span>
                              <span className="text-[10px] font-mono text-white/40">{log.admin}</span>
                           </div>
                           <div className="text-[12px] text-white/60 font-light italic">
                              {log.action === 'STATUS_UPDATE' ? (
                                <>Transitioned to <span className="text-white/80 font-bold">{log.details.newStatus}</span>: <span className="text-white/40">{log.details.remarks}</span></>
                              ) : (
                                <span>{JSON.stringify(log.details)}</span>
                              )}
                           </div>
                        </div>
                        <div className="text-[9px] font-mono text-white/10 uppercase group-hover:text-white/30 transition-colors">
                           {new Date(log.timestamp).toLocaleString()}
                        </div>
                     </div>
                   )) : (
                     <div className="text-center py-10 opacity-20 font-mono text-[10px] uppercase tracking-widest italic border border-white/5 border-dashed rounded-[32px]">No operational records found.</div>
                   )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <div className="text-9xl mb-12 animate-pulse grayscale">🛡️</div>
            <h3 className="text-3xl font-black uppercase tracking-[1em]">Awaiting_Strategic_Input</h3>
            <p className="font-mono text-[11px] mt-6 tracking-[0.6em] font-black">Strategic Intelligence Node Active // Standby for Transmission</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricWidget = ({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) => (
  <div className="glass p-8 rounded-[32px] border-white/10 shadow-xl group hover:bg-white/5 transition-colors">
    <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-3 font-black">{label}</div>
    <div className={`text-2xl font-black tracking-tighter ${color} group-hover:scale-105 transition-transform`}>{value}</div>
  </div>
);

export default AdminCommandCenter;
