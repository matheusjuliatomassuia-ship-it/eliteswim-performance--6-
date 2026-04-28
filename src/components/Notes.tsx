import React, { useState } from 'react';
import { Note, NoteCategory } from '../../types';
import { MOCK_NOTES } from '../../constants';
import { Plus, Trash2, Calendar, StickyNote } from 'lucide-react';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [newNote, setNewNote] = useState<{title: string, content: string, category: NoteCategory}>({
    title: '',
    content: '',
    category: 'Geral'
  });

  const categories: NoteCategory[] = ['Geral', 'Técnica', 'Mental', 'Nutrição', 'Logística'];

  const getCategoryColor = (cat: NoteCategory) => {
    switch(cat) {
      case 'Técnica': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mental': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Nutrição': return 'bg-green-100 text-green-800 border-green-200';
      case 'Logística': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const noteEntry: Note = {
      id: Math.random().toString(36).slice(2, 11),
      date: new Date().toISOString().split('T')[0],
      title: newNote.title,
      content: newNote.content,
      category: newNote.category
    };

    setNotes([noteEntry, ...notes]);
    setNewNote({ title: '', content: '', category: 'Geral' });
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta anotação?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Note Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <StickyNote className="mr-2 text-primary" /> Nova Anotação
        </h2>
        <form onSubmit={handleAddNote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Ex: Correção Virada Costas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={newNote.category}
                onChange={(e) => setNewNote({...newNote, category: e.target.value as NoteCategory})}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Digite sua anotação aqui..."
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit"
              className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors flex items-center shadow-md"
            >
              <Plus size={20} className="mr-2" /> Salvar Nota
            </button>
          </div>
        </form>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow relative group">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(note.category)}`}>
                  {note.category}
                </span>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{note.title}</h3>
              <p className="text-slate-600 whitespace-pre-wrap text-sm">{note.content}</p>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center text-xs text-slate-400 rounded-b-xl">
              <Calendar size={14} className="mr-2" />
              {new Date(note.date).toLocaleDateString('pt-BR')}
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p>Nenhuma anotação encontrada. Comece a escrever!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;