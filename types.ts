
export enum Stroke {
  Free = 'Livre',
  Back = 'Costas',
  Breast = 'Peito',
  Fly = 'Borboleta',
  IM = 'Medley'
}

export enum Course {
  SCM = '25m',
  LCM = '50m'
}

export type UserRole = 'Athlete' | 'Coach';

// --- Management Types ---
export interface Group {
  id: string;
  name: string;
}

export interface WorkoutDefinition {
  id: string;
  name: string;
  active: boolean;
}

export interface AthleteProfile {
  id: string;
  name: string;
  email?: string;
  coachEmail?: string; // Novo campo para vínculo
  groupId: string;
  birthDate: string;
  gender: 'M' | 'F';
  photoUrl?: string;
  active: boolean;
}

// --- Competition Records ---
export interface Split {
  id: string;
  distance: number;
  time: string;
}

export interface AthleteEntry {
  id: string;
  athleteId: string;
  event: string;
  time: string;
  splits: Split[];
}

export interface MeetRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  poolSize?: '25m' | '50m';
  location: string;
  entries: AthleteEntry[];
  type?: 'Pool' | 'OpenWater';
  groupIds?: string[];
}

// --- Biomechanics ---
export interface TrackingPoint {
  time: number;
  x: number;
  y: number;
  type: 'head' | 'hip' | 'ankle';
}

export interface StrokeEvent {
  time: number;
  id: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingData {
  id: string;
  type: string;
  points: DrawingPoint[];
  color: string;
  timestamp?: number;
  angleValue?: number;
}

export interface BiomechanicsAnalysis {
  id: string;
  athleteId: string;
  date: string;
  title: string;
  videoUrl: string;
  stroke: Stroke;
  coachNotes: string;
  focusPoints: string[];
  trackingData?: TrackingPoint[];
  strokeEvents?: StrokeEvent[];
  drawings?: DrawingData[];
  pushOffTime?: number;
}

// --- Pool Workout Specific Types ---
export type PoolIntensity = 'A0' | 'A1' | 'A2' | 'A3' | 'AN1' | 'AN2' | 'AN3' | 'AA' | 'N/A';

export type PoolEquipment = 
  | 'Sem material' 
  | 'Pé de pato' 
  | 'Snorkel' 
  | 'Palmar P' 
  | 'Palmar M' 
  | 'Palmar G' 
  | 'Flutuador' 
  | 'Prancha' 
  | 'Paraquedas' 
  | 'Elástico';

export interface PoolSet {
  id: string;
  description: string;
  distance: number;
  intensity: PoolIntensity;
  interval: string;
  equipment: PoolEquipment;
  equipment2?: PoolEquipment;
  equipment3?: PoolEquipment;
}

export interface PoolWorkoutStructure {
  warmUp: PoolSet[];
  preSet: PoolSet[];
  mainSet: PoolSet[];
  coolDown: PoolSet[];
}

export interface PlannedSession {
  id: string;
  athleteId: string;
  date: string;
  type: 'Natação' | 'Musculação' | 'Preparação Física' | 'Preventivo';
  category: 'Ordinário' | 'Choque' | 'Recuperativo' | 'Manutenção';
  volume: number;
  intensity: number;
  description?: string;
  videoUrl?: string;
  structuredWorkout?: PoolWorkoutStructure;
  active?: boolean;
}

// --- Assessment Types ---
export interface PhysicalAssessment {
  id: string;
  athleteId: string;
  date: string;
  wellsBench: number; 
  shoulderMobilityLeft: number;
  shoulderMobilityRight: number;
  t12Test: number;
  medBallThrow: number;
  height: number;
  weight: number;
  wingspan: number;
  skinfolds: {
    tricepital: number;
    subescapular: number;
    bicepital: number;
    peitoral: number;
    axilar: number;
    suprailiaca: number;
    abdominal: number;
    coxa: number;
    panturrilha: number;
  };
  notes?: string;
}

export interface DailyMetric {
  id?: string;
  athleteId?: string;
  date: string;
  readinessScore?: number; // 0-100
  mood: number;
  stress: number;
  sleepQuality: number;
  sleepHours: number;
  bedtime?: string;
  wakeTime?: string;
  restingHeartRate: number;
  rpe: number; // Piscina
  psr: number; // Piscina
  gymRpe?: number;
  gymPsr?: number;
  sRPE: number;
  urineColor: number;
  fatigue: number;
  soreness: number;
  nutritionQuality?: number;
  supplementsTaken?: boolean;
  intensityZones?: {
    aerobic: number; // metros
    anaerobic: number; // metros
    sprint: number; // metros
  };
  painInfo?: {
    location: string;
    intensity: number;
    notes: string;
  };
  menstrualInfo?: {
    active: boolean;
    startDate?: string;
    endDate?: string;
    disposition: number;
    pain: number;
    flow: 'Leve' | 'Moderado' | 'Intenso' | '';
  };
  notes: string;
  trainingLoad: number;
  poolLoad: number;
  gymLoad: number;
}

export interface SwimTime {
  id: string;
  date: string;
  event: string;
  stroke: Stroke;
  distance: number;
  course: Course;
  time: string;
  seconds: number;
  type: 'Treino' | 'Competição' | 'Tiro';
  meetName?: string;
  meetId?: string;
  athleteId?: string;
  rpe?: number;
  psr?: number;
}

export interface BodyComposition {
  date: string;
  weight: number;
  height: number;
  bodyFatPct: number;
  muscleMassPct: number;
  hydrationPct?: number;
  athleteId?: string;
}

export interface Strategy {
  id: string;
  eventName: string;
  targetTime: string;
  splits: { distance: number; time: string; instruction: string }[];
  focusPoints: string[];
  athleteId?: string;
  notes?: string;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  endDate: string;
  location: string;
  priority: 'A' | 'B' | 'C';
  groupIds: string[];
}

export interface GymExercise {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  targetMuscle: string;
}

export interface GymSetLog {
  weight: number;
  reps: number;
}

export interface GymLog {
  id: string;
  athleteId: string;
  workoutId: string;
  date: string;
  exerciseName: string;
  sets: GymSetLog[];
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string; // Nome do exercício
  sets: string; // Ex: "4"
  reps: string; // Ex: "8"
  rest: string;
  notes: string;
  videoUrl?: string;
}

export interface WorkoutPlan {
  id: string;
  athleteId: string;
  title: string;
  exercises: WorkoutExercise[];
  dateAssigned: string;
  active: boolean;
}

export type NoteCategory = 'Geral' | 'Técnica' | 'Mental' | 'Nutrição' | 'Logística';

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  category: NoteCategory;
}

export interface SwimStandard {
  id: string;
  name: string;
  gender: 'M' | 'F';
  course: Course;
  category: string;
  event: string;
  time: string;
  seconds: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  image?: string;
  timestamp: string;
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  isGroup: boolean;
  online: boolean;
  unread: number;
  members?: string[];
  email?: string;
}

export type ResourceType = 'Book' | 'Movie' | 'Mindfulness';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  authorOrDirector?: string;
  description: string;
  imageUrl?: string;
  link?: string;
  steps?: string[];
  duration?: string;
}

export interface Preventive {
  id: string;
  title: string;
  duration: string;
  focus: string;
  videoUrl: string;
}
