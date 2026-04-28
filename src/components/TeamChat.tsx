
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, MoreVertical, Search, Phone, Video, Users, User, UserPlus, X, Share2, Link, FileText, Activity, CheckSquare, Square, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { ChatMessage, ChatContact } from '../../types';

interface TeamChatProps {
  messages: Record<string, ChatMessage[]>;
  onUpdateMessages: (messages: Record<string, ChatMessage[]>) => void;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

const TeamChat: React.FC<TeamChatProps> = ({ messages, onUpdateMessages, currentUser }) => {
  // Inicializa com persistência do chat ativo
  const [activeChat, setActiveChat] = useState<string>(() => {
    try {
      return localStorage.getItem('eliteSwim_activeChat') || 'GRP-01';
    } catch {
      return 'GRP-01';
    }
  });

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Adicionar Contato Individual
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', role: '', email: '' });

  // Estado para Edição de Nome
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Estado para Criar Grupo
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);

  // Estado para Adicionar Membros ao Grupo Atual
  const [showAddMember, setShowAddMember] = useState(false);

  // Estado para Menu de Compartilhamento
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Lista de Contatos com Persistência Local
  const [contacts, setContacts] = useState<ChatContact[]>(() => {
    try {
      const saved = localStorage.getItem('eliteSwim_contacts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Erro ao carregar contatos:", e);
    }
    return [
      { id: 'GRP-01', name: 'Elite Team 2025', role: 'Grupo Oficial', avatarColor: 'bg-blue-600', isGroup: true, online: true, unread: 3, members: ['coach_felippe', 'athlete_matheus'] },
      { id: 'coach_felippe', name: 'Felippe Simões', role: 'Head Coach', avatarColor: 'bg-slate-700', isGroup: false, online: true, unread: 0, email: 'felippesimoes212@gmail.com' },
      { id: 'athlete_matheus', name: 'Matheus Juliato', role: 'Atleta Elite', avatarColor: 'bg-indigo-600', isGroup: false, online: true, unread: 0, email: 'matheusjuliatomassuia@gmail.com' },
    ];
  });

  // Salvar contatos e chat ativo sempre que houver alteração
  useEffect(() => {
    localStorage.setItem('eliteSwim_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('eliteSwim_activeChat', activeChat);
  }, [activeChat]);

  const activeContact = contacts.find(c => c.id === activeChat);
  const activeMessages = messages[activeChat] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, activeChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = {
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), newMessage]
    };

    onUpdateMessages(updatedMessages);
    setInputText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          text: '',
          image: base64String,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        const updatedMessages = {
          ...messages,
          [activeChat]: [...(messages[activeChat] || []), newMessage]
        };
        onUpdateMessages(updatedMessages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = (type: 'link' | 'record' | 'file') => {
    let text = '';
    switch (type) {
      case 'link':
        text = '🔗 Compartilhou um link: https://eliteswim.app/resultados';
        break;
      case 'record':
        text = '📊 Compartilhou: Relatório de Performance Semanal';
        break;
      case 'file':
        text = '📄 Compartilhou arquivo: Estrategia_Prova.pdf';
        break;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = {
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), newMessage]
    };
    onUpdateMessages(updatedMessages);
    setShowShareMenu(false);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactData.name || !newContactData.role) return;

    const nextIdNum = contacts.filter(c => !c.isGroup).length + 1;
    const newId = `USR-${nextIdNum.toString().padStart(2, '0')}`;

    const newContact: ChatContact = {
      id: newId,
      name: newContactData.name,
      role: newContactData.role,
      email: newContactData.email,
      avatarColor: 'bg-indigo-500',
      isGroup: false,
      online: false,
      unread: 0
    };

