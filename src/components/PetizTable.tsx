
import React, { useState } from 'react';
import { OFFICIAL_INDICES_DATA } from '../../constants/indicesData';
import { Anchor, Waves, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';

const PetizTable: React.FC = () => {
  const [season, setSeason] = useState<'INVERNO' | 'VERAO'>('INVERNO');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  const petizEvents = [
    "50m Livre", "100m Livre", "200m Livre", "400m Livre", "800m Livre",
    "100m Costas", "200m Costas", "100m Peito", "200m Peito",
    "100m Borboleta", "200m Borboleta", "100m Medley", "200m Medley"
  ];

  const getIdx = (cat: 1 | 2) => {
    if (cat === 1) return season === 'INVERNO' ? 0 : 1;
    return season === 'INVERNO' ? 2 : 3;
  };

  const getTime = (evt: string, pool: '25m' | '50m', cat: 1 | 2) => {
    const data = OFFICIAL_INDICES_DATA.FAP[gender][pool][evt];
    if (!data) return '---';
    const val = data[getIdx(cat)];
    return val || '---';
  };

  const getHeaderBg = () => {
    if (gender === 'F') {
      return season === 'INVERNO' ? 'bg-[#5e003a]' : 'bg-[#7a0035]';
    }
    return season === 'INVERNO' ? 'bg-[#002b5e]' : 'bg-[#5e4100]';
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-surface p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${gender === 'F' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            <Anchor size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Radar Petiz FAP</h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em]">Temporada Oficial 2025 // São Paulo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setSeason('INVERNO')} 
              className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${season === 'INVERNO' ? (gender === 'F' ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]') : 'text-slate-500 hover:text-slate-300'}`}
            >
              Inverno
            </button>
            <button 
              onClick={() => setSeason('VERAO')} 
              className={`px-6 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${season === 'VERAO' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Verão
            </button>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 shadow-inner">
            <button onClick={() => setGender('M')} className={`px-4 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${gender === 'M' ? 'bg-primary text-white' : 'text-slate-500'}`}>Masc</button>
            <button onClick={() => setGender('F')} className={`px-4 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${gender === 'F' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-500'}`}>Fem</button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className={`p-4 border-b border-white/10 flex justify-between items-center transition-colors duration-500 ${getHeaderBg()}`}>
           <div className="flex items-center gap-2 text-white">
              <Waves size={18} className="animate-pulse" />
              <h3 className="text-xs font-black uppercase italic tracking-widest">
                Tabela de Índices {gender === 'M' ? 'Masculino' : 'Feminino'} // {season}
              </h3>
           </div>
           <span className="text-[9px] font-black text-white/40 italic uppercase tracking-widest flex items-center gap-2">
             <CheckCircle2 size={10}/> Dados Oficiais FAP 2025
           </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950/80">
                <th rowSpan={2} className={`p-4 text-left font-black uppercase text-[10px] italic border-r border-white/10 sticky left-0 z-30 bg-slate-900 shadow-[5px_0_10px_rgba(0,0,0,0.5)] ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>Provas</th>
                <th colSpan={2} className="p-3 text-center border-r border-white/10 text-white font-black text-xs italic uppercase bg-slate-900/50">PETIZ I</th>
                <th colSpan={2} className="p-3 text-center text-white font-black text-xs italic uppercase bg-slate-900/50">PETIZ II</th>
              </tr>
              <tr className="bg-slate-950/40 border-b border-white/5">
                <th className="p-2 text-center border-r border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Piscina 25m</th>
                <th className="p-2 text-center border-r border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">Piscina 50m</th>
                <th className="p-2 text-center border-r border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Piscina 25m</th>
                <th className="p-2 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Piscina 50m</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {petizEvents.map(event => (
                <tr key={event} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 font-black italic uppercase text-xs text-white sticky left-0 z-20 border-r border-white/10 bg-slate-900 shadow-[5px_0_10px_rgba(0,0,0,0.3)]">
                    {event}
                  </td>
                  <td className="p-3 text-center font-mono text-[11px] border-r border-white/5 text-slate-300">
                    {getTime(event, '25m', 1)}
                  </td>
                  <td className="p-3 text-center font-mono text-[11px] border-r border-white/10 text-slate-300 bg-white/[0.01]">
                    {getTime(event, '50m', 1)}
                  </td>
                  <td className={`p-3 text-center font-mono text-[11px] border-r border-white/5 font-bold ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
                    {getTime(event, '25m', 2)}
                  </td>
                  <td className={`p-3 text-center font-mono text-[11px] font-bold bg-white/[0.01] ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
                    {getTime(event, '50m', 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3 shadow-inner">
            <h4 className={`text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
              <Calendar size={14}/> Regra de Sazonalidade (FAP)
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Diferente das categorias maiores, o Petiz possui marcas distintas para o <b>Campeonato de Inverno</b> e o <b>Campeonato de Verão</b>. Os tempos de Verão são projetados considerando a evolução técnica natural do atleta ao longo do ciclo anual.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PetizTable;
