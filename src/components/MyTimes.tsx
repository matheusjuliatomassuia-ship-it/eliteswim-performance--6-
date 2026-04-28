
import React, { useState, useMemo } from 'react';
import { 
  Trophy, Save, Waves, Activity, CheckCircle2, Calendar, Edit2, Zap, User, Info
} from 'lucide-react';
import { timeToSeconds } from '../../constants';
import { AthleteProfile, Course, SwimTime, Stroke } from '../../types';
import { OFFICIAL_INDICES_DATA } from '../../constants/indicesData';

interface MyTimesProps {
  data: Record<string, Record<string, Record<string, string>>>;
  onUpdate: (data: Record<string, Record<string, Record<string, string>>>) => void;
  userRole?: string;
  athletes?: AthleteProfile[];
  currentUserId?: string;
  forcedCategory?: string; // Categoria vinda do perfil do usuário logado
  onGlobalSync?: (newTime: SwimTime) => void;
}

const MyTimes: React.FC<MyTimesProps> = ({ data, onUpdate, userRole = 'Athlete', athletes = [], currentUserId = '1', forcedCategory, onGlobalSync }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState(userRole === 'Coach' ? (athletes[0]?.id || '1') : currentUserId);
  const [activeCourse, setActiveCourse] = useState<Course>(Course.LCM);
  const [activeSeason, setActiveSeason] = useState<'INV' | 'VER'>('INV'); 
  
  const [lastUpdatedEvent, setLastUpdatedEvent] = useState<string | null>(null);

  const isCoach = userRole === 'Coach';
  const poolKey = activeCourse === Course.LCM ? '50m' : '25m';
  
  // FILTRO PARA REMOVER DUPLICADOS NO SELECT
  const uniqueAthletes = useMemo(() => {
    const seen = new Set();
    return athletes.filter(a => {
      const duplicate = seen.has(a.id);
      seen.add(a.id);
      return !duplicate;
    });
  }, [athletes]);

  const athlete = uniqueAthletes.find(a => a.id === selectedAthleteId);
  const athleteRecords = data[selectedAthleteId || '1'] || { '25m': {}, '50m': {} };
  const currentPBs = athleteRecords[poolKey] || {};

  const strokeGroups = [
    { name: "Nado Livre", events: ["50m Livre", "100m Livre", "200m Livre", "400m Livre", "800m Livre", "1500m Livre"], color: "text-sky-400" },
    { name: "Nado Costas", events: ["50m Costas", "100m Costas", "200m Costas"], color: "text-indigo-400" },
    { name: "Nado Peito", events: ["50m Peito", "100m Peito", "200m Peito"], color: "text-emerald-400" },
    { name: "Nado Borboleta", events: ["50m Borboleta", "100m Borboleta", "200m Borboleta"], color: "text-pink-400" },
    { name: "Nado Medley", events: ["100m Medley", "200m Medley", "400m Medley"], color: "text-amber-400" }
  ];

  // Helper para mapear string de categoria para idade técnica de referência baseada na tabela 2026
  const mapCategoryToAge = (catStr: string): number | null => {
    if (!catStr) return null;
    const s = catStr.toLowerCase();
    
    // Novas categorias detalhadas
    if (s.includes('petiz 1') || s === 'petiz1') return 11;
    if (s.includes('petiz 2') || s === 'petiz2') return 12;
    if (s.includes('infantil 1') || s === 'infantil1') return 13;
    if (s.includes('infantil 2') || s === 'infantil2') return 14;
    if (s.includes('juvenil 1') || s === 'juvenil1') return 15;
    if (s.includes('juvenil 2') || s === 'juvenil2') return 16;
    if (s.includes('júnior 1') || s.includes('junior 1') || s === 'junior1') return 17;
    if (s.includes('júnior 2') || s.includes('junior 2') || s === 'junior2') return 18;
    if (s.includes('sênior') || s.includes('senior')) return 20;
    
    // Bloco Mirim Unificado
    if (s.includes('mirim')) return 10; 
    
    return null;
  };

  const getSubCategoryLabel = (age: number) => {
    if (age <= 10) return "Mirim";
    if (age === 11) return "Petiz 1";
    if (age === 12) return "Petiz 2";
    if (age === 13) return "Infantil 1";
    if (age === 14) return "Infantil 2";
    if (age === 15) return "Juvenil 1";
    if (age === 16) return "Juvenil 2";
    if (age === 17) return "Júnior 1";
    if (age <= 19) return "Júnior 2";
    return "Sênior";
  };

  // Calcula idade competitiva (Base 2026 para temporada 2025/2026)
  const competitiveAge = useMemo(() => {
    if (athlete?.birthDate) {
      const birthYear = new Date(athlete.birthDate).getFullYear();
      return 2026 - birthYear;
    }
    if (athlete?.groupId) {
      const groupAge = mapCategoryToAge(athlete.groupId);
      if (groupAge !== null) return groupAge;
    }
    return 16; // Padrão
  }, [athlete]);

  const currentCategoryLabel = useMemo(() => {
    return getSubCategoryLabel(competitiveAge);
  }, [competitiveAge]);

  const getIndexColumns = (org: 'CBDA' | 'FAP', age: number, season: 'INV' | 'VER') => {
    if (org === 'CBDA') {
      if (age <= 13) return season === 'INV' ? 0 : 1;
      if (age === 14) return season === 'INV' ? 2 : 3;
      if (age === 15) return season === 'INV' ? 4 : 5;
      if (age === 16) return season === 'INV' ? 6 : 7;
      if (age === 17) return 8;
      if (age <= 19) return 9;
      return activeCourse === Course.LCM ? 10 : 11;
    } else {
      if (age <= 11) return season === 'INV' ? 0 : 1;
      if (age === 12) return season === 'INV' ? 2 : 3;
      if (age === 13) return season === 'INV' ? 4 : 5;
      if (age === 14) return season === 'INV' ? 6 : 7;
      if (age === 15) return season === 'INV' ? 8 : 9;
      if (age === 16) return season === 'INV' ? 10 : 11;
      if (age === 17) return 12;
      return 13;
    }
  };

  const checkIndexAchievement = (evt: string, pb: string) => {
    const isNeutral = !pb || pb === '--:--.--' || pb === '00:00.00' || pb.trim() === '';
    if (isNeutral || !athlete) return { isNational: false, isRegional: false, targetCBDA: '', targetFAP: '' };
    
    const pbSec = timeToSeconds(pb);
    const gender = athlete.gender || 'M';
    
    let hasNational = false;
    let targetCBDA = '';
    const cbdaTimes = OFFICIAL_INDICES_DATA.CBDA?.[gender]?.[poolKey]?.[evt];
    if (cbdaTimes) {
      const colIdx = getIndexColumns('CBDA', competitiveAge, activeSeason);
      targetCBDA = cbdaTimes[colIdx];
      if (targetCBDA && targetCBDA !== '---') {
        if (pbSec <= timeToSeconds(targetCBDA)) hasNational = true;
      }
    }

    let hasRegional = false;
    let targetFAP = '';
    const fapTimes = OFFICIAL_INDICES_DATA.FAP?.[gender]?.[poolKey]?.[evt];
    if (fapTimes) {
      const colIdx = getIndexColumns('FAP', competitiveAge, activeSeason);
      targetFAP = fapTimes[colIdx];
      if (targetFAP && targetFAP !== '---') {
        if (pbSec <= timeToSeconds(targetFAP)) hasRegional = true;
      }
    }

    return { isNational: hasNational, isRegional: hasRegional, targetCBDA, targetFAP };
  };

  const handleUpdateRecord = (event: string, time: string) => {
    let timeToSave = time.trim();
    const athleteKey = selectedAthleteId || '1';
    const updatedData = { ...data };

    if (!timeToSave || timeToSave === '--:--.--' || timeToSave === '00:00.00') {
      if (updatedData[athleteKey] && updatedData[athleteKey][poolKey]) {
        const newDataForAthlete = { ...updatedData[athleteKey][poolKey] };
        delete newDataForAthlete[event];
        updatedData[athleteKey] = { ...updatedData[athleteKey], [poolKey]: newDataForAthlete };
        onUpdate(updatedData);
      }
      return;
    }
    
    const regex = /^(\d{1,2}:)?\d{1,2}\.\d{2}$/;
    if (!regex.test(timeToSave)) {
      alert("Formato inválido! Use MM:SS.CC (Ex: 00:24.50)");
      return;
    }

    if (!updatedData[athleteKey]) updatedData[athleteKey] = { '25m': {}, '50m': {} };
    if (!updatedData[athleteKey][poolKey]) updatedData[athleteKey][poolKey] = {};
    
    updatedData[athleteKey][poolKey][event] = timeToSave;
    onUpdate(updatedData);

    setLastUpdatedEvent(event);
    setTimeout(() => setLastUpdatedEvent(null), 2000);
  };

  const BrazilFlag = () => (
    <div className="w-5 h-3.5 bg-[#009b3a] relative overflow-hidden flex items-center justify-center rounded-sm shadow-sm border border-white/10" title="Índice Brasileiro">
       <div className="w-[12px] h-[8px] bg-[#fedf00] [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]"></div>
       <div className="absolute w-[4px] h-[4px] bg-[#002776] rounded-full"></div>
    </div>
  );

  const SPFlag = () => (
    <div className="w-5 h-3.5 bg-white relative overflow-hidden flex flex-col justify-between rounded-sm shadow-sm border border-white/10" title="Índice Paulista">
       <div className="h-[1px] bg-black"></div>
       <div className="h-[1px] bg-black"></div>
       <div className="h-[1px] bg-black"></div>
       <div className="h-[1px] bg-black"></div>
       <div className="absolute top-0 left-0 w-2.5 h-2 bg-red-600 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-24 text-slate-200">
      <div className="bg-surface border border-white/10 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-inner">
             <Trophy size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Quadro de Recordes</h2>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-[8px] text-slate-500 uppercase font-mono tracking-widest italic">Personal Best Database</p>
               {athlete && (
                 <span className="text-[7px] bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 font-black uppercase flex items-center gap-1.5 shadow-lg">
                   <User size={8}/> CAT: {currentCategoryLabel.toUpperCase()}
                 </span>
               )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-col items-center mr-4">
            <span className="text-[7px] font-black text-slate-500 uppercase italic mb-1 tracking-widest">apenas para brasileiro</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5 shadow-inner">
              <button onClick={() => setActiveSeason('INV')} className={`px-4 py-1.5 text-[8px] font-black uppercase italic rounded-md transition-all ${activeSeason === 'INV' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-400'}`}>Inverno</button>
              <button onClick={() => setActiveSeason('VER')} className={`px-4 py-1.5 text-[8px] font-black uppercase italic rounded-md transition-all ${activeSeason === 'VER' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-400'}`}>Verão</button>
            </div>
          </div>

          {isCoach && (
            <select value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)} className="flex-1 lg:flex-none p-2 bg-white border border-white/10 rounded-lg text-black font-bold uppercase text-[10px] outline-none">
              {uniqueAthletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}

          <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5 shadow-inner">
            <button onClick={() => setActiveCourse(Course.LCM)} className={`px-4 py-1.5 text-[9px] font-black uppercase italic rounded-md transition-all ${activeCourse === Course.LCM ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Piscina 50m</button>
            <button onClick={() => setActiveCourse(Course.SCM)} className={`px-4 py-1.5 text-[9px] font-black uppercase italic rounded-md transition-all ${activeCourse === Course.SCM ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Piscina 25m</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strokeGroups.map(group => (
          <div key={group.name} className="bg-surface rounded-xl border border-white/5 overflow-hidden shadow-lg group/table">
             <div className="bg-slate-900/80 p-3 border-b border-white/5 flex justify-between items-center">
                <h3 className={`text-xs font-black uppercase italic tracking-widest ${group.color}`}>{group.name}</h3>
                <Waves size={14} className="text-slate-700" />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-black/20 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                         <th className="px-4 py-3">Evento</th>
                         <th className="px-4 py-3 text-center">Tempo PB</th>
                         <th className="px-4 py-3 text-right">Indices Alcançados ({activeSeason})</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {group.events
                        .filter(event => !(activeCourse === Course.LCM && event === '100m Medley'))
                        .map(event => {
                        const pbValue = currentPBs[event] || '--:--.--';
                        const isNeutralPB = !pbValue || pbValue === '--:--.--' || pbValue === '00:00.00' || pbValue.trim() === '';
                        const { isNational, isRegional, targetCBDA, targetFAP } = checkIndexAchievement(event, pbValue);
                        const isJustUpdated = lastUpdatedEvent === event;

                        return (
                          <tr key={event} className={`hover:bg-white/[0.03] transition-colors ${isJustUpdated ? 'bg-success/10 animate-pulse' : ''}`}>
                             <td className="px-4 py-3 text-xs font-bold text-slate-300 uppercase italic">
                               {event}
                             </td>
                             <td className="px-4 py-3 text-center relative group/input">
                                <input 
                                  key={`${activeCourse}-${selectedAthleteId}-${event}`}
                                  type="text"
                                  defaultValue={isNeutralPB ? '' : pbValue}
                                  placeholder="--:--.--"
                                  onBlur={(e) => handleUpdateRecord(event, e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                  className={`w-28 bg-transparent text-center font-mono font-black text-base italic outline-none border-b border-transparent focus:border-primary/50 focus:text-white transition-all ${isNeutralPB ? 'text-white/30 placeholder:text-white/20' : 'text-white'}`}
                                />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-30 transition-opacity">
                                   <Edit2 size={10} className="text-white" />
                                </div>
                             </td>
                             <td className="px-4 py-3 text-right">
                                {isNeutralPB ? (
                                   <span className="text-[8px] font-black text-slate-800 uppercase italic">Vazio</span>
                                ) : (
                                   <div className="flex flex-col items-end gap-1.5">
                                      <div className="flex gap-2">
                                         {isNational && <BrazilFlag />}
                                         {isRegional && <SPFlag />}
                                      </div>
                                      {!isNational && !isRegional ? (
                                         <div className="opacity-30 flex flex-col items-end">
                                            <span className="text-[7px] font-black text-slate-600 uppercase italic">Abaixo do Índice</span>
                                            <span className="text-[6px] text-slate-700 font-bold uppercase">Meta: {targetCBDA || targetFAP || '---'}</span>
                                         </div>
                                      ) : (
                                         <span className="text-[6px] text-primary/60 font-black uppercase">Marca de Elite</span>
                                      )}
                                   </div>
                                )}
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-4 shadow-inner">
         <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-primary" />
            <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest">Sistema de Conquistas (Radar: {currentCategoryLabel})</h4>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10">
               <BrazilFlag />
               <span className="text-[9px] font-bold text-slate-300 uppercase">Bandeira Brasil: Índice Brasileiro (CBDA)</span>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10">
               <SPFlag />
               <span className="text-[9px] font-bold text-slate-300 uppercase">Bandeira SP: Índice Paulista (FAP)</span>
            </div>
         </div>
         <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
            <Info size={14} className="text-primary mt-0.5" />
            <p className="text-[8px] text-slate-400 italic uppercase tracking-tighter leading-relaxed">
               Os recordes são sincronizados automaticamente com a categoria <b>{currentCategoryLabel}</b> do atleta selecionado. Ao bater um índice oficial em competição, o selo da federação correspondente aparecerá automaticamente no quadro.
            </p>
         </div>
      </div>
    </div>
  );
};

export default MyTimes;
