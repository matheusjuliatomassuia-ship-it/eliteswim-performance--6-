
import React, { useState, useMemo } from 'react';
import { BodyComposition, DailyMetric, PlannedSession, AthleteProfile, Group } from '../types';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Bar, Line } from 'recharts';
import { Activity, BarChart2, TrendingUp, Moon, Zap, Brain, Smile, Droplets, Flame, ShieldAlert, Filter, User, Calendar, Table as TableIcon, ClipboardCheck, HeartPulse, Users, LayoutGrid, Layers, ChevronDown, Battery, Maximize2, X, BarChart3, MessageSquare } from 'lucide-react';
import { URINE_COLORS } from '../constants';

interface MonitoringProps {
  data: BodyComposition[];
  metrics: DailyMetric[];
  plannedSessions: PlannedSession[];
  onUpdate: (data: BodyComposition[]) => void;
  userRole?: string;
  athletes?: AthleteProfile[];
  groups?: Group[];
}

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 14 dias', value: 14 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 60 dias', value: 60 },
  { label: 'Últimos 90 dias', value: 90 },
  { label: 'Últimos 6 meses', value: 180 },
  { label: 'Último 1 ano', value: 365 },
  { label: 'Últimos 2 anos', value: 730 },
  { label: 'Todo o Histórico', value: 9999 },
];

