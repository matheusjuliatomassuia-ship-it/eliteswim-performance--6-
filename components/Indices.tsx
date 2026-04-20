
import React, { useState, useMemo } from 'react';
import { OFFICIAL_INDICES_DATA } from '../constants/indicesData';
import { Table as TableIcon, Award, Calendar, CheckCircle2, Waves, Anchor } from 'lucide-react';

const CBDA_COLS_METADATA = [
  { label: "INF 1", category: "Base", season: "INV", idx: 0 },
  { label: "INF 1", category: "Base", season: "VER", idx: 1 },
  { label: "INF 2", category: "Base", season: "INV", idx: 2 },
  { label: "INF 2", category: "Base", season: "VER", idx: 3 },
  { label: "JUV 1", category: "Base", season: "INV", idx: 4 },
  { label: "JUV 1", category: "Base", season: "VER", idx: 5 },
  { label: "JUV 2", category: "Base", season: "INV", idx: 6 },
  { label: "JUV 2", category: "Base", season: "VER", idx: 7 },
  { label: "JR 1", category: "Elite", season: "ANUAL", idx: 8 },
  { label: "JR 2+", category: "Elite", season: "ANUAL", idx: 9 },
  { label: "LENK", category: "Elite", season: "ANUAL", idx: 10 },
  { label: "FINKEL", category: "Elite", season: "ANUAL", idx: 11 }
];

const FAP_COLS_METADATA = [
  { label: "INF 1", category: "Base", season: "INV", idx: 4 },
  { label: "INF 1", category: "Base", season: "VER", idx: 5 },
  { label: "INF 2", category: "Base", season: "INV", idx: 6 },
  { label: "INF 2", category: "Base", season: "VER", idx: 7 },
  { label: "JUV 1", category: "Base", season: "INV", idx: 8 },
  { label: "JUV 1", category: "Base", season: "VER", idx: 9 },
  { label: "JUV 2", category: "Base", season: "INV", idx: 10 },
  { label: "JUV 2", category: "Base", season: "VER", idx: 11 },
  { label: "JR 1", category: "Elite", season: "ANUAL", idx: 12 },
  { label: "JR 2 / SNR", category: "Elite", season: "ANUAL", idx: 13 }
];

