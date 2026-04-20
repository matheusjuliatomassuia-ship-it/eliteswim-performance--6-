
import { DailyMetric, SwimTime, BodyComposition, Stroke, Course, Competition, Strategy, GymExercise, GymLog, Note, SwimStandard, Resource, PlannedSession, Group, WorkoutDefinition, AthleteProfile, PhysicalAssessment, BiomechanicsAnalysis } from './types';

/**
 * Converte string de tempo (MM:SS.CC ou SS.CC) para segundos (number)
 */
export const timeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '--:--.--' || timeStr === '00:00.00') return Infinity;
  
  const cleanStr = timeStr.replace(/\./g, ':');
  const parts = cleanStr.split(':');
  
  if (parts.length === 3) {
    const [m, s, c] = parts;
    return parseInt(m) * 60 + parseInt(s) + parseFloat(`0.${c}`);
  }
  
  if (parts.length === 2) {
    const [s, c] = parts;
    return parseInt(s) * 60 + parseFloat(`0.${c}`);
  }

  return parseFloat(timeStr) || Infinity;
};

/**
 * Normaliza qualquer entrada de tempo para o formato MM:SS.CC
 */
export const normalizeSwimTime = (raw: string): string => {
  const clean = raw.trim().replace(/[^0-9.:]/g, '');
  if (!clean) return '00:00.00';

  if (clean.includes(':') && clean.includes('.')) return clean;

  const dots = (clean.match(/\./g) || []).length;
  if (dots >= 1 && !clean.includes(':')) {
    const parts = clean.split('.');
    if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
    if (parts.length === 2) return `00:${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}`;
  }

  return clean;
};

export const URINE_COLORS = ['#fcfcb8', '#fcf46c', '#fae841', '#f5d625', '#dca909', '#b8860b', '#856108'];

export const MOCK_GROUPS: Group[] = [
  { id: 'mirim', name: 'MIRIM' },
  { id: 'petiz1', name: 'PETIZ 1' },
  { id: 'petiz2', name: 'PETIZ 2' },
  { id: 'infantil1', name: 'INFANTIL 1' },
  { id: 'infantil2', name: 'INFANTIL 2' },
  { id: 'juvenil1', name: 'JUVENIL 1' },
  { id: 'juvenil2', name: 'JUVENIL 2' },
  { id: 'junior1', name: 'JÚNIOR 1' },
  { id: 'junior2', name: 'JÚNIOR 2' },
  { id: 'senior', name: 'SÊNIOR' }
];

export const MOCK_WORKOUT_TYPES: WorkoutDefinition[] = [
  { id: 'wt1', name: 'Natação', active: true },
  { id: 'wt2', name: 'Musculação', active: true },
  { id: 'wt3', name: 'Preparação Física', active: true },
  { id: 'wt4', name: 'Fisioterapia', active: true },
];

export const MOCK_ATHLETE_PROFILES: AthleteProfile[] = [
  { id: 'athlete_matheus', name: 'Matheus Juliato', email: 'matheusjuliatomassuia@gmail.com', coachEmail: 'felippesimoes212@gmail.com', groupId: 'juvenil2', birthDate: '2010-07-12', gender: 'M', active: true },
];

export const MOCK_BIOMECHANICS: BiomechanicsAnalysis[] = [];
export const MOCK_ASSESSMENTS: PhysicalAssessment[] = [];
export const MOCK_METRICS: DailyMetric[] = [];
export const MOCK_TIMES: SwimTime[] = [];
export const MOCK_BODY: BodyComposition[] = [];
export const MOCK_COMPETITIONS: Competition[] = [];
export const MOCK_STRATEGIES: Strategy[] = [];
export const MOCK_RESOURCES: Resource[] = [];

export const MOCK_PLANS: PlannedSession[] = [
  {
    id: 'pool-14-01-2026-hist',
    athleteId: 'athlete_matheus',
    date: '2026-01-14',
    type: 'Natação',
    category: 'Ordinário',
    volume: 0,
    intensity: 0,
    description: 'Treino de Água',
    active: false,
    structuredWorkout: {
      warmUp: [{ id: 'w1', description: 'Aquecimento Progressivo', distance: 400, intensity: 'A1', interval: '00:00', equipment: 'Sem material' }],
      preSet: [],
      mainSet: [],
      coolDown: []
    }
  }
];

export const GYM_EXERCISES: GymExercise[] = [];
export const MOCK_GYM_LOGS: GymLog[] = [];
export const MOCK_NOTES: Note[] = [];
export const MOCK_STANDARDS: SwimStandard[] = [];
