
import React, { useState } from 'react';
import { MeetRecord, AthleteProfile, AthleteEntry, Split, SwimTime, Course, Stroke, Group } from '../../types';
import { Trophy, Calendar, MapPin, Plus, Save, Trash2, X, ChevronDown, ChevronUp, User, List, Clock, Waves, Sparkles, CheckCircle2, Filter, CheckSquare, Square, Anchor, AlertTriangle } from 'lucide-react';
import { timeToSeconds, MOCK_GROUPS, normalizeSwimTime } from '../../constants';

interface MeetRecordsProps {
  records: MeetRecord[];
  athletes: AthleteProfile[];
  groups: Group[];
  onUpdateRecords: (data: MeetRecord[]) => void;
  onSyncTimes: (newTimes: SwimTime[]) => void;
  userRole: string;
}

const MeetRecords: React.FC<MeetRecordsProps> = ({ records, athletes, groups, onUpdateRecords, onSyncTimes, userRole }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [expandedMeetId, setExpandedMeetId] = useState<string | null>(null);
  
  // Controle de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [meetToDelete, setMeetToDelete] = useState<string | null>(null);

  const [meetForm, setMeetForm] = useState<Partial<MeetRecord>>({
    name: '',
    startDate: '',
    endDate: '',
    poolSize: '50m',
    location: '',
    type: 'Pool',
    groupIds: [],
    entries: []
  });

  const isCoach = userRole === 'Coach';

  const handleNewMeet = () => {
    const today = new Date().toISOString().split('T')[0];
    setMeetForm({ name: '', startDate: today, endDate: today, poolSize: '50m', location: '', type: 'Pool', groupIds: [], entries: [] });
    setViewState('form');
  };

  const handleAddAthleteEntry = () => {
    const isPool = meetForm.type === 'Pool';
    const newEntry: AthleteEntry = { id: Date.now().toString() + Math.random().toString(), athleteId: '', event: isPool ? '100m Livre' : '5k', time: '00:00.00', splits: [] };
    setMeetForm(prev => ({ ...prev, entries: [...(prev.entries || []), newEntry] }));
  };

  const handleRemoveEntryFromForm = (entryId: string) => { 
    setMeetForm(prev => ({ ...prev, entries: prev.entries?.filter(e => e.id !== entryId) })); 
  };

  const requestDeleteEvent = (meetId: string) => {
    setMeetToDelete(meetId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = () => {
    if (meetToDelete) {
      const updatedRecords = records.filter(m => m.id !== meetToDelete);
      onUpdateRecords(updatedRecords);
    }
    setShowDeleteConfirm(false);
    setMeetToDelete(null);
  };

  const handleClearAllRecords = () => {
    if (!confirm("AVISO CRÍTICO: Deseja apagar TODO o histórico de competições e resultados oficiais? Esta ação é irreversível.")) return;
    onUpdateRecords([]);
  };

  const handleUpdateEntry = (entryId: string, field: keyof AthleteEntry, value: any) => {
    setMeetForm(prev => ({ ...prev, entries: prev.entries?.map(e => e.id === entryId ? { ...e, [field]: value } : e) }));
  };

  const toggleGroupSelection = (groupId: string) => {
    const current = meetForm.groupIds || [];
    if (current.includes(groupId)) setMeetForm({ ...meetForm, groupIds: current.filter(id => id !== groupId) });
    else setMeetForm({ ...meetForm, groupIds: [...current, groupId] });
  };

  const inferStrokeAndDistance = (eventName: string, type: 'Pool' | 'OpenWater') => {
    if (type === 'OpenWater') {
      let distance = 5000;
      if (eventName === '500m') distance = 500;
      else if (eventName === '1k') distance = 1000;
      else if (eventName === '1.5k') distance = 1500;
      else if (eventName === '2k') distance = 2000;
      else if (eventName === '2.5k') distance = 2500;
      else if (eventName === '3k') distance = 3000;
      else if (eventName === '5k') distance = 5000;
      else if (eventName === '10k') distance = 10000;
      return { distance, stroke: Stroke.Free };
    }
    let distance = 100;
    if (eventName.includes('50m')) distance = 50;
    else if (eventName.includes('200m')) distance = 200;
    else if (eventName.includes('400m')) distance = 400;
    else if (eventName.includes('800m')) distance = 800;
    else if (eventName.includes('1500m')) distance = 1500;
    let stroke = Stroke.Free;
    if (eventName.includes('Costas')) stroke = Stroke.Back;
    else if (eventName.includes('Peito')) stroke = Stroke.Breast;
    else if (eventName.includes('Borboleta')) stroke = Stroke.Fly;
    else if (eventName.includes('Medley')) stroke = Stroke.IM;
    return { distance, stroke };
  };

  const handleSaveMeet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetForm.name || !meetForm.startDate) { alert("Preencha nome e data."); return; }
    if (meetForm.entries?.some(e => !e.athleteId)) { alert("Selecione atletas."); return; }
    
    const recordId = Date.now().toString();
    
    // Normaliza todos os tempos das entradas antes de salvar
    const normalizedEntries = meetForm.entries?.map(entry => ({
      ...entry,
      time: normalizeSwimTime(entry.time)
    })) || [];

    const record: MeetRecord = { ...meetForm, entries: normalizedEntries, id: recordId } as MeetRecord;
    
    const newSwimTimes: SwimTime[] = record.entries.map(entry => {
      const { distance, stroke } = inferStrokeAndDistance(entry.event, record.type || 'Pool');
      return { 
        id: `meet-${record.id}-${entry.id}`, 
        date: record.startDate, 
        event: entry.event, 
        stroke, 
        distance, 
        course: record.type === 'OpenWater' ? Course.LCM : (record.poolSize === '50m' ? Course.LCM : Course.SCM), 
        time: entry.time, 
        seconds: timeToSeconds(entry.time), 
        type: 'Competição', 
        meetName: record.name,
        meetId: recordId,
        athleteId: entry.athleteId 
      };
    });
    
    onSyncTimes(newSwimTimes);
    onUpdateRecords([record, ...records]);
    setViewState('list');
  };

  const EVENT_OPTIONS = [ "50m Livre", "100m Livre", "200m Livre", "400m Livre", "800m Livre", "1500m Livre", "50m Peito", "100m Peito", "200m Peito", "50m Costas", "100m Costas", "200m Costas", "50m Borboleta", "100m Borboleta", "200m Borboleta", "100m Medley", "200m Medley", "400m Medley" ];
  const OPEN_WATER_OPTIONS = ["500m", "1k", "1.5k", "2k", "2.5k", "3k", "5k", "10k"];
  const filteredPoolOptions = meetForm.poolSize === '25m' ? EVENT_OPTIONS : EVENT_OPTIONS.filter(e => e !== '100m Medley');

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto border border-danger/20 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Confirmar Exclusão</h3>
                <p className="text-slate-400 text-sm italic font-medium">Você realmente deseja excluir este boletim de competição? Todos os resultados vinculados serão removidos.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setMeetToDelete(null); }}
                  className="px-6 py-4 bg-white/5 text-slate-400 font-black uppercase italic text-xs rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteEvent}
                  className="px-6 py-4 bg-danger text-white font-black uppercase italic text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-danger/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center">
          <div className="p-3 bg-primary/10 rounded-xl mr-4 border border-primary/20"><Trophy className="text-primary" size={24} /></div>
          <div><h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Competições</h2><p className="text-slate-500 text-xs font-mono uppercase tracking-widest break-words">Base de Dados de Resultados Técnicos</p></div>
        </div>
        <div className="flex gap-3">
          {isCoach && records.length > 0 && viewState === 'list' && (
            <button onClick={handleClearAllRecords} className="bg-danger/10 text-danger border border-danger/20 font-black px-4 py-2.5 rounded-xl hover:bg-danger hover:text-white transition-all uppercase tracking-widest text-[9px] italic flex items-center"><Trash2 size={14} className="mr-2" /> Limpar Histórico</button>
          )}
          {isCoach && viewState === 'list' && (
            <button onClick={handleNewMeet} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:brightness-110 flex items-center uppercase tracking-widest text-[10px] italic shadow-lg"><Plus size={16} className="mr-2" /> Novo Registro</button>
          )}
        </div>
      </div>

      {viewState === 'list' ? (
        <div className="space-y-4">
          {records.map(meet => (
            <div key={meet.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-primary/20 shadow-lg">
              <div className="p-6 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpandedMeetId(expandedMeetId === meet.id ? null : meet.id)}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border italic ${meet.type === 'OpenWater' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : (meet.poolSize === '50m' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')}`}>
                         {meet.type === 'OpenWater' ? 'Águas Abertas' : `Piscina ${meet.poolSize}`}
                       </span>
                       {meet.groupIds?.map(gid => ( <span key={gid} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-white/5 text-slate-500 border border-white/5 italic">{groups.find(g => g.id === gid)?.name}</span> ))}
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight break-words">{meet.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-400 text-xs">
                       <div className="flex items-center"><Calendar size={14} className="mr-1.5 text-primary" /> {String(meet.startDate).split('-').reverse().join('/')} {meet.endDate && meet.endDate !== meet.startDate && ` a ${String(meet.endDate).split('-').reverse().join('/')}`}</div>
                       <div className="flex items-center"><MapPin size={14} className="mr-1.5 text-danger" /> <span className="break-words max-w-[200px]">{meet.location}</span></div>
                       <div className="flex items-center font-bold text-slate-300"><User size={14} className="mr-1.5 text-primary" /> {meet.entries.length} Atletas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCoach && ( 
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          requestDeleteEvent(meet.id);
                        }} 
                        className="p-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all shadow-sm group/del"
                        title="Remover Evento Todo"
                      >
                        <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                      </button> 
                    )}
                    {expandedMeetId === meet.id ? <ChevronUp size={24} className="text-primary" /> : <ChevronDown size={24} className="text-slate-600" />}
                  </div>
                </div>
              </div>
              {expandedMeetId === meet.id && (
                <div className="px-6 pb-6 pt-2 bg-black/40 border-t border-white/5">
                   <div className="space-y-4 mt-4">
                      {meet.entries.map(entry => {
                        const athlete = athletes.find(a => a.id === entry.athleteId);
                        const group = groups.find(g => g.id === athlete?.groupId);
                        return (
                          <div key={entry.id} className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden group/entry relative">
                             <div className="p-4 flex justify-between items-center border-b border-white/5 bg-slate-900">
                                <div>
                                   <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="text-[7px] font-black bg-white/10 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-widest">{group?.name || 'Geral'}</span>
                                      <p className="text-[10px] font-black text-primary uppercase break-words">{entry.event}</p>
                                   </div>
                                   <h4 className="text-white font-bold italic uppercase break-words">{athlete?.name || 'Atleta'}</h4>
                                </div>
                                <div className="flex items-center gap-6">
                                   <div className="text-right">
                                      <p className="text-[9px] text-slate-500 uppercase font-black">Oficial</p>
                                      <p className="text-xl font-mono font-black text-white italic">{entry.time}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {meet.entries.length === 0 && (
                        <div className="py-8 text-center text-slate-600 italic text-xs uppercase font-black tracking-widest">Nenhum resultado registrado neste boletim.</div>
                      )}
                   </div>
                </div>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 flex flex-col items-center">
               <Trophy size={64} className="text-slate-600 mb-6" />
               <p className="text-sm font-black uppercase text-slate-500 tracking-widest italic">Aguardando registro de boletins oficiais.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
           <form onSubmit={handleSaveMeet} className="bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="p-6 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-lg font-black text-white italic uppercase tracking-widest flex items-center"><List className="mr-2 text-primary" /> Boletim de Resultados</h3>
                 <button type="button" onClick={() => setViewState('list')} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 lg:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Campeonato</label><input type="text" value={meetForm.name} onChange={e => setMeetForm({...meetForm, name: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black outline-none focus:ring-1 focus:ring-primary font-bold" placeholder="Ex: Torneio FAP" required /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modalidade</label><div className="flex bg-black/30 p-1 rounded-xl border border-white/5"><button type="button" onClick={() => setMeetForm({...meetForm, type: 'Pool'})} className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${meetForm.type === 'Pool' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>Piscina</button><button type="button" onClick={() => setMeetForm({...meetForm, type: 'OpenWater'})} className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${meetForm.type === 'OpenWater' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>Águas Abertas</button></div></div>
                    {meetForm.type === 'Pool' && ( <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Piscina</label><div className="flex bg-black/30 p-1 rounded-xl border border-white/5"><button type="button" onClick={() => setMeetForm({...meetForm, poolSize: '25m'})} className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${meetForm.poolSize === '25m' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>25m</button><button type="button" onClick={() => setMeetForm({...meetForm, poolSize: '50m'})} className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${meetForm.poolSize === '50m' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>50m</button></div></div> )}
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Início</label><input type="date" value={meetForm.startDate} onChange={e => setMeetForm({...meetForm, startDate: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black outline-none focus:ring-1 focus:ring-primary font-mono font-bold" required /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Término</label><input type="date" value={meetForm.endDate} onChange={e => setMeetForm({...meetForm, endDate: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black outline-none focus:ring-1 focus:ring-primary font-mono font-bold" required /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local</label><input type="text" value={meetForm.location} onChange={e => setMeetForm({...meetForm, location: e.target.value})} className="w-full p-3 bg-white border border-white/10 rounded-xl text-black outline-none focus:ring-1 focus:ring-primary font-bold" placeholder="Santos / São Paulo" /></div>
                    <div className="lg:col-span-3 space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Categorias</label>
                      <div className="flex flex-wrap gap-2">
                         {groups.map(g => ( <button key={g.id} type="button" onClick={() => toggleGroupSelection(g.id)} className={`flex items-center px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${meetForm.groupIds?.includes(g.id) ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'bg-white/5 border-white/5 text-slate-500'}`}>{meetForm.groupIds?.includes(g.id) ? <CheckSquare size={14} className="mr-2" /> : <Square size={14} className="mr-2" />}{g.name}</button> ))}
                      </div>
                    </div>
                 </div>
                 <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="flex justify-between items-center"><h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Resultados</h4><button type="button" onClick={handleAddAthleteEntry} className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center"><Plus size={14} className="mr-1" /> Novo Atleta/Prova</button></div>
                    <div className="space-y-8">
                       {meetForm.entries?.map((entry) => {
                         const currentAthlete = athletes.find(a => a.id === entry.athleteId);
                         const filtered = currentAthlete?.groupId ? athletes.filter(a => a.groupId === currentAthlete.groupId) : (meetForm.groupIds?.length ? athletes.filter(a => meetForm.groupIds?.includes(a.groupId)) : athletes);
                         return (
                           <div key={entry.id} className="bg-black/30 border border-white/5 rounded-2xl p-6 relative animate-in slide-in-from-left-4">
                              <button type="button" onClick={() => handleRemoveEntryFromForm(entry.id)} className="absolute top-4 right-4 text-slate-600 hover:text-danger p-2 transition-colors"><Trash2 size={18} /></button>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Filter size={10}/> Categoria</label><select value={currentAthlete?.groupId || ''} onChange={e => { const a = athletes.find(at => at.groupId === e.target.value); handleUpdateEntry(entry.id, 'athleteId', a?.id || ''); }} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black text-xs font-bold"><option value="">Todas...</option>{groups.filter(g => meetForm.groupIds?.includes(g.id) || !meetForm.groupIds?.length).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase">Atleta</label><select value={entry.athleteId} onChange={e => handleUpdateEntry(entry.id, 'athleteId', e.target.value)} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black text-xs font-bold" required><option value="">Escolher...</option>{filtered.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase">Prova</label><select value={entry.event} onChange={e => handleUpdateEntry(entry.id, 'event', e.target.value)} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black text-xs font-bold">{(meetForm.type === 'OpenWater' ? OPEN_WATER_OPTIONS : filteredPoolOptions).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                                 <div className="space-y-2"><label className="text-[9px] font-black text-slate-600 uppercase">Tempo</label><input type="text" value={entry.time} onChange={e => handleUpdateEntry(entry.id, 'time', e.target.value)} placeholder="0.24.50" className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-black text-xs font-mono font-black italic text-center" /></div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-900/50 border-t border-white/5 flex justify-end gap-4"><button type="button" onClick={() => setViewState('list')} className="px-8 py-3 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 italic">Cancelar</button><button type="submit" className="px-12 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg italic flex items-center"><Save size={16} className="mr-2" /> Finalizar & Salvar</button></div>
           </form>
        </div>
      )}
    </div>
  );
};

export default MeetRecords;