const Indices: React.FC = () => {
  const [org, setOrg] = useState<'CBDA' | 'FAP' | 'PETIZ_FAP'>('CBDA');
  const [seasonFilter, setSeasonFilter] = useState<'INVERNO' | 'VERAO'>('INVERNO');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [course, setCourse] = useState<'25m' | '50m'>('50m');

  const events = useMemo(() => {
    if (org === 'PETIZ_FAP') {
      return [
        "50m Livre", "100m Livre", "200m Livre", "400m Livre", "800m Livre",
        "100m Costas", "200m Costas", "100m Peito", "200m Peito",
        "100m Borboleta", "200m Borboleta", "100m Medley", "200m Medley"
      ];
    }
    const dataSource = OFFICIAL_INDICES_DATA[org][gender][course];
    return Object.keys(dataSource || {});
  }, [org, gender, course]);

  const visibleCols = useMemo(() => {
    const filter = seasonFilter === 'INVERNO' ? 'INV' : 'VER';
    const metadata = org === 'CBDA' ? CBDA_COLS_METADATA : FAP_COLS_METADATA;
    return metadata.filter(col => col.season === filter || col.season === 'ANUAL');
  }, [org, seasonFilter]);

  const getHeaderBg = () => {
    if (gender === 'F') {
      return seasonFilter === 'INVERNO' ? 'bg-[#5e003a]' : 'bg-[#7a0035]';
    }
    if (org === 'PETIZ_FAP') {
      return seasonFilter === 'INVERNO' ? 'bg-[#002b5e]' : 'bg-[#5e4100]';
    }
    if (org === 'CBDA') {
      return seasonFilter === 'INVERNO' ? 'bg-[#001b44]' : 'bg-[#443300]';
    }
    return seasonFilter === 'INVERNO' ? 'bg-[#002b5e]' : 'bg-[#5e4100]';
  };

  const FilterBox = ({ label, value, options, onChange, colorClass = "text-primary" }: any) => (
    <div className="relative flex-1 min-w-[140px]">
      <label className="absolute -top-2 left-3 bg-background px-1.5 text-[9px] font-black text-slate-500 uppercase tracking-tighter z-10">
        {label}:
      </label>
      <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-900 transition-all hover:border-primary/50">
        <select 
          value={value} 
          onChange={e => onChange(e.target.value as any)}
          className={`w-full bg-transparent font-black text-xs p-3 outline-none cursor-pointer appearance-none uppercase ${colorClass}`}
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white italic">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const getPetizTime = (evt: string, pool: '25m' | '50m', cat: 1 | 2) => {
    const data = OFFICIAL_INDICES_DATA.FAP[gender][pool][evt];
    if (!data) return '---';
    const idx = cat === 1 ? (seasonFilter === 'INVERNO' ? 0 : 1) : (seasonFilter === 'INVERNO' ? 2 : 3);
    return data[idx] || '---';
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="flex items-center gap-3 mb-2">
         <TableIcon className={gender === 'F' ? "text-pink-500" : "text-primary"} size={24} />
         <h3 className="text-xl font-black text-white italic uppercase tracking-widest leading-none">Radar de Índices Oficiais</h3>
         <div className="h-px bg-white/5 flex-1 ml-4"></div>
      </div>

      <div className="bg-surface p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-wrap gap-5 items-center backdrop-blur-md">
        <FilterBox 
          label="Federação" 
          value={org} 
          colorClass={gender === 'F' ? 'text-pink-400' : 'text-primary'}
          options={[
            {label: 'BRASILEIRO (CBDA)', value: 'CBDA'}, 
            {label: 'PAULISTA (FAP)', value: 'FAP'},
            {label: 'PETIZ (FAP)', value: 'PETIZ_FAP'}
          ]} 
          onChange={setOrg} 
        />
        
        <FilterBox 
          label="Temporada Alvo" 
          value={seasonFilter} 
          colorClass={seasonFilter === 'INVERNO' ? (gender === 'F' ? 'text-pink-400' : 'text-sky-400') : 'text-amber-400'}
          options={[
            {label: 'INVERNO', value: 'INVERNO'}, 
            {label: 'VERÃO', value: 'VERAO'}
          ]} 
          onChange={setSeasonFilter} 
        />

        {org !== 'PETIZ_FAP' && (
          <FilterBox 
            label="Metragem" 
            value={course} 
            colorClass={gender === 'F' ? 'text-pink-400' : 'text-primary'}
            options={[{label: 'OLÍMPICA (50m)', value: '50m'}, {label: 'CURTA (25m)', value: '25m'}]} 
            onChange={setCourse} 
          />
        )}
        
        <FilterBox 
          label="Gênero" 
          value={gender} 
          colorClass={gender === 'F' ? 'text-pink-400' : 'text-primary'}
          options={[{label: 'MASCULINO', value: 'M'}, {label: 'FEMININO', value: 'F'}]} 
          onChange={setGender} 
        />
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className={`p-4 border-b border-white/10 flex justify-between items-center transition-colors duration-500 ${getHeaderBg()}`}>
           <div className="flex items-center gap-2">
              {org === 'PETIZ_FAP' ? <Anchor size={18} className="text-white" /> : <Award size={18} className={gender === 'F' ? "text-pink-300" : "text-primary"} />}
              <h3 className="text-xs font-black text-white uppercase italic tracking-widest">
                Índices {org === 'PETIZ_FAP' ? 'FAP PETIZ I e II' : org} // {seasonFilter}
              </h3>
           </div>
           <span className="text-[9px] font-black text-white/40 italic uppercase tracking-widest flex items-center gap-2">
             <CheckCircle2 size={10}/> Base de Dados Sincronizada 2025
           </span>
        </div>

        <div className="overflow-x-auto">
          {org === 'PETIZ_FAP' ? (
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
                {events.map(event => (
                  <tr key={event} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 font-black italic uppercase text-xs text-white sticky left-0 z-20 border-r border-white/10 bg-slate-900 shadow-[5px_0_10px_rgba(0,0,0,0.3)]">
                      {event}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px] border-r border-white/5 text-slate-300">
                      {getPetizTime(event, '25m', 1)}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px] border-r border-white/10 text-slate-300 bg-white/[0.01]">
                      {getPetizTime(event, '50m', 1)}
                    </td>
                    <td className={`p-3 text-center font-mono text-[11px] border-r border-white/5 font-bold ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
                      {getPetizTime(event, '25m', 2)}
                    </td>
                    <td className={`p-3 text-center font-mono text-[11px] font-bold bg-white/[0.01] ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
                      {getPetizTime(event, '50m', 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/80">
                  <th className={`p-4 text-left font-black uppercase text-[10px] italic border-r border-white/10 sticky left-0 z-30 bg-slate-900 shadow-[5px_0_10px_rgba(0,0,0,0.5)] ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>Provas</th>
                  {visibleCols.map((col: any, i: number) => (
                      <th key={i} className={`p-4 text-center border-r border-white/10 whitespace-nowrap min-w-[100px] bg-slate-900/50`}>
                         <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                           {col.season === 'ANUAL' ? 'ELITE ANUAL' : `CAT. ${col.season}`}
                         </span>
                         <span className={`text-xs font-black uppercase italic ${col.season === 'INV' ? (gender === 'F' ? 'text-pink-400' : 'text-cyan-400') : col.season === 'VER' ? (gender === 'F' ? 'text-pink-500' : 'text-amber-400') : 'text-white'}`}>
                           {col.label}
                         </span>
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map(event => {
                  const rawRow = OFFICIAL_INDICES_DATA[org][gender][course][event];
                  if (!rawRow) return null;
                  return (
                    <tr key={event} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 font-black italic uppercase text-xs text-white sticky left-0 z-20 border-r border-white/10 bg-slate-900 shadow-[5px_0_10px_rgba(0,0,0,0.3)]">
                        {event}
                      </td>
                      {visibleCols.map((col: any, idx: number) => {
                        const val = rawRow[col.idx];
                        let color = "text-slate-300";
                        if (val === '---') color = "text-slate-800 opacity-20";
                        else if (col.idx >= 8 && org === 'CBDA') color = gender === 'F' ? "text-pink-400 font-black neon-text-sm" : "text-primary font-black neon-text-sm";
                        return (
                          <td key={idx} className={`p-3 text-center font-mono text-[11px] border-r border-white/5 whitespace-nowrap ${color}`}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3 shadow-inner">
            <h4 className={`text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 ${gender === 'F' ? 'text-pink-400' : 'text-primary'}`}>
              <Calendar size={14}/> Sazonalidade dos Índices
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              {org === 'PETIZ_FAP' 
                ? "Para o Petiz, as marcas de Verão são projetadas considerando a evolução técnica natural do atleta ao longo do ciclo anual, sendo geralmente mais exigentes que as de Inverno."
                : "As marcas de Inverno referem-se aos campeonatos do primeiro semestre. As marcas de Verão são geralmente mais exigentes e aplicam-se ao segundo semestre."
              }
            </p>
         </div>
      </div>
    </div>
  );
};

export default Indices;
