
import React, { useState, useMemo } from 'react';
import { timeToSeconds } from '../../constants';
import { OFFICIAL_INDICES_DATA } from '../../constants/indicesData';
import { Timer, Target, CheckCircle2, AlertCircle } from 'lucide-react';

const Calculator: React.FC = () => {
  const [event, setEvent] = useState('100m Livre');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [course, setCourse] = useState<'25m' | '50m'>('50m');
  const [season, setSeason] = useState<'INVERNO' | 'VERAO'>('INVERNO');
  const [userTime, setUserTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('JUVENIL 2');

  const categories = [
    { label: "PETIZ 1", cbdaIdx: { INVERNO: 0, VERAO: 0 }, fapIdx: { INVERNO: 0, VERAO: 1 } },
    { label: "PETIZ 2", cbdaIdx: { INVERNO: 0, VERAO: 0 }, fapIdx: { INVERNO: 2, VERAO: 3 } },
    { label: "INFANTIL 1", cbdaIdx: { INVERNO: 0, VERAO: 1 }, fapIdx: { INVERNO: 4, VERAO: 5 } },
    { label: "INFANTIL 2", cbdaIdx: { INVERNO: 2, VERAO: 3 }, fapIdx: { INVERNO: 6, VERAO: 7 } },
    { label: "JUVENIL 1", cbdaIdx: { INVERNO: 4, VERAO: 5 }, fapIdx: { INVERNO: 8, VERAO: 9 } },
    { label: "JUVENIL 2", cbdaIdx: { INVERNO: 6, VERAO: 7 }, fapIdx: { INVERNO: 10, VERAO: 11 } },
    { label: "JÚNIOR 1", cbdaIdx: { INVERNO: 8, VERAO: 8 }, fapIdx: { INVERNO: 12, VERAO: 12 } },
    { label: "JÚNIOR 2+", cbdaIdx: { INVERNO: 9, VERAO: 9 }, fapIdx: { INVERNO: 13, VERAO: 13 } }
  ];

  const results = useMemo(() => {
    if (!userTime || userTime.length < 5) return null;
    const inputSec = timeToSeconds(userTime);
    const catData = categories.find(c => c.label === selectedCategory);
    if (!catData) return null;

    const cbdaTimes = OFFICIAL_INDICES_DATA.CBDA?.[gender]?.[course]?.[event];
    const fapTimes = OFFICIAL_INDICES_DATA.FAP?.[gender]?.[course]?.[event];

    const calcStatus = (target: string) => {
      if (target === '---' || !target) return { status: 'n/a', diff: 0, time: '---' };
      const targetSec = timeToSeconds(target);
      const diff = inputSec - targetSec;
      return { status: diff <= 0 ? 'achieved' : 'missed', diff: diff, time: target };
    };

    const cbdaTargetIdx = season === 'INVERNO' ? catData.cbdaIdx.INVERNO : catData.cbdaIdx.VERAO;
    const fapTargetIdx = season === 'INVERNO' ? catData.fapIdx.INVERNO : catData.fapIdx.VERAO;

    return {
      nacional: calcStatus(cbdaTimes ? cbdaTimes[cbdaTargetIdx] : ''),
      estadual: calcStatus(fapTimes ? fapTimes[fapTargetIdx] : '')
    };
  }, [event, gender, course, season, userTime, selectedCategory]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-20">
      <div className={`hud-card p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-colors ${gender === 'F' ? 'border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-transparent' : 'border-primary/20 bg-gradient-to-br from-primary/10 to-transparent'}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-3 text-white rounded-2xl shadow-lg ${gender === 'F' ? 'bg-pink-500' : 'bg-primary'}`}><Target size={28} /></div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-widest leading-none">Simulador de Metas 2025</h2>
            <p className="text-[9px] text-slate-400 font-mono uppercase mt-2 italic tracking-[0.2em]">Cálculo em Tempo Real vs Índices Oficiais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end mb-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Prova de Referência</label>
            <select value={event} onChange={e => setEvent(e.target.value)} className={`w-full p-3 bg-surface border border-white/10 rounded-xl text-white font-bold outline-none text-sm uppercase italic focus:ring-1 ${gender === 'F' ? 'focus:ring-pink-500' : 'focus:ring-primary'}`}>
              {Object.keys(OFFICIAL_INDICES_DATA.CBDA.M["25m"]).map(ev => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Categoria</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={`w-full p-3 bg-surface border border-white/10 rounded-xl text-white font-bold outline-none text-sm uppercase italic focus:ring-1 ${gender === 'F' ? 'focus:ring-pink-500' : 'focus:ring-primary'}`}>
              {categories.map(cat => <option key={cat.label} value={cat.label}>{cat.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Ciclo Competitivo</label>
            <select 
              value={season} 
              onChange={e => setSeason(e.target.value as any)} 
              className={`w-full p-3 bg-slate-900 border rounded-xl font-black outline-none text-sm uppercase italic focus:ring-1 transition-all ${season === 'INVERNO' ? (gender === 'F' ? 'text-pink-400 border-pink-500/30 focus:ring-pink-400' : 'text-sky-400 border-sky-500/30 focus:ring-sky-400') : 'text-amber-400 border-amber-500/30 focus:ring-amber-400'}`}
            >
               <option value="INVERNO">INVERNO</option>
               <option value="VERAO">VERÃO</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
           <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tempo Atual / Balizamento (00:00.00)</label>
            <div className="relative">
              <Timer className={`absolute left-3 top-3 ${gender === 'F' ? 'text-pink-500' : 'text-primary'}`} size={18} />
              <input type="text" value={userTime} onChange={e => setUserTime(e.target.value)} placeholder="00:00.00" className={`w-full pl-10 pr-4 py-2.5 bg-white border-2 rounded-xl text-black font-mono font-black italic text-lg outline-none ${gender === 'F' ? 'border-pink-500/20' : 'border-primary/20'}`} />
            </div>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 h-[48px]">
            <button onClick={() => setCourse('50m')} className={`flex-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${course === '50m' ? (gender === 'F' ? 'bg-pink-500 text-white shadow-lg' : 'bg-primary text-white shadow-lg') : 'text-slate-500'}`}>P50</button>
            <button onClick={() => setCourse('25m')} className={`flex-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${course === '25m' ? (gender === 'F' ? 'bg-pink-500 text-white shadow-lg' : 'bg-primary text-white shadow-lg') : 'text-slate-500'}`}>P25</button>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 border-t border-white/5 pt-6">
           <button onClick={() => setGender('M')} className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase italic transition-all ${gender === 'M' ? 'bg-primary border-primary text-white' : 'border-white/10 text-slate-500'}`}>Masculino</button>
           <button onClick={() => setGender('F')} className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase italic transition-all ${gender === 'F' ? 'bg-pink-500 border-pink-500 text-white' : 'border-white/10 text-slate-500'}`}>Feminino</button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
          <div className={`p-8 rounded-3xl border-t-4 shadow-xl flex flex-col ${results.nacional.status === 'achieved' ? 'bg-success/5 border-success' : 'bg-slate-900 border-slate-700 opacity-80'}`}>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status Brasileiro ({season})</span>
             <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Índice Alvo: {results.nacional.time}</h4>
             {results.nacional.status === 'achieved' ? (
                <div className="text-success font-black text-sm mt-4 flex items-center gap-2 italic animate-pulse"><CheckCircle2 size={16}/> MARCA ATINGIDA</div>
             ) : (
                <div className="text-danger font-black text-sm mt-4 flex items-center gap-2 italic"><AlertCircle size={16}/> FALTAM {results.nacional.diff.toFixed(2)}s</div>
             )}
          </div>
          <div className={`p-8 rounded-3xl border-t-4 shadow-xl flex flex-col ${results.estadual.status === 'achieved' ? (gender === 'F' ? 'bg-pink-500/5 border-pink-500' : 'bg-primary/5 border-primary') : 'bg-slate-900 border-slate-700 opacity-80'}`}>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status Paulista ({season})</span>
             <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Índice Alvo: {results.estadual.time}</h4>
             {results.estadual.status === 'achieved' ? (
                <div className={`${gender === 'F' ? 'text-pink-400' : 'text-primary'} font-black text-sm mt-4 flex items-center gap-2 italic animate-pulse`}><CheckCircle2 size={16}/> MARCA ATINGIDA</div>
             ) : (
                <div className="text-danger font-black text-sm mt-4 flex items-center gap-2 italic"><AlertCircle size={16}/> FALTAM {results.estadual.diff.toFixed(2)}s</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
