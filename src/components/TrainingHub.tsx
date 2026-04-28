
import React, { useState, useEffect, useMemo } from 'react';
import { PlannedSession, WorkoutPlan, PoolWorkoutStructure, PoolSet, PoolIntensity, PoolEquipment, Preventive, AthleteProfile, Group, GymLog } from '../../types';
import GymTraining from './GymTraining';
import { Waves, Dumbbell, Activity, ShieldPlus, Plus, Trash2, Save, X, Target, ArrowRight, ClipboardCheck, Link as LinkIcon, Users, User, Send, History, Calendar, CheckCircle2, ChevronRight, LayoutList, Filter, ToggleLeft, ToggleRight, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

interface TrainingHubProps {
  userRole: string;
  plans: PlannedSession[];
  gymPlans: WorkoutPlan[];
  onUpdateGymPlans: (plans: WorkoutPlan[]) => void;
  gymLogs: GymLog[];
  onUpdateGymLogs: (logs: GymLog[]) => void;
  onUpdatePlans?: (plans: PlannedSession[]) => void;
  preventives: Preventive[];
  onUpdatePreventives: (data: Preventive[]) => void;
  athletes?: AthleteProfile[];
  groups?: Group[];
  currentUserId?: string;
  onSimulateAthleteView?: (athleteId: string) => void;
}

const POOL_INTENSITIES: PoolIntensity[] = ['A0', 'A1', 'A2', 'A3', 'AN1', 'AN2', 'AN3', 'AA'];

const POOL_EQUIPMENT: PoolEquipment[] = [
  'Sem material', 
  'Pé de pato', 
  'Snorkel', 
  'Palmar P', 
  'Palmar M', 
  'Palmar G', 
  'Flutuador', 
  'Prancha', 
  'Paraquedas', 
  'Elástico'
];

const TrainingHub: React.FC<TrainingHubProps> = ({ userRole, plans, gymPlans, onUpdateGymPlans, gymLogs, onUpdateGymLogs, onUpdatePlans, preventives, onUpdatePreventives, athletes = [], groups = [], currentUserId, onSimulateAthleteView }) => {
  const [activeCategory, setActiveCategory] = useState<'piscina' | 'musculacao' | 'fisico' | 'preventivo'>(() => {
    const saved = localStorage.getItem('eliteSwim_lastTrainingCategory');
    return (saved as any) || 'piscina';
  });
  
  const [poolTab, setPoolTab] = useState<'current' | 'history'>('current');
  const [isBuildingPool, setIsBuildingPool] = useState(false);
  const [isBuildingPF, setIsBuildingPF] = useState(false);
  const [isBuildingPrev, setIsBuildingPrev] = useState(false);
  
  // Controle de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');
  
  // Data definida para 14/01/2026 conforme solicitado
  const [sessionDate, setSessionDate] = useState('2026-01-14');
  
  const [targetMode, setTargetMode] = useState<'individual' | 'group'>('group');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');

  const isCoach = userRole === 'Coach';

  // Filtra atletas do seletor baseado no grupo selecionado (para o Coach visualizar)
  const filteredAthletesForView = useMemo(() => {
    if (filterGroupId === 'all') return athletes;
    return athletes.filter(a => a.groupId === filterGroupId);
  }, [athletes, filterGroupId]);

  // Garante que o atleta selecionado mude se o grupo mudar e ele não estiver nele
  useEffect(() => {
    if (isCoach && filterGroupId !== 'all') {
      const isAthleteInGroup = athletes.find(a => a.id === selectedAthleteId)?.groupId === filterGroupId;
      if (!isAthleteInGroup && filteredAthletesForView.length > 0) {
        setSelectedAthleteId(filteredAthletesForView[0].id);
      }
    }
  }, [filterGroupId, athletes, isCoach, filteredAthletesForView, selectedAthleteId]);

  const [newPoolStructure, setNewPoolStructure] = useState<PoolWorkoutStructure>({
    warmUp: [], preSet: [], mainSet: [], coolDown: []
  });

  const [newGenericDesc, setNewGenericDesc] = useState('');
  const [newGenericVideo, setNewGenericVideo] = useState('');

  // Filtros de Planos de Piscina
  const poolPlans = useMemo(() => {
    const userId = isCoach ? selectedAthleteId : currentUserId;
    return plans.filter(p => p.type === 'Natação' && p.athleteId === userId);
  }, [plans, selectedAthleteId, currentUserId, isCoach]);

  // SESSÃO ATIVA: Agora filtrada pelo atributo 'active'
  const activePoolPlan = useMemo(() => {
    return poolPlans
      .filter(p => p.active !== false) // Treinos ativos (ou sem flag)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [poolPlans]);

  // HISTÓRICO: Exibe explicitamente o que foi desativado
  const historyPoolPlans = useMemo(() => {
    return poolPlans
      .filter(p => p.active === false)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [poolPlans]);

  const addPoolSet = (section: keyof PoolWorkoutStructure) => {
    const newSet: PoolSet = { 
      id: Math.random().toString(), 
      description: '', 
      distance: 0, 
      intensity: 'A1', 
      interval: '00:00', 
      equipment: 'Sem material', 
      equipment2: 'Sem material',
      equipment3: 'Sem material' 
    };
    setNewPoolStructure(prev => ({ ...prev, [section]: [...prev[section], newSet] }));
  };

  const savePoolWorkout = () => {
    if (!onUpdatePlans) return;
    const targetIds = targetMode === 'individual' ? [selectedAthleteId] : athletes.filter(a => a.groupId === selectedGroupId).map(a => a.id);
    
    if (targetIds.length === 0) { alert("Selecione um destinatário."); return; }

    const totalVolume = [...newPoolStructure.warmUp, ...newPoolStructure.preSet, ...newPoolStructure.mainSet, ...newPoolStructure.coolDown].reduce((acc, curr) => acc + (curr.distance || 0), 0);
    
    const newSessions: PlannedSession[] = targetIds.map(id => ({
      id: "pool-" + Date.now().toString() + "-" + id,
      athleteId: id,
      date: sessionDate,
      type: 'Natação',
      category: 'Ordinário',
      volume: totalVolume,
      intensity: 0,
      description: 'Treino de Água',
      structuredWorkout: newPoolStructure,
      active: true // Nasce na sessão ativa
    }));

    onUpdatePlans([...plans, ...newSessions]);
    setIsBuildingPool(false);
    setPoolTab('current');
    alert(`Treino de água publicado! Verifique na Sessão Ativa.`);
  };

  const handleFinishPoolWorkout = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
    setDeleteMode('archive');
    setShowDeleteConfirm(true);
  };

  const handlePermanentDeletePoolWorkout = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
    setDeleteMode('permanent');
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkout = () => {
    if (!onUpdatePlans || !workoutToDelete) return;
    
    if (deleteMode === 'archive') {
      // Move para o histórico
      const updatedPlans = plans.map(p => p.id === workoutToDelete ? { ...p, active: false } : p);
      onUpdatePlans(updatedPlans);
    } else {
      // Remove permanentemente
      const updatedPlans = plans.filter(p => p.id !== workoutToDelete);
      onUpdatePlans(updatedPlans);
    }
    
    setShowDeleteConfirm(false);
    setWorkoutToDelete(null);
  };

  // FUNÇÃO SOLICITADA: Volta o treino do histórico para a sessão ativa
  const handleRestorePoolWorkout = (id: string) => {
    if (!onUpdatePlans) return;
    const workout = plans.find(p => p.id === id);
    if (workout) {
      const updatedPlans = plans.map(p => p.id === id ? { ...p, active: true } : p);
      onUpdatePlans(updatedPlans);
      setSessionDate(workout.date);
      setPoolTab('current');
    }
  };

  const savePFWorkout = () => {
    if (!onUpdatePlans) return;
    const targetIds = targetMode === 'individual' ? [selectedAthleteId] : athletes.filter(a => a.groupId === selectedGroupId).map(a => a.id);
    if (targetIds.length === 0) { alert("Selecione um destinatário."); return; }
    const newSessions: PlannedSession[] = targetIds.map(id => ({
      id: Date.now().toString() + id,
      athleteId: id,
      date: sessionDate,
      type: 'Preparação Física',
      category: 'Ordinário',
      volume: 0,
      intensity: 0,
      description: newGenericDesc || 'Sessão de PF',
      videoUrl: newGenericVideo,
      active: true
    }));
    onUpdatePlans([...plans, ...newSessions]);
    setIsBuildingPF(false);
  };

  const savePrevWorkout = () => {
    if (!onUpdatePlans) return;
    const targetIds = targetMode === 'individual' ? [selectedAthleteId] : athletes.filter(a => a.groupId === selectedGroupId).map(a => a.id);
    const newSessions: PlannedSession[] = targetIds.map(id => ({
      id: Date.now().toString() + id,
      athleteId: id,
      date: sessionDate,
      type: 'Preventivo',
      category: 'Recuperativo',
      volume: 0,
      intensity: 0,
      description: newGenericDesc || 'Rotina Preventiva',
      videoUrl: newGenericVideo,
      active: true
    }));
    onUpdatePlans([...plans, ...newSessions]);
    setIsBuildingPrev(false);
  };

  const TargetSelector = () => (
    <div className="bg-black/20 p-6 rounded-2xl border border-white/10 mb-8 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Send size={14} className="text-primary" />
        <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest">Configuração de Envio</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-500 uppercase italic block">Público-Alvo</label>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
            <button onClick={() => setTargetMode('group')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${targetMode === 'group' ? 'bg-primary text-white' : 'text-slate-500'}`}><Users size={12}/> Por Grupo</button>
            <button onClick={() => setTargetMode('individual')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${targetMode === 'individual' ? 'bg-primary text-white' : 'text-slate-500'}`}><User size={12}/> Individual</button>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-500 uppercase italic block">{targetMode === 'group' ? 'Selecionar Categoria' : 'Selecionar Nadador'}</label>
          {targetMode === 'group' ? (
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black font-black uppercase text-xs">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black font-black uppercase text-xs">
              {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto border border-danger/20 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                  {deleteMode === 'permanent' ? 'Excluir Permanentemente' : 'Confirmar Exclusão'}
                </h3>
                <p className="text-slate-400 text-sm italic font-medium">
                  {deleteMode === 'permanent' ? 'Esta ação removerá este treino definitivamente da base de dados e não poderá ser desfeita.' : 'Você realmente quer excluir a sessão?'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-4 bg-white/5 text-slate-400 font-black uppercase italic text-xs rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteWorkout}
                  className="px-6 py-4 bg-danger text-white font-black uppercase italic text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-danger/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5 shadow-xl w-full max-w-2xl mx-auto overflow-x-auto whitespace-nowrap">
        {[
          { id: 'piscina', label: 'PISCINA', icon: Waves, color: 'text-sky-400' },
          { id: 'musculacao', label: 'MUSCULAÇÃO', icon: Dumbbell, color: 'text-indigo-400' },
          { id: 'fisico', label: 'PREP. FÍSICA', icon: Activity, color: 'text-emerald-400' },
          { id: 'preventivo', label: 'PREVENTIVO', icon: ShieldPlus, color: 'text-rose-400' }
        ].map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition-all ${activeCategory === cat.id ? 'bg-white text-slate-900 shadow-2xl scale-105 z-10' : 'text-slate-500 hover:text-white'}`}
          >
            <cat.icon size={16} className={activeCategory === cat.id ? 'text-slate-900' : cat.color} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeCategory === 'piscina' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 p-1 rounded-xl border border-white/5 flex w-fit shadow-xl">
              <button onClick={() => setPoolTab('current')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${poolTab === 'current' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Sessão Ativa</button>
              <button onClick={() => setPoolTab('history')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${poolTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Histórico de Treinos</button>
            </div>

            {poolTab === 'current' && (
              <div className="space-y-6">
                {isCoach && !isBuildingPool && (
                  <button onClick={() => setIsBuildingPool(true)} className="w-full py-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-primary transition-all group">
                    <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus size={32}/></div>
                    <p className="font-black uppercase italic text-sm tracking-widest">Prescrever Treino de Água</p>
                  </button>
                )}

                {isBuildingPool && (
                  <div className="bg-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3"><Waves className="text-primary"/><h3 className="font-black italic uppercase">Estruturador de Treino</h3></div>
                      <div className="flex items-center gap-4">
                         <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="bg-white p-2 rounded text-black font-bold text-xs" />
                         <button onClick={() => setIsBuildingPool(false)} className="text-slate-400 hover:text-white"><X/></button>
                      </div>
                    </div>
                    <div className="p-8">
                      {isCoach && <TargetSelector />}
                      <div className="space-y-8">
                        {(['warmUp', 'preSet', 'mainSet', 'coolDown'] as const).map(section => (
                          <div key={section} className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-primary uppercase italic">{section === 'warmUp' ? 'AQUECIMENTO' : section === 'preSet' ? 'PRÉ-SÉRIE' : section === 'mainSet' ? 'PRINCIPAL' : 'SOLTURA'}</h4>
                              <button onClick={() => addPoolSet(section)} className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Plus size={12}/> Adicionar Bloco</button>
                            </div>
                            {newPoolStructure[section].map((set, idx) => (
                              <div key={set.id} className="grid grid-cols-12 gap-2 bg-black/20 p-3 rounded-xl border border-white/5 items-center">
                                <div className="col-span-3"><input type="text" placeholder="Exercício..." value={set.description} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].description = e.target.value; setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none" /></div>
                                <div className="col-span-1"><input type="number" placeholder="m" value={set.distance} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].distance = Number(e.target.value); setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none text-center" /></div>
                                <div className="col-span-1"><select value={set.intensity} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].intensity = e.target.value as any; setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none">{POOL_INTENSITIES.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}</select></div>
                                <div className="col-span-2"><select value={set.equipment} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].equipment = e.target.value as any; setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none">{POOL_EQUIPMENT.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}</select></div>
                                <div className="col-span-2"><select value={set.equipment2} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].equipment2 = e.target.value as any; setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none">{POOL_EQUIPMENT.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}</select></div>
                                <div className="col-span-2"><select value={set.equipment3} onChange={e => { const s = [...newPoolStructure[section]]; s[idx].equipment3 = e.target.value as any; setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="w-full bg-white/5 p-2 rounded text-white text-[10px] outline-none">{POOL_EQUIPMENT.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}</select></div>
                                <div className="col-span-1 flex justify-center"><button onClick={() => { const s = [...newPoolStructure[section]]; s.splice(idx,1); setNewPoolStructure({...newPoolStructure, [section]: s}); }} className="text-slate-600 hover:text-danger"><Trash2 size={16}/></button></div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <button onClick={savePoolWorkout} className="w-full bg-success text-white py-4 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2 transition-all hover:brightness-110"><Send size={20}/> Publicar e Enviar Treino</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <Waves className="text-primary" size={20} />
                        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Plano de Água Ativo</h3>
                      </div>
                      {isCoach && (
                      <div className="flex flex-wrap items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                            <Filter size={12} className="text-slate-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase italic">Grupo:</span>
                            <select value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)} className="bg-slate-900 p-1 rounded text-white font-black uppercase italic text-[10px] outline-none">
                                <option value="all">Todos</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pl-1">
                            <User size={12} className="text-primary" />
                            <span className="text-[9px] font-black text-slate-500 uppercase italic">Atleta:</span>
                            <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="bg-white p-1 rounded text-black font-black uppercase italic text-[10px] outline-none min-w-[140px]">
                                {filteredAthletesForView.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                {filteredAthletesForView.length === 0 && <option disabled>Sem atletas</option>}
                            </select>
                          </div>
                      </div>
                      )}
                  </div>

                  {activePoolPlan ? (
                    <div key={activePoolPlan.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                      <div className="p-5 bg-slate-900 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-primary/30 text-primary shadow-inner">
                              <Calendar size={18}/>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">SESSÃO: {new Date(activePoolPlan.date + 'T12:00:00').toLocaleDateString('pt-BR')}</h4>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right">
                               <span className="text-[8px] font-black text-slate-500 uppercase block">Metragem</span>
                               <span className="text-lg font-mono font-black text-primary italic">{activePoolPlan.volume}m</span>
                            </div>
                            <button onClick={() => handleFinishPoolWorkout(activePoolPlan.id)} className="bg-success text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase italic shadow-lg hover:brightness-110 flex items-center gap-2 transition-all">
                               <Trash2 size={16}/>
                               {isCoach ? 'EXCLUIR SESSÃO' : 'FINALIZAR TREINO'}
                            </button>
                         </div>
                      </div>
                      <div className="p-8 space-y-8">
                         {activePoolPlan.structuredWorkout && (
                           <>
                             {(['warmUp', 'preSet', 'mainSet', 'coolDown'] as const).map(section => (
                               activePoolPlan.structuredWorkout![section].length > 0 && (
                                 <div key={section} className="space-y-4">
                                   <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic border-l-4 border-primary pl-3">{section === 'warmUp' ? 'AQUECIMENTO' : section === 'preSet' ? 'PRÉ-SÉRIE' : section === 'mainSet' ? 'SÉRIE PRINCIPAL' : 'RELAXAMENTO / SOLTURA'}</h5>
                                   <div className="grid grid-cols-1 gap-3">
                                     {activePoolPlan.structuredWorkout![section].map(set => (
                                       <div key={set.id} className="flex justify-between items-center bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                                          <div className="flex-1">
                                             <p className="text-base font-black text-white italic group-hover:text-primary transition-colors">{set.description}</p>
                                             <div className="flex items-center gap-3 mt-2">
                                                <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-slate-400 uppercase border border-white/5">{set.equipment}</span>
                                                {set.equipment2 && set.equipment2 !== 'Sem material' && (
                                                   <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-slate-400 uppercase border border-white/5">{set.equipment2}</span>
                                                )}
                                                {set.equipment3 && set.equipment3 !== 'Sem material' && (
                                                   <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-slate-400 uppercase border border-white/5">{set.equipment3}</span>
                                                )}
                                                <span className="px-2 py-0.5 bg-primary/10 rounded text-[8px] font-black text-primary uppercase border border-primary/20">{set.intensity}</span>
                                             </div>
                                          </div>
                                          <div className="text-right ml-4">
                                             <p className="text-2xl font-black text-white italic font-mono">{set.distance}<span className="text-xs text-slate-500 ml-1">m</span></p>
                                          </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )
                             ))}
                           </>
                         )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-40 flex flex-col items-center">
                      <Waves size={64} className="text-slate-500 mb-6" />
                      <p className="text-sm font-black text-white uppercase tracking-widest italic">Nenhum treino de piscina ativo para hoje.</p>
                      {isCoach && <p className="text-[10px] text-slate-600 uppercase font-black mt-2">Use o botão acima para prescrever novos trabalhos de água.</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {poolTab === 'history' && (
               <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <History className="text-slate-400" size={20} />
                      <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Base de Dados de Água</h3>
                    </div>
                    {isCoach && (
                      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Filtrar por Grupo:</span>
                        <select value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)} className="bg-slate-900 p-1 rounded text-white font-black uppercase italic text-[10px] outline-none">
                            <option value="all">Todos</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <span className="text-[9px] font-black text-slate-500 uppercase italic">Atleta:</span>
                        <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="bg-white p-1 rounded text-black font-black uppercase italic text-[10px] outline-none min-w-[140px]">
                            {filteredAthletesForView.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {historyPoolPlans.length > 0 ? (
                    historyPoolPlans.map(p => (
                      <div key={p.id} className="hud-card p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-6">
                           <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                              <LayoutList size={24}/>
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-black italic uppercase tracking-tight">Sessão de Piscina</h4>
                                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-black uppercase italic border border-primary/30">{p.volume}m Totais</span>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic flex items-center gap-2">
                                <Calendar size={10} /> Realizado em {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                {isCoach && <span className="text-primary/60 ml-2">| Atleta: {athletes.find(a=>a.id===p.athleteId)?.name}</span>}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Reativar</span>
                              <button 
                                onClick={() => handleRestorePoolWorkout(p.id)} 
                                className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all" 
                                title="Voltar para Sessão Ativa"
                              >
                                <ChevronRight size={20}/>
                              </button>
                           </div>
                           <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Excluir</span>
                              <button 
                                onClick={() => handlePermanentDeletePoolWorkout(p.id)} 
                                className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-danger hover:bg-danger/10 transition-all" 
                                title="Excluir Permanentemente"
                              >
                                <Trash2 size={20}/>
                              </button>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                      <History size={48} className="mx-auto mb-4"/>
                      <p className="font-black uppercase italic text-xs">Nenhum registro histórico de piscina encontrado.</p>
                    </div>
                  )}
               </div>
            )}
          </div>
        )}

        {activeCategory === 'musculacao' && (
          // Fixed: onUpdateGymPlans changed to onUpdatePlans to match GymTrainingProps
          <GymTraining userRole={userRole} plans={gymPlans} onUpdatePlans={onUpdateGymPlans} gymLogs={gymLogs} onUpdateGymLogs={onUpdateGymLogs} athletes={athletes} groups={groups} currentUserId={currentUserId} onSimulateAthleteView={onSimulateAthleteView} />
        )}

        {activeCategory === 'fisico' && (
          <div className="space-y-6">
            {isCoach && !isBuildingPF && (
               <button onClick={() => setIsBuildingPF(true)} className="w-full py-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 transition-all group">
                  <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus size={32}/></div>
                  <p className="font-black uppercase italic text-sm tracking-widest">Prescrever Preparação Física</p>
               </button>
            )}

            {isBuildingPF && (
              <div className="bg-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3"><Activity className="text-emerald-500"/><h3 className="font-black italic uppercase">Nova Sessão de Preparação Física</h3></div>
                    <button onClick={() => setIsBuildingPF(false)} className="text-slate-400 hover:text-white"><X/></button>
                 </div>
                 <div className="p-8 space-y-6">
                    <TargetSelector />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Sessão</label>
                       <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Treino</label>
                       <textarea rows={6} value={newGenericDesc} onChange={e => setNewGenericDesc(e.target.value)} className="w-full p-4 bg-white border border-slate-300 rounded-xl italic font-medium text-black" placeholder="Ex: Corrida 5km leve + core 20 min..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><LinkIcon size={12} className="text-primary"/> Link do Vídeo</label>
                       <input type="text" value={newGenericVideo} onChange={e => setNewGenericVideo(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-black" placeholder="https://youtube.com/..." />
                    </div>
                    <button onClick={savePFWorkout} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2"><Send size={20}/> Publicar e Enviar PF</button>
                 </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {plans.filter(p => p.type === 'Preparação Física' && (isCoach ? p.athleteId === selectedAthleteId : p.athleteId === currentUserId)).map(p => (
                <div key={p.id} className="hud-card p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20"><Activity size={24}/></div>
                      <div>
                         <h4 className="text-white font-black italic uppercase">{p.description}</h4>
                         <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {athletes.find(a => a.id === p.athleteId)?.name}</p>
                      </div>
                   </div>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-400"><ArrowRight size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'preventivo' && (
          <div className="space-y-6">
            {isCoach && !isBuildingPrev && (
               <button onClick={() => setIsBuildingPrev(true)} className="w-full py-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-rose-500 transition-all group">
                  <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus size={32}/></div>
                  <p className="font-black uppercase italic text-sm tracking-widest">Prescrever Rotina de Preventivos</p>
               </button>
            )}

            {isBuildingPrev && (
              <div className="bg-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3"><ShieldPlus className="text-rose-500"/><h3 className="font-black italic uppercase">Nova Rotina de Preventivos</h3></div>
                    <button onClick={() => setIsBuildingPrev(false)} className="text-slate-400 hover:text-white"><X/></button>
                 </div>
                 <div className="p-8 space-y-6">
                    <TargetSelector />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data da Atividade</label>
                       <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                       <textarea rows={6} value={newGenericDesc} onChange={e => setNewGenericDesc(e.target.value)} className="w-full p-4 bg-white border border-slate-300 rounded-xl italic font-medium text-black" placeholder="Ex: Mobilidade de ombro 3x15..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><LinkIcon size={12} className="text-primary"/> Link do Vídeo</label>
                       <input type="text" value={newGenericVideo} onChange={e => setNewGenericVideo(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-black" placeholder="https://youtube.com/..." />
                    </div>
                    <button onClick={savePrevWorkout} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-2"><Send size={20}/> Publicar e Enviar Preventivo</button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {plans.filter(p => p.type === 'Preventivo' && (isCoach ? p.athleteId === selectedAthleteId : p.athleteId === currentUserId)).map(p => (
                <div key={p.id} className="hud-card p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20"><ShieldPlus size={24}/></div>
                      <div>
                         <h4 className="text-white font-black italic uppercase">{p.description}</h4>
                         <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {athletes.find(a => a.id === p.athleteId)?.name}</p>
                      </div>
                   </div>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-400"><ArrowRight size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingHub;