const MONTH_OPTIONS = [
  { label: 'Todos os Meses', value: 'all' },
  { label: 'Janeiro', value: 0 },
  { label: 'Fevereiro', value: 1 },
  { label: 'Março', value: 2 },
  { label: 'Abril', value: 3 },
  { label: 'Maio', value: 4 },
  { label: 'Junho', value: 5 },
  { label: 'Julho', value: 6 },
  { label: 'Agosto', value: 7 },
  { label: 'Setembro', value: 8 },
  { label: 'Outubro', value: 9 },
  { label: 'Novembro', value: 10 },
  { label: 'Dezembro', value: 11 },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const Monitoring: React.FC<MonitoringProps> = ({ metrics, plannedSessions = [], userRole = 'Athlete', athletes = [], groups = [] }) => {
  const [viewMode, setViewMode] = useState<'group' | 'individual'>(userRole === 'Coach' ? 'group' : 'individual');
  const [modality, setModality] = useState<'both' | 'pool' | 'gym'>('both');
  const [tableType, setTableType] = useState<'athletes' | 'team'>('athletes');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || ''); 
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [period, setPeriod] = useState<number>(14);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isChartMaximized, setIsChartMaximized] = useState(false);

  const formatDate = (dateStr: string) => dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7);
  
  // Garantir unicidade dos atletas para evitar erros de chave duplicada
  const uniqueAthletes = useMemo(() => {
    return Array.from(new Map(athletes.map(a => [a.id, a])).values());
  }, [athletes]);

  const dates = useMemo(() => {
    const dList = [];
    
    if (selectedMonth === 'all') {
      const today = new Date();
      const effectivePeriod = period === 9999 ? 365 * 3 : period; 
      for (let i = effectivePeriod - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i);
        dList.push(d.toISOString().split('T')[0]);
      }
    } else {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(selectedYear, selectedMonth, i);
        dList.push(d.toISOString().split('T')[0]);
      }
    }
    return dList;
  }, [period, selectedMonth, selectedYear]);

  const athletesInGroup = useMemo(() => 
    uniqueAthletes.filter(a => a.groupId === selectedGroupId)
  , [selectedGroupId, uniqueAthletes]);

  const athletesToFilter = useMemo(() => 
    viewMode === 'group' 
      ? athletesInGroup.map(a => a.id)
      : [selectedAthleteId]
  , [viewMode, athletesInGroup, selectedAthleteId]);

  const chartData = useMemo(() => {
    return dates.map(date => {
      let dayMetrics = metrics.filter(m => m.date === date && athletesToFilter.includes(m.athleteId || ''));
      const dayPlans = plannedSessions.filter(p => p.date === date && athletesToFilter.includes(p.athleteId));

      if (viewMode === 'individual') {
        const latest = dayMetrics[dayMetrics.length - 1];
        dayMetrics = latest ? [latest] : [];
      }

      const realized = dayMetrics.length > 0 
        ? dayMetrics.reduce((acc, m) => acc + (m.sRPE || 0), 0) / (viewMode === 'group' ? (dayMetrics.length || 1) : 1)
        : 0;

      const planned = dayPlans.length > 0
        ? dayPlans.reduce((acc, p) => acc + (p.volume * p.intensity), 0) / (viewMode === 'group' ? (athletesToFilter.length || 1) : 1)
        : 0;

      const psr = dayMetrics.length > 0 
        ? dayMetrics.reduce((acc, m) => acc + (m.psr || 0), 0) / (dayMetrics.length || 1) 
        : 0;

      const rpe = dayMetrics.length > 0 
        ? dayMetrics.reduce((acc, m) => acc + (m.rpe || 0), 0) / (dayMetrics.length || 1) 
        : 0;
        
      const psrGym = dayMetrics.length > 0 
        ? dayMetrics.reduce((acc, m) => acc + (m.gymPsr || 0), 0) / (dayMetrics.length || 1) 
        : 0;

      const rpeGym = dayMetrics.length > 0 
        ? dayMetrics.reduce((acc, m) => acc + (m.gymRpe || 0), 0) / (dayMetrics.length || 1) 
        : 0;

      return {
        formattedDate: formatDate(date),
        realized: Number(realized.toFixed(2)),
        planned: Number(planned.toFixed(2)),
        psr: Number(psr.toFixed(2)),
        rpe: Number(rpe.toFixed(2)),
        psrGym: Number(psrGym.toFixed(2)),
        rpeGym: Number(rpeGym.toFixed(2))
      };
    }).filter(d => (selectedMonth === 'all' && period === 9999) ? (d.realized > 0 || d.planned > 0) : true);
  }, [dates, metrics, plannedSessions, viewMode, athletesToFilter, period, selectedMonth]);

  const individualAverages = useMemo(() => {
    return athletesInGroup.map(athlete => {
      let filteredMetrics = metrics.filter(m => dates.includes(m.date) && m.athleteId === athlete.id);
      if (filteredMetrics.length === 0) return { ...athlete, hasData: false };

      const latestMetricsByDate: Record<string, DailyMetric> = {};
      filteredMetrics.forEach(m => {
        latestMetricsByDate[m.date] = m;
      });
      const uniqueMetrics = Object.values(latestMetricsByDate).sort((a,b) => a.date.localeCompare(b.date));

      const sum = (key: keyof DailyMetric) => uniqueMetrics.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);
      const count = uniqueMetrics.length;

      return {
        ...athlete,
        hasData: true,
        rpe: sum('rpe') / count,
        psr: sum('psr') / count,
        gymRpe: (sum as any)('gymRpe') / count,
        gymPsr: (sum as any)('gymPsr') / count,
        fatigue: sum('fatigue') / count,
        stress: sum('stress') / count,
        mood: sum('mood') / count,
        soreness: sum('soreness') / count,
        sleep: sum('sleepHours') / count,
        urine: sum('urineColor') / count,
        totalLoad: sum('sRPE') / count,
        bedtime: uniqueMetrics[uniqueMetrics.length - 1].bedtime,
        wakeTime: uniqueMetrics[uniqueMetrics.length - 1].wakeTime
      };
    });
  }, [athletesInGroup, metrics, dates]);

  const teamAverage = useMemo(() => {
    const dataPoints = individualAverages.filter(a => (a as any).hasData);
    if (dataPoints.length === 0) return null;
    const count = dataPoints.length;
    const sum = (key: string) => dataPoints.reduce((acc, a) => acc + (a as any)[key], 0);

    return {
      rpe: sum('rpe') / count,
      psr: sum('psr') / count,
      gymRpe: sum('gymRpe') / count,
      gymPsr: sum('gymPsr') / count,
      fatigue: sum('fatigue') / count,
      stress: sum('stress') / count,
      mood: sum('mood') / count,
      soreness: sum('soreness') / count,
      sleep: sum('sleep') / count,
      urine: sum('urine') / count,
      totalLoad: sum('totalLoad') / count
    };
  }, [individualAverages]);

  const biomedicalAverages = useMemo(() => {
    const filteredMetrics = metrics.filter(m => dates.includes(m.date) && athletesToFilter.includes(m.athleteId || ''));
    if (filteredMetrics.length === 0) return null;

    const latestMetrics: Record<string, DailyMetric> = {};
    filteredMetrics.forEach(m => {
      latestMetrics[`${m.date}_${m.athleteId}`] = m;
    });
    const uniqueMetrics = Object.values(latestMetrics);

    const sum = (key: keyof DailyMetric) => uniqueMetrics.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);
    const count = uniqueMetrics.length;

    return {
      readiness: (sum as any)('readinessScore') / count,
      sleep: sum('sleepHours') / count,
      sleepQuality: (sum as any)('sleepQuality') / count,
      fatigue: sum('fatigue') / count,
      stress: sum('stress') / count,
      mood: sum('mood') / count,
      soreness: sum('soreness') / count,
      urine: sum('urineColor') / count,
      rpe: sum('rpe') / count,
      psr: sum('psr') / count,
      gymRpe: (sum as any)('gymRpe') / count,
      gymPsr: (sum as any)('gymPsr') / count,
    };
  }, [metrics, dates, athletesToFilter]);

  const getPositiveColor = (v: number) => { 
    if (v <= 4) return 'bg-red-500 text-white'; 
    if (v <= 6) return 'bg-yellow-400 text-slate-800'; 
    return 'bg-emerald-500 text-white'; 
  };
  
  const getNegativeColor = (v: number) => { 
    if (v <= 3) return 'bg-emerald-500 text-white'; 
    if (v <= 6) return 'bg-yellow-400 text-slate-800'; 
    return 'bg-red-500 text-white'; 
  };

  const BioStatusCard = ({ icon: Icon, label, value, color, max = 10, unit = "" }: any) => (
    <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl group hover:border-primary/40 transition-all shadow-xl backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl bg-white/5 ${color} shadow-inner`}><Icon size={20} /></div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase italic block tracking-tighter">Média do Período</span>
          <span className="text-xl font-black text-white italic font-mono leading-none">{value.toFixed(1)}{unit}</span>
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} 
          style={{ width: `${(value / max) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      {/* FILTER HUD */}
      <div className="bg-surface border border-white/5 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/20 shadow-inner"><BarChart2 size={24}/></div>
           <div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Cockpit de Monitoramento</h2>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-1">Meta vs Realidade Biológica</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto relative z-10">
           <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shadow-inner">
              <button onClick={() => setViewMode('individual')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${viewMode === 'individual' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>INDIVIDUAL</button>
              <button onClick={() => setViewMode('group')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${viewMode === 'group' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>EQUIPE</button>
           </div>
           
           <div className="flex items-center gap-2 bg-white/5 p-1 px-3 rounded-xl border border-white/5">
              <Filter size={14} className="text-slate-500" />
              {viewMode === 'group' ? (
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-white outline-none min-w-[120px] cursor-pointer">
                  {groups.map(g => <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>)}
                </select>
              ) : (
                <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-white outline-none min-w-[120px] cursor-pointer">
                  {uniqueAthletes.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>)}
                </select>
              )}
            </div>

           <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shadow-inner">
              <button onClick={() => setModality('both')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'both' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>AMBOS</button>
              <button onClick={() => setModality('pool')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'pool' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>PISCINA</button>
              <button onClick={() => setModality('gym')} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${modality === 'gym' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>ACADEMIA</button>
           </div>

           <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <select 
                  value={period} 
                  disabled={selectedMonth !== 'all'}
                  onChange={(e) => setPeriod(Number(e.target.value))} 
                  className={`p-2 px-4 bg-slate-900 border rounded-xl text-[10px] font-black uppercase outline-none italic shadow-lg transition-all cursor-pointer ${selectedMonth === 'all' ? 'border-primary/40 text-primary' : 'border-white/5 text-slate-700 opacity-50'}`}
                >
                  {PERIOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>)}
                </select>
              </div>

              <div className="relative">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className={`p-2 px-4 bg-slate-900 border rounded-xl text-[10px] font-black uppercase outline-none italic shadow-lg transition-all cursor-pointer ${selectedMonth !== 'all' ? 'border-accent/40 text-accent' : 'border-white/5 text-slate-500'}`}
                >
                  {MONTH_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>)}
                </select>
              </div>

              <div className="relative">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="p-2 px-4 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 outline-none italic shadow-lg cursor-pointer"
                >
                  {YEAR_OPTIONS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                </select>
              </div>
           </div>
        </div>
      </div>

      {/* MAIN LOAD CHART */}
      <div className="hud-card border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-4 right-4 z-10 lg:hidden text-black font-black">
          <button 
            onClick={() => setIsChartMaximized(true)}
            className="p-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-primary hover:bg-white/10 transition-all shadow-xl active:scale-95"
            title="Ampliar Gráfico"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center italic">
            <Activity className="mr-2 text-primary" size={18} /> 
            Análise de Carga: {selectedMonth === 'all' ? (period === 9999 ? 'Todo o Histórico' : `${period} dias`) : `${MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
          </h3>
          <div className="flex flex-wrap gap-4">
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-400/50"></div><span className="text-[8px] font-black text-sky-400 uppercase italic">META PLANEJADA</span></div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Campo (Realizada)</span></div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Recuperação (PSR)</span></div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Esforço (PSE)</span></div>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#475569" 
                tick={{fontSize: 10}} 
                fontStyle="italic"
                interval={dates.length > 31 ? (dates.length > 365 ? 90 : 30) : (dates.length > 14 ? 2 : 0)} 
              />
              <YAxis yAxisId="left" stroke="#475569" tick={{fontSize: 10}} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#f43f5e" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                labelStyle={{ fontWeight: 'black', color: '#f1f5f9', marginBottom: '8px', textTransform: 'uppercase' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', fontStyle: 'italic', paddingBottom: '20px' }} />
              <Bar yAxisId="left" dataKey="planned" name="META PLANEJADA" fill="#38bdf8" fillOpacity={0.3} radius={[4, 4, 0, 0]} barSize={dates.length > 60 ? 2 : 24} />
              <Bar yAxisId="left" dataKey="realized" name="CARGA REALIZADA" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={dates.length > 60 ? 2 : 24} />
              
              {(modality === 'both' || modality === 'pool') && (
                <>
                  <Bar yAxisId="right" dataKey="psr" name="RECUPERAÇÃO PISC. (PSR)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={dates.length > 31 ? 2 : 12} />
                  <Bar yAxisId="right" dataKey="rpe" name="ESFORÇO PISC. (PSE)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={dates.length > 31 ? 2 : 12} />
                </>
              )}
              
              {(modality === 'both' || modality === 'gym') && (
                <>
                  <Bar yAxisId="right" dataKey="psrGym" name="RECUPERAÇÃO ACAD. (PSR)" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={dates.length > 31 ? 2 : 12} />
                  <Bar yAxisId="right" dataKey="rpeGym" name="ESFORÇO ACAD. (PSE)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={dates.length > 31 ? 2 : 12} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL DE AMPLIFICAÇÃO DO GRÁFICO DE CARGA */}
      {isChartMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full h-full p-4 md:p-12 flex flex-col gap-6">
              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                       <BarChart3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Análise de Carga</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Telemetria de Supercompensação</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsChartMaximized(false)}
                   className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-2xl text-white hover:bg-danger hover:text-white transition-all shadow-lg active:scale-95"
                 >
                   <X size={32} />
                 </button>
              </div>

              <div className="flex-1 bg-surface border border-white/10 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(14,165,233,0.1)] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.2),transparent_70%)]"></div>
                 </div>
                 <div className="w-full h-full max-h-[80vh]">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={chartData} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                         <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
                         <XAxis 
                           dataKey="formattedDate" 
                           stroke="#64748b" 
                           tick={{fontSize: 11, fontStyle: 'italic'}} 
                           dy={10}
                         />
                         <YAxis yAxisId="left" stroke="#475569" tick={{fontSize: 11}} />
                         <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#f43f5e" tick={{fontSize: 11}} />
                         <Tooltip 
                           contentStyle={{ 
                             backgroundColor: '#0f172a', 
                             border: '1px solid rgba(14,165,233,0.3)', 
                             borderRadius: '20px',
                             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                             padding: '16px'
                           }} 
                           labelStyle={{ color: '#0ea5e9', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', fontStyle: 'italic' }}
                         />
                         <Legend verticalAlign="top" height={60} iconSize={12} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '900', fontStyle: 'italic', paddingBottom: '30px' }} />
                         
                         <Bar yAxisId="left" dataKey="planned" name="META" fill="#38bdf8" fillOpacity={0.4} radius={[6, 6, 0, 0]} />
                         <Bar yAxisId="left" dataKey="realized" name="REALIZADO" fill="#f1f5f9" radius={[6, 6, 0, 0]} />
                         
                         {(modality === 'both' || modality === 'pool') && (
                           <>
                             <Bar yAxisId="right" dataKey="psr" name="PSR PISCINA" fill="#10b981" radius={[4, 4, 0, 0]} />
                             <Bar yAxisId="right" dataKey="rpe" name="PSE PISCINA" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                           </>
                         )}
                         
                         {(modality === 'both' || modality === 'gym') && (
                           <>
                             <Bar yAxisId="right" dataKey="psrGym" name="PSR ACAD." fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                             <Bar yAxisId="right" dataKey="rpeGym" name="PSE ACAD." fill="#f59e0b" radius={[4, 4, 0, 0]} />
                           </>
                         )}
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Status Consolidado</p>
                 <div className="flex justify-center gap-12">
                    <div className="text-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase block">Prontidão</span>
                       <span className="text-2xl font-black text-success italic font-mono">{biomedicalAverages?.readiness.toFixed(0)}%</span>
                    </div>
                    <div className="text-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase block">Sono</span>
                       <span className="text-2xl font-black text-white italic font-mono">{biomedicalAverages?.sleep.toFixed(1)}h</span>
                    </div>
                    <div className="text-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase block">Estresse</span>
                       <span className="text-2xl font-black text-amber-500 italic font-mono">{biomedicalAverages?.stress.toFixed(1)}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* BIOMEDICAL STATUS GRID */}
      <div className="space-y-6">
         <div className="flex items-center gap-4 px-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShieldAlert size={18} /></div>
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Status Biomédico Consolidado</h3>
            <div className="h-px bg-white/5 flex-1"></div>
            {biomedicalAverages && (
               <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-primary/20">
                  <span className="text-[10px] font-black text-slate-500 uppercase italic mr-2">Prontidão Média:</span>
                  <span className={`text-sm font-black italic font-mono ${biomedicalAverages.readiness > 80 ? 'text-success' : 'text-primary'}`}>{biomedicalAverages.readiness.toFixed(0)}%</span>
               </div>
            )}
         </div>

         {biomedicalAverages ? (
           <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
               <BioStatusCard icon={Moon} label="Média de Sono" value={biomedicalAverages.sleep} color="text-indigo-400" max={12} unit="h" />
               <BioStatusCard icon={Zap} label="Índice de Fadiga" value={biomedicalAverages.fatigue} color="text-rose-400" />
               <BioStatusCard icon={Brain} label="Carga de Estresse" value={biomedicalAverages.stress} color="text-amber-400" />
               <BioStatusCard icon={Smile} label="Estado de Humor" value={biomedicalAverages.mood} color="text-emerald-400" />
               <BioStatusCard icon={Flame} label="Dor Muscular" value={biomedicalAverages.soreness} color="text-red-500" />
               <BioStatusCard icon={Activity} label="Qualidade Sono" value={biomedicalAverages.sleepQuality} color="text-sky-400" />
               <BioStatusCard icon={Zap} label="PSE Médio (P/A)" value={(biomedicalAverages.rpe + (biomedicalAverages as any).gymRpe) / 2} color="text-rose-500" />
               <BioStatusCard icon={Battery} label="PSR Médio (P/A)" value={(biomedicalAverages.psr + (biomedicalAverages as any).gymPsr) / 2} color="text-emerald-500" />
               
               <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl flex flex-col justify-between shadow-xl backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                     <div className="p-2.5 rounded-xl bg-white/5 text-yellow-400 shadow-inner"><Droplets size={20} /></div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-500 uppercase italic block tracking-tighter">Hidratação</span>
                        <div className="w-6 h-6 rounded-full border-2 border-white/20 mt-1 ml-auto shadow-lg" style={{ backgroundColor: URINE_COLORS[Math.round(biomedicalAverages.urine) - 1] || '#fff' }}></div>
                     </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Cor da Urina Média</p>
                  <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 italic">Tabela de Armstrong</span>
               </div>

               <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-xl">
                  <TrendingUp size={28} className="text-primary mb-3" />
                  <p className="text-[10px] font-black text-white uppercase italic tracking-widest">Tendência do Ciclo</p>
                  <span className="text-xs font-bold text-primary uppercase mt-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">Análise de Adaptabilidade</span>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 mt-8">
              <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HeartPulse className="text-primary" size={24} />
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">TELEMETRIA CONSOLIDADA</h3>
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 shadow-inner">
                  <button 
                    onClick={() => setTableType('athletes')} 
                    className={`flex items-center gap-2 px-6 py-2 text-[9px] font-black rounded-lg transition-all ${tableType === 'athletes' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    <User size={12} /> ATLETAS
                  </button>
                  <button 
                    onClick={() => setTableType('team')} 
                    className={`flex items-center gap-2 px-6 py-2 text-[9px] font-black rounded-lg transition-all ${tableType === 'team' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
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
                        {tableType === 'athletes' ? 'NADADOR' : 'GRUPO ANALISADO'}
                      </th>
                      <th className="px-4 py-5 font-black text-slate-800">CARGA {tableType === 'athletes' ? 'TOTAL' : 'MÉDIA'}</th>
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
                    {tableType === 'athletes' ? (
                       individualAverages.map((athlete, idx) => {
                        return (
                          <tr key={`${athlete.id}_${idx}`} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 border-r border-slate-200 text-left sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800 uppercase italic leading-none">{athlete.name}</span>
                                <span className="text-[8px] text-slate-400 uppercase font-mono mt-1">{athlete.groupId}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono font-black text-slate-900 text-[15px]">
                               {(athlete as any).hasData ? (athlete as any).totalLoad.toFixed(1) : '---'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`px-2 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-[10px] shadow-sm ${getNegativeColor(modality === 'gym' ? (athlete as any).gymRpe : (athlete as any).rpe)}`}>
                                  {modality === 'both' 
                                    ? `${(athlete as any).rpe.toFixed(1)} / ${(athlete as any).gymRpe.toFixed(1)}`
                                    : modality === 'pool' 
                                      ? (athlete as any).rpe.toFixed(1)
                                      : (athlete as any).gymRpe.toFixed(1)
                                  }
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`px-2 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-[10px] shadow-sm ${getPositiveColor(modality === 'gym' ? (athlete as any).gymPsr : (athlete as any).psr)}`}>
                                  {modality === 'both' 
                                    ? `${(athlete as any).psr.toFixed(1)} / ${(athlete as any).gymPsr.toFixed(1)}`
                                    : modality === 'pool' 
                                      ? (athlete as any).psr.toFixed(1)
                                      : (athlete as any).gymPsr.toFixed(1)
                                  }
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor((athlete as any).fatigue)}`}>
                                  {(athlete as any).fatigue.toFixed(1)}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor((athlete as any).stress)}`}>
                                  {(athlete as any).stress.toFixed(1)}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getPositiveColor((athlete as any).mood)}`}>
                                  {(athlete as any).mood.toFixed(1)}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-4">
                              {(athlete as any).hasData ? (
                                <div className={`w-10 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-xs shadow-sm ${getNegativeColor((athlete as any).soreness)}`}>
                                  {(athlete as any).soreness.toFixed(1)}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-4 font-mono font-black text-slate-700">
                               {(athlete as any).hasData ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-[15px]">{(athlete as any).sleep.toFixed(1)}h</span>
                                  <span className="text-[11px] text-slate-400 font-bold opacity-80">
                                    {(athlete as any).bedtime || '--:--'} às {(athlete as any).wakeTime || '--:--'}
                                  </span>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {(athlete as any).hasData ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-5 h-5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: URINE_COLORS[Math.round((athlete as any).urine) - 1] || '#fff' }}></div>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      teamAverage ? (
                        <tr className="bg-white animate-in fade-in border-t-2 border-primary/20">
                          <td className="px-6 py-10 border-r border-slate-200 text-left sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                              <Layers size={22} className="text-primary" />
                              <div>
                                <span className="text-[14px] font-black text-slate-800 uppercase italic leading-none block">MÉDIA GERAL DA EQUIPE</span>
                                <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Status de Supercompensação</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-10 font-mono font-black text-primary text-2xl">
                            {teamAverage.totalLoad.toFixed(1)}
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-32 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-sm shadow-lg ${getNegativeColor(modality === 'gym' ? teamAverage.gymRpe : teamAverage.rpe)}`}>
                              {modality === 'both' 
                                ? `${teamAverage.rpe.toFixed(1)} / ${teamAverage.gymRpe.toFixed(1)}`
                                : modality === 'pool' 
                                  ? teamAverage.rpe.toFixed(1)
                                  : teamAverage.gymRpe.toFixed(1)
                              }
                            </div>
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-32 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-sm shadow-lg ${getPositiveColor(modality === 'gym' ? teamAverage.gymPsr : teamAverage.psr)}`}>
                              {modality === 'both' 
                                ? `${teamAverage.psr.toFixed(1)} / ${teamAverage.gymPsr.toFixed(1)}`
                                : modality === 'pool' 
                                  ? teamAverage.psr.toFixed(1)
                                  : teamAverage.gymPsr.toFixed(1)
                              }
                            </div>
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(teamAverage.fatigue)}`}>
                              {teamAverage.fatigue.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(teamAverage.stress)}`}>
                              {teamAverage.stress.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getPositiveColor(teamAverage.mood)}`}>
                              {teamAverage.mood.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-2 py-10">
                            <div className={`w-14 h-12 mx-auto flex items-center justify-center rounded-xl font-black text-lg shadow-lg ${getNegativeColor(teamAverage.soreness)}`}>
                              {teamAverage.soreness.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-4 py-10">
                            <span className="text-2xl font-black text-slate-700 italic font-mono">{teamAverage.sleep.toFixed(1)}h</span>
                          </td>
                          <td className="px-6 py-10">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-xl" style={{ backgroundColor: URINE_COLORS[Math.round(teamAverage.urine) - 1] || '#fff' }}></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase">Nível {teamAverage.urine.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-20 text-slate-400 italic">Consolidando telemetria técnica...</td>
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

            {/* FEEDBACKS DO PERÍODO */}
            {tableType === 'athletes' && individualAverages.filter(a => (a as any).hasData).some(a => metrics.some(m => m.athleteId === a.id && dates.includes(m.date) && m.notes)) && (
              <div className="mt-8 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-4 px-1">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm"><MessageSquare size={18} /></div>
                  <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Feedbacks e Observações do Período</h3>
                  <div className="h-px bg-white/5 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {individualAverages.filter(a => (a as any).hasData).flatMap((athlete, aIdx) => {
                    const athleteNotes = metrics.filter(m => m.athleteId === athlete.id && dates.includes(m.date) && m.notes);
                    return athleteNotes.map((m, mIdx) => (
                      <div key={`${m.athleteId}_${m.date}_${aIdx}_${mIdx}`} className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-all shadow-xl">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white uppercase italic">{athlete.name}</span>
                            <span className="text-[8px] font-mono text-slate-500">{m.date}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 font-bold tracking-tighter uppercase">{athlete.groupId}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed">
                          "{m.notes}"
                        </p>
                      </div>
                    ));
                  })}
                </div>
              </div>
            )}
           </>
         ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20 bg-white/5">
               <Activity size={48} className="mx-auto mb-4 text-slate-500"/>
               <p className="font-black uppercase italic text-xs tracking-widest text-slate-500">Aguardando preenchimento dos diários para consolidar métricas.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Monitoring;
