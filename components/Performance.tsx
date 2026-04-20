
import React, { useState, useMemo } from 'react';
import { SwimTime, Course, AthleteProfile, Group, Stroke } from '../types';
import { timeToSeconds } from '../constants';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { Trophy, Timer, Plus, X, Zap, Save, BarChart3, MapPin, Trash2, AlertTriangle, Maximize2 } from 'lucide-react';

interface PerformanceProps {
  times: SwimTime[];
  onUpdate: (times: SwimTime[]) => void;
  userRole?: string;
  athletes?: AthleteProfile[];
  groups?: Group[];
  onSyncWithRecords?: (newTime: SwimTime) => void;
  currentUserId?: string;
}

const Performance: React.FC<PerformanceProps> = ({ times, onUpdate, userRole = 'Athlete', athletes = [], onSyncWithRecords, currentUserId = '1' }) => {
  const [selectedEvent, setSelectedEvent] = useState('100m Livre');
  const [selectedCourse, setSelectedCourse] = useState<Course>(Course.LCM);
  const isCoach = userRole === 'Coach';
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || currentUserId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTimeForm, setNewTimeForm] = useState({ event: '100m Livre', course: Course.LCM, time: '', date: new Date().toISOString().split('T')[0], type: 'Treino' as any, athleteId: isCoach ? (athletes[0]?.id || currentUserId) : currentUserId, meetName: '' });

  // Controle de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timeToDelete, setTimeToDelete] = useState<string | null>(null);
  const [isChartMaximized, setIsChartMaximized] = useState(false);

  const filteredTimes = useMemo(() => {
    return times.filter(t => {
      const isCorrectEvent = t.event === selectedEvent;
      const isCorrectPool = t.course === selectedCourse;
      const isCorrectAthlete = isCoach ? (t.athleteId === selectedAthleteId) : (t.athleteId === currentUserId || !t.athleteId); 
      return isCorrectEvent && isCorrectAthlete && isCorrectPool;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [times, selectedEvent, selectedCourse, selectedAthleteId, isCoach, currentUserId]);

  const stats = useMemo(() => {
    if (filteredTimes.length === 0) return { pb: '--:--', pbSeconds: 0, avg: '--:--', last: '--:--' };
    const seconds = filteredTimes.map(t => t.seconds);
    const minSeconds = Math.min(...seconds);
    const avgSeconds = seconds.reduce((a, b) => a + b, 0) / seconds.length;
    
    const format = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = (s % 60).toFixed(2);
      return min > 0 ? `${min}:${sec.padStart(5, '0')}` : sec;
    };

    return {
      pb: filteredTimes.find(t => t.seconds === minSeconds)?.time || '--:--',
      pbSeconds: minSeconds,
      avg: format(avgSeconds),
      last: filteredTimes[filteredTimes.length - 1].time
    };
  }, [filteredTimes]);

  const inferStrokeAndDistance = (eventName: string) => {
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
    if (eventName.includes('Medley')) stroke = Stroke.IM;
    
    return { distance, stroke };
  };

  const handleRegisterTime = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!newTimeForm.time) return;
    
    // Suporte para entrada flexível (MM:SS.CC ou SS.CC)
    let rawTime = newTimeForm.time.trim();
    if (!rawTime.includes(':') && parseFloat(rawTime) < 60 && rawTime.includes('.')) {
       rawTime = `00:${rawTime.padStart(5, '0')}`;
    }

    const seconds = timeToSeconds(rawTime);
    const { distance, stroke } = inferStrokeAndDistance(newTimeForm.event);

    const newEntry: SwimTime = { 
      id: Date.now().toString(), 
      date: newTimeForm.date, 
      event: newTimeForm.event, 
      stroke, 
      distance, 
      course: newTimeForm.course, 
      time: rawTime, 
      seconds, 
      type: newTimeForm.type, 
      meetName: newTimeForm.meetName || 'Treino / Tomada',
      athleteId: isCoach ? newTimeForm.athleteId : currentUserId 
    };

    setSelectedEvent(newTimeForm.event);
    setSelectedCourse(newTimeForm.course);
    if (isCoach) setSelectedAthleteId(newTimeForm.athleteId);

    if (onSyncWithRecords) {
      onSyncWithRecords(newEntry);
    } else {
      onUpdate([...times, newEntry]); 
    }
    
    setShowAddModal(false); 
    setNewTimeForm(prev => ({ ...prev, time: '', meetName: '' }));
  };

  const requestDeleteTime = (id: string) => {
    setTimeToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTime = () => {
    if (timeToDelete) {
      onUpdate(times.filter(t => t.id !== timeToDelete));
    }
    setShowDeleteConfirm(false);
    setTimeToDelete(null);
  };

  const eventOptions = [ "50m Livre", "100m Livre", "200m Livre", "400m Livre", "800m Livre", "1500m Livre", "50m Peito", "100m Peito", "200m Peito", "50m Costas", "100m Costas", "200m Costas", "50m Borboleta", "100m Borboleta", "200m Borboleta", "100m Medley", "200m Medley", "400m Medley" ];

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto border border-danger/20 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Excluir Tempo?</h3>
                <p className="text-slate-400 text-sm italic font-medium">Esta ação removerá permanentemente esta marca dos seus registros históricos.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setTimeToDelete(null); }}
                  className="px-6 py-4 bg-white/5 text-slate-400 font-black uppercase italic text-xs rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteTime}
                  className="px-6 py-4 bg-danger text-white font-black uppercase italic text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-danger/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-black text-white uppercase italic tracking-widest flex items-center"><Zap className="mr-2 text-primary" size={20} /> Registrar Novo Tempo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleRegisterTime} className="p-8 space-y-6 text-black">
              {isCoach && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Atleta</label>
                  <select value={newTimeForm.athleteId} onChange={e => setNewTimeForm({...newTimeForm, athleteId: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                    {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prova</label>
                  <select value={newTimeForm.event} onChange={e => setNewTimeForm({...newTimeForm, event: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                    {eventOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Piscina</label>
                  <select value={newTimeForm.course} onChange={e => setNewTimeForm({...newTimeForm, course: e.target.value as Course})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                    <option value={Course.LCM}>50m</option>
                    <option value={Course.SCM}>25m</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Local / Evento</label><input type="text" placeholder="Ex: Uberlândia" value={newTimeForm.meetName} onChange={e => setNewTimeForm({...newTimeForm, meetName: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tempo (00:00.00)</label><input type="text" placeholder="00:00.00" value={newTimeForm.time} onChange={e => setNewTimeForm({...newTimeForm, time: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-primary font-mono font-black italic text-center text-3xl outline-none" /></div>
              <button type="submit" className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-xs italic flex items-center justify-center gap-2"><Save size={18} /> Salvar Marca</button>
            </form>
          </div>
        </div>
      )}

      <div className="hud-card p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col flex-1 w-full">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 italic">Analítica de Performance</label>
          <div className="flex gap-2">
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="flex-1 p-2.5 bg-white border border-white/10 rounded-xl text-xs font-bold text-black uppercase italic outline-none">
              {eventOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value as Course)} className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-black text-primary uppercase italic outline-none">
              <option value={Course.LCM}>50m</option>
              <option value={Course.SCM}>25m</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {isCoach && (
            <div className="flex-1 lg:flex-none">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 italic">Atleta Selecionado</label>
              <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} className="w-full p-2.5 bg-white border border-white/10 rounded-xl text-xs font-bold text-black uppercase italic outline-none min-w-[180px]">
                {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => setShowAddModal(true)} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:brightness-110 shadow-lg flex items-center uppercase text-[10px] tracking-widest italic flex-1 lg:flex-none justify-center">
            <Plus size={18} className="mr-2" /> Adicionar Tempo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 hud-card p-6 rounded-2xl border border-white/5 h-[400px] relative">
          <div className="absolute top-4 right-4 z-10 lg:hidden">
            <button 
              onClick={() => setIsChartMaximized(true)}
              className="p-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-primary hover:bg-white/10 transition-all shadow-xl active:scale-95"
              title="Ampliar Gráfico"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div className="h-[340px] w-full">
            {filteredTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredTimes}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.split('-').reverse().slice(0, 2).join('/')} stroke="#475569" fontSize={10} fontStyle="italic" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="seconds" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" dot={{ r: 4, fill: '#0ea5e9' }} />
                  {stats.pbSeconds > 0 && <ReferenceLine y={stats.pbSeconds} stroke="#f2ff00" strokeDasharray="5 5" opacity={0.3} />}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Timer size={64} className="text-slate-500 mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.3em] italic">Sem telemetria registrada</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="hud-card p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-center bg-gradient-to-br from-slate-900 to-black relative overflow-hidden">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Personal Best (PB)</p>
             <h4 className="text-3xl font-black text-accent italic neon-text">{stats.pb}</h4>
          </div>
          <div className="hud-card p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-center">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Média Geral</p>
             <h4 className="text-3xl font-black text-white italic">{stats.avg}</h4>
          </div>
        </div>
      </div>

      {/* MODAL DE AMPLIFICAÇÃO DO GRÁFICO */}
      {isChartMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full h-full p-4 md:p-12 flex flex-col gap-6">
              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                       <BarChart3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedEvent}</h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">{selectedCourse === Course.LCM ? '50m (LONG)' : '25m (SHORT)'}</p>
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
                    {filteredTimes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredTimes}>
                          <defs>
                            <linearGradient id="colorMaxTime" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => d.split('-').reverse().join('/')} 
                            stroke="#64748b" 
                            fontSize={11} 
                            fontStyle="italic"
                            dy={10}
                          />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
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
                          <Area 
                            type="monotone" 
                            dataKey="seconds" 
                            stroke="#0ea5e9" 
                            strokeWidth={5} 
                            fillOpacity={1} 
                            fill="url(#colorMaxTime)" 
                            dot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 10, fill: '#f2ff00', stroke: '#000', strokeWidth: 2 }} 
                          />
                          {stats.pbSeconds > 0 && (
                            <ReferenceLine 
                              y={stats.pbSeconds} 
                              stroke="#f2ff00" 
                              strokeDasharray="10 5" 
                              strokeWidth={2}
                              label={{ position: 'top', value: 'PB', fill: '#f2ff00', fontSize: 12, fontWeight: '900' }} 
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Timer size={120} className="text-slate-500 mb-6" />
                        <p className="text-xl font-black uppercase tracking-[0.5em] italic">Sem telemetria registrada</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pb-4">
                 <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Personal Best</p>
                    <h4 className="text-4xl font-black text-accent italic neon-text">{stats.pb}</h4>
                 </div>
                 <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Média Geral</p>
                    <h4 className="text-4xl font-black text-white italic">{stats.avg}</h4>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="hud-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-400 uppercase italic tracking-[0.2em]">Últimos Tempos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/80 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic">Data do Evento</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic">Tempo Oficial</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic">Local</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic">Piscina</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic text-center">Variação</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest italic">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/20">
              {filteredTimes.slice().reverse().map((t, idx, arr) => {
                const prev = arr[idx + 1]; 
                const diff = prev ? t.seconds - prev.seconds : 0;
                return ( 
                  <tr key={t.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">{t.date.split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4 font-mono font-black text-white italic text-base">{t.time}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-300 uppercase italic flex items-center gap-1.5 truncate max-w-[180px]">
                        <MapPin size={10} className="text-primary" /> {t.meetName || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-500 uppercase">{t.course}</span></td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {diff !== 0 ? ( 
                        <span className={`text-[11px] font-black italic px-2 py-1 rounded-lg ${diff < 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {diff < 0 ? '-' : '+'}{Math.abs(diff).toFixed(2)}s
                        </span> 
                      ) : <span className="text-[10px] text-slate-800">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => requestDeleteTime(t.id)}
                        className="p-2 text-slate-600 hover:text-danger bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir Registro"
                       >
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr> 
                );
              })}
              {filteredTimes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-700 italic text-xs uppercase font-black tracking-widest">Nenhum registro encontrado para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
