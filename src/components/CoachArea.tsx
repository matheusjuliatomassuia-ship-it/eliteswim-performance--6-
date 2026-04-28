
import React, { useMemo, useState } from 'react';
import { DailyMetric, AthleteProfile } from '../../types';
import { URINE_COLORS } from '../../constants';
import { Activity, HeartPulse, Flame, Thermometer, ClipboardX, User, Users, LayoutGrid, Layers, MessageSquare } from 'lucide-react';

interface CoachAreaProps { metrics: DailyMetric[]; athletes?: AthleteProfile[]; }

const CoachArea: React.FC<CoachAreaProps> = ({ metrics, athletes = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'athletes' | 'team'>('athletes');
  const [modality, setModality] = useState<'both' | 'pool' | 'gym'>('both');
  
  const getPositiveColor = (v: number) => { 
    if (v === 0) return 'bg-slate-100 text-slate-300'; 
    if (v <= 4) return 'bg-red-500 text-white'; 
    if (v <= 6) return 'bg-yellow-400 text-slate-800'; 
    return 'bg-emerald-500 text-white'; 
  };
  
  const getNegativeColor = (v: number) => { 
    if (v === 0) return 'bg-slate-100 text-slate-300'; 
    if (v <= 3) return 'bg-emerald-500 text-white'; 
    if (v <= 6) return 'bg-yellow-400 text-slate-800'; 
    return 'bg-red-500 text-white'; 
  };

  const stats = useMemo(() => {
    const rawDayMetrics = metrics.filter(m => m.date === selectedDate);
    // Assegura unicidade por atleta no dia
    const dayMetrics = Array.from(new Map(rawDayMetrics.map(m => [m.athleteId, m])).values());
    const respondersIds = dayMetrics.map(m => m.athleteId);
    
    const pendingAthletes = athletes.filter(a => !respondersIds.includes(a.id)).map(a => a.name);
    
    const painAlerts = dayMetrics.filter(m => m.soreness > 7 || (m.painInfo && m.painInfo.intensity > 5)).map(m => ({
      name: athletes.find(a => a.id === m.athleteId)?.name || 'Atleta',
      location: m.painInfo?.location || 'Geral',
      level: m.painInfo?.intensity || m.soreness
    }));

    const menstrualAlerts = dayMetrics.filter(m => m.menstrualInfo?.active).map(m => ({
      name: athletes.find(a => a.id === m.athleteId)?.name || 'Atleta',
      info: m.menstrualInfo
    }));

    const totalLoad = dayMetrics.reduce((acc, m) => acc + (m.sRPE || 0), 0);
    const avgLoad = dayMetrics.length > 0 ? totalLoad / dayMetrics.length : 0;

    const teamAverages = dayMetrics.length > 0 ? {
      sRPE: totalLoad / dayMetrics.length,
      rpe: dayMetrics.reduce((acc, m) => acc + (m.rpe || 0), 0) / dayMetrics.length,
      psr: dayMetrics.reduce((acc, m) => acc + (m.psr || 0), 0) / dayMetrics.length,
      gymRpe: dayMetrics.reduce((acc, m) => acc + (m.gymRpe || 0), 0) / dayMetrics.length,
      gymPsr: dayMetrics.reduce((acc, m) => acc + (m.gymPsr || 0), 0) / dayMetrics.length,
      fatigue: dayMetrics.reduce((acc, m) => acc + (m.fatigue || 0), 0) / dayMetrics.length,
      stress: dayMetrics.reduce((acc, m) => acc + (m.stress || 0), 0) / dayMetrics.length,
      mood: dayMetrics.reduce((acc, m) => acc + (m.mood || 0), 0) / dayMetrics.length,
      soreness: dayMetrics.reduce((acc, m) => acc + (m.soreness || 0), 0) / dayMetrics.length,
      sleep: dayMetrics.reduce((acc, m) => acc + (m.sleepHours || 0), 0) / dayMetrics.length,
      urine: dayMetrics.reduce((acc, m) => acc + (m.urineColor || 0), 0) / dayMetrics.length,
    } : null;

    return { pendingAthletes, painAlerts, menstrualAlerts, dayMetrics, avgLoad, teamAverages };
  }, [metrics, athletes, selectedDate]);

  // Deduplicar atletas para evitar erros de chave duplicada
  const uniqueAthletes = useMemo(() => {
    return Array.from(new Map(athletes.map(a => [a.id, a])).values());
  }, [athletes]);

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* HEADER CARD */}
      <div className="hud-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
         <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary border border-primary/30 shadow-inner"><Activity size={24} /></div>
            <div>
               <h2 className="text-xl font-black text-white uppercase italic tracking-widest leading-none">Gestão da Equipe</h2>
               <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 tracking-widest">Status de Telemetria e Alertas de Saúde</p>
            </div>
         </div>
         <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="hidden lg:block text-right">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Carga Média do Dia</p>
               <p className="text-xl font-black text-primary italic font-mono">{stats.avgLoad.toFixed(2)}</p>
            </div>
            
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shadow-inner">
               <button onClick={() => setModality('both')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'both' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>AMBOS</button>
               <button onClick={() => setModality('pool')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'pool' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>PISCINA</button>
               <button onClick={() => setModality('gym')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'gym' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>ACADEMIA</button>
            </div>

            <div className="flex gap-3 bg-black/40 p-2 rounded-xl border border-white/5 shadow-inner">
               <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-primary font-black uppercase text-xs outline-none px-4" />
            </div>
         </div>
      </div>

      {/* ALERT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className={`p-4 rounded-2xl border transition-all ${stats.painAlerts.length > 0 ? 'bg-danger/10 border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/5 opacity-40'}`}>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2"><Flame size={18} className="text-danger" /><h3 className="text-[10px] font-black text-white uppercase italic">Dor Muscular Elevada</h3></div>
               <span className="text-[10px] font-mono text-danger font-bold">{stats.painAlerts.length}</span>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto">
               {stats.painAlerts.length > 0 ? stats.painAlerts.map((a, i) => (
                 <p key={i} className="text-[10px] text-slate-300 font-bold uppercase truncate">• {a.name} ({a.location} - {a.level}/10)</p>
               )) : <p className="text-[10px] text-slate-600 italic">Nenhum reporte crítico</p>}
            </div>
         </div>

         <div className={`p-4 rounded-2xl border transition-all ${stats.menstrualAlerts.length > 0 ? 'bg-pink-500/10 border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'bg-white/5 border-white/5 opacity-40'}`}>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2"><Thermometer size={18} className="text-pink-400" /><h3 className="text-[10px] font-black text-white uppercase italic">Ciclo Menstrual Ativo</h3></div>
               <span className="text-[10px] font-mono text-pink-400 font-bold">{stats.menstrualAlerts.length}</span>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto">
               {stats.menstrualAlerts.length > 0 ? stats.menstrualAlerts.map((a, i) => (
                 <p key={i} className="text-[10px] text-slate-300 font-bold uppercase truncate">• {a.name} (Fluxo {a.info?.flow})</p>
               )) : <p className="text-[10px] text-slate-600 italic">Nenhum reporte ativo</p>}
            </div>
         </div>

         <div className={`p-4 rounded-2xl border transition-all ${stats.pendingAthletes.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-success/10 border-success/30 opacity-40'}`}>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2"><ClipboardX size={18} className="text-amber-400" /><h3 className="text-[10px] font-black text-white uppercase italic">Diários Pendentes</h3></div>
               <span className="text-[10px] font-mono text-amber-400 font-bold">{stats.pendingAthletes.length}</span>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto">
               {stats.pendingAthletes.length > 0 ? stats.pendingAthletes.map((name, i) => (
                 <p key={i} className="text-[10px] text-slate-300 font-bold uppercase truncate">• {name}</p>
               )) : <p className="text-[10px] text-emerald-500 font-black italic uppercase">Equipe 100% Sincronizada!</p>}
            </div>
         </div>
      </div>

      {/* CONSOLIDATED TELEMETRY TABLE - Matching Monitoring Style */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-top-4">
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HeartPulse className="text-primary" size={24} />
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">TELEMETRIA CONSOLIDADA</h3>
          </div>
          
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 shadow-inner">
             <button 
               onClick={() => setViewMode('athletes')} 
               className={`flex items-center gap-2 px-6 py-2 text-[9px] font-black rounded-lg transition-all ${viewMode === 'athletes' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
             >
               <User size={12} /> ATLETAS
             </button>
             <button 
               onClick={() => setViewMode('team')} 
               className={`flex items-center gap-2 px-6 py-2 text-[9px] font-black rounded-lg transition-all ${viewMode === 'team' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
             >
               <Users size={12} /> MÉDIA DA EQUIPE
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-5 border-r border-slate-200 text-left sticky left-0 bg-slate-50 z-10">
                  {viewMode === 'athletes' ? 'NADADOR' : 'EQUIPE GERAL'}
                </th>
                <th className="px-4 py-5 font-black text-slate-800">CARGA {viewMode === 'athletes' ? 'TOTAL' : 'MÉDIA'}</th>
                <th className="px-4 py-5">
                  {modality === 'both' ? 'PSE (P/A)' : modality === 'pool' ? 'PSE PISCINA' : 'PSE ACADEMIA'}
                </th>
                <th className="px-4 py-5">
                  {modality === 'both' ? 'PSR (P/A)' : modality === 'pool' ? 'PSR PISCINA' : 'PSR ACADEMIA'}
                </th>
                <th className="px-4 py-5">FADIGA</th>
                <th className="px-4 py-5">ESTRESSE</th>
                <th className="px-4 py-5">HUMOR</th>
                <th className="px-4 py-5">DOR</th>
                <th className="px-4 py-5">SONO</th>
                <th className="px-6 py-5">URINA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {viewMode === 'athletes' ? (
                uniqueAthletes.map((athlete) => {
                  const m = stats.dayMetrics.find(m => m.athleteId === athlete.id);
                  return (
                    <tr key={athlete.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 border-r border-slate-200 text-left sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 uppercase italic leading-none">{athlete.name}</span>
                           <span className="text-[8px] text-slate-400 uppercase font-mono mt-1">{athlete.groupId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-black text-slate-900 text-[15px]">{m ? (m.sRPE || 0).toFixed(1) : '---'}</td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`px-2 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-[10px] shadow-sm ${getNegativeColor(modality === 'gym' ? m.gymRpe! : m.rpe)}`}>
                            {modality === 'both' 
                              ? `${m.rpe.toFixed(1)} / ${(m.gymRpe || 0).toFixed(1)}`
                              : modality === 'pool' 
                                ? m.rpe.toFixed(1)
                                : (m.gymRpe || 0).toFixed(1)
                            }
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`px-2 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-[10px] shadow-sm ${getPositiveColor(modality === 'gym' ? m.gymPsr! : m.psr)}`}>
                            {modality === 'both' 
                              ? `${m.psr.toFixed(1)} / ${(m.gymPsr || 0).toFixed(1)}`
                              : modality === 'pool' 
                                ? m.psr.toFixed(1)
                                : (m.gymPsr || 0).toFixed(1)
                            }
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor(m.fatigue)}`}>
                            {m.fatigue.toFixed(1)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor(m.stress)}`}>
                            {m.stress.toFixed(1)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getPositiveColor(m.mood)}`}>
                            {m.mood.toFixed(1)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4">
                        {m ? (
                          <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor(m.soreness)}`}>
                            {m.soreness.toFixed(1)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 font-mono font-black text-slate-700">
                        {m ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[15px]">{m.sleepHours.toFixed(1)}h</span>
                            <span className="text-[11px] text-slate-400 font-bold opacity-80">
                              {m.bedtime || '--:--'} às {m.wakeTime || '--:--'}
                            </span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {m ? (
                            <div className="w-5 h-5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: URINE_COLORS[m.urineColor - 1] || '#fff' }} title={`Nível ${m.urineColor}`}></div>
                          ) : '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                stats.teamAverages ? (
                  <tr className="bg-white animate-in fade-in border-t-2 border-primary/20">
                    <td className="px-6 py-10 border-r border-slate-200 text-left sticky left-0 bg-white z-10">
                       <div className="flex items-center gap-3">
                          <Layers size={22} className="text-primary" />
                          <div>
                            <span className="text-[14px] font-black text-slate-800 uppercase italic leading-none block">MÉDIA GERAL DA EQUIPE</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Status do Grupo em {selectedDate}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-10 font-mono font-black text-primary text-2xl italic">{stats.teamAverages.sRPE.toFixed(1)}</td>
                    <td className="px-2 py-10">
                      <div className={`w-32 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-sm shadow-lg ${getNegativeColor(modality === 'gym' ? stats.teamAverages.gymRpe : stats.teamAverages.rpe)}`}>
                        {modality === 'both' 
                          ? `${stats.teamAverages.rpe.toFixed(1)} / ${stats.teamAverages.gymRpe.toFixed(1)}`
                          : modality === 'pool' 
                            ? stats.teamAverages.rpe.toFixed(1)
                            : stats.teamAverages.gymRpe.toFixed(1)
                        }
                      </div>
                    </td>
                    <td className="px-2 py-10">
                      <div className={`w-32 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-sm shadow-lg ${getPositiveColor(modality === 'gym' ? stats.teamAverages.gymPsr : stats.teamAverages.psr)}`}>
                        {modality === 'both' 
                          ? `${stats.teamAverages.psr.toFixed(1)} / ${stats.teamAverages.gymPsr.toFixed(1)}`
                          : modality === 'pool' 
                            ? stats.teamAverages.psr.toFixed(1)
                            : stats.teamAverages.gymPsr.toFixed(1)
                        }
                      </div>
                    </td>
                    <td className="px-2 py-10">
                      <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(stats.teamAverages.fatigue)}`}>
                        {stats.teamAverages.fatigue.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-2 py-10">
                      <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(stats.teamAverages.stress)}`}>
                        {stats.teamAverages.stress.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-2 py-10">
                      <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getPositiveColor(stats.teamAverages.mood)}`}>
                        {stats.teamAverages.mood.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-2 py-10">
                      <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(stats.teamAverages.soreness)}`}>
                        {stats.teamAverages.soreness.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-4 py-10">
                       <span className="text-2xl font-black text-slate-700 italic font-mono">{stats.teamAverages.sleep.toFixed(1)}h</span>
                    </td>
                    <td className="px-6 py-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-xl" style={{ backgroundColor: URINE_COLORS[Math.round(stats.teamAverages.urine) - 1] || '#fff' }}></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Nível {stats.teamAverages.urine.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-slate-400 italic text-sm">
                      Nenhum dado reportado no dia {selectedDate} para calcular médias.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-900/50 flex justify-center border-t border-slate-800">
          <p className="text-[8px] text-slate-600 font-bold uppercase italic tracking-widest flex items-center gap-2">
            <LayoutGrid size={10} /> Sincronização de Telemetria v.8.5.0
          </p>
        </div>
      </div>

      {/* FEEDBACKS DO DIA */}
      {viewMode === 'athletes' && stats.dayMetrics.filter(m => m.notes).length > 0 && (
        <div className="animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 mb-4 px-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm"><MessageSquare size={18} /></div>
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Feedbacks e Observações</h3>
            <div className="h-px bg-white/5 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.dayMetrics.filter(m => m.notes).map((m, idx) => {
              const athlete = uniqueAthletes.find(a => a.id === m.athleteId);
              return (
                <div key={`${m.athleteId}_${idx}`} className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-all shadow-xl">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                    <span className="text-[11px] font-black text-white uppercase italic">{athlete?.name || 'Atleta'}</span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold tracking-tighter uppercase">{athlete?.groupId}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed">
                    "{m.notes}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachArea;
