
import React, { useState, useMemo } from 'react';
import { GymLog, WorkoutPlan, AthleteProfile, Group, WorkoutExercise, GymSetLog } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Dumbbell, TrendingUp, Plus, Users, FilePlus, Save, Trash2, Calendar, ClipboardCheck, Info, User, Filter, Layers, PencilLine, Video, PlayCircle, Archive, CheckCircle2, History, Scale, ChevronRight, ToggleLeft, ToggleRight, CheckSquare, Square, Zap, Activity, Link as LinkIcon, Loader2, Send } from 'lucide-react';

interface GymTrainingProps {
  userRole?: string;
  plans?: WorkoutPlan[];
  onUpdatePlans?: (plans: WorkoutPlan[]) => void;
  gymLogs: GymLog[];
  onUpdateGymLogs: (logs: GymLog[]) => void;
  athletes?: AthleteProfile[];
  groups?: Group[];
  currentUserId?: string;
  onSimulateAthleteView?: (athleteId: string) => void;
}

const GymTraining: React.FC<GymTrainingProps> = ({ userRole = 'Athlete', plans = [], onUpdatePlans, gymLogs, onUpdateGymLogs, athletes = [], groups = [], currentUserId, onSimulateAthleteView }) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'current' | 'builder' | 'archive'>(userRole === 'Coach' ? 'builder' : 'current');
  const [progressView, setProgressView] = useState<'exercise' | 'total_volume'>('exercise');
  const [isPublishing, setIsPublishing] = useState(false);
  const isCoach = userRole === 'Coach';
  
  // -- FILTERS & TARGETS (COACH) --
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [targetMode, setTargetMode] = useState<'individual' | 'group'>('group');
  
  // Filtro de Progresso
  const [progressGroupId, setProgressGroupId] = useState<string>(groups[0]?.id || 'all');
  
  const filteredAthletesForProgress = useMemo(() => {
    if (progressGroupId === 'all') return athletes;
    return athletes.filter(a => a.groupId === progressGroupId);
  }, [athletes, progressGroupId]);

  // -- BUILDER STATE --
  const [newPlan, setNewPlan] = useState<Partial<WorkoutPlan>>({ title: '', exercises: [], active: true });
  const [tempRow, setTempRow] = useState({ exerciseName: '', sets: '4', reps: '8', rest: '60s', notes: '', videoUrl: '' });

  // -- LOGGING STATE (ATHLETE) --
  const [weightInputs, setWeightInputs] = useState<Record<string, Record<number, string>>>({});

  // Memo de treinos ativos: Garante que o treino recém-criado apareça aqui
  const activeWorkouts = useMemo(() => {
    const userId = isCoach ? selectedAthleteId : currentUserId;
    return (plans || []).filter(p => p.athleteId === userId && p.active);
  }, [plans, selectedAthleteId, currentUserId, isCoach]);

  const archivedWorkouts = useMemo(() => {
    const userId = isCoach ? selectedAthleteId : currentUserId;
    return (plans || []).filter(p => p.athleteId === userId && !p.active);
  }, [plans, selectedAthleteId, currentUserId, isCoach]);

  const handleWeightChange = (exId: string, setIdx: number, val: string) => {
    setWeightInputs(prev => ({ ...prev, [exId]: { ...(prev[exId] || {}), [setIdx]: val } }));
  };

  const handleFinishWorkout = (workout: WorkoutPlan) => {
    const newLogs: GymLog[] = workout.exercises.map(ex => {
      const exerciseWeights = weightInputs[ex.id] || {};
      const setsCount = parseInt(ex.sets) || 1;
      const repsCount = parseInt(ex.reps) || 1;
      const setsLogs: GymSetLog[] = [];
      for (let i = 0; i < setsCount; i++) {
        setsLogs.push({ weight: parseFloat(exerciseWeights[i]) || 0, reps: repsCount });
      }
      return {
        id: Date.now().toString() + Math.random().toString(),
        athleteId: currentUserId || '1',
        workoutId: workout.id,
        date: new Date().toISOString().split('T')[0],
        exerciseName: ex.exerciseId,
        sets: setsLogs
      };
    }).filter(log => log.sets.some(s => s.weight > 0));

    if (newLogs.length === 0) { alert("Preencha o peso usado para registrar."); return; }
    onUpdateGymLogs([...gymLogs, ...newLogs]);
    setWeightInputs({});
    alert("Tonelagem registrada com sucesso!");
  };

  // --- LOGIC: BUILDER ---
  const handleAddExerciseToPlan = () => {
    if (!tempRow.exerciseName.trim()) return;
    const newEx: WorkoutExercise = {
      id: Date.now().toString() + Math.random().toString(),
      exerciseId: tempRow.exerciseName,
      sets: tempRow.sets,
      reps: tempRow.reps,
      rest: tempRow.rest,
      notes: tempRow.notes,
      videoUrl: tempRow.videoUrl
    };
    setNewPlan(prev => ({ ...prev, exercises: [...(prev.exercises || []), newEx] }));
    setTempRow({ exerciseName: '', sets: '4', reps: '8', rest: '60s', notes: '', videoUrl: '' });
  };

  const handleSavePlan = () => {
    if (!newPlan.title || !newPlan.exercises?.length) { 
      alert("Preencha o título e adicione pelo menos um exercício."); 
      return; 
    }
    
    setIsPublishing(true);
    
    const athletesToAssign = targetMode === 'individual' 
      ? [selectedAthleteId] 
      : athletes.filter(a => a.groupId === selectedGroupId).map(a => a.id);
    
    if (athletesToAssign.length === 0) { 
      alert("Nenhum atleta encontrado no alvo selecionado."); 
      setIsPublishing(false);
      return; 
    }

    // Criar os objetos de plano com a flag active: true para aparecer na Sessão Ativa
    const newCreatedPlans: WorkoutPlan[] = athletesToAssign.map(id => ({
      ...newPlan as WorkoutPlan,
      id: "gym-" + Date.now().toString() + "-" + id,
      athleteId: id,
      dateAssigned: new Date().toISOString(),
      active: true 
    }));

    // Simulação de delay de envio
    setTimeout(() => {
      if (onUpdatePlans) {
        onUpdatePlans([...plans, ...newCreatedPlans]);
      }
      
      setIsPublishing(false);
      
      // Se for envio individual, garantir que a visualização do técnico mude para o atleta em questão
      if (targetMode === 'individual') {
        setSelectedAthleteId(athletesToAssign[0]);
      }
      
      setNewPlan({ title: '', exercises: [], active: true });
      
      // Mudar para a aba de "Sessão Ativa" para o treinador ver o resultado do envio
      setActiveTab('current');
      
      alert(`Protocolo enviado com sucesso! Verifique agora na aba Sessão Ativa.`);
    }, 600);
  };

  const toggleWorkoutActive = (id: string, currentStatus: boolean) => {
    if (onUpdatePlans) onUpdatePlans(plans.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
  };

  // --- LOGIC: PROGRESS GRAPHS ---
  const [selectedGraphExercise, setSelectedGraphExercise] = useState<string>('');
  
  const availableExercisesForGraph = useMemo(() => {
    const names = new Set<string>();
    const userId = isCoach ? selectedAthleteId : currentUserId;
    gymLogs.filter(l => l.athleteId === userId).forEach(l => names.add(l.exerciseName));
    const list = Array.from(names);
    if (list.length > 0 && !selectedGraphExercise) setSelectedGraphExercise(list[0]);
    return list;
  }, [gymLogs, selectedAthleteId, currentUserId, isCoach]);

  const exerciseChartData = useMemo(() => {
    const userId = isCoach ? selectedAthleteId : currentUserId;
    return gymLogs
      .filter(l => l.athleteId === userId && l.exerciseName === selectedGraphExercise)
      .map(l => ({
        date: l.date,
        maxWeight: Math.max(...l.sets.map(s => s.weight)),
        volume: l.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [gymLogs, selectedGraphExercise, selectedAthleteId, currentUserId, isCoach]);

  const totalVolumeData = useMemo(() => {
    const userId = isCoach ? selectedAthleteId : currentUserId;
    const sessionTotals: Record<string, number> = {};
    gymLogs.filter(l => l.athleteId === userId).forEach(l => {
      const volume = l.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      sessionTotals[l.date] = (sessionTotals[l.date] || 0) + volume;
    });
    return Object.entries(sessionTotals)
      .map(([date, total]) => ({ date, totalVolume: total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [gymLogs, selectedAthleteId, currentUserId, isCoach]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* NAVEGAÇÃO INTERNA */}
      <div className="bg-slate-900/40 p-1 rounded-xl border border-white/5 flex w-fit shadow-xl overflow-x-auto">
        <button onClick={() => setActiveTab('current')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${activeTab === 'current' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Sessão Ativa</button>
        <button onClick={() => setActiveTab('progress')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${activeTab === 'progress' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Evolução de Carga</button>
        {isCoach && <button onClick={() => setActiveTab('builder')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${activeTab === 'builder' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Montar Protocolo</button>}
        <button onClick={() => setActiveTab('archive')} className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${activeTab === 'archive' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Histórico</button>
      </div>

      {isCoach && activeTab === 'progress' && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-wrap gap-6 items-end animate-in slide-in-from-left-2">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 flex items-center gap-1"><Filter size={10}/> Grupo</span>
              <select value={progressGroupId} onChange={e => setProgressGroupId(e.target.value)} className="bg-white p-2 rounded-lg text-black font-bold text-xs outline-none min-w-[180px]">
                <option value="all">Todos os Grupos</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
           </div>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 flex items-center gap-1"><User size={10}/> Nadador</span>
              <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="bg-white p-2 rounded-lg text-black font-bold text-xs outline-none min-w-[220px]">
                {filteredAthletesForProgress.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
           </div>
        </div>
      )}

      {/* --- TAB: CURRENT WORKOUT (SESSÃO ATIVA) --- */}
      {activeTab === 'current' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Activity className="text-primary" size={20} />
                <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Protocolo de Trabalho Atual</h3>
             </div>
             {isCoach && (
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                   <span className="text-[9px] font-black text-slate-500 uppercase italic">Visualizando Sessão de:</span>
                   <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="bg-white p-1 rounded text-black font-black uppercase italic text-[10px] outline-none">
                      {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                   </select>
                </div>
             )}
          </div>

          {activeWorkouts.length > 0 ? (
            activeWorkouts.map(workout => (
              <div key={workout.id} className="bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="p-6 bg-slate-900 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{workout.title}</h3>
                      <p className="text-[10px] text-primary font-black uppercase mt-1 italic flex items-center gap-1">Sincronizado em {new Date(workout.dateAssigned).toLocaleDateString()}</p>
                    </div>
                    {!isCoach && (
                      <button onClick={() => handleFinishWorkout(workout)} className="bg-success text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest italic shadow-lg hover:brightness-110 flex items-center gap-2 transition-all"><CheckCircle2 size={16}/> Registrar Tonelagem</button>
                    )}
                 </div>
                 
                 <div className="p-6 space-y-6">
                    {workout.exercises.map((ex, idx) => (
                      <div key={ex.id} className="bg-black/20 rounded-xl border border-white/5 p-5 group hover:border-primary/10 transition-all">
                         <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                            <div className="flex items-start gap-4">
                               <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black italic border border-primary/20">{idx+1}</span>
                               <div>
                                  <h4 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                                    {ex.exerciseId}
                                    {ex.videoUrl && <a href={ex.videoUrl} target="_blank" rel="noopener" className="text-primary hover:text-white transition-colors"><PlayCircle size={18}/></a>}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">SÉRIES: {ex.sets} | REPS: {ex.reps} | DESC: {ex.rest}</p>
                                  {ex.notes && <p className="text-[10px] text-amber-500/80 mt-2 font-medium italic">Obs: {ex.notes}</p>}
                               </div>
                            </div>
                         </div>
                         
                         {!isCoach && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                {Array.from({length: parseInt(ex.sets) || 0}).map((_, setIdx) => (
                                  <div key={setIdx} className="bg-white/5 p-3 rounded-xl border border-white/5 text-center group-hover:bg-white/[0.08] transition-all">
                                    <label className="block text-[7px] font-black text-slate-500 uppercase mb-2">SÉRIE {setIdx+1}</label>
                                    <input type="number" placeholder="KG" value={weightInputs[ex.id]?.[setIdx] || ''} onChange={e => handleWeightChange(ex.id, setIdx, e.target.value)} className="w-full bg-white text-black font-mono font-black italic text-center rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                                  </div>
                                ))}
                            </div>
                         )}
                      </div>
                    ))}
                 </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-40 flex flex-col items-center">
               <Dumbbell size={64} className="text-slate-500 mb-6" />
               <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Nenhum protocolo ativo para execução hoje.</p>
               {isCoach && <p className="text-[10px] text-slate-600 uppercase font-black mt-2">Vá para 'Montar Protocolo' para prescrever novos treinos para {athletes.find(a=>a.id===selectedAthleteId)?.name}.</p>}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: BUILDER (COACH) --- */}
      {activeTab === 'builder' && isCoach && (
        <div className="space-y-6">
           <div className="bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 bg-slate-900 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2"><FilePlus className="text-primary"/> Montar Protocolo</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Prescrição Técnica de Musculação</p>
                 </div>
                 <button onClick={handleSavePlan} disabled={isPublishing} className="bg-success text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest italic shadow-lg hover:brightness-110 flex items-center gap-2 transition-all disabled:opacity-50">
                    {isPublishing ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} 
                    {isPublishing ? 'PUBLICANDO...' : 'PUBLICAR E ENVIAR PARA SESSÃO ATIVA'}
                 </button>
              </div>
              
              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block italic">Modo de Distribuição</label>
                              <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
                                 <button onClick={() => setTargetMode('group')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${targetMode === 'group' ? 'bg-primary text-white' : 'text-slate-500'}`}>Por Grupo</button>
                                 <button onClick={() => setTargetMode('individual')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${targetMode === 'individual' ? 'bg-primary text-white' : 'text-slate-500'}`}>Individual</button>
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block italic">{targetMode === 'group' ? 'Selecionar Grupo Alvo' : 'Selecionar Nadador'}</label>
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

                    <div className="space-y-6">
                       <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
                          <div>
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block italic">Nome do Protocolo</label>
                             <input type="text" value={newPlan.title} onChange={e => setNewPlan({...newPlan, title: e.target.value})} placeholder="Ex: Treino A - Força Explosiva" className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-black uppercase italic text-xs outline-none focus:ring-1 focus:ring-primary shadow-inner" />
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                             <div className="flex items-center gap-2 p-2 rounded-lg text-success opacity-80 cursor-default">
                                <CheckCircle2 size={20}/>
                                <span className="text-[9px] font-black uppercase tracking-widest italic">Será entregue como ATIVO para o atleta</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-black/30 p-8 rounded-2xl border border-white/5 space-y-6">
                    <h4 className="text-xs font-black text-white uppercase italic border-b border-white/5 pb-3 flex items-center gap-2"><Layers size={16} className="text-primary"/> Compor Lista de Exercícios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 ml-1">Nome do Exercício</label>
                          <input type="text" value={tempRow.exerciseName} onChange={e => setTempRow({...tempRow, exerciseName: e.target.value})} placeholder="Ex: Agachamento Livre" className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none text-xs" />
                       </div>
                       <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 ml-1">Séries</label>
                          <input type="text" value={tempRow.sets} onChange={e => setTempRow({...tempRow, sets: e.target.value})} placeholder="Ex: 4" className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none text-xs" />
                       </div>
                       <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 ml-1">Repetições</label>
                          <input type="text" value={tempRow.reps} onChange={e => setTempRow({...tempRow, reps: e.target.value})} placeholder="Ex: 8-10" className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none text-xs" />
                       </div>
                       <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 ml-1">Intervalo</label>
                          <input type="text" value={tempRow.rest} onChange={e => setTempRow({...tempRow, rest: e.target.value})} placeholder="Ex: 90s" className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none text-xs" />
                       </div>
                       <div className="md:col-span-4">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 ml-1 flex items-center gap-1.5"><LinkIcon size={12} className="text-primary"/> Link do Vídeo (YouTube / Drive)</label>
                          <input type="text" value={tempRow.videoUrl} onChange={e => setTempRow({...tempRow, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none text-xs" />
                       </div>
                    </div>
                    <button onClick={handleAddExerciseToPlan} className="w-full py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest italic hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"><Plus size={18}/> Adicionar à Prescrição</button>
                 </div>

                 <div className="bg-black/40 rounded-xl overflow-hidden border border-white/5">
                    <table className="w-full text-left">
                       <thead className="bg-slate-900/80 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-6 py-4">Ordem</th>
                             <th className="px-6 py-4">Exercício Prescrito</th>
                             <th className="px-6 py-4">Configuração</th>
                             <th className="px-6 py-4">Vídeo</th>
                             <th className="px-6 py-4 text-right">Controle</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5 text-black">
                          {newPlan.exercises?.map((ex, i) => (
                            <tr key={ex.id} className="text-slate-300 group hover:bg-white/[0.02]">
                               <td className="px-6 py-4 font-mono text-[10px]">{i+1}</td>
                               <td className="px-6 py-4 font-black italic uppercase text-xs text-white">{ex.exerciseId}</td>
                               <td className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500">{ex.sets} x {ex.reps} • {ex.rest}</td>
                               <td className="px-6 py-4">
                                  {ex.videoUrl ? (
                                    <span className="text-primary font-black uppercase text-[8px] flex items-center gap-1 italic"><CheckCircle2 size={10}/> Vinculado</span>
                                  ) : (
                                    <span className="text-slate-700 font-black uppercase text-[8px] italic">Ausente</span>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-right"><button onClick={() => setNewPlan({...newPlan, exercises: newPlan.exercises?.filter(e=>e.id!==ex.id)})} className="text-slate-600 hover:text-danger p-2 transition-colors"><Trash2 size={16}/></button></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* ... tabs progress e archive continuam iguais ... */}
      {/* --- TAB: PROGRESS --- */}
      {activeTab === 'progress' && (
        <div className="space-y-8 animate-in fade-in">
           {/* Seletor de Visão de Progresso */}
           <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 w-fit">
              <button onClick={() => setProgressView('exercise')} className={`px-4 py-1.5 text-[9px] font-black uppercase italic rounded-lg transition-all ${progressView === 'exercise' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>Sobrecarga por Exercício</button>
              <button onClick={() => setProgressView('total_volume')} className={`px-4 py-1.5 text-[9px] font-black uppercase italic rounded-lg transition-all ${progressView === 'total_volume' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Volume Total da Sessão</button>
           </div>

           {progressView === 'exercise' ? (
             <div className="space-y-6">
                <div className="hud-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-xl text-primary border border-primary/20"><TrendingUp size={24}/></div>
                      <div>
                         <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Curva de Intensidade</h3>
                         <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest italic">Evolução de Peso Máximo (1RM Est.)</p>
                      </div>
                   </div>
                   <div className="w-full md:w-auto">
                      <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 ml-1">Selecionar Exercício</label>
                      <select value={selectedGraphExercise} onChange={e => setSelectedGraphExercise(e.target.value)} className="w-full md:w-64 p-3 bg-white border border-white/10 rounded-xl text-black font-black uppercase italic outline-none focus:ring-1 focus:ring-primary text-xs">
                        {availableExercisesForGraph.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                      </select>
                   </div>
                </div>

                {exerciseChartData.length > 0 ? (
                  <div className="hud-card p-8 rounded-2xl border border-white/5 h-[400px] relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} className="text-primary"/></div>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={exerciseChartData}>
                           <defs>
                              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis dataKey="date" tickFormatter={d => d.split('-').reverse().slice(0, 2).join('/')} stroke="#475569" fontSize={10} fontStyle="italic" />
                           <YAxis stroke="#475569" fontSize={10} hide={false} />
                           <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)', color: '#f1f5f9' }} />
                           <Area type="monotone" dataKey="maxWeight" name="Carga Máxima (kg)" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorMax)" dot={{ r: 4, fill: '#0ea5e9', stroke: '#020617', strokeWidth: 2 }} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 flex flex-col items-center">
                     <History size={48} className="text-slate-500 mb-4" />
                     <p className="italic font-black uppercase text-slate-500 tracking-widest text-xs">Sem dados históricos para este exercício.</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="space-y-6">
                <div className="hud-card p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl bg-gradient-to-br from-indigo-900/20 to-transparent">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30"><Activity size={24}/></div>
                      <div>
                         <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Volume de Tonelagem Acumulada</h3>
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">Carga de Trabalho Total por Sessão (Séries x Reps x Kg)</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-black uppercase italic">Média de Volume</p>
                      <p className="text-2xl font-mono font-black text-indigo-400 italic">{(totalVolumeData.reduce((acc,d)=>acc+d.totalVolume, 0) / (totalVolumeData.length || 1)).toFixed(0)} kg</p>
                   </div>
                </div>

                {totalVolumeData.length > 0 ? (
                  <div className="hud-card p-8 rounded-2xl border border-white/5 h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={totalVolumeData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis dataKey="date" tickFormatter={d => d.split('-').reverse().slice(0, 2).join('/')} stroke="#475569" fontSize={10} fontStyle="italic" />
                           <YAxis stroke="#475569" fontSize={10} />
                           <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)', color: '#f1f5f9' }} 
                              itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#818cf8' }}
                              formatter={(value: number) => [`${value} kg`, "Volume Total"]}
                           />
                           <Bar dataKey="totalVolume" name="Volume da Sessão" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 flex flex-col items-center">
                     <Dumbbell size={48} className="text-slate-500 mb-4" />
                     <p className="italic font-black uppercase text-slate-500 tracking-widest text-xs">Aguardando registros de treino para calcular volume.</p>
                  </div>
                )}
             </div>
           )}
        </div>
      )}

      {/* --- TAB: ARCHIVE (HISTÓRICO) --- */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
           <div className="flex items-center gap-3 mb-2">
             <Archive className="text-slate-400" size={20} />
             <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Base de Planos Arquivados</h3>
           </div>
           
           {(plans || []).filter(p => isCoach ? p.athleteId === selectedAthleteId : p.athleteId === currentUserId).map(plan => {
             const athlete = athletes.find(a => a.id === plan.athleteId);
             return (
               <div key={plan.id} className={`hud-card p-6 rounded-2xl border border-white/5 group hover:border-white/20 transition-all flex justify-between items-center shadow-lg ${!plan.active ? 'opacity-60' : 'border-primary/20'}`}>
                  <div className="flex items-center gap-6">
                     <div className={`p-4 rounded-2xl shadow-inner ${plan.active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-800 text-slate-600'}`}>
                        <Archive size={24}/>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-black italic uppercase tracking-tight">{plan.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase italic border ${plan.active ? 'bg-success/20 text-success border-success/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{plan.active ? 'Status: ATIVO' : 'Status: ARQUIVADO'}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">
                          Prescrito em {new Date(plan.dateAssigned).toLocaleDateString()} • {plan.exercises.length} Exercícios
                          {isCoach && athlete && <span className="ml-2 text-primary/80">| Alvo: {athlete.name}</span>}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                     {isCoach && (
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-500 uppercase mb-1">{plan.active ? 'Arquivar' : 'Ativar'}</span>
                          <button onClick={() => toggleWorkoutActive(plan.id, plan.active)} className={`p-1 transition-all rounded-lg ${plan.active ? 'text-primary' : 'text-slate-600'}`}>
                             {plan.active ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                          </button>
                       </div>
                     )}
                     <button onClick={() => { setSelectedAthleteId(plan.athleteId); setActiveTab('current'); }} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all" title="Ver Detalhes na Sessão Ativa"><ChevronRight size={20}/></button>
                  </div>
               </div>
             );
           })}
           {(plans || []).length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                <Archive size={48} className="mx-auto mb-4"/>
                <p className="font-black uppercase italic text-xs">Nenhum protocolo encontrado no banco de dados.</p>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GymTraining;
