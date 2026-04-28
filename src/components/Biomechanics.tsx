import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiomechanicsAnalysis, AthleteProfile, Stroke, DrawingData } from '../../types';
import { saveVideoLocal, getVideoLocal } from '../../services/videoStorage';
import { 
  Video, Plus, Trash2, X, Save, UploadCloud, Play, Pause, 
  RotateCw, Timer, Scissors, Eraser, 
  FileVideo, Undo2, MousePointer,
  ChevronLeft, ChevronRight, RotateCcw, Calendar, Loader2,
  Search, ArrowUpRight, Hand, Zap, Clock, Activity,
  Ruler, Minus, CornerUpRight, FileText, CheckCircle2, MessageSquare, AlertCircle, User, Filter, History
} from 'lucide-react';

interface BiomechanicsProps {
  userRole: string;
  analyses: BiomechanicsAnalysis[];
  athletes: AthleteProfile[];
  onUpdateAnalyses: (data: BiomechanicsAnalysis[]) => void;
  onDeleteAnalysis: (id: string) => void;
  currentUserId?: string;
}

type Tool = 'pointer' | 'arrow' | 'curvedArrow' | 'line' | 'angle' | 'zoom' | 'eraser';

const Biomechanics: React.FC<BiomechanicsProps> = ({ userRole, analyses, athletes, onUpdateAnalyses, onDeleteAnalysis, currentUserId }) => {
  const [viewState, setViewState] = useState<'list' | 'viewer' | 'upload'>('list');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [listFilterAthleteId, setListFilterAthleteId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados do Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [showGrid, setShowGrid] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);
  
  // Dados de Análise
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([]);
  const [wallTimer, setWallTimer] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [strokeCount, setStrokeCount] = useState(0);
  const [zoomRect, setZoomRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Estados do Relatório Técnico
  const [coachNotes, setCoachNotes] = useState('');
  const [focusPoints, setFocusPoints] = useState<string[]>([]);
  const [newFocusPoint, setNewFocusPoint] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeAnalysis = analyses.find(a => a.id === selectedAnalysisId);

  // Estados de Upload
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    athleteId: '',
    stroke: Stroke.Free,
    date: new Date().toISOString().split('T')[0]
  });

  const isCoach = userRole === 'Coach';

  // --- RESOLVER VÍDEO ---
  useEffect(() => {
    let objectUrl = '';
    const resolveUrl = async () => {
      if (!activeAnalysis) return;
      setIsResolving(true);
      try {
        if (activeAnalysis.videoUrl.startsWith('local-id:')) {
          const blob = await getVideoLocal(activeAnalysis.videoUrl.replace('local-id:', ''));
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setResolvedVideoUrl(objectUrl);
          }
        } else {
          setResolvedVideoUrl(activeAnalysis.videoUrl);
        }
      } catch (e) {
        console.error("Erro na fonte:", e);
      } finally {
        setIsResolving(false);
      }
    };
    resolveUrl();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [activeAnalysis?.id]);

  useEffect(() => {
    if (activeAnalysis) {
      setDrawings(activeAnalysis.drawings || []);
      setWallTimer({ start: activeAnalysis.pushOffTime || null, end: null });
      setStrokeCount(activeAnalysis.strokeEvents?.length || 0);
      setCoachNotes(activeAnalysis.coachNotes || '');
      setFocusPoints(activeAnalysis.focusPoints || []);
      setZoomScale(1);
      setZoomOffset({ x: 0, y: 0 });
    }
  }, [activeAnalysis?.id]);

  // --- LÓGICA DE FILTRAGEM ---
  const getVisibleAnalyses = () => {
    let filtered = analyses;
    if (isCoach) {
      if (listFilterAthleteId !== 'all') {
        filtered = filtered.filter(a => a.athleteId === listFilterAthleteId);
      }
    } else {
      filtered = filtered.filter(a => a.athleteId === currentUserId);
    }

    if (searchTerm) {
      filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  };

  const visibleAnalyses = getVisibleAnalyses().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- LÓGICA DE COORDENADAS (NORMALIZADAS 0-1) ---
  const getPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    setIsMouseDown(true);

    if (activeTool === 'zoom') {
      setZoomRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    if (activeTool === 'eraser') {
      setDrawings(prev => prev.filter(d => !d.points.some(p => Math.abs(p.x - pos.x) < 0.04 && Math.abs(p.y - pos.y) < 0.04)));
      return;
    }

    if (activeTool === 'angle' || activeTool === 'curvedArrow') {
      if (tempPoints.length < 3) {
        const updatedPoints = [...tempPoints, pos];
        if (updatedPoints.length === 3) {
          let val = 0;
          if (activeTool === 'angle') {
            const a1 = Math.atan2(updatedPoints[0].y - updatedPoints[1].y, updatedPoints[0].x - updatedPoints[1].x);
            const a2 = Math.atan2(updatedPoints[2].y - updatedPoints[1].y, updatedPoints[2].x - updatedPoints[1].x);
            val = Math.round(Math.abs((a1 - a2) * 180 / Math.PI));
            if (val > 180) val = 360 - val;
          }
          setDrawings(prev => [...prev, { id: Date.now().toString(), type: activeTool, points: updatedPoints, color: '#fbbf24', angleValue: val }]);
          setTempPoints([]);
        } else {
          setTempPoints(updatedPoints);
        }
      }
      return;
    }

    if (activeTool === 'arrow' || activeTool === 'line') {
      setTempPoints([pos, pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown) return;
    const pos = getPos(e);
    
    if (activeTool === 'zoom' && zoomRect) {
      setZoomRect({ ...zoomRect, w: pos.x - zoomRect.x, h: pos.y - zoomRect.y });
    } else if (activeTool === 'arrow' || activeTool === 'line') {
      setTempPoints(prev => [prev[0], pos]);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    
    if (activeTool === 'zoom' && zoomRect) {
      const minSize = 0.05;
      if (Math.abs(zoomRect.w) > minSize && Math.abs(zoomRect.h) > minSize) {
        const scale = 1 / Math.max(Math.abs(zoomRect.w), Math.abs(zoomRect.h));
        setZoomScale(Math.min(scale, 5));
        setZoomOffset({
          x: (0.5 - (zoomRect.x + zoomRect.w / 2)) * 100,
          y: (0.5 - (zoomRect.y + zoomRect.h / 2)) * 100
        });
      } else {
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
      }
      setZoomRect(null);
    }

    if (tempPoints.length === 2 && (activeTool === 'arrow' || activeTool === 'line')) {
      setDrawings(prev => [...prev, { id: Date.now().toString(), type: activeTool, points: tempPoints, color: '#3b82f6' }]);
      setTempPoints([]);
    }
  };

  const handleUndo = () => {
    if (drawings.length > 0) setDrawings(prev => prev.slice(0, -1));
  };

  const handleWallTimerToggle = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    if (wallTimer.start === null || wallTimer.end !== null) {
      setWallTimer({ start: time, end: null });
    } else {
      setWallTimer({ ...wallTimer, end: time });
    }
  };

  const handleAddFocusPoint = () => {
    if (!newFocusPoint.trim()) return;
    setFocusPoints([...focusPoints, newFocusPoint.trim()]);
    setNewFocusPoint('');
  };

  const handleRemoveFocusPoint = (idx: number) => {
    setFocusPoints(focusPoints.filter((_, i) => i !== idx));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for(let i=0; i<w; i+=w/10) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke(); }
      for(let i=0; i<h; i+=h/10) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(w,i); ctx.stroke(); }
    }

    if (activeTool === 'zoom' && zoomRect) {
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(zoomRect.x * w, zoomRect.y * h, zoomRect.w * w, zoomRect.h * h);
      ctx.setLineDash([]);
    }

    const renderD = (d: any) => {
      ctx.strokeStyle = d.type === 'angle' ? '#fbbf24' : '#3b82f6'; 
      ctx.lineWidth = 3; 
      ctx.lineCap = 'round';
      
      if (d.type === 'line' || d.type === 'arrow') {
        ctx.beginPath(); 
        ctx.moveTo(d.points[0].x*w, d.points[0].y*h); 
        ctx.lineTo(d.points[1].x*w, d.points[1].y*h); 
        ctx.stroke();
        
        if (d.type === 'arrow') {
          const a = Math.atan2(d.points[1].y-d.points[0].y, d.points[1].x-d.points[0].x);
          ctx.beginPath(); ctx.moveTo(d.points[1].x*w, d.points[1].y*h);
          ctx.lineTo(d.points[1].x*w - 15*Math.cos(a-Math.PI/6), d.points[1].y*h - 15*Math.sin(a-Math.PI/6));
          ctx.lineTo(d.points[1].x*w - 15*Math.cos(a+Math.PI/6), d.points[1].y*h - 15*Math.sin(a+Math.PI/6));
          ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        }
      } else if (d.type === 'angle' && d.points.length >= 2) {
        ctx.beginPath(); ctx.moveTo(d.points[0].x*w, d.points[0].y*h);
        for(let i=1; i<d.points.length; i++) ctx.lineTo(d.points[i].x*w, d.points[i].y*h);
        ctx.stroke();
        if (d.points.length === 3) {
          ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 16px Inter';
          ctx.fillText(`${d.angleValue}°`, d.points[1].x*w + 12, d.points[1].y*h - 12);
        }
      } else if (d.type === 'curvedArrow' && d.points.length >= 2) {
        ctx.beginPath(); ctx.moveTo(d.points[0].x*w, d.points[0].y*h);
        if (d.points.length === 3) {
          ctx.quadraticCurveTo(d.points[1].x*w, d.points[1].y*h, d.points[2].x*w, d.points[2].y*h);
          const a = Math.atan2(d.points[2].y - d.points[1].y, d.points[2].x - d.points[1].x);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(d.points[2].x*w, d.points[2].y*h);
          ctx.lineTo(d.points[2].x*w - 15*Math.cos(a-Math.PI/6), d.points[2].y*h - 15*Math.sin(a-Math.PI/6));
          ctx.lineTo(d.points[2].x*w - 15*Math.cos(a+Math.PI/6), d.points[2].y*h - 15*Math.sin(a+Math.PI/6));
          ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        } else {
          ctx.lineTo(d.points[1].x*w, d.points[1].y*h);
          ctx.stroke();
        }
      }
    };
    
    drawings.forEach(renderD);
    if (tempPoints.length > 0) renderD({ type: activeTool, points: tempPoints });
  }, [drawings, tempPoints, showGrid, activeTool, zoomRect]);

  useEffect(() => {
    let frame: number;
    const loop = () => { draw(); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  const getWallDisplay = () => {
    if (wallTimer.start === null) return "0.000";
    const end = wallTimer.end || currentTime;
    return Math.max(0, end - wallTimer.start).toFixed(3);
  };

  const handleSaveLab = () => {
    if (activeAnalysis) {
      onUpdateAnalyses(analyses.map(a => a.id === activeAnalysis.id ? {
        ...a, 
        drawings, 
        pushOffTime: wallTimer.start || 0, 
        coachNotes,
        focusPoints,
        strokeEvents: Array(strokeCount).fill({id:'',time:0})
      } : a));
      alert("Relatório Biomecânico finalizado! O atleta já pode visualizar o feedback.");
      setViewState('list'); // Voltar para a lista após finalizar
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-surface border border-white/5 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex items-center">
          {viewState !== 'list' && <button onClick={() => setViewState('list')} className="mr-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors"><ChevronLeft size={20}/></button>}
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center">
              <Video className="mr-2 text-primary" size={22} /> {viewState === 'viewer' ? activeAnalysis?.title : 'Laboratório Biomecânico'}
            </h2>
            <p className="text-slate-500 text-[9px] font-mono uppercase tracking-widest">Análise de Performance de Elite</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isCoach && viewState === 'list' && (
             <button onClick={() => setViewState('upload')} className="bg-primary text-white font-black px-6 py-2 rounded-xl hover:brightness-110 flex items-center uppercase tracking-widest text-[10px] italic shadow-lg"><Plus size={16} className="mr-2" /> Novo Vídeo</button>
          )}
          {viewState === 'viewer' && isCoach && (
            <>
              <button onClick={handleUndo} className="p-2 bg-white/5 text-slate-400 rounded-lg hover:text-white" title="Desfazer"><Undo2 size={18}/></button>
              <button onClick={() => { if(confirm("Limpar todas as marcações?")) { setDrawings([]); setStrokeCount(0); setWallTimer({start:null, end:null}); setZoomScale(1); setZoomOffset({x:0,y:0}); setCoachNotes(''); setFocusPoints([]); }}} className="p-2 bg-white/5 text-danger/60 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors" title="Limpar Tudo"><RotateCcw size={18}/></button>
            </>
          )}
        </div>
      </div>

      {viewState === 'list' ? (
        <div className="space-y-6">
           {/* Cabeçalho do Histórico */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                 <History size={20} className="text-primary" />
                 <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Histórico de Avaliações</h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                 <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <Search size={14} className="text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar análise..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-white outline-none font-bold"
                    />
                 </div>

                 {isCoach && (
                   <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center gap-3">
                      <Filter size={14} className="text-slate-500" />
                      <select 
                        value={listFilterAthleteId}
                        onChange={e => setListFilterAthleteId(e.target.value)}
                        className="bg-transparent text-white font-bold text-[10px] outline-none cursor-pointer uppercase"
                      >
                        <option value="all" className="bg-surface">Todos os Atletas</option>
                        {athletes.map(a => <option key={a.id} value={a.id} className="bg-surface">{a.name}</option>)}
                      </select>
                   </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleAnalyses.map(analysis => {
                const athlete = athletes.find(a => a.id === analysis.athleteId);
                const hasReport = (analysis.coachNotes && analysis.coachNotes.length > 5) || (analysis.focusPoints && analysis.focusPoints.length > 0);
                
                return (
                  <div key={analysis.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-sm hover:border-primary/30 transition-all group cursor-pointer flex flex-col" onClick={() => { setSelectedAnalysisId(analysis.id); setViewState('viewer'); }}>
                      <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                        <FileVideo size={48} className="text-slate-800 z-0" />
                        <div className="absolute top-3 right-3 z-20">
                           {hasReport ? (
                             <span className="bg-success/20 text-success text-[7px] font-black px-2 py-0.5 rounded border border-success/30 uppercase italic flex items-center gap-1">
                                <CheckCircle2 size={8} /> Relatório Concluído
                             </span>
                           ) : (
                             <span className="bg-amber-500/20 text-amber-500 text-[7px] font-black px-2 py-0.5 rounded border border-amber-500/30 uppercase italic">
                                Sem Parecer Técnico
                             </span>
                           )}
                        </div>
                        <div className="absolute bottom-4 left-4 z-20">
                            <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase mb-1 block w-fit italic">{analysis.stroke}</span>
                            <h4 className="text-white font-black italic tracking-tight text-sm line-clamp-1">{analysis.title}</h4>
                            {isCoach && <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1"><User size={10} className="text-primary"/> {athlete?.name || 'Atleta Sincronizado'}</p>}
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center bg-slate-900/50 mt-auto">
                        <div className="flex items-center text-[9px] font-black text-slate-500 uppercase font-mono"><Calendar size={12} className="mr-1" /> {analysis.date.split('-').reverse().join('/')}</div>
                        <div className="flex items-center gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setSelectedAnalysisId(analysis.id); setViewState('viewer'); }} className="text-slate-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                           {isCoach && <button onClick={(e) => { e.stopPropagation(); onDeleteAnalysis(analysis.id); }} className="text-slate-600 hover:text-danger ml-2"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                  </div>
                );
              })}
              {visibleAnalyses.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                   <Video size={48} className="mx-auto mb-4 text-slate-700 opacity-20" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">Nenhuma avaliação biomecânica registrada no histórico.</p>
                </div>
              )}
           </div>
        </div>
      ) : viewState === 'upload' ? (
        <div className="max-w-xl mx-auto hud-card p-8 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-4">
           <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-6 flex items-center"><UploadCloud className="mr-2 text-primary" /> Carregar Filmagem</h3>
           <form onSubmit={async (e) => { e.preventDefault(); if(!selectedFile || !uploadForm.athleteId) return; setIsUploading(true); const vidId = `vid_${Date.now()}`; await saveVideoLocal(vidId, selectedFile); onUpdateAnalyses([...analyses, { ...uploadForm, id: Date.now().toString(), videoUrl: `local-id:${vidId}`, coachNotes: '', focusPoints: [] }]); setViewState('list'); setIsUploading(false); }} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative">
                 <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                 <FileVideo size={48} className="mx-auto mb-4 text-slate-700" />
                 <p className="text-slate-400 font-bold uppercase text-xs">{selectedFile ? selectedFile.name : 'Selecionar Arquivo Local'}</p>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vincular ao Atleta</label>
                 <select 
                  value={uploadForm.athleteId}
                  onChange={e => setUploadForm({...uploadForm, athleteId: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-primary font-bold"
                  required
                 >
                   <option value="" className="bg-surface text-slate-500">Selecionar Atleta...</option>
                   {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título da Análise</label>
                 <input type="text" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-primary" placeholder="Ex: Análise de Virada - Regional" required />
              </div>
              
              <button type="submit" disabled={isUploading || !selectedFile || !uploadForm.athleteId} className="w-full bg-primary text-white font-black py-4 rounded-xl hover:brightness-110 transition-all uppercase tracking-widest disabled:opacity-50 mt-4 shadow-xl">
                 {isUploading ? 'Processando Telemetria...' : 'Iniciar Laboratório'}
              </button>
           </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Ferramentas */}
            <div className="lg:col-span-1 space-y-4">
                <div className="hud-card p-5 rounded-xl border border-white/5 space-y-6">
                  <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Ferramentas Técnicas</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          {id:'pointer', icon: MousePointer, label: 'Seleção'},
                          {id:'line', icon: Minus, label: 'Linha Reta'},
                          {id:'arrow', icon: ArrowUpRight, label: 'Seta de Direção'},
                          {id:'curvedArrow', icon: CornerUpRight, label: 'Seta Curva / Fluxo'},
                          {id:'angle', icon: Ruler, label: 'Ângulo / Goniômetro'},
                          {id:'zoom', icon: Search, label: 'Lupa (Arraste para ampliar)'},
                          {id:'eraser', icon: Eraser, label: 'Apagar Marcação'}
                        ].map(t => (
                          <button key={t.id} disabled={!isCoach} onClick={() => setActiveTool(t.id as Tool)} title={t.label} className={`p-2 rounded flex justify-center transition-all disabled:opacity-30 ${activeTool === t.id ? 'bg-primary text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-900 text-slate-600 hover:text-slate-400'}`}><t.icon size={18}/></button>
                        ))}
                      </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Métricas de Água</p>
                      
                      <button disabled={!isCoach} onClick={() => setStrokeCount(s => s + 1)} className="w-full p-3 rounded bg-accent text-black font-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50">
                        <Hand size={18}/> <span>BRAÇADAS</span>
                        <span className="ml-auto bg-black/10 px-2 py-0.5 rounded font-mono text-sm">{strokeCount}</span>
                      </button>

                      <button disabled={!isCoach} onClick={handleWallTimerToggle} className={`w-full p-3 rounded font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${wallTimer.start && !wallTimer.end ? 'bg-danger text-white animate-pulse' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                        <Timer size={18}/> <span>{wallTimer.start && !wallTimer.end ? 'PARAR PAREDE' : 'START PAREDE'}</span>
                      </button>
                  </div>

                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                      <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Tempo Parede:</span><span className={`text-lg font-black italic font-mono ${wallTimer.end ? 'text-success' : 'text-primary'}`}>{getWallDisplay()}s</span></div>
                  </div>
                </div>
            </div>

            {/* Player Central */}
            <div className="lg:col-span-3 space-y-4">
                <div className="relative group rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black">
                  {isResolving ? (
                      <div className="aspect-video flex items-center justify-center text-slate-600 font-mono text-xs uppercase tracking-widest"><Loader2 className="animate-spin mr-2" /> Decodificando Vídeo...</div>
                  ) : (
                      <div className="relative aspect-video overflow-hidden" style={{ cursor: isCoach ? (activeTool === 'pointer' ? 'default' : 'crosshair') : 'default' }}>
                        <div className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center"
                              style={{ 
                                transform: `rotate(${rotation}deg) scale(${zoomScale}) translate(${zoomOffset.x}%, ${zoomOffset.y}%)`,
                                transformOrigin: 'center center'
                              }}>
                            <video ref={videoRef} src={resolvedVideoUrl} className="max-w-full max-h-full" playsInline onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
                            <canvas ref={canvasRef} width={1280} height={720} className={`absolute inset-0 z-10 ${isCoach ? 'pointer-events-auto' : 'pointer-events-none'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => setIsMouseDown(false)} />
                        </div>
                        
                        <div className="absolute top-4 left-4 z-20 pointer-events-none space-y-2">
                            <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xl flex items-center uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></span> Análise {isCoach ? 'Ativa' : 'do Técnico'}
                            </div>
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded text-white font-mono text-[10px]">
                              TIME: {currentTime.toFixed(3)}s
                            </div>
                        </div>
                      </div>
                  )}

                  <div className="bg-slate-900/95 p-4 border-t border-white/10">
                      <div className="flex items-center gap-4 mb-4">
                        <input type="range" min="0" max={duration || 0} step="0.001" value={currentTime} onChange={e => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="flex-1 accent-primary h-1 bg-white/10 rounded-full" />
                        <span className="text-[10px] font-mono text-slate-400 w-20 text-right">{currentTime.toFixed(3)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()} className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">{isPlaying ? <Pause fill="white"/> : <Play fill="white" className="ml-1"/>}</button>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase mr-1">Velocidade:</span>
                              <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                                {[0.25, 0.5, 0.75, 1].map(r => (
                                  <button key={r} onClick={() => { setPlaybackRate(r); if(videoRef.current) videoRef.current.playbackRate = r; }} className={`px-2.5 py-1 text-[9px] font-black rounded transition-all ${playbackRate === r ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}>{r.toFixed(2)}x</button>
                                ))}
                              </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setRotation(r => (r+90)%360)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Girar Vídeo 90°"><RotateCw size={18}/></button>
                            <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1 text-[9px] font-black rounded border transition-colors ${showGrid ? 'border-primary text-primary shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'border-white/10 text-slate-600'}`}>GRID</button>
                            {isCoach && (
                               <button onClick={handleSaveLab} className="bg-success text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase italic shadow-lg hover:brightness-110 flex items-center gap-2 transition-all"><Save size={14}/> FINALIZAR ANÁLISE</button>
                            )}
                        </div>
                      </div>
                  </div>
                </div>
            </div>
          </div>

          {/* RELATÓRIO TÉCNICO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pontos de Atenção */}
            <div className="hud-card rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-white/5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center italic">
                    <CheckCircle2 size={16} className="mr-2 text-accent" /> Pontos de Atenção (Gatilhos)
                  </h3>
               </div>
               <div className="p-6 space-y-4">
                  {isCoach && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newFocusPoint}
                        onChange={e => setNewFocusPoint(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddFocusPoint()}
                        placeholder="Ex: Cotovelo baixo na pegada"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button onClick={handleAddFocusPoint} className="bg-primary p-2 rounded-lg text-white hover:brightness-110"><Plus size={18}/></button>
                    </div>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {focusPoints.length > 0 ? focusPoints.map((point, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                           <span className="text-xs text-slate-300 font-medium italic">{point}</span>
                        </div>
                        {isCoach && <button onClick={() => handleRemoveFocusPoint(idx)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>}
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-8 italic opacity-50">Nenhum ponto de atenção listado.</p>
                    )}
                  </div>
               </div>
            </div>

            {/* Parecer do Treinador */}
            <div className="hud-card rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-white/5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center italic">
                    <MessageSquare size={16} className="mr-2 text-primary" /> Observações do Treinador
                  </h3>
                  <FileText size={14} className="text-slate-500" />
               </div>
               <div className="p-6">
                  <textarea 
                    value={coachNotes}
                    readOnly={!isCoach}
                    onChange={e => setCoachNotes(e.target.value)}
                    placeholder={isCoach ? "Escreva aqui a análise biomecânica detalhada..." : "Aguardando parecer do treinador..."}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none font-medium italic disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between mt-3 px-2">
                     <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Atleta: {athletes.find(a => a.id === activeAnalysis?.athleteId)?.name}</span>
                     <div className="flex items-center gap-1">
                        <AlertCircle size={10} className="text-primary" />
                        <span className="text-[9px] text-slate-400 font-mono">BIOMECH-REPORT-v2</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biomechanics;
