import React, { useState, useMemo, useEffect } from "react";
import { DailyMetric } from "../types";
import { URINE_COLORS } from "../constants";
import {
  Smile,
  Battery,
  Activity,
  Zap,
  Moon,
  HeartPulse,
  Send,
  Brain,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Waves,
  Dumbbell,
  ShieldCheck,
  Thermometer,
  Flame,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";

interface ScaleButtonProps {
  val: number;
  currentVal: number | undefined;
  onClick: (v: number) => void;
  colorClass: string;
}
const ScaleButton: React.FC<ScaleButtonProps> = ({
  val,
  currentVal,
  onClick,
  colorClass,
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick(val);
    }}
    className={`flex-1 aspect-square flex items-center justify-center font-black text-xl text-white transition-all duration-150 border-r border-white/10 last:border-0 ${currentVal === val ? "ring-4 ring-inset ring-white z-10 shadow-2xl opacity-100" : "opacity-85 hover:opacity-100"} ${colorClass}`}
  >
    {val}
  </button>
);

interface ScaleProps {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  icon: React.ElementType;
  isPositive?: boolean;
  compact?: boolean;
  subLabel?: string;
}
const DynamicScale: React.FC<ScaleProps> = ({
  label,
  value,
  onChange,
  icon: Icon,
  isPositive = false,
  compact = false,
  subLabel,
}) => {
  const getColor = (v: number) => {
    if (isPositive) {
      if (v <= 2) return "bg-red-500";
      if (v <= 4) return "bg-orange-500";
      if (v <= 6) return "bg-yellow-400";
      if (v <= 8) return "bg-emerald-400";
      return "bg-emerald-500";
    } else {
      if (v <= 2) return "bg-emerald-500";
      if (v <= 4) return "bg-emerald-400";
      if (v <= 6) return "bg-yellow-400";
      if (v <= 8) return "bg-orange-500";
      return "bg-red-500";
    }
  };

  return (
    <div className={compact ? "mb-4" : "mb-8"}>
      <div className="flex justify-between items-end mb-2 px-1">
        <div>
          <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] italic">
            <Icon size={14} className="mr-2 text-primary" /> {label}
          </label>
          {subLabel && (
            <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5 ml-6">
              {subLabel}
            </p>
          )}
        </div>
        <span className="bg-slate-900 px-4 py-1.5 rounded-lg text-sm font-black text-primary border border-primary/20 italic shadow-inner">
          {value || "0"}
        </span>
      </div>
      <div className="flex w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/40 p-2 gap-px">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <ScaleButton
            key={num}
            val={num}
            currentVal={value}
            onClick={onChange}
            colorClass={getColor(num)}
          />
        ))}
      </div>
    </div>
  );
};

