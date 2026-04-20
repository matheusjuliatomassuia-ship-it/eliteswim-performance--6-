import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Calendar, Clock, AlertTriangle, Info, Bell, Save, X, User, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'Normal' | 'Importante' | 'Urgente';
}

interface AnnouncementsProps {
  userRole: string;
  userName: string;
}

const Announcements: React.FC<AnnouncementsProps> = ({ userRole, userName }) => {
  const isCoach = userRole === 'Coach';
  const [isAdding, setIsAdding] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('eliteSwim_announcements');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Alteração no Horário de Sábado',
        content: 'O treino de sábado (24/05) será antecipado para as 07:00 devido à manutenção da piscina olímpica.',
        date: new Date().toISOString(),
        author: 'Felippe Simões',
        priority: 'Importante'
      },
      {
        id: '2',
        title: 'Uniforme Novo Disponível',
        content: 'Os novos kits de treinamento chegaram na secretaria. Favor retirar até quinta-feira.',
        date: new Date(Date.now() - 86400000).toISOString(),
        author: 'Felippe Simões',
        priority: 'Normal'
      }
    ];
  });

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'Normal' as 'Normal' | 'Importante' | 'Urgente'
  });

  useEffect(() => {
    localStorage.setItem('eliteSwim_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: form.title,
      content: form.content,
      date: new Date().toISOString(),
      author: userName,
      priority: form.priority
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setIsAdding(false);
    setForm({ title: '', content: '', priority: 'Normal' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este aviso permanentemente?")) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'border-danger text-danger bg-danger/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
      case 'Importante': return 'border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]';
      default: return 'border-slate-700 text-slate-400 bg-slate-800/50';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header Visual */}
      <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
            <Megaphone className="text-primary animate-pulse" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mural de Avisos</h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Broadcast de Telemetria e Ordens</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-success rounded-full animate-ping"></div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistemas Ativos</span>
        </div>
      </div>

      {/* Form Overlay (se estiver adicionando) */}
      {isAdding && (
        <div className="bg-surface rounded-2xl border border-primary/20 shadow-2xl overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-white/5">
            <h3 className="font-black text-white uppercase italic text-[10px] tracking-widest flex items-center">
              <Bell size={14} className="mr-2 text-primary" /> Redigir Novo Aviso
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
          </div>
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Aviso</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="Ex: Treino Extra de Sábado"
                  required 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prioridade do Comunicado</label>
                <select 
                  value={form.priority} 
                  onChange={e => setForm({...form, priority: e.target.value as any})}
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-bold outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Normal">Normal (Padrão)</option>
                  <option value="Importante">Importante (Destaque Azul)</option>
                  <option value="Urgente">Urgente (Alerta Vermelho)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Corpo da Mensagem</label>
              <textarea 
                rows={4} 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-primary leading-relaxed italic placeholder:opacity-30"
                placeholder="Descreva o comunicado detalhadamente aqui..."
                required
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest italic hover:text-white transition-colors">Descartar</button>
              <button type="submit" className="px-12 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg italic flex items-center transition-all">
                <Save size={16} className="mr-2" /> Publicar no Mural
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Avisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD ESPECIAL PARA ADICIONAR (Sempre visível se não estiver editando) */}
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="hud-card rounded-2xl border-2 border-dashed border-primary/20 p-6 flex flex-col items-center justify-center min-h-[220px] group hover:border-primary/50 hover:bg-primary/5 transition-all shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all">
              <Plus size={32} />
            </div>
            <h3 className="text-sm font-black text-white italic uppercase tracking-[0.2em]">Postar Novo Aviso</h3>
            <p className="text-[9px] text-slate-500 uppercase font-mono mt-2 opacity-60">Clique para abrir o editor tático</p>
          </button>
        )}

        {announcements.map((a) => (
          <div key={a.id} className="hud-card rounded-2xl border border-white/5 p-6 relative group hover:border-white/10 transition-all flex flex-col shadow-xl min-h-[220px]">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic border flex items-center gap-1 ${getPriorityStyles(a.priority)}`}>
                {a.priority === 'Urgente' && <AlertTriangle size={8} />}
                {a.priority}
              </span>
              {(isCoach || a.author === userName) && (
                <button onClick={() => handleDelete(a.id)} className="text-slate-600 hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <h3 className="text-lg font-black text-white italic uppercase tracking-tight mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
              {a.title}
            </h3>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium italic line-clamp-4">
              "{a.content}"
            </p>

            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shadow-inner">
                  {a.author.charAt(0)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase italic truncate max-w-[80px]">{a.author}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-[8px] font-mono text-slate-600 uppercase">
                  <Calendar size={10} className="mr-1 text-primary/50" />
                  {new Date(a.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-[8px] font-mono text-slate-600 uppercase">
                  <Clock size={10} className="mr-1 text-primary/50" />
                  {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            {a.priority === 'Urgente' && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-danger rounded-full shadow-[0_0_15px_#f43f5e]"></div>
            )}
            {a.priority === 'Importante' && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-primary rounded-full shadow-[0_0_15px_#0ea5e9]"></div>
            )}
          </div>
        ))}

        {announcements.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 flex flex-col items-center justify-center bg-white/[0.01]">
            <Sparkles size={48} className="text-slate-700 mb-4" />
            <p className="italic font-black uppercase text-slate-500 tracking-widest text-xs">Mural Limpo. Aguardando Transmissão...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;