    setContacts([...contacts, newContact]);
    setNewContactData({ name: '', role: '', email: '' });
    setShowAddContact(false);
    setActiveChat(newId);
  };

  const handleDeleteContact = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique abra o chat ao deletar
    
    if (window.confirm(`Tem certeza que deseja remover "${name}" da sua lista de contatos?`)) {
      const updatedContacts = contacts.filter(c => c.id !== id);
      setContacts(updatedContacts);
      
      // Força atualização imediata no LocalStorage
      localStorage.setItem('eliteSwim_contacts', JSON.stringify(updatedContacts));
      
      // Se o chat ativo for o deletado, limpa a seleção
      if (activeChat === id) {
        setActiveChat(''); // Remove seleção
        localStorage.removeItem('eliteSwim_activeChat');
      }
    }
  };

  // --- Funções de Edição de Nome ---
  const handleStartEdit = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContactId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    const updatedContacts = contacts.map(c => 
      c.id === editingContactId ? { ...c, name: editName } : c
    );

    setContacts(updatedContacts);
    setEditingContactId(null);
    setEditName('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContactId(null);
    setEditName('');
  };
  // --------------------------------

  // Funções de Grupo
  const toggleSelection = (id: string) => {
    if (selectedForGroup.includes(id)) {
      setSelectedForGroup(selectedForGroup.filter(sid => sid !== id));
    } else {
      setSelectedForGroup([...selectedForGroup, id]);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedForGroup.length === 0) return;

    const nextGrpNum = contacts.filter(c => c.isGroup).length + 1;
    const newId = `GRP-${nextGrpNum.toString().padStart(2, '0')}`;

    const newGroup: ChatContact = {
      id: newId,
      name: newGroupName,
      role: 'Grupo Personalizado',
      avatarColor: 'bg-purple-600',
      isGroup: true,
      online: true,
      unread: 0,
      members: selectedForGroup
    };

    setContacts([newGroup, ...contacts]);
    setNewGroupName('');
    setSelectedForGroup([]);
    setShowCreateGroup(false);
    setActiveChat(newId);
  };

  const handleAddMembersToGroup = () => {
    if (selectedForGroup.length === 0) return;

    const updatedContacts = contacts.map(c => {
      if (c.id === activeChat) {
        return { 
          ...c, 
          members: [...(c.members || []), ...selectedForGroup] 
        };
      }
      return c;
    });

    setContacts(updatedContacts);
    setSelectedForGroup([]);
    setShowAddMember(false);
    
    // Feedback no chat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'system',
      text: 'Novos membros foram adicionados ao grupo.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    const updatedMessages = {
      ...messages,
      [activeChat]: [...(messages[activeChat] || []), newMessage]
    };
    onUpdateMessages(updatedMessages);
  };

  const handleAudioCall = () => {
    alert(`Iniciando chamada de áudio com ${activeContact?.name}...`);
  };

  const handleVideoCall = () => {
    alert(`Iniciando videochamada com ${activeContact?.name}...`);
  };

  // Filtrar contatos para seleção (excluir grupos e o próprio usuário se necessário)
  const availableContacts = contacts.filter(c => !c.isGroup && c.id !== currentUser.id);

  // Filtrar contatos visíveis na barra lateral (ocultar o próprio usuário)
  const visibleSidebarContacts = contacts.filter(c => c.id !== currentUser.id);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Modal Overlay para Criar Grupo ou Adicionar Membros */}
      {(showCreateGroup || showAddMember) && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {showCreateGroup ? 'Criar Novo Grupo' : 'Adicionar Pessoas ao Grupo'}
              </h3>
              <button onClick={() => { setShowCreateGroup(false); setShowAddMember(false); setSelectedForGroup([]); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {showCreateGroup && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Grupo</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Treino de Sábado"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {showCreateGroup ? 'Selecionar Participantes' : 'Selecionar Novos Membros'}
                </label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-black">
                  {availableContacts
                    .filter(c => showAddMember ? !(activeContact?.members || []).includes(c.id) : true) // Filtra quem já está no grupo
                    .map(contact => (
                    <div 
                      key={contact.id} 
                      onClick={() => toggleSelection(contact.id)}
                      className="flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className={`mr-3 ${selectedForGroup.includes(contact.id) ? 'text-primary' : 'text-slate-300'}`}>
                        {selectedForGroup.includes(contact.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${contact.avatarColor}`}>
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.role}</p>
                      </div>
                    </div>
                  ))}
                  {availableContacts.filter(c => showAddMember ? !(activeContact?.members || []).includes(c.id) : true).length === 0 && (
                     <div className="p-4 text-center text-slate-500 text-sm">Todos os contatos já estão neste grupo.</div>
                  )}
                </div>
              </div>

              <button 
                onClick={showCreateGroup ? handleCreateGroup : handleAddMembersToGroup}
                disabled={selectedForGroup.length === 0 || (showCreateGroup && !newGroupName.trim())}
                className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg hover:bg-sky-600 transition-colors"
              >
                {showCreateGroup ? 'Criar Grupo' : 'Adicionar Selecionados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-800">Conversas</h2>
            <div className="flex space-x-1">
         <button 
  onClick={() => { setShowCreateGroup(true); setShowAddContact(false); }}
  className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-purple-600 hover:border-purple-600 transition-colors"
  title="Criar Grupo"
>
  <Users size={18} />
</button>

<button 
  onClick={() => { setShowAddContact(!showAddContact); setShowCreateGroup(false); }}
  className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-primary hover:border-primary transition-colors"
  title="Adicionar Pessoa"
>
  {showAddContact ? <X size={18} /> : <UserPlus size={18} />}
</button>
            </div>
          </div>
          
          {/* Add Contact Form */}
          {showAddContact && (
            <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <form onSubmit={handleAddContact} className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Nome do contato"
                  value={newContactData.name}
                  onChange={e => setNewContactData({...newContactData, name: e.target.value})}
                  className="w-full p-2 text-sm border border-slate-200 rounded focus:border-primary outline-none text-black"
                  autoFocus
                />
                <input 
                  type="text" 
                  placeholder="Função (ex: Preparador)"
                  value={newContactData.role}
                  onChange={e => setNewContactData({...newContactData, role: e.target.value})}
                  className="w-full p-2 text-sm border border-slate-200 rounded focus:border-primary outline-none text-black"
                />
                <input 
                  type="email" 
                  placeholder="Email (Opcional)"
                  value={newContactData.email}
                  onChange={e => setNewContactData({...newContactData, email: e.target.value})}
                  className="w-full p-2 text-sm border border-slate-200 rounded focus:border-primary outline-none text-black"
                />
                <button type="submit" className="w-full bg-primary text-white text-sm font-bold py-1.5 rounded hover:bg-sky-600">
                  Salvar Contato
                </button>
              </form>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar mensagem..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary text-black"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibleSidebarContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setActiveChat(contact.id)}
              className={`w-full flex items-center p-4 hover:bg-white transition-colors border-b border-slate-100 cursor-pointer relative group ${activeChat === contact.id ? 'bg-white border-l-4 border-l-primary shadow-sm' : 'border-l-4 border-l-transparent'}`}
              role="button"
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${contact.avatarColor}`}>
                  {contact.isGroup ? <Users size={20} /> : <User size={20} />}
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="ml-4 text-left flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  {/* Se estiver editando este contato */}
                  {editingContactId === contact.id ? (
                    <div className="flex items-center w-full space-x-1" onClick={(e) => e.stopPropagation()}>
                       <input 
                         type="text"
                         value={editName}
                         onChange={(e) => setEditName(e.target.value)}
                         className="w-full p-1 text-sm border border-primary rounded focus:outline-none text-black"
                         autoFocus
                       />
                       <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                         <Check size={16} />
                       </button>
                       <button onClick={handleCancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded">
                         <X size={16} />
                       </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{contact.name}</h3>
                      {contact.unread > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{contact.unread}</span>
                      )}
                    </>
                  )}
                </div>
                {!editingContactId && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500 truncate max-w-[120px]">{contact.role}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                      #{contact.id.length > 8 ? contact.id.slice(0, 8) + '...' : contact.id}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Edit & Delete) - Only show if not editing */}
              {!editingContactId && (
                <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded px-1">
                   <button 
                    onClick={(e) => handleStartEdit(contact.id, contact.name, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
                    title="Editar Nome"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteContact(contact.id, contact.name, e)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                    title="Remover Contato"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5]">
        {/* Chat Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 relative">
          <div className="flex items-center">
            {activeContact ? (
              <>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${activeContact.avatarColor}`}>
                  {activeContact.isGroup ? <Users size={18} /> : <User size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{activeContact.name}</h3>
                    <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-500 font-mono border border-slate-200">
                      ID: {activeContact.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center">
                    {activeContact.online ? <span className="text-green-600 font-medium">Online</span> : 'Visto por último hoje'}
                    {activeContact.isGroup && activeContact.members && (
                      <span className="ml-2 text-slate-400">• {activeContact.members.length} membros</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mr-3">
                  <User size={18} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800">Selecione um contato</h3>
                </div>
              </div>
            )}
          </div>
          
          {activeContact && (
            <div className="flex items-center text-slate-400 space-x-3 relative">
            
              {/* Add Member Button (Only for Groups) */}
              {activeContact.isGroup && (
                <button 
                  onClick={() => { setShowAddMember(true); setSelectedForGroup([]); }}
                  className="hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"
                  title="Adicionar Pessoa ao Grupo"
                >
                  <UserPlus size={20} />
                </button>
              )}

              <div className="relative">
                <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={`hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full ${showShareMenu ? 'text-primary' : ''}`} 
                  title="Compartilhar"
                >
                  <Share2 size={20} />
                </button>
                
                {/* Share Menu Dropdown */}
                {showShareMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                    <button 
                      onClick={() => handleShare('link')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center"
                    >
                      <Link size={16} className="mr-2" /> Compartilhar Link
                    </button>
                    <button 
                      onClick={() => handleShare('file')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center"
                    >
                      <FileText size={16} className="mr-2" /> Enviar Arquivo
                    </button>
                    <button 
                      onClick={() => handleShare('record')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center"
                    >
                      <Activity size={16} className="mr-2" /> Registro do App
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleAudioCall}
                className="hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"
                title="Chamada de Áudio"
              >
                <Phone size={20} />
              </button>
              <button 
                onClick={handleVideoCall}
                className="hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"
                title="Videochamada"
              >
                <Video size={22} />
              </button>
              <button className="hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"><MoreVertical size={20} /></button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/subtle-grey.png')]">
          {activeContact ? (
             activeMessages.length > 0 ? (
              activeMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                      {/* Show sender name if it's a group and not me */}
                      {!isMe && activeContact?.isGroup && msg.senderId !== 'system' && (
                        <p className="text-xs font-bold text-orange-600 mb-1">{msg.senderName || msg.senderId}</p>
                      )}
                      
                      {/* System Messages */}
                      {msg.senderId === 'system' ? (
                        <p className="text-xs text-center italic opacity-80">{msg.text}</p>
                      ) : (
                        <>
                          {/* Image Rendering */}
                          {msg.image && (
                            <div className="mb-2">
                              <img src={msg.image} alt="Enviada" className="rounded-lg max-w-full h-auto max-h-64 object-cover border border-black/10" />
                            </div>
                          )}
                          {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                        </>
                      )}
                      
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>{msg.timestamp}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="mb-2">Nenhuma mensagem aqui ainda.</p>
                  <p className="text-sm">Envie um "Olá" para começar!</p>
                </div>
              </div>
            )
          ) : (
             <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="mb-2">Nenhum chat selecionado.</p>
                  <p className="text-sm">Escolha um contato à esquerda para conversar.</p>
                </div>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors" disabled={!activeContact}>
              <Paperclip size={20} />
            </button>
            
            {/* Hidden Input for Images */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={!activeContact}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={!activeContact}
            >
              <Image size={20} />
            </button>
            
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeContact ? `Mensagem como ${currentUser.name}...` : "Selecione um chat..."}
              className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none disabled:bg-slate-50 disabled:text-slate-400 text-black font-medium"
              disabled={!activeContact}
            />
            <button 
              type="submit" 
              className="p-3 bg-primary text-white rounded-full hover:bg-sky-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputText.trim() || !activeContact}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
