
import React, { useState } from 'react';
import { PlannedSession, DailyMetric, Group } from '../types';
import { Calendar, Trash2, Copy, Save, ChevronLeft, ChevronRight, User, Plus, Users, ArrowRightLeft, AlertCircle, BarChart3, CheckCircle2, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { MOCK_GROUPS, MOCK_ATHLETE_PROFILES } from '../constants';

interface PlanningProps {
  plans: PlannedSession[];
  metrics: DailyMetric[];
  onUpdatePlans: (plans: PlannedSession[]) => void;
  userRole?: string;
  onNavigate?: (tab: string) => void;
}

const Planning: React.FC<PlanningProps> = ({ plans, metrics, onUpdatePlans, userRole, onNavigate }) => {
  const [planningMode, setPlanningMode] = useState<'collective' | 'individual'>('collective');
  const athletes = MOCK_ATHLETE_PROFILES;
  const groups = MOCK_GROUPS;
  
  const [selectedAthleteId, setSelectedAthleteId] = useState('1');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(groups.map(g => g.id));
  const [isSyncing, setIsSyncing] = useState(false);

  const getLocalToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(getLocalToday()));

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const toISODate = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const date = new Date(d.getTime() - (offset * 60 * 1000));
    return date.toISOString().split('T')[0];
  };

  const weekDays = (() => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  })();

  const startStr = weekDays[0].toLocaleDateString('pt-BR');
  const endStr = weekDays[6].toLocaleDateString('pt-BR');
  const weekStartStr = toISODate(currentWeekStart);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = toISODate(weekEnd);

  const targetId = planningMode === 'collective' ? 'master' : selectedAthleteId;

  const currentPlans = plans.filter(p => {
    const pDate = p.date;
    const inWeek = pDate >= weekStartStr && pDate < weekEndStr;
    return p.athleteId === targetId && inWeek;
  });

  const allDistributedPlans = plans.filter(p => {
    const pDate = p.date;
    const inWeek = pDate >= weekStartStr && pDate < weekEndStr;
    return p.athleteId !== 'master' && inWeek;
  });

  const totalDistributedLoad = allDistributedPlans.reduce((acc, curr) => acc + ((curr.volume || 0) * (curr.intensity || 0)), 0);
  const averageTeamLoad = athletes.length > 0 ? (totalDistributedLoad / athletes.length) : 0;
  
  // Cálculo da Carga Base (A.U.) consolidada
  const currentLoadAU = currentPlans.reduce((acc, curr) => acc + ((curr.volume || 0) * (curr.intensity || 0)), 0);

  const handleUpdateSession = (planId: string, field: keyof PlannedSession, value: any) => {
    onUpdatePlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleAddSession = (dateStr: string) => {
    const newPlan: PlannedSession = {
      id: Date.now().toString() + Math.random().toString().slice(2),
      athleteId: targetId,
      date: dateStr,
      type: 'Natação',
      category: 'Ordinário',
      volume: 60,
      intensity: 5,
      description: ''
    };
    onUpdatePlans([...plans, newPlan]);
  };

  const handleDuplicateSession = (plan: PlannedSession, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onUpdatePlans([...plans, { ...plan, id: Date.now().toString() + Math.random().toString().slice(2) }]);
  };

  const handleRemoveSession = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onUpdatePlans(plans.filter(p => p.id !== id));
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveAction = () => {
    setIsSyncing(true);
    
    // Simula um delay de processamento para feedback visual
    setTimeout(() => {
      if (planningMode === 'collective') {
        if (selectedGroupIds.length === 0) {
          alert("Selecione ao menos uma categoria para aplicar o planejamento.");
          setIsSyncing(false);
          return;
        }
        
        const affectedAthletes = athletes.filter(a => selectedGroupIds.includes(a.groupId));
        
        const otherPlans = plans.filter(p => {
          const pDate = p.date;
          const inWeek = pDate >= weekStartStr && pDate < weekEndStr;
          const athleteOfPlan = athletes.find(a => a.id === p.athleteId);
          const isAffectedAthlete = athleteOfPlan && selectedGroupIds.includes(athleteOfPlan.groupId);
          return !inWeek || (!isAffectedAthlete && p.athleteId !== 'master');
        });

        const newAthletePlans: PlannedSession[] = [];
        affectedAthletes.forEach(athlete => {
          currentPlans.forEach(mp => {
            newAthletePlans.push({ ...mp, id: Date.now().toString() + Math.random().toString().slice(2) + athlete.id, athleteId: athlete.id });
          });
        });
        
        onUpdatePlans([...otherPlans, ...newAthletePlans]);
      } else {
        // Individual já está salvo no state, apenas confirmamos
      }
      
      setIsSyncing(false);
      if (onNavigate) onNavigate('monitoring');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        {userRole === 'Coach' && (
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            <button onClick={() => setPlanningMode('collective')} className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${planningMode === 'collective' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Users size={16} className="mr-2" /> Coletivo</button>
            <button onClick={() => setPlanningMode('individual')} className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${planningMode === 'individual' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><User size={16} className="mr-2" /> Individual</button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col w-full md:w-auto gap-4">
            {planningMode === 'individual' ? (
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full mr-3"><User size={20} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase">Atleta Alvo</label><select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-black outline-none min-w-[200px]">{athletes.map(a => <option key={a.id} value={a.id} className="text-black">{a.name}</option>)}</select></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-slate-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100"><AlertCircle size={20} className="mr-2 text-amber-500" /><span className="text-sm font-black uppercase italic">Distribuição de Carga Base</span></div>
                <div className="flex flex-wrap gap-2">
                   {groups.map(g => (
                     <button 
                       key={g.id} 
                       onClick={() => toggleGroupSelection(g.id)}
                       className={`flex items-center px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all ${selectedGroupIds.includes(g.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                     >
                       {selectedGroupIds.includes(g.id) ? <CheckSquare size={14} className="mr-1.5" /> : <Square size={14} className="mr-1.5" />}
                       {g.name}
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 self-center md:self-end">
             <button onClick={() => handleWeekChange('prev')} className="p-1 hover:bg-white rounded-full transition-all"><ChevronLeft className="text-slate-600" /></button>
             <div className="flex items-center text-sm font-bold text-slate-700"><Calendar className="mr-2 text-primary" size={18} /><span>{startStr} - {endStr}</span></div>
             <button onClick={() => handleWeekChange('next')} className="p-1 hover:bg-white rounded-full transition-all"><ChevronRight className="text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
           <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Sessões Programadas</span>
           <span className="text-3xl font-black text-slate-800 italic">{currentPlans.length}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
           <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">CARGA BASE (A.U.)</span>
           <span className="text-3xl font-black text-primary italic neon-text">{currentLoadAU.toFixed(1)}</span>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-center ${averageTeamLoad !== currentLoadAU ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
           <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Média do Grupo</span>
           <span className={`text-3xl font-black italic ${averageTeamLoad !== currentLoadAU ? 'text-amber-600' : 'text-slate-800'}`}>{averageTeamLoad.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-center">
             <button 
               onClick={handleSaveAction} 
               disabled={isSyncing}
               className={`w-full h-full min-h-[110px] flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all p-4 active:scale-95 group ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
             >
               <RefreshCcw size={32} className={`mb-2 transition-transform duration-500 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
               <span className="uppercase text-sm italic tracking-widest">{isSyncing ? 'Sincronizando...' : 'Finalizar & Salvar'}</span>
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-100 p-4 border-b border-slate-200 text-xs font-black text-slate-600 uppercase italic">
          <div className="col-span-1 text-center">Ações</div>
          <div className="col-span-2">Dia</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-center">Tempo</div>
          <div className="col-span-3">Carga Planejada</div>
        </div>
        <div className="divide-y divide-slate-100">
          {weekDays.map((day) => {
            const dateStr = toISODate(day);
            const dayPlans = currentPlans.filter(p => p.date === dateStr);
            const isToday = toISODate(getLocalToday()) === dateStr;
            return (
              <div key={dateStr} className={isToday ? 'bg-sky-50/30' : ''}>
                {dayPlans.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center">
                     <div className="md:col-span-1"></div>
                     <div className="md:col-span-2"><span className={`text-sm font-black italic ${isToday ? 'text-primary' : 'text-slate-700'}`}>{day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
                     <div className="md:col-span-9"><button onClick={() => handleAddSession(dateStr)} className="text-[10px] text-slate-400 hover:text-primary font-black uppercase italic border border-dashed border-slate-300 px-6 py-2.5 rounded-xl bg-white transition-all">+ Adicionar Sessão</button></div>
                  </div>
                ) : (
                  dayPlans.map((plan, index) => (
                    <div key={plan.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50 relative ${index > 0 ? 'border-t border-slate-100/50' : ''}`}>
                       <div className="md:col-span-1 flex justify-center space-x-1 absolute top-4 right-4 md:static z-10"><button onClick={(e) => handleDuplicateSession(plan, e)} className="p-2 text-slate-400 hover:text-primary transition-colors"><Copy size={16}/></button><button onClick={(e) => handleRemoveSession(plan.id, e)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button></div>
                       <div className="md:col-span-2">{index === 0 && <span className={`text-sm font-black italic ${isToday ? 'text-primary' : 'text-slate-800'}`}>{day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>}</div>
                       <div className="md:col-span-2"><select value={plan.type} onChange={(e) => handleUpdateSession(plan.id, 'type', e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-[11px] outline-none text-black font-black uppercase italic"><option value="Natação">Água</option><option value="Musculação">Academia</option><option value="Preparação Física">PF</option></select></div>
                       <div className="md:col-span-2"><select value={plan.category} onChange={(e) => handleUpdateSession(plan.id, 'category', e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-[11px] outline-none text-black font-black uppercase italic"><option value="Ordinário">Ordinário</option><option value="Choque">Choque</option><option value="Recuperativo">Recuperativo</option><option value="Manutenção">Manutenção</option></select></div>
                       <div className="md:col-span-2"><input type="number" value={plan.volume} onChange={(e) => handleUpdateSession(plan.id, 'volume', Number(e.target.value))} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-black text-center" /></div>
                       <div className="md:col-span-3 flex flex-col justify-center"><div className="flex justify-between mb-1"><span className="text-[10px] font-black text-primary uppercase italic">PSE: {plan.intensity} | Carga: {(plan.volume * plan.intensity).toFixed(0)}</span></div><input type="range" min="0" max="10" value={plan.intensity} onChange={(e) => handleUpdateSession(plan.id, 'intensity', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" /></div>
                    </div>
                  ))
                )}
                {dayPlans.length > 0 && <div className="grid grid-cols-12 px-5 pb-5"><div className="col-span-3"></div><div className="col-span-9"><button onClick={() => handleAddSession(dateStr)} className="text-[9px] text-slate-400 hover:text-primary font-black uppercase italic mt-1 flex items-center gap-1.5"><Plus size={10}/> Adicionar sessão</button></div></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Planning;