interface DailyLogProps {
  onAddLog: (log: DailyMetric) => void;
  userId?: string;
  previousLogs?: DailyMetric[];
}
const DailyLog: React.FC<DailyLogProps> = ({ onAddLog, userId, previousLogs }) => {
  const [activeTab, setActiveTab] = useState<"wellbeing" | "training">(
    "wellbeing",
  );
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<DailyMetric>>({
    date: new Date().toISOString().split("T")[0],
    mood: 5,
    stress: 3,
    sleepQuality: 7,
    sleepHours: 8,
    bedtime: "22:30",
    wakeTime: "06:30",
    rpe: 0,
    psr: 0,
    gymRpe: 0,
    gymPsr: 0,
    urineColor: 1,
    fatigue: 3,
    soreness: 2,
    notes: "",
    painInfo: { location: "", intensity: 0, notes: "" },
  });

  // Cálculo de Horas de Sono
  useEffect(() => {
    if (formData.bedtime && formData.wakeTime) {
      const [bH, bM] = formData.bedtime.split(":").map(Number);
      const [wH, wM] = formData.wakeTime.split(":").map(Number);

      let bedDate = new Date(2020, 0, 1, bH, bM);
      let wakeDate = new Date(2020, 0, 1, wH, wM);

      if (wakeDate <= bedDate) {
        wakeDate.setDate(wakeDate.getDate() + 1);
      }

      const diff = (wakeDate.getTime() - bedDate.getTime()) / (1000 * 60 * 60);
      setFormData((prev) => ({
        ...prev,
        sleepHours: Number(diff.toFixed(1)),
      }));
    }
  }, [formData.bedtime, formData.wakeTime]);

  const weeklyAverage = useMemo(() => {
    if (!previousLogs || previousLogs.length === 0) return 8.2;
    const now = new Date();
    const last7Days = previousLogs.filter((l) => {
      const d = new Date(l.date);
      return now.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
    });
    if (last7Days.length === 0) return 8.2;
    const total = last7Days.reduce(
      (acc, curr) => acc + (curr.sleepHours || 0),
      0,
    );
    return Number((total / last7Days.length).toFixed(1));
  }, [previousLogs]);

  // Cálculo de Prontidão (Readiness Score)
  const readinessScore = useMemo(() => {
    const sleep = (formData.sleepQuality || 0) * 1.5;
    const hrs = (formData.sleepHours || 0) * 2;
    const mood = (formData.mood || 0) * 1.2;
    const stress = (10 - (formData.stress || 0)) * 1.5;
    const recovery = (((formData.psr || 0) + (formData.gymPsr || 0)) / 2) * 1.8;
    const fatigue = (10 - (formData.fatigue || 0)) * 1.5;

    const total = sleep + hrs + mood + stress + recovery + fatigue;
    const max = 15 + 24 + 12 + 15 + 18 + 15;
    return Math.min(100, Math.round((total / max) * 100));
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Carga Simbolizada baseada em PSE
    const poolLoad = (formData.rpe || 0) * 90;
    const gymLoad = (formData.gymRpe || 0) * 60;

    setTimeout(() => {
      onAddLog({
        ...formData,
        id: Date.now().toString(),
        readinessScore,
        sRPE: poolLoad + gymLoad,
        poolLoad,
        gymLoad,
        athleteId: userId || "1",
      } as DailyMetric);

      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab("wellbeing");
      }, 3000);
    }, 1200);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-danger";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showSuccess && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-8">
          <div className="bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-4 border border-emerald-400/30 backdrop-blur-xl">
            <div className="p-2 bg-white/20 rounded-full animate-bounce">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-black text-xs uppercase italic tracking-widest">
                Diário Sincronizado!
              </p>
              <p className="text-[10px] text-emerald-100 font-bold opacity-80 uppercase">
                Dados de elite processados com sucesso.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOP HUD: READINESS SCORE - Visible only in Training or globally if preferred */}
      {activeTab === "training" && (
        <div className="bg-surface border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group animate-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Zap size={180} className="text-primary" />
          </div>
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.5)]`}
            >
              <div
                className={`absolute inset-0 rounded-full border-t-4 border-primary animate-spin opacity-30`}
                style={{ animationDuration: "3s" }}
              ></div>
              <span className="text-[10px] font-black text-slate-500 uppercase italic">
                Status Atual
              </span>
              <span
                className={`text-4xl font-black italic font-mono ${getScoreColor(readinessScore)}`}
              >
                {readinessScore}
              </span>
              <span className="text-[8px] font-black text-slate-400 uppercase">
                Prontidão
              </span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
              Telemetria de Performance
            </h2>
            <p className="text-slate-400 text-sm italic font-medium leading-relaxed max-w-xl">
              {readinessScore >= 80
                ? "Sinal verde para carga máxima. Seu corpo está em estado de supercompensação ideal."
                : readinessScore >= 60
                  ? "Carga moderada. Mantenha o foco na técnica e monitore sinais de fadiga central."
                  : "Alerta de recuperação. Priorize sono e hidratação. Treino regenerativo sugerido."}
            </p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center min-w-[140px]">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Data
            </span>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-transparent text-primary font-black uppercase text-sm outline-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* INNER TABS NAV */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 shadow-xl w-full md:w-fit mx-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab("wellbeing")}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === "wellbeing" ? "bg-primary text-white shadow-2xl scale-105 z-10" : "text-slate-500 hover:text-white"}`}
        >
          <Smile size={16} /> BEM-ESTAR
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase italic tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === "training" ? "bg-primary text-white shadow-2xl scale-105 z-10" : "text-slate-500 hover:text-white"}`}
        >
          <Waves size={16} /> TREINAMENTO
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === "wellbeing" && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-surface border border-white/5 p-4 md:p-6 rounded-3xl space-y-8">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-4 flex items-center">
                <Moon size={18} className="mr-2 text-indigo-400" /> Sono
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl shadow-inner group transition-all hover:border-primary/30">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center">
                      <Clock size={14} className="mr-2 text-primary" /> Deitei
                      às
                    </label>
                  </div>
                  <input
                    type="time"
                    value={formData.bedtime}
                    onChange={(e) =>
                      setFormData({ ...formData, bedtime: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-primary outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                </div>

                <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl shadow-inner group transition-all hover:border-emerald-400/30">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center">
                      <Clock size={14} className="mr-2 text-emerald-400" />{" "}
                      Acordei às
                    </label>
                  </div>
                  <input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) =>
                      setFormData({ ...formData, wakeTime: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Moon size={80} className="text-primary" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Total Dormido
                  </span>
                  <p className="text-3xl font-black italic font-mono text-white">
                    {formData.sleepHours}
                    <span className="text-sm text-primary ml-1">h</span>
                  </p>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform text-emerald-400">
                    <Activity size={80} />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Média Semanal
                  </span>
                  <p className="text-3xl font-black italic font-mono text-emerald-400">
                    {weeklyAverage}
                    <span className="text-sm text-emerald-500 ml-1">h</span>
                  </p>
                </div>
              </div>

              <DynamicScale
                label="Qualidade do Sono"
                subLabel="Profundidade e sensação de repouso"
                value={formData.sleepQuality}
                onChange={(v) => setFormData({ ...formData, sleepQuality: v })}
                icon={Moon}
                isPositive
              />
              <DynamicScale
                label="Humor"
                subLabel="Estado emocional para o dia"
                value={formData.mood}
                onChange={(v) => setFormData({ ...formData, mood: v })}
                icon={Smile}
                isPositive
              />
            </div>

            <div className="bg-surface border border-white/5 p-4 md:p-6 rounded-3xl space-y-8">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-4 flex items-center">
                <Brain size={18} className="mr-2 text-rose-400" /> Biofísico
              </h3>
              <DynamicScale
                label="Estresse"
                subLabel="Carga mental externa"
                value={formData.stress}
                onChange={(v) => setFormData({ ...formData, stress: v })}
                icon={Activity}
              />
              <DynamicScale
                label="Fadiga"
                subLabel="Cansaço físico sistêmico"
                value={formData.fatigue}
                onChange={(v) => setFormData({ ...formData, fatigue: v })}
                icon={Zap}
              />

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center">
                  <Thermometer size={14} className="mr-2 text-amber-500" /> Urina
                </label>
                <div className="flex w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/40 p-3 gap-px">
                  {URINE_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, urineColor: idx + 1 })
                      }
                      className={`flex-1 aspect-square border-r border-white/10 last:border-0 transition-all ${formData.urineColor === idx + 1 ? "ring-4 ring-inset ring-white z-10 shadow-2xl opacity-100" : "opacity-85 hover:opacity-100"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <DynamicScale
                  label="Dor"
                  subLabel="Nível de desconforto muscular"
                  value={formData.soreness}
                  onChange={(v) => setFormData({ ...formData, soreness: v })}
                  icon={Flame}
                  compact
                />
                <input
                  type="text"
                  placeholder="Localização da dor (Ex: Ombro D, Lombar...)"
                  value={formData.painInfo?.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      painInfo: {
                        ...formData.painInfo!,
                        location: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-950 border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-primary italic"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className={`w-full bg-primary hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center gap-3 uppercase italic tracking-widest text-sm active:scale-95 border-b-4 border-sky-700 mt-2`}
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSending ? "Sincronizando..." : "Enviar Telemetria"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "training" && (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Piscina */}
            <div className="bg-surface border border-white/5 p-4 md:p-8 rounded-3xl space-y-12">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-4 flex items-center">
                <Waves size={18} className="mr-2 text-primary" /> Sessão de
                Piscina
              </h3>
              <DynamicScale
                label="PSE - Esforço"
                subLabel="Intensidade percebida na água"
                value={formData.rpe}
                onChange={(v) => setFormData({ ...formData, rpe: v })}
                icon={Zap}
              />
              <DynamicScale
                label="PSR - Recuperação"
                subLabel="O quanto você se sente recuperado para nadar"
                value={formData.psr}
                onChange={(v) => setFormData({ ...formData, psr: v })}
                icon={Battery}
                isPositive
              />
            </div>

            {/* Academia / PF */}
            <div className="bg-surface border border-white/5 p-4 md:p-8 rounded-3xl space-y-12">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-4 flex items-center">
                <Dumbbell size={18} className="mr-2 text-indigo-400" /> Academia
                / Prep. Física
              </h3>
              <DynamicScale
                label="PSE - Esforço"
                subLabel="Intensidade no Dryland"
                value={formData.gymRpe}
                onChange={(v) => setFormData({ ...formData, gymRpe: v })}
                icon={Zap}
              />
              <DynamicScale
                label="PSR - Recuperação"
                subLabel="Recuperação pós-musculação"
                value={formData.gymPsr}
                onChange={(v) => setFormData({ ...formData, gymPsr: v })}
                icon={Battery}
                isPositive
              />
              
              {/* Feedback Section */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest flex items-center">
                  <MessageSquare size={14} className="mr-2 text-primary" />{" "}
                  Feedback da Sessão
                </h3>
                <textarea
                  placeholder="Como foi o treino? Notas sobre técnica, sensações ou observações do treinador..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-white/5 disabled:opacity-50 text-white rounded-2xl p-4 text-xs font-medium italic outline-none focus:ring-1 focus:ring-primary min-h-[100px] transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className={`w-full bg-primary hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center gap-3 uppercase italic tracking-widest text-sm active:scale-95 border-b-4 border-sky-700 mt-2`}
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSending ? "Sincronizando..." : "Enviar Telemetria"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyLog;
