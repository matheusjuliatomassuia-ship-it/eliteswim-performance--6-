
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Award, MapPin, Camera, KeyRound, Calendar, ChevronRight, Trash2, Plus, Save, LogOut, Settings, ShieldCheck, RefreshCw, CloudUpload, Sparkles, Database, CheckCircle2, Lock, FileText, Link as LinkIcon, UserPlus, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
interface ProfileProps {
  user: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    photoUrl?: string;
    coachEmail?: string;
    club?: string;
    category?: string;
    birthDate?: string;
    gender?: string;
    state?: string;
    country?: string;
  };
  onLogout: () => void;
  onUpdateUser: (name: string, email: string, photoUrl?: string, coachEmail?: string, club?: string, category?: string, birthDate?: string, gender?: any, state?: string, country?: string, newPassword?: string) => void;
  onSyncResults?: () => Promise<boolean>;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onUpdateUser, onSyncResults }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    club: user.club || '', 
    category: user.category || '', 
    coachEmail: user.coachEmail || '', 
    birthDate: user.birthDate || '',
    gender: user.gender || 'M',
    state: user.state || '',
    country: user.country || '',
    currentPassword: user.password || (user.role === 'Coach' ? 'coachjuv2026' : 'Matheus2020'), 
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(user.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      name: user.name, 
      email: user.email,
      coachEmail: user.coachEmail || '',
      club: user.club || '',
      category: user.category || '',
      birthDate: user.birthDate || '',
      gender: user.gender || 'M',
      state: user.state || '',
      country: user.country || '',
      currentPassword: user.password || (user.role === 'Coach' ? 'coachjuv2026' : 'Matheus2020')
    }));
    setPhotoPreview(user.photoUrl);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(
      formData.name, 
      formData.email, 
      photoPreview, 
      formData.coachEmail, 
      formData.club, 
      formData.category, 
      formData.birthDate, 
      formData.gender as any,
      formData.state,
      formData.country
    );
    alert("Dados consolidados e salvos com sucesso!");
  };

  const handleUpdatePassword = () => {
    if (!formData.currentPassword) {
      alert("Informe a senha atual para prosseguir.");
      return;
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("A nova senha e a confirmação não coincidem.");
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      alert("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    // Atualiza via onUpdateUser para persistir a nova senha
    onUpdateUser(
      formData.name,
      formData.email,
      photoPreview,
      formData.coachEmail,
      formData.club,
      formData.category,
      formData.birthDate,
      formData.gender as any,
      formData.state,
      formData.country,
      formData.newPassword || formData.currentPassword
    );

    alert("Segurança atualizada! Suas novas credenciais foram consolidadas.");
    setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
  };

  const triggerSync = async () => {
    if (!onSyncResults) return;
    setIsSyncing(true);
    setSyncDone(false);
    const success = await onSyncResults();
    setTimeout(() => {
      setIsSyncing(false);
      if (success) setSyncDone(true);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in">
      {/* Header Profile Card */}
      <div className="hud-card p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/5 ring-4 ring-primary/20 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
            {photoPreview ? ( <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" /> ) : (
              <div className="w-full h-full bg-gradient-to-tr from-primary to-primaryDark flex items-center justify-center text-white text-4xl font-black italic">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={28} /></div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
        </div>
        <div className="text-center md:text-left flex-1 relative z-10 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter neon-text break-words">{user.name}</h2>
            <span className="px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white border border-primary/30 w-fit mx-auto md:mx-0 italic shadow-lg flex-shrink-0">
              {user.role === 'Coach' ? 'COACH' : 'ATLETA'}
            </span>
          </div>
          <p className="text-slate-500 font-mono text-xs mb-6 uppercase tracking-widest break-all">{user.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            {user.club && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">
                <Award size={16} className="text-primary" />
                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest break-words">{user.club}</span>
              </div>
            )}
            
            {(user.state || user.country) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">
                <MapPin size={16} className="text-danger" />
                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">
                  {user.state}{user.state && user.country ? ', ' : ''}{user.country}
                </span>
              </div>
            )}
          </div>
        </div>
        <button onClick={onLogout} className="bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg italic flex items-center gap-2 flex-shrink-0"><LogOut size={16} /> Logout</button>
      </div>

      {/* Vínculo com Treinador (Exclusivo Atleta) */}
      {user.role === 'Athlete' && (
        <div className="hud-card p-8 rounded-2xl border border-primary/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-inner">
              <LinkIcon size={20} />
            </div>
            <h3 className="text-lg font-black text-white italic uppercase tracking-widest">Vínculo com Treinador</h3>
          </div>
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail do Técnico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  name="coachEmail" 
                  value={formData.coachEmail} 
                  onChange={handleChange} 
                  placeholder="exemplo@tecnico.com"
                  className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" 
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${formData.coachEmail ? 'bg-primary/10 border-primary/30' : 'bg-slate-800/50 border-white/5 opacity-50'}`}>
                {formData.coachEmail ? (
                  <>
                    <CheckCircle2 size={20} className="text-primary" />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase italic">Sincronização Ativa</p>
                      <p className="text-[8px] text-slate-400 uppercase font-mono">Seu técnico verá seus dados</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} className="text-slate-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase italic">Aguardando Vínculo</p>
                      <p className="text-[8px] text-slate-600 uppercase font-mono">Insira um e-mail válido</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[9px] text-slate-500 italic leading-relaxed">
            Ao vincular o e-mail do seu treinador, ele terá acesso automático às suas planilhas de treino, diários de performance, testes físicos e análises biomecânicas em tempo real.
          </p>
        </div>
      )}

      {/* Profile Parameters */}
      <div className="hud-card p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-inner">
            <Settings size={20} />
          </div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-widest">Parâmetros de Perfil</h3>
        </div>
        
        <form onSubmit={handleSaveProfile} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de Acesso</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clube / Equipe</label>
              <input 
                type="text" 
                name="club" 
                value={formData.club} 
                onChange={handleChange}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black uppercase outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all italic" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
              <input 
                type="text" 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                placeholder="Ex: Juvenil 2" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado</label>
              <input 
                type="text" 
                name="state" 
                value={formData.state} 
                onChange={handleChange} 
                placeholder="Ex: SÃO PAULO" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black uppercase outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all italic" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">País</label>
              <input 
                type="text" 
                name="country" 
                value={formData.country} 
                onChange={handleChange} 
                placeholder="Ex: BR" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black uppercase outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all italic" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
              <input 
                type="date" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleChange}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gênero</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all appearance-none cursor-pointer"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button 
              type="submit" 
              className="bg-primary text-white font-black py-4 px-10 rounded-xl hover:brightness-110 transition-all uppercase tracking-widest text-[11px] italic shadow-2xl flex items-center justify-center gap-3 active:scale-95"
            >
              <FileText size={18} /> Consolidar Registros
            </button>
          </div>
        </form>
      </div>

      {/* Segurança */}
      <div className="hud-card p-8 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-danger/20 rounded-lg text-danger shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-widest">Segurança & Credenciais</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                name="currentPassword" 
                value={formData.currentPassword} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all pr-12" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                name="newPassword" 
                value={formData.newPassword} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all pr-12" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-black outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all pr-12" 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5">
          <button 
            onClick={handleUpdatePassword}
            className="bg-primary text-white font-black py-4 px-10 rounded-xl hover:brightness-110 transition-all uppercase tracking-widest text-[11px] italic shadow-2xl flex items-center justify-center gap-3 active:scale-95"
          >
            <FileText size={18} /> Consolidar Registros
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
