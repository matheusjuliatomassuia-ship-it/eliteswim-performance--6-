
import React, { useState } from 'react';
import { AthleteProfile, Group, WorkoutDefinition } from '../types';
import { User, Users, Activity, Plus, Search, Edit2, Trash2, ArrowLeft, Save, CheckCircle, Eye, Link as LinkIcon, AlertTriangle, X } from 'lucide-react';

interface CoachRegistrationsProps {
  athletes: AthleteProfile[];
  groups: Group[];
  workoutTypes: WorkoutDefinition[];
  onUpdateAthletes: (data: AthleteProfile[]) => void;
  onUpdateGroups: (data: Group[]) => void;
  onUpdateWorkoutTypes: (data: WorkoutDefinition[]) => void;
}

type Tab = 'athletes' | 'groups' | 'workouts';

const CoachRegistrations: React.FC<CoachRegistrationsProps> = ({
  athletes,
  groups,
  workoutTypes,
  onUpdateAthletes,
  onUpdateGroups,
  onUpdateWorkoutTypes
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('athletes');
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  
  // -- DELETE MODAL STATE --
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    type: 'athlete' | 'group' | 'workout' | null;
  }>({
    isOpen: false,
    id: '',
    type: null
  });

  // -- ATHLETE STATES --
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);
  const [athleteForm, setAthleteForm] = useState<Partial<AthleteProfile>>({
    name: '',
    email: '',
    groupId: '',
    birthDate: '',
    gender: 'M',
    photoUrl: '',
    active: true
  });
  const [athleteSearch, setAthleteSearch] = useState('');
  const [athleteGroupFilter, setAthleteGroupFilter] = useState('');

  // -- GROUP STATES --
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<Partial<Group>>({ name: '' });

  // -- WORKOUT TYPE STATES --
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutForm, setWorkoutForm] = useState<Partial<WorkoutDefinition>>({ name: '', active: true });

  // -- HELPERS --
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || '-';

  // --- HANDLERS: DELETE ---
  const requestDelete = (id: string, type: 'athlete' | 'group' | 'workout') => {
    setDeleteModal({ isOpen: true, id, type });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: '', type: null });
  };

  const confirmDelete = () => {
    const { id, type } = deleteModal;
    if (type === 'athlete') {
      onUpdateAthletes(athletes.filter(a => a.id !== id));
    } else if (type === 'group') {
      onUpdateGroups(groups.filter(g => g.id !== id));
    } else if (type === 'workout') {
      onUpdateWorkoutTypes(workoutTypes.filter(w => w.id !== id));
    }
    closeDeleteModal();
  };

  // --- HANDLERS: ATHLETES ---
  const handleEditAthlete = (athlete: AthleteProfile) => {
    setEditingAthleteId(athlete.id);
    setAthleteForm({ ...athlete });
    setViewState('form');
  };

  const handleNewAthlete = () => {
    setEditingAthleteId(null);
    setAthleteForm({ name: '', email: '', groupId: '', birthDate: '', gender: 'M', photoUrl: '', active: true });
    setViewState('form');
  };

  const handleSaveAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteForm.name || !athleteForm.groupId) {
      alert("Preencha o nome e o grupo.");
      return;
    }

    if (editingAthleteId) {
      const updated = athletes.map(a => a.id === editingAthleteId ? { ...a, ...athleteForm } as AthleteProfile : a);
      onUpdateAthletes(updated);
    } else {
      const newAthlete: AthleteProfile = {
        ...athleteForm as AthleteProfile,
        id: Date.now().toString()
      };
      onUpdateAthletes([...athletes, newAthlete]);
    }
    setViewState('list');
  };

  // --- HANDLERS: GROUPS ---
  const handleEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupForm({ ...group });
    setViewState('form');
  };

  const handleNewGroup = () => {
    setEditingGroupId(null);
    setGroupForm({ name: '' });
    setViewState('form');
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;

    if (editingGroupId) {
      const updated = groups.map(g => g.id === editingGroupId ? { ...g, ...groupForm } as Group : g);
      onUpdateGroups(updated);
    } else {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: groupForm.name!
      };
      onUpdateGroups([...groups, newGroup]);
    }
    setViewState('list');
  };

  // --- HANDLERS: WORKOUT TYPES ---
  const handleEditWorkout = (workout: WorkoutDefinition) => {
    setEditingWorkoutId(workout.id);
    setWorkoutForm({ ...workout });
    setViewState('form');
  };

  const handleNewWorkout = () => {
    setEditingWorkoutId(null);
    setWorkoutForm({ name: '', active: true });
    setViewState('form');
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutForm.name) return;

    if (editingWorkoutId) {
      const updated = workoutTypes.map(w => w.id === editingWorkoutId ? { ...w, ...workoutForm } as WorkoutDefinition : w);
      onUpdateWorkoutTypes(updated);
    } else {
      const newWorkout: WorkoutDefinition = {
        id: Date.now().toString(),
        name: workoutForm.name!,
        active: workoutForm.active!
      };
      onUpdateWorkoutTypes([...workoutTypes, newWorkout]);
    }
    setViewState('list');
  };

  // -- RENDERERS --

  const renderTabs = () => (
    <div className="flex space-x-4 border-b border-slate-200 mb-6 overflow-x-auto">
      <button
        onClick={() => { setActiveTab('athletes'); setViewState('list'); }}
        className={`pb-3 px-4 font-bold flex items-center whitespace-nowrap transition-colors border-b-2 ${activeTab === 'athletes' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
      >
        <User size={18} className="mr-2" /> Atletas
      </button>
      <button
        onClick={() => { setActiveTab('groups'); setViewState('list'); }}
        className={`pb-3 px-4 font-bold flex items-center whitespace-nowrap transition-colors border-b-2 ${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
      >
        <Users size={18} className="mr-2" /> Grupos
      </button>
      <button
        onClick={() => { setActiveTab('workouts'); setViewState('list'); }}
        className={`pb-3 px-4 font-bold flex items-center whitespace-nowrap transition-colors border-b-2 ${activeTab === 'workouts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
      >
        <Activity size={18} className="mr-2" /> Tipos de Treino
      </button>
    </div>
  );

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(athleteSearch.toLowerCase());
    const matchesGroup = athleteGroupFilter ? a.groupId === athleteGroupFilter : true;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto border border-danger/20 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Excluir Registro?</h3>
                <p className="text-slate-500 text-sm italic font-medium">
                  {deleteModal.type === 'athlete' && "Esta ação removerá permanentemente o atleta e todos os seus dados vinculados."}
                  {deleteModal.type === 'group' && "Esta ação removerá o grupo. Atletas vinculados ficarão sem grupo definido."}
                  {deleteModal.type === 'workout' && "Esta ação removerá este tipo de treino das opções de prescrição."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={closeDeleteModal}
                  className="px-6 py-4 bg-slate-100 text-slate-500 font-black uppercase italic text-xs rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-6 py-4 bg-danger text-white font-black uppercase italic text-xs rounded-2xl hover:brightness-110 shadow-lg shadow-danger/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[500px]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            {activeTab === 'athletes' && 'Cadastro de Atleta'}
            {activeTab === 'groups' && 'Cadastro de Grupo'}
            {activeTab === 'workouts' && 'Cadastro de Tipo de Treino'}
          </h2>
          <p className="text-slate-500 text-sm">
            {activeTab === 'athletes' && 'Gerencie seus atletas'}
            {activeTab === 'groups' && 'Gerencie os grupos de atletas'}
            {activeTab === 'workouts' && 'Cadastre os tipos de treinos de seus atletas'}
          </p>
        </div>

        {/* Tabs */}
        {viewState === 'list' && renderTabs()}

        {/* CONTENT AREA */}
        
        {/* --- ATHLETES TAB --- */}
        {activeTab === 'athletes' && (
          viewState === 'list' ? (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <button 
                  onClick={handleNewAthlete}
                  className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                >
                  <Plus size={18} className="mr-2" /> Novo atleta
                </button>
                
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Nome do atleta"
                      value={athleteSearch}
                      onChange={e => setAthleteSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none w-full md:w-64 text-black"
                    />
                  </div>
                  <select 
                    value={athleteGroupFilter}
                    onChange={e => setAthleteGroupFilter(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
                  >
                    <option value="" className="text-black">Todos os grupos</option>
                    {groups.map(g => <option key={g.id} value={g.id} className="text-black">{g.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ações</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nome completo</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Idade</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nascimento</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Gênero</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm">
                    {filteredAthletes.map(athlete => (
                      <tr key={athlete.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap flex gap-2">
                          <button onClick={() => handleEditAthlete(athlete)} className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-colors" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => requestDelete(athlete.id, 'athlete')} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 flex items-center">
                          {athlete.photoUrl && <img src={athlete.photoUrl} alt="" className="w-6 h-6 rounded-full mr-2 object-cover border border-slate-200" />}
                          {athlete.name}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{calculateAge(athlete.birthDate)}</td>
                        <td className="px-6 py-3 text-slate-600">{new Date(athlete.birthDate).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-3 text-slate-600">{athlete.gender === 'M' ? 'Masculino' : 'Feminino'}</td>
                        <td className="px-6 py-3 text-slate-600 uppercase text-xs font-bold">{getGroupName(athlete.groupId)}</td>
                      </tr>
                    ))}
                    {filteredAthletes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhum atleta encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Exibindo {filteredAthletes.length} registros
              </div>
            </div>
          ) : (
            // Athlete Form
            <form onSubmit={handleSaveAthlete} className="animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 border-b border-slate-200 pb-2">Informe os campos abaixo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Grupo</label>
                    <select 
                      value={athleteForm.groupId}
                      onChange={e => setAthleteForm({...athleteForm, groupId: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                      required
                    >
                      <option value="" className="text-black">Selecione um grupo</option>
                      {groups.map(g => <option key={g.id} value={g.id} className="text-black">{g.name}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome completo</label>
                    <input 
                      type="text" 
                      value={athleteForm.name}
                      onChange={e => setAthleteForm({...athleteForm, name: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={athleteForm.birthDate}
                      onChange={e => setAthleteForm({...athleteForm, birthDate: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email (Opcional)</label>
                    <input 
                      type="email" 
                      value={athleteForm.email}
                      onChange={e => setAthleteForm({...athleteForm, email: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center">
                        <LinkIcon size={12} className="mr-1"/> Foto URL (Opcional)
                    </label>
                    <input 
                      type="text" 
                      value={athleteForm.photoUrl}
                      onChange={e => setAthleteForm({...athleteForm, photoUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Gênero</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={athleteForm.gender === 'M'}
                          onChange={() => setAthleteForm({...athleteForm, gender: 'M'})}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-700">Masculino</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={athleteForm.gender === 'F'}
                          onChange={() => setAthleteForm({...athleteForm, gender: 'F'})}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-700">Feminino</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setViewState('list')}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-500 text-white font-bold rounded hover:bg-emerald-600 transition-colors flex items-center"
                >
                  <CheckCircle size={16} className="mr-2" /> {editingAthleteId ? 'Salvar alterações' : 'Cadastrar atleta'}
                </button>
              </div>
            </form>
          )
        )}

        {/* --- GROUPS TAB --- */}
        {activeTab === 'groups' && (
          viewState === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                <button 
                  onClick={handleNewGroup}
                  className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                  <Plus size={18} className="mr-2" /> Novo grupo
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">Ações</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nome do Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm">
                    {groups.map(group => (
                      <tr key={group.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap flex gap-2">
                          <button onClick={() => handleEditGroup(group)} className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => requestDelete(group.id, 'group')} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 uppercase">{group.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Group Form
            <form onSubmit={handleSaveGroup} className="animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 border-b border-slate-200 pb-2">Informe os campos abaixo</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Grupo</label>
                  <input 
                    type="text" 
                    value={groupForm.name}
                    onChange={e => setGroupForm({...groupForm, name: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setViewState('list')}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-500 text-white font-bold rounded hover:bg-emerald-600 transition-colors flex items-center"
                >
                  <CheckCircle size={16} className="mr-2" /> {editingGroupId ? 'Salvar alterações' : 'Cadastrar grupo'}
                </button>
              </div>
            </form>
          )
        )}

        {/* --- WORKOUT TYPES TAB --- */}
        {activeTab === 'workouts' && (
          viewState === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                <button 
                  onClick={handleNewWorkout}
                  className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                  <Plus size={18} className="mr-2" /> Novo tipo de treino
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">Ações</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Descrição do Tipo de Treino</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm">
                    {workoutTypes.map(workout => (
                      <tr key={workout.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap flex gap-2">
                          <button onClick={() => handleEditWorkout(workout)} className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => requestDelete(workout.id, 'workout')} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 uppercase">{workout.name}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${workout.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {workout.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Workout Type Form
            <form onSubmit={handleSaveWorkout} className="animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 border-b border-slate-200 pb-2">Informe os campos abaixo</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Descrição do Tipo de Treino</label>
                    <input 
                      type="text" 
                      value={workoutForm.name}
                      onChange={e => setWorkoutForm({...workoutForm, name: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-black"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={workoutForm.active}
                      onChange={e => setWorkoutForm({...workoutForm, active: e.target.checked})}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                    />
                    <label className="ml-2 text-sm font-medium text-slate-700">Exibir para novos treinos</label>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setViewState('list')}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-500 text-white font-bold rounded hover:bg-emerald-600 transition-colors flex items-center"
                >
                  <CheckCircle size={16} className="mr-2" /> {editingWorkoutId ? 'Salvar alterações' : 'Cadastrar tipo de treino'}
                </button>
              </div>
            </form>
          )
        )}

      </div>
    </div>
  );
};

export default CoachRegistrations;
