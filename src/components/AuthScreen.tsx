
import React, { useState } from 'react';
import { ArrowRight, Waves, Trophy, ClipboardList, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';

interface AuthScreenProps {
  onLogin: (email: string, role: UserRole, name?: string, password?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('Athlete');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isAnimatingError, setIsAnimatingError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAnimatingError(false);

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (isLogin) {
      // 1. Verificar usuários ELITE (Fixos)
      const isEliteAthlete = formData.email.toLowerCase() === 'matheusjuliatomassuia@gmail.com' && formData.password === 'Matheus2020';
      const isEliteCoach = formData.email.toLowerCase() === 'felippesimoes212@gmail.com' && formData.password === 'coachjuv2026';

      if (isEliteAthlete) {
        onLogin(formData.email, 'Athlete', 'Matheus Juliato', formData.password);
        return;
      }
      
      if (isEliteCoach) {
        onLogin(formData.email, 'Coach', 'Felippe Simões', formData.password);
        return;
      }

      // 2. Verificar banco de contas local
      const accountsRaw = localStorage.getItem('eliteSwim_accounts');
      if (accountsRaw) {
        try {
          const accounts = JSON.parse(accountsRaw);
          const user = accounts.find((a: any) => a.email.toLowerCase() === formData.email.toLowerCase() && a.password === formData.password);
          if (user) {
            onLogin(user.email, user.role, user.name, user.password);
            return;
          }
        } catch (e) {
          console.error("Erro ao ler banco de contas:", e);
        }
      }

      setError('E-MAIL OU SENHA INCORRETOS.');
      setIsAnimatingError(true);
      setTimeout(() => setIsAnimatingError(false), 400); 
    } else {
      onLogin(formData.email, role, formData.name, formData.password);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#0ea5e9] rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      <div className={`bg-slate-900 rounded-[2rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] w-full max-w-[320px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 p-7 relative z-10 border-2 ${error ? 'border-danger' : 'border-[#0ea5e9]'} ${isAnimatingError ? 'animate-jump-once' : ''}`}>
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6 w-full">
          <div className="w-12 h-12 bg-[#0ea5e9] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 transition-transform hover:scale-105">
            <Waves className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none text-center text-wrap">EliteSwim</h1>
          <p className="text-blue-400/60 text-[8px] font-bold uppercase tracking-[0.2em] mt-2 text-center">High Performance Management</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-2 mb-6 w-full">
          <button
            type="button"
            onClick={() => setRole('Athlete')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${role === 'Athlete' ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]' : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700'}`}
          >
            <Trophy size={20} className="mb-1.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Atleta</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('Coach')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${role === 'Coach' ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]' : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700'}`}
          >
            <ClipboardList size={20} className="mb-1.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Coach</span>
          </button>
        </div>

        {/* Toggle Pill */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800 w-full">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all text-center ${isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all text-center ${!isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-400'}`}
          >
            Cadastrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          {!isLogin && (
            <div className="animate-in slide-in-from-top-2 w-full">
              <label className="block text-[8px] font-black text-blue-400/80 uppercase mb-1.5 tracking-[0.15em] text-center w-full">Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all bg-white text-black font-bold placeholder:text-slate-400 text-center text-xs shadow-sm"
              />
            </div>
          )}

          <div className="w-full">
            <label className="block text-[8px] font-black text-blue-400/80 uppercase mb-1.5 tracking-[0.15em] text-center w-full">Email de Acesso</label>
            <input
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all bg-white text-black font-bold placeholder:text-slate-400 text-center text-xs shadow-sm"
            />
          </div>

          <div className="w-full">
            <label className="block text-[8px] font-black text-blue-400/80 uppercase mb-1.5 tracking-[0.15em] text-center w-full">Senha Privada</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all bg-white text-black font-bold placeholder:text-slate-400 text-center text-xs shadow-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-danger text-[9px] font-black uppercase text-center px-2 animate-in fade-in slide-in-from-top-1 w-full bg-danger/5 py-2 rounded-lg border border-danger/20">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full ${error ? 'bg-danger border-rose-800' : 'bg-[#0ea5e9] border-[#0369a1]'} text-white font-black py-4 rounded-xl hover:brightness-110 transition-all transform active:scale-[0.98] shadow-2xl flex items-center justify-center uppercase tracking-[0.15em] text-[10px] group border-b-4 mt-2`}
          >
            {isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
