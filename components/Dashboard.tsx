
import React, { useEffect, useState, useMemo } from 'react';
import { DailyMetric, AthleteProfile, Group, Competition } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Battery, Moon, TrendingUp, Shield, Medal, Target, Zap, Clock } from 'lucide-react';
import { getCoachingInsight } from '../services/geminiService';
import { MOCK_TIMES } from '../constants';

interface DashboardProps {
  metrics: DailyMetric[];
  userRole?: string;
  athletes?: AthleteProfile[];
  groups?: Group[];
  competitions?: Competition[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, userRole, athletes = [], groups = [], competitions = [] }) => {
  const [insight, setInsight] = useState<string>("Iniciando processamento técnico via IA...");
  const isCoach = userRole === 'Coach';
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const countdowns = useMemo(() => {
    const getNextComp = (priority: 'A' | 'B' | 'C') => competitions.filter(c => c.priority === priority && new Date(c.endDate) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    const calculateDays = (dateStr: string) => { const target = new Date(dateStr); target.setHours(0, 0, 0, 0); return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); };
    const nextA = getNextComp('A'); const nextB = getNextComp('B'); const nextC = getNextComp('C');
    return {
      A: nextA ? { days: calculateDays(nextA.date), name: nextA.name, active: new Date(nextA.date) <= today && new Date(nextA.endDate) >= today } : null,
      B: nextB ? { days: calculateDays(nextB.date), name: nextB.name, active: new Date(nextB.date) <= today && new Date(nextB.endDate) >= today } : null,
      C: nextC ? { days: calculateDays(nextC.date), name: nextC.name, active: new Date(nextC.date) <= today && new Date(nextC.endDate) >= today } : null,
    };
  }, [competitions]);

  const KPICard = ({ label, val, sub, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`hud-card p-6 rounded-xl border ${borderClass || 'border-white/5'} shadow-2xl relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={48} className="text-white" /></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4"><div className={`p-1.5 rounded bg-white/5 ${colorClass}`}><Icon size={16} className="text-white" /></div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest break-words">{label}</p></div>
        <h3 className="text-4xl font-black text-white italic tracking-tighter neon-text break-words">{val}</h3>
        {sub && <p className="text-[10px] text-primary font-mono mt-3 uppercase tracking-wider break-words">{sub}</p>}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );

  useEffect(() => { if (!isCoach) getCoachingInsight(metrics, MOCK_TIMES).then(setInsight); }, [metrics, isCoach]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['A', 'B', 'C'].map(prio => {
          const item = (countdowns as any)[prio];
          const color = prio === 'A' ? 'border-l-danger' : prio === 'B' ? 'border-l-amber-500' : 'border-l-primary';
          return (
            <div key={prio} className={`hud-card p-5 rounded-2xl border-l-4 ${item?.active ? 'border-l-success animate-pulse' : color} bg-slate-900/40 relative overflow-hidden group`}>
               <div className="flex justify-between items-start mb-4"><div className={`p-2 rounded-lg border ${item?.active ? 'bg-success/10 text-success border-success/20' : 'bg-white/5 text-white border-white/10'}`}>{prio === 'A' ? <Medal size={20}/> : <Target size={20}/>}</div><span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-white/5">{item?.active ? 'MISSÃO EM CURSO' : `ALVO (${prio})`}</span></div>
               {item ? ( <> <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic truncate">{item.name}</p><div className="flex items-baseline gap-2"><span className={`text-4xl font-black italic neon-text ${item.active ? 'text-success' : 'text-white'}`}>{item.active ? 'PISCINA' : item.days}</span>{!item.active && <span className="text-xs font-black text-slate-400 uppercase italic">DIAS</span>}</div> </> ) : ( <p className="text-xs text-slate-600 font-bold uppercase italic py-4">Sem alvos ativos</p> )}
            </div>
          );
        })}
      </div>

      {isCoach ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KPICard label="Atletas Monitorados" val={athletes.length} icon={TrendingUp} colorClass="text-primary" sub="Elite sob Gestão" borderClass="border-primary/20" />
            <KPICard label="Alertas de Risco" val="0" icon={Shield} colorClass="text-success" sub="Estável" borderClass="border-success/20" />
          </div>
          <div className="hud-card p-6 rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center"><Zap size={14} className="mr-2 text-primary" /> Status da Equipe em Tempo Real</h3>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Dados Recentes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-4 px-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Atleta</th>
                    <th className="py-4 px-4 text-slate-500 font-black uppercase text-[10px] tracking-widest text-center">Prontidão</th>
                    <th className="py-4 px-4 text-slate-500 font-black uppercase text-[10px] tracking-widest text-center whitespace-nowrap">PSE (P/A)</th>
                    <th className="py-4 px-4 text-slate-500 font-black uppercase text-[10px] tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {athletes.map(a => {
                    const latestMetric = [...metrics]
                      .filter(m => m.athleteId === a.id)
                      .sort((m1, m2) => new Date(m2.date).getTime() - new Date(m1.date).getTime())[0];
                    
                    const score = latestMetric?.readinessScore || 0;
                    const rpe = latestMetric?.rpe || 0;
                    const gymRpe = latestMetric?.gymRpe || 0;

                    return (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 px-4 font-black text-slate-300 italic uppercase tracking-tighter break-words">{a.name}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${score >= 80 ? 'bg-success' : score >= 60 ? 'bg-yellow-400' : 'bg-danger'}`} 
                                style={{width: `${latestMetric ? score : 0}%`}}
                              ></div>
                            </div>
                            <span className={`font-mono font-bold text-xs ${score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-400' : 'text-danger'}`}>
                              {latestMetric ? `${score}%` : '---'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono text-[10px] font-black italic text-slate-400">
                            {latestMetric ? `${rpe} / ${gymRpe}` : '---'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                            !latestMetric ? 'bg-slate-800 text-slate-500 border-white/5' :
                            score >= 60 ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                          }`}>
                            {!latestMetric ? 'Sem Dados' : score >= 60 ? 'Apto' : 'Cuidado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="hud-card p-8 rounded-2xl border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center"><TrendingUp size={14} className="mr-2" /> Parecer Técnico da IA</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium italic break-words">{insight}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
