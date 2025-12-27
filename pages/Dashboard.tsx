
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { firebaseService } from '../firebase';
import { IncidentCase, RiskLevel, SUPPORTED_CITIES } from '../types';

interface DashboardProps {
  currentCity: string;
  onCityChange: (city: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentCity, onCityChange }) => {
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    firebaseService.getCases(currentCity).then(setCases);
    setIsVisible(true);
  }, [currentCity]);

  const criticalCases = cases.filter(c => c.analysis.riskLevel === RiskLevel.CRITICAL);
  const highCases = cases.filter(c => c.analysis.riskLevel === RiskLevel.HIGH);

  const severityData = [
    { name: 'Critical', value: criticalCases.length, color: '#ff003c' },
    { name: 'High', value: highCases.length, color: '#ff8c00' },
    { name: 'Moderate', value: cases.filter(c => c.analysis.riskLevel === RiskLevel.MODERATE).length, color: '#ffcc00' },
    { name: 'Low', value: cases.filter(c => c.analysis.riskLevel === RiskLevel.LOW).length, color: '#00ff88' },
  ];

  return (
    <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight mb-3 flex items-center gap-4">
            Metropolitan Ops <span className="text-[10px] font-mono px-4 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded-full animate-pulse tracking-[0.3em]">LIVE_TELEMETRY</span>
          </h1>
          <p className="text-white/40 max-w-xl font-light leading-relaxed">Dual-engine risk synchronization dashboard. Monitoring real-time hazards via integrated AI scanner nodes and citizen feedback loops.</p>
        </div>

        <div className="glass p-1.5 rounded-2xl border-white/10 flex gap-1 shadow-2xl">
          {SUPPORTED_CITIES.map(city => (
            <button
              key={city}
              onClick={() => onCityChange(city)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${currentCity === city ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              {city}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Fixed SourceEngine comparison: 'CIVIC_GUARD' is the correct type value for human reports in types.ts */}
        <StatCard label="Network Nodes" value={cases.length} subValue={`${cases.filter(c => c.sourceEngine === 'DISASTER_AI').length} AI Scans / ${cases.filter(c => c.sourceEngine === 'CIVIC_GUARD').length} Civic`} />
        <StatCard label="Critical Zones" value={criticalCases.length} color="text-red-500" subValue="Urgent response active" />
        <StatCard label="AI Integrity" value="96.2%" subValue="Global Certainty Index" />
        <StatCard label="Avg Response" value="2.8h" subValue="Optimal efficiency" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 glass rounded-[40px] p-8 relative overflow-hidden group border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="font-bold text-white/60 uppercase tracking-[0.4em] text-[10px]">Active Risk Heatmap // {currentCity.toUpperCase()}</h3>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ff003c]"></span>
              <span className="text-[8px] font-mono text-white/30">GRID_UPLINK_STABLE</span>
            </div>
          </div>
          
          <div className="h-[500px] w-full bg-black/40 rounded-3xl relative overflow-hidden border border-white/5 group-hover:border-cyan-500/20 transition-colors">
            {/* Visual simulation of a futuristic map */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            {/* Pulsing Risk Pins */}
            <div className="absolute inset-0">
               {cases.map((c, i) => {
                 // Simulated coordinates mapped to screen for visualization
                 const x = 10 + (Math.sin(i * 19) + 1) * 40;
                 const y = 10 + (Math.cos(i * 23) + 1) * 40;
                 const isCritical = c.analysis.riskLevel === RiskLevel.CRITICAL;
                 
                 return (
                    <div 
                      key={c.id} 
                      className="absolute group/pin cursor-pointer" 
                      style={{ top: `${y}%`, left: `${x}%` }}
                    >
                      {/* Cluster animated ripple */}
                      <div className={`absolute -inset-10 rounded-full opacity-0 group-hover/pin:opacity-100 transition-opacity duration-700 animate-ping-slow ${isCritical ? 'bg-red-500/30' : 'bg-cyan-500/20'}`}></div>
                      <div className={`absolute -inset-6 rounded-full opacity-20 group-hover/pin:opacity-60 transition-all ${isCritical ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                      
                      <div className={`w-4 h-4 rounded-full relative z-10 border-2 border-white/20 transition-transform group-hover/pin:scale-125 ${
                        isCritical ? 'bg-red-500 neo-glow-critical' : 
                        c.analysis.riskLevel === RiskLevel.HIGH ? 'bg-orange-500 shadow-[0_0_15px_rgba(255,140,0,0.5)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(0,242,255,0.5)]'
                      }`}></div>
                      
                      {/* Floating Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 opacity-0 group-hover/pin:opacity-100 transition-all duration-500 pointer-events-none translate-y-2 group-hover/pin:translate-y-0">
                         <div className="glass px-4 py-2 rounded-2xl border-white/20 whitespace-nowrap shadow-2xl backdrop-blur-xl">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-cyan-400">{c.analysis.hazardType}</div>
                            <div className="text-[8px] text-white/40 font-mono uppercase">{c.analysis.riskLevel} SEVERITY // {c.analysis.impactRadius}</div>
                         </div>
                         <div className="w-[1px] h-4 bg-gradient-to-t from-cyan-500 to-transparent mx-auto"></div>
                      </div>
                    </div>
                 )
               })}
            </div>

            {/* Neural Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
               <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                  {Array.from({length: 144}).map((_, i) => <div key={i} className="border border-white/30"></div>)}
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-[40px] p-8 border-white/5 h-full flex flex-col shadow-2xl">
            <h3 className="font-bold text-white/60 uppercase tracking-[0.4em] text-[10px] mb-10">Distribution Index</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={8} animationDuration={1800} stroke="none">
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer hover:opacity-75 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '16px', fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-5 mt-10">
              {severityData.map(d => (
                <div key={d.name} className="flex items-center justify-between group cursor-help">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs font-mono text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">{d.name}</span>
                  </div>
                  <span className="text-sm font-black tracking-tighter">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, color = "text-white" }: { label: string; value: string | number; subValue: string; color?: string }) => (
  <div className="glass p-10 rounded-[32px] hover:border-white/20 transition-all duration-500 group overflow-hidden relative border-white/5 hover:scale-[1.02]">
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-[60px] group-hover:bg-cyan-500/10 transition-colors"></div>
    <div className="text-white/30 text-[9px] font-mono uppercase tracking-[0.4em] mb-8">{label}</div>
    <div className={`text-5xl font-black mb-3 tracking-tighter ${color} group-hover:translate-x-1 transition-transform`}>{value}</div>
    <div className="text-white/20 text-[10px] font-medium tracking-wide uppercase">{subValue}</div>
  </div>
);

export default Dashboard;
