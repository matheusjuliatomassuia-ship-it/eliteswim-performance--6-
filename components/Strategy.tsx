
import React, { useState } from 'react';
import { Competition, Strategy, Group } from '../types';
import { Calendar, MapPin, Target, Zap, Plus, Save, Trash2, X, ChevronRight, Edit3, Award, Users, Repeat, MessageSquare, User, List, Flag, Clock, CheckSquare, Square, FileText, AlertTriangle } from 'lucide-react';
import { MOCK_GROUPS } from '../constants';

interface StrategyProps {
  competitions: Competition[];
  strategies: Strategy[];
  onUpdateCompetitions: (data: Competition[]) => void;
  onUpdateStrategies: (data: Strategy[]) => void;
  userRole?: string;
  currentUserId?: string;
}

const StrategyComponent: React.FC<StrategyProps> = ({ 
  competitions, 
  strategies, 
  onUpdateCompetitions,
  onUpdateStrategies,
  userRole = 'Athlete',
  currentUserId = '1'
}) => {
  const isCoach = userRole === 'Coach';
  const [activeTab, setActiveTab] = useState<'calendar' | 'plans'>('plans');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // -- DELETE CONFIRMATION STATE --
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);

  // -- COMPETITION STATES --
  const [isAddingCompetition, setIsAddingCompetition] = useState(false);
  const [compForm, setCompForm] = useState<Partial<Competition>>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: '',
    priority: 'C',
    groupIds: []
  });

  // -- STRATEGY STATES --
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const athletes = [
    { id: '1', name: 'Matheus Juliato' }
  ];
  
  const [targetAthleteId, setTargetAthleteId] = useState('1');
  const [viewAthleteId, setViewAthleteId] = useState(isCoach ? '1' : currentUserId);
  const [splitIncrement, setSplitIncrement] = useState<number>(50);

  const [newStrategy, setNewStrategy] = useState<Partial<Strategy>>({
    eventName: '',
    targetTime: '',
    splits: [],
    focusPoints: [],
    notes: ''
  });

  const [newSplit, setNewSplit] = useState({ distance: 50, time: '', instruction: '' });

  // --- LOGIC: COMPETITIONS ---
  const toggleGroupSelection = (groupId: string) => {
    const current = compForm.groupIds || [];
    if (current.includes(groupId)) {
      setCompForm({ ...compForm, groupIds: current.filter(id => id !== groupId) });
    } else {
      setCompForm({ ...compForm, groupIds: [...current, groupId] });
    }
  };

  const handleSaveCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name || !compForm.date || !compForm.groupIds || compForm.groupIds.length === 0) {
        alert("Preencha o nome, data e selecione ao menos um grupo.");
        return;
    }
    const competition: Competition = {
      ...compForm,
      id: Date.now().toString(),
    } as Competition;
    onUpdateCompetitions([...competitions, competition]);
    setIsAddingCompetition(false);
    setCompForm({ name: '', date: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], location: '', priority: 'C', groupIds: [] });
  };

  const handleDeleteCompetition = (id: string) => {
    if (confirm("Remover competição do calendário?")) {
      onUpdateCompetitions(competitions.filter(c => c.id !== id));
    }
  };

  const sortedCompetitions = [...competitions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- LOGIC: STRATEGIES ---
  const visibleStrategies = strategies.filter(s => 
    isCoach ? s.athleteId === viewAthleteId : s.athleteId === currentUserId
  );

  const handleUpdateSplit = (index: number, field: string, value: any) => {
    const updated = [...(newStrategy.splits || [])];
    updated[index] = { ...updated[index], [field]: value };
    setNewStrategy(prev => ({ ...prev, splits: updated }));
  };

  const handleAddManualSplit = () => {
    setNewStrategy(prev => ({
      ...prev,
      splits: [...(prev.splits || []), { ...newSplit, distance: splitIncrement }]
    }));
    setNewSplit(prev => ({ ...prev, distance: splitIncrement, time: '', instruction: '' }));
  };

  const handleSaveStrategy = () => {
    if (!newStrategy.eventName || !newStrategy.targetTime) return;
    const strategy: Strategy = {
      id: Date.now().toString(),
      eventName: newStrategy.eventName,
      targetTime: newStrategy.targetTime,
      splits: newStrategy.splits || [],
      focusPoints: newStrategy.focusPoints || [],
      notes: newStrategy.notes || '',
      athleteId: isCoach ? targetAthleteId : (currentUserId || '1')
    };
    onUpdateStrategies([...strategies, strategy]);
    setIsCreatingStrategy(false);
    setNewStrategy({ eventName: '', targetTime: '', splits: [], focusPoints: [], notes: '' });
  };

  const requestDeleteStrategy = (id: string) => {
    setStrategyToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStrategy = () => {
    if (strategyToDelete) {
      onUpdateStrategies(strategies.filter(s => s.id !== strategyToDelete));
    }
    setShowDeleteConfirm(false);
    setStrategyToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto border border-danger/20 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Excluir Plano Tático?</h3>
                <p className="text-slate-400 text-sm italic font-medium">Esta ação removerá permanentemente as instruções de prova deste nadador.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setStrategyToDelete(null); }}
                  className="px-6 py-4 bg-white/5 text-slate-400 font-black uppercase italic text-xs rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteStrategy}
                  className="px-6 py-4 bg-danger text-white font-black uppercase italic text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-danger/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
        <button onClick={() => setActiveTab('plans')} className={`px-6 py-2 text-xs font-black uppercase italic rounded-lg transition-all ${activeTab === 'plans' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Plano Tático</button>
        <button onClick={() => setActiveTab('calendar')} className={`px-6 py-2 text-xs font-black uppercase italic rounded-lg transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Calendário de Competições</button>
      </div>

      {activeTab === 'plans' && (
        <div className="space-y-6">
          {isCreatingStrategy && isCoach ? (
            <div className="bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center">
                    <Target className="mr-3 text-primary" size={24} />
                    <div>
                       <h3 className="text-lg font-black text-white italic uppercase tracking-widest leading-none">Novo Planejamento Tático</h3>
                       <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Definição de Protocolo de Execução de Prova</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCreatingStrategy(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>

              <div className="p-8 space-y-8">
                 <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-primary/20 rounded-lg text-primary"><User size={20}/></div>
                       <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Atleta Destino</span>
                          <span className="text-sm font-bold text-white uppercase italic">Defina o nadador que executará esta tática</span>
                       </div>
                    </div>
                    <select 
                      value={targetAthleteId} 
                      onChange={(e) => setTargetAthleteId(e.target.value)}
                      className="p-2.5 bg-white border border-white/10 rounded-xl text-black font-bold italic outline-none focus:ring-1 focus:ring-primary min-w-[220px]"
                    >
                      {athletes.map(a => <option key={a.id} value={a.id} className="text-black">{a.name}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Evento / Distância</label>
                       <input type="text" placeholder="Ex: 400m Livre" value={newStrategy.eventName} onChange={e => setNewStrategy({...newStrategy, eventName: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold italic outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tempo de Meta (Alvo)</label>
                       <input type="text" placeholder="00:00.00" value={newStrategy.targetTime} onChange={e => setNewStrategy({...newStrategy, targetTime: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-mono font-black italic outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                 </div>

                 {/* Campo de Notas por escrito */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FileText size={12} className="text-primary"/> Informações Adicionais / Briefing Técnico</label>
                    <textarea 
                      rows={4} 
                      value={newStrategy.notes} 
                      onChange={e => setNewStrategy({...newStrategy, notes: e.target.value})}
                      className="w-full p-4 bg-white border border-white/10 rounded-xl text-black font-medium italic outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Descreva aqui orientações específicas sobre estratégia de nado, contagem de braçadas, viradas ou mindset para a prova..."
                    />
                 </div>

                 <div className="bg-black/30 p-6 rounded-2xl border border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passagem por Parcial (m):</span>
                          <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5">
                             <button onClick={() => setSplitIncrement(50)} className={`px-4 py-1.5 text-[10px] font-black rounded transition-all ${splitIncrement === 50 ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>50m</button>
                             <button onClick={() => setSplitIncrement(100)} className={`px-4 py-1.5 text-[10px] font-black rounded transition-all ${splitIncrement === 100 ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>100m</button>
                             <button onClick={() => setSplitIncrement(25)} className={`px-4 py-1.5 text-[10px] font-black rounded transition-all ${splitIncrement === 25 ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>25m</button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       {newStrategy.splits?.map((s, idx) => (
                         <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white/5 p-2 rounded-xl border border-white/5 group animate-in slide-in-from-left-2">
                            <div className="col-span-2 text-center border-r border-white/5">
                               <input 
                                 type="number" 
                                 value={s.distance} 
                                 onChange={e => handleUpdateSplit(idx, 'distance', Number(e.target.value))}
                                 className="w-full bg-white text-[11px] font-black text-black font-mono italic text-center outline-none rounded p-1" 
                               />
                               <span className="text-[7px] text-slate-600 block uppercase font-black">METROS</span>
                            </div>
                            <div className="col-span-3">
                               <input type="text" placeholder="Passagem" value={s.time} onChange={e => handleUpdateSplit(idx, 'time', e.target.value)} className="w-full bg-white text-xs font-mono font-bold text-black border border-white/5 rounded p-1 focus:border-primary outline-none" />
                            </div>
                            <div className="col-span-6 relative">
                               <input type="text" placeholder="Instrução para este trecho..." value={s.instruction} onChange={e => handleUpdateSplit(idx, 'instruction', e.target.value)} className="w-full bg-white text-[10px] text-black font-bold italic border border-white/5 rounded p-1 focus:border-primary outline-none pr-8" />
                            </div>
                            <div className="col-span-1 text-right">
                               <button onClick={() => setNewStrategy({...newStrategy, splits: newStrategy.splits?.filter((_, i) => i !== idx)})} className="text-slate-600 hover:text-danger"><Trash2 size={14}/></button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <button onClick={handleAddManualSplit} className="mt-4 w-full py-3 border-2 border-dashed border-white/5 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:border-primary hover:text-primary transition-all flex items-center justify-center italic">
                       <Plus size={14} className="mr-2" /> Adicionar Trecho de {splitIncrement}m
                    </button>
                 </div>
              </div>

              <div className="p-8 bg-slate-900/50 border-t border-white/5 flex justify-end gap-4">
                 <button onClick={() => setIsCreatingStrategy(false)} className="px-8 py-3 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 italic">Descartar</button>
                 <button onClick={handleSaveStrategy} className="px-12 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg italic flex items-center">
                   <Save size={16} className="mr-2" /> Ativar Plano Tático
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Instruções de Prova</h2>
                 
                 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isCoach && (
                      <div className="bg-slate-900 p-1.5 rounded-xl border border-white/5 flex items-center gap-3 shadow-lg">
                         <div className="flex items-center gap-2 pl-2 border-r border-white/10 pr-2">
                            <Users size={14} className="text-primary" />
                            <span className="text-[9px] font-black text-slate-500 uppercase italic">Filtrar Nadador:</span>
                         </div>
                         <select 
                           value={viewAthleteId} 
                           onChange={(e) => setViewAthleteId(e.target.value)}
                           className="bg-white text-[10px] font-black text-black uppercase italic outline-none cursor-pointer pr-4 rounded px-2"
                         >
                           {athletes.map(a => <option key={a.id} value={a.id} className="text-black">{a.name}</option>)}
                         </select>
                      </div>
                    )}

                    {isCoach && (
                      <button onClick={() => setIsCreatingStrategy(true)} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase italic shadow-lg flex items-center hover:brightness-110 transition-all flex-1 md:flex-none">
                         <Plus size={16} className="mr-2" /> Novo Planejamento
                      </button>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {visibleStrategies.map(strat => (
                   <div key={strat.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden group hover:border-primary/20 transition-all shadow-xl relative">
                      <div className="p-6 bg-slate-900 flex justify-between items-center border-b border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner"><Target size={24}/></div>
                            <div>
                               <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{strat.eventName}</h4>
                               <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                 CÓD-TÁTICO: {strat.id.slice(-6)}
                                 {isCoach && <span className="text-primary/60">• NADADOR: {athletes.find(a => a.id === strat.athleteId)?.name || 'EQUIPE'}</span>}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase italic">Meta de Tempo</p>
                            <p className="text-2xl font-mono font-black text-primary italic neon-text">{strat.targetTime}</p>
                         </div>
                      </div>
                      
                      {strat.notes && (
                        <div className="p-6 bg-primary/5 border-b border-white/5">
                           <h5 className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12}/> Briefing do Treinador</h5>
                           <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{strat.notes}"</p>
                        </div>
                      )}

                      <div className="p-6 bg-slate-900/30">
                         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {strat.splits.map((s, i) => (
                              <div key={i} className="bg-black/40 p-3 rounded-xl border border-white/5 relative overflow-hidden group/split">
                                 <span className="absolute top-0 right-0 p-1 text-[8px] font-black text-white/10 uppercase italic">{s.distance}M</span>
                                 <p className="text-xs font-black text-white font-mono mb-1">{s.time || '--:--'}</p>
                                 <p className="text-[8px] text-primary font-black uppercase italic tracking-tighter truncate">{s.instruction}</p>
                                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 group-hover/split:scale-x-100 transition-transform"></div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="p-4 bg-black/20 flex justify-between items-center px-6">
                         <div className="flex gap-2">
                           {strat.focusPoints.length > 0 ? strat.focusPoints.map((p, i) => <span key={i} className="px-2 py-1 bg-white/5 text-[9px] text-slate-400 font-bold uppercase rounded border border-white/5 flex items-center gap-1"><Zap size={10} className="text-accent" /> {p}</span>) : (
                             <span className="text-[9px] text-slate-600 italic uppercase font-bold tracking-widest">Instrução Técnica de Performance Ativa</span>
                           )}
                         </div>
                         {isCoach && (
                           <button 
                            onClick={() => requestDeleteStrategy(strat.id)} 
                            className="text-slate-600 hover:text-danger p-2 bg-white/5 rounded-lg transition-colors"
                           >
                            <Trash2 size={16}/>
                           </button>
                         )}
                      </div>
                   </div>
                 ))}
                 {visibleStrategies.length === 0 && (
                   <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 flex flex-col items-center">
                      <Target size={48} className="text-slate-500 mb-4" />
                      <p className="italic font-black uppercase text-slate-500 tracking-widest text-xs">Aguardando definição tática do treinador.</p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Calendário de Competições</h2>
                 <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Planejamento de Picos de Performance e Logística</p>
              </div>
              
              {isCoach && !isAddingCompetition && (
                <button 
                  onClick={() => setIsAddingCompetition(true)}
                  className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase italic shadow-lg flex items-center hover:brightness-110 transition-all"
                >
                   <Plus size={16} className="mr-2" /> Agendar Nova Competição
                </button>
              )}
           </div>

           {isAddingCompetition && isCoach && (
             <div className="bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 mb-8">
                <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                   <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center"><Flag className="mr-2 text-primary" /> Novo Alvo Competitivo</h3>
                   <button onClick={() => setIsAddingCompetition(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <form onSubmit={handleSaveCompetition} className="p-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2 lg:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Evento</label><input type="text" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none focus:ring-1 focus:ring-primary" placeholder="Ex: Torneio Regional FAP" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Prioridade</label><div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                            {[
                                { id: 'A', label: 'Prioridade A' },
                                { id: 'B', label: 'Prioridade B' },
                                { id: 'C', label: 'Prioridade C' }
                            ].map(p => (
                              <button key={p.id} type="button" onClick={() => setCompForm({...compForm, priority: p.id as any})} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${compForm.priority === p.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>{p.label}</button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data de Início</label>
                         <input type="date" value={compForm.date} onChange={e => setCompForm({...compForm, date: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none focus:ring-1 focus:ring-primary" required />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data de Término</label>
                         <input type="date" value={compForm.endDate} onChange={e => setCompForm({...compForm, endDate: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none focus:ring-1 focus:ring-primary" required />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local da Competição</label>
                         <input type="text" value={compForm.location} onChange={e => setCompForm({...compForm, location: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black font-bold outline-none focus:ring-1 focus:ring-primary" placeholder="Ex: Clube Esperia, São Paulo" />
                      </div>
                      <div className="space-y-2 lg:col-span-3">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Categorias Envolvidas (Selecione uma ou mais)</label>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                            {MOCK_GROUPS.map(g => (
                              <button 
                                key={g.id} 
                                type="button" 
                                onClick={() => toggleGroupSelection(g.id)}
                                className={`flex items-center p-3 rounded-xl border transition-all ${compForm.groupIds?.includes(g.id) ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                 {compForm.groupIds?.includes(g.id) ? <CheckSquare size={16} className="mr-2" /> : <Square size={16} className="mr-2" />}
                                 <span className="text-[10px] font-black uppercase italic">{g.name}</span>
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-end gap-4 pt-4">
                      <button type="button" onClick={() => setIsAddingCompetition(false)} className="px-8 py-3 bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest italic">Cancelar</button>
                      <button type="submit" className="px-12 py-3 bg-success text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg italic flex items-center">
                         <Save size={16} className="mr-2" /> Salvar no Calendário
                      </button>
                   </div>
                </form>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedCompetitions.map(comp => (
                <div key={comp.id} className="bg-surface p-6 rounded-2xl border border-white/5 relative group hover:border-primary/30 transition-all shadow-xl">
                   <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase rounded-bl-xl italic shadow-lg ${comp.priority === 'A' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : comp.priority === 'B' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-700 text-white'}`}>Prio {comp.priority}</div>
                   
                   <div className="flex justify-between items-start mb-4 pr-16">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{comp.name}</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex flex-col text-xs text-slate-400 font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                         <span className="text-[7px] text-slate-600 uppercase mb-1">Período de Atividade</span>
                         <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-primary" />
                           {new Date(comp.date).toLocaleDateString('pt-BR')} 
                           {comp.date !== comp.endDate && ` a ${new Date(comp.endDate).toLocaleDateString('pt-BR')}`}
                         </div>
                      </div>
                      <div className="flex flex-col text-xs text-slate-400 font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                         <span className="text-[7px] text-slate-600 uppercase mb-1">Cidade / Clube</span>
                         <div className="flex items-center gap-2">
                           <MapPin size={12} className="text-danger" />
                           {comp.location}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Atletas Convocados:</p>
                      <div className="flex flex-wrap gap-1.5">
                         {comp.groupIds.map((gid, i) => (
                           <span key={i} className="bg-white/5 text-[8px] font-black text-slate-400 px-2 py-0.5 rounded border border-white/5 uppercase italic">
                              {MOCK_GROUPS.find(g => g.id === gid)?.name}
                           </span>
                         ))}
                      </div>
                   </div>

                   {new Date(comp.date) > today && (
                     <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase bg-primary/5 p-2 rounded-lg border border-primary/10 w-fit italic">
                        <Clock size={12} /> {Math.ceil((new Date(comp.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} DIAS PARA A LARGADA
                     </div>
                   )}

                   {isCoach && (
                     <button onClick={() => handleDeleteCompetition(comp.id)} className="absolute bottom-4 right-4 p-2 text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default StrategyComponent;
