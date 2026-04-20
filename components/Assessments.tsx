import React, { useState } from 'react';
import { PhysicalAssessment, AthleteProfile } from '../types';
import { Ruler, Weight, User, Calendar, Save, Trash2, Plus, ArrowRight, ClipboardList, Activity, Zap, TrendingUp, Info, X } from 'lucide-react';

interface AssessmentsProps {
  userRole: string;
  assessments: PhysicalAssessment[];
  athletes: AthleteProfile[];
  onUpdateAssessments: (data: PhysicalAssessment[]) => void;
  currentUserId?: string;
}

const Assessments: React.FC<AssessmentsProps> = ({ userRole, assessments, athletes, onUpdateAssessments, currentUserId }) => {
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [form, setForm] = useState<Partial<PhysicalAssessment>>({
    date: new Date().toISOString().split('T')[0],
    wellsBench: 0,
    shoulderMobilityLeft: 3,
    shoulderMobilityRight: 3,
    t12Test: 0,
    medBallThrow: 0,
    height: 0,
    weight: 0,
    wingspan: 0,
    skinfolds: { tricepital: 0, subescapular: 0, bicepital: 0, peitoral: 0, axilar: 0, suprailiaca: 0, abdominal: 0, coxa: 0, panturrilha: 0 }
  });

  const isCoach = userRole === 'Coach';
  
  // Lógica de Identidade: Se for Atleta, ele trava no seu ID. Se for Coach, usa o seletor.
  const athleteIdToFilter = isCoach ? selectedAthleteId : currentUserId;
  
  const filteredAssessments = assessments
    .filter(a => a.athleteId === athleteIdToFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteIdToFilter) return;

    const newAssessment: PhysicalAssessment = {
      ...form,
      id: Date.now().toString(),
      athleteId: athleteIdToFilter,
    } as PhysicalAssessment;

    onUpdateAssessments([...assessments, newAssessment]);
    setViewState('list');
    alert('Avaliação salva e sincronizada com o perfil do atleta!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta avaliação permanentemente?')) {
      onUpdateAssessments(assessments.filter(a => a.id !== id));
    }
  };

  const sumSkinfolds = (folds: PhysicalAssessment['skinfolds']) => {
    return Object.values(folds).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight flex items-center">
            <ClipboardList className="mr-2 text-primary" /> Avaliações Físicas
          </h2>
          <p className="text-slate-500 text-sm">{isCoach ? 'Gestão de performance física da equipe.' : 'Seus resultados de testes e medidas antropométricas.'}</p>
        </div>

        {isCoach && viewState === 'list' && (
          <div className="flex gap-4 w-full md:w-auto">
             <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Escolher Atleta</span>
                <select 
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary min-w-[200px] text-black"
                >
                  {athletes.map(a => <option key={a.id} value={a.id} className="text-black">{a.name}</option>)}
                </select>
             </div>
             <button 
              onClick={() => setViewState('form')}
              className="bg-primary text-white font-black px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center shadow-sm self-end"
             >
               <Plus size={18} className="mr-2" /> Nova Avaliação
             </button>
          </div>
        )}

        {isCoach && viewState === 'form' && (
          <button 
            onClick={() => setViewState('list')}
            className="text-slate-500 hover:text-slate-800 font-bold text-sm underline flex items-center"
          >
            <X size={16} className="mr-1" /> Cancelar Registro
          </button>
        )}
      </div>

      {/* COACH FORM VIEW */}
      {isCoach && viewState === 'form' ? (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg animate-in slide-in-from-bottom-4">
           <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                   <User className="text-primary" />
                </div>
                <div>
                   <h3 className="font-bold uppercase tracking-widest text-xs">Avaliando: {athletes.find(a => a.id === selectedAthleteId)?.name}</h3>
                   <p className="text-[10px] text-slate-400">Entrada de telemetria física</p>
                </div>
              </div>
              <input 
                type="date" 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})}
                className="bg-white border border-slate-700 rounded px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary text-black font-bold"
              />
           </div>

           <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Coluna 1: Testes Físicos */}
              <div className="space-y-6">
                 <h4 className="font-black text-slate-800 uppercase text-xs border-b pb-2 flex items-center">
                   <Zap size={16} className="mr-2 text-amber-500" /> Testes Funcionais
                 </h4>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banco de Wells (cm)</label>
                    <input type="number" step="0.1" value={form.wellsBench} onChange={e => setForm({...form, wellsBench: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mob. Ombro E (1-5)</label>
                       <select value={form.shoulderMobilityLeft} onChange={e => setForm({...form, shoulderMobilityLeft: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-bold">
                          {[1,2,3,4,5].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mob. Ombro D (1-5)</label>
                       <select value={form.shoulderMobilityRight} onChange={e => setForm({...form, shoulderMobilityRight: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-bold">
                          {[1,2,3,4,5].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teste T12 (metros)</label>
                    <input type="number" value={form.t12Test} onChange={e => setForm({...form, t12Test: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" placeholder="Ex: 850" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Med. Ball Throw (m)</label>
                    <input type="number" step="0.01" value={form.medBallThrow} onChange={e => setForm({...form, medBallThrow: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" />
                 </div>
              </div>

              {/* Coluna 2: Antropometria */}
              <div className="space-y-6">
                 <h4 className="font-black text-slate-800 uppercase text-xs border-b pb-2 flex items-center">
                   <Ruler size={16} className="mr-2 text-primary" /> Antropometria
                 </h4>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Altura (cm)</label>
                    <input type="number" step="0.1" value={form.height} onChange={e => setForm({...form, height: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                    <input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Envergadura (cm)</label>
                    <input type="number" step="0.1" value={form.wingspan} onChange={e => setForm({...form, wingspan: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-black font-mono font-bold" />
                 </div>
              </div>

              {/* Coluna 3: Dobras Cutâneas */}
              <div className="space-y-4">
                 <h4 className="font-black text-slate-800 uppercase text-xs border-b pb-2 flex items-center">
                   <Activity size={16} className="mr-2 text-emerald-500" /> Dobras Cutâneas (mm)
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                    {Object.keys(form.skinfolds!).map((fold) => (
                      <div key={fold}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{fold}</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={(form.skinfolds as any)[fold]} 
                          onChange={e => setForm({
                            ...form, 
                            skinfolds: { ...form.skinfolds!, [fold]: Number(e.target.value) }
                          })}
                          className="w-full p-1.5 border border-slate-200 rounded bg-white text-sm font-mono text-black font-bold"
                        />
                      </div>
                    ))}
                 </div>
                 <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Somatório Σ 9 dobras</span>
                    <span className="text-2xl font-black text-emerald-700 font-mono">{sumSkinfolds(form.skinfolds!)} mm</span>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button type="submit" className="bg-slate-900 text-white font-black px-10 py-3 rounded-lg hover:bg-black shadow-lg flex items-center uppercase text-xs tracking-widest">
                <Save size={18} className="mr-2" /> Salvar Avaliação
              </button>
           </div>
        </form>
      ) : (
        /* LIST VIEW / ATHLETE VIEW */
        <div className="grid grid-cols-1 gap-6">
          {filteredAssessments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-top-4">
               <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm uppercase italic">Resumo Técnico ({new Date(filteredAssessments[0].date).toLocaleDateString()})</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Atleta: {athletes.find(a => a.id === athleteIdToFilter)?.name}</span>
                     <TrendingUp size={18} className="text-primary" />
                  </div>
               </div>
               
               <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Flex (Wells)</span>
                    <span className="text-xl font-black text-slate-800 font-mono">{filteredAssessments[0].wellsBench}cm</span>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Res. (T12)</span>
                    <span className="text-xl font-black text-primary font-mono">{filteredAssessments[0].t12Test}m</span>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Lanç. MedBall</span>
                    <span className="text-xl font-black text-amber-600 font-mono">{filteredAssessments[0].medBallThrow}m</span>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Peso / Estatura</span>
                    <span className="text-sm font-black text-slate-800 font-mono">{filteredAssessments[0].weight}kg / {filteredAssessments[0].height}cm</span>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Envergadura</span>
                    <span className="text-xl font-black text-slate-800 font-mono">{filteredAssessments[0].wingspan}cm</span>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase mb-1">Σ Dobras</span>
                    <span className="text-xl font-black text-emerald-700 font-mono">{sumSkinfolds(filteredAssessments[0].skinfolds)}mm</span>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-4 bg-white border-b flex items-center justify-between">
                <h3 className="font-bold text-slate-800 uppercase text-xs italic tracking-widest">Histórico de Performance</h3>
                <span className="text-[10px] text-slate-400 font-mono">{filteredAssessments.length} Registros Arquivados</span>
             </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                   <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso / Env.</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Σ Dobras</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Wells</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">T12</th>
                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">MedBall</th>
                        {isCoach && <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAssessments.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 italic">{new Date(a.date).toLocaleDateString()}</td>
                           <td className="px-6 py-4 text-center font-mono text-xs text-slate-600">{a.weight}kg | {a.wingspan}cm</td>
                           <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600">{sumSkinfolds(a.skinfolds)}mm</td>
                           <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{a.wellsBench}cm</td>
                           <td className="px-6 py-4 text-center font-mono font-bold text-primary">{a.t12Test}m</td>
                           <td className="px-6 py-4 text-center font-mono font-bold text-amber-600">{a.medBallThrow}m</td>
                           {isCoach && (
                             <td className="px-6 py-4 text-right">
                               <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                             </td>
                           )}
                        </tr>
                      ))}
                      {filteredAssessments.length === 0 && (
                        <tr>
                           <td colSpan={isCoach ? 7 : 6} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                              Nenhuma avaliação física registrada para este perfil.
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;