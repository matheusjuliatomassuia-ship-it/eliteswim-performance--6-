
import React, { useState } from 'react';
import { Resource, ResourceType } from '../types';
import { BookOpen, Film, BrainCircuit, ExternalLink, Clock, List, Plus, X, Save, Trash2, Link as LinkIcon, Edit3, Youtube, Music, Eye } from 'lucide-react';

interface ResourcesProps {
  resources: Resource[];
  onUpdateResources: (data: Resource[]) => void;
  userRole: string;
}

const Resources: React.FC<ResourcesProps> = ({ resources, onUpdateResources, userRole }) => {
  const [activeTab, setActiveTab] = useState<ResourceType>('Book');
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Resource>>({
    type: 'Book',
    title: '',
    authorOrDirector: '',
    description: '',
    imageUrl: '',
    link: '',
    duration: '',
    steps: []
  });
  const [newStep, setNewStep] = useState('');

  const isCoach = userRole === 'Coach';
  const filteredResources = resources.filter(r => r.type === activeTab);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const newResource: Resource = {
      ...form,
      id: Date.now().toString(),
      type: activeTab
    } as Resource;
    onUpdateResources([newResource, ...resources]);
    setIsAdding(false);
    setForm({ type: activeTab, title: '', authorOrDirector: '', description: '', imageUrl: '', link: '', duration: '', steps: [] });
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setForm({ ...form, steps: [...(form.steps || []), newStep.trim()] });
    setNewStep('');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      <div className="bg-surface rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Biblioteca Técnica</h2>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-1">Sistemas de Conhecimento // v.5.0</p>
          </div>
          {isCoach && !isAdding && (
            <button onClick={() => setIsAdding(true)} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:brightness-110 flex items-center text-[10px] uppercase tracking-widest italic shadow-lg transition-all"><Plus size={16} className="mr-2" /> Adicionar Recurso</button>
          )}
        </div>
        <div className="flex bg-slate-900">
          {[
            { id: 'Book', label: 'LIVROS', icon: BookOpen },
            { id: 'Movie', label: 'FILMES/DOCS', icon: Film },
            { id: 'Mindfulness', label: 'TREINO MENTAL', icon: BrainCircuit }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex flex-col items-center py-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <tab.icon size={20} className="mb-1" />
              <span className="text-[10px] font-black uppercase italic tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="bg-surface rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-top-4">
           <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-white/5">
              <h3 className="font-black text-white uppercase italic text-[10px] tracking-widest">Adicionar {activeTab}</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
           </div>
           <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6 text-black">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Título do Recurso</label>
                    <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:ring-1 focus:ring-primary" required />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{activeTab === 'Book' ? 'Autor Principal' : 'Diretor / Canal'}</label>
                    <input type="text" value={form.authorOrDirector} onChange={e => setForm({...form, authorOrDirector: e.target.value})} className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:ring-1 focus:ring-primary" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Link Externo (URL)</label>
                    <div className="flex gap-2">
                       <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-500"><LinkIcon size={18}/></div>
                       <input type="text" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="flex-1 p-3 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:ring-1 focus:ring-primary" placeholder="Amazon, Youtube, etc." />
                    </div>
                 </div>
              </div>
              <div className="space-y-6 text-black">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Capa (Image URL)</label>
                    <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-primary" placeholder="https://..." />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Sinopse Curta</label>
                    <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary leading-relaxed italic" />
                 </div>
              </div>

              {activeTab === 'Mindfulness' && (
                <div className="md:col-span-2 bg-black/40 p-6 rounded-2xl border border-white/5">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center"><List size={14} className="mr-2 text-primary" /> Guia de Execução (Passos)</h4>
                   <div className="flex gap-2 mb-4">
                      <input type="text" value={newStep} onChange={e => setNewStep(e.target.value)} className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white" placeholder="Descreva o passo da técnica..." />
                      <button type="button" onClick={addStep} className="bg-primary p-2 rounded-lg text-white"><Plus size={18}/></button>
                   </div>
                   <div className="space-y-2">
                      {form.steps?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-white/5">
                           <span className="text-[10px] text-slate-300 font-bold italic">{i+1}. {s}</span>
                           <button type="button" onClick={() => setForm({...form, steps: form.steps?.filter((_,idx)=>idx!==i)})} className="text-danger"><Trash2 size={12}/></button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-4 border-t border-white/5 pt-6">
                 <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 italic">Cancelar</button>
                 <button type="submit" className="px-12 py-3 bg-success text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg italic flex items-center">
                    <Save size={16} className="mr-2" /> Adicionar Recurso
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* ... resto do componente ... */}
    </div>
  );
};

export default Resources;
