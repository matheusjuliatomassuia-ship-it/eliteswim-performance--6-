import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_METRICS, MOCK_TIMES, MOCK_BODY, MOCK_COMPETITIONS, MOCK_STRATEGIES, MOCK_PLANS, MOCK_ATHLETE_PROFILES, MOCK_GROUPS, MOCK_WORKOUT_TYPES, MOCK_ASSESSMENTS, MOCK_BIOMECHANICS, MOCK_RESOURCES, timeToSeconds } from '../constants';
import { DailyMetric, UserRole, SwimTime, BodyComposition, WorkoutPlan, PlannedSession, AthleteProfile, Group, WorkoutDefinition, Competition, Strategy, PhysicalAssessment, BiomechanicsAnalysis, MeetRecord, Resource, Course, GymLog } from '../types';
import Dashboard from './components/Dashboard';
import DailyLog from './components/DailyLog';
import Performance from './components/Performance';
import Monitoring from './components/Health';
import StrategyComponent from './components/Strategy';
import TrainingHub from './components/TrainingHub';
import Indices from './components/Indices';
import Calculator from './components/Calculator';
import MyTimes from './components/MyTimes';
import Announcements from './components/Announcements';
import AuthScreen from './components/AuthScreen';
import Profile from './components/Profile';
import CoachArea from './components/CoachArea';
import Resources from './components/Resources';
import Planning from './components/Planning';
import CoachRegistrations from './components/CoachRegistrations';
import Assessments from './components/Assessments';
import Biomechanics from './components/Biomechanics';
import MeetRecords from './components/MeetRecords';
import {
  saveToSupabase,
  loadFromSupabase,
  debouncedSave,
  saveUserProfile,
  loadAthletesByCoach,
  loadAllAthletesData,
} from './supabaseSync';
import { LayoutDashboard, FilePenLine, Timer, Activity, Trophy, Dumbbell, ListChecks, Clock, Megaphone, LogOut, UserCog, ClipboardList, BookOpen, Menu, X, CalendarRange, Settings, Layers, ClipboardCheck, Video, Waves, Medal, Target, Anchor } from 'lucide-react';

// ─── Coleções sincronizadas com Supabase ─────────────────────────────────────
// Cada string é o nome da "collection" na tabela data_store
const COLLECTIONS = {
  METRICS: 'metrics',
  TIMES: 'times',
  PB_RECORDS: 'pbRecords',
  MEET_RECORDS: 'meetRecords',
  BODY: 'body',
  GYM_PLANS: 'gymPlans',
  GYM_LOGS: 'gymLogs',
  PLANS: 'plans',
  COMPETITIONS: 'competitions',
  STRATEGIES: 'strategies',
  ASSESSMENTS: 'assessments',
  BIOMECHANICS: 'biomechanics',
  MANAGED_ATHLETES: 'managedAthletes',
  MANAGED_GROUPS: 'managedGroups',
  MANAGED_WORKOUTS: 'managedWorkouts',
  RESOURCES: 'resources',
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('Athlete');
  const [userId, setUserId] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [userClub, setUserClub] = useState('');
  const [userCategory, setUserCategory] = useState('');
  const [userBirthDate, setUserBirthDate] = useState('');
  const [userGender, setUserGender] = useState<'M' | 'F'>('M');
  const [userState, setUserState] = useState('');
  const [userCountry, setUserCountry] = useState('');
  const [coachEmail, setCoachEmail] = useState<string | undefined>(undefined);

  const [currentTab, setCurrentTab] = useState('performance');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ─── DATA STATE ─────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [times, setTimes] = useState<SwimTime[]>([]);
  const [pbRecords, setPbRecords] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [meetRecords, setMeetRecords] = useState<MeetRecord[]>([]);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [bodyData, setBodyData] = useState<BodyComposition[]>([]);
  const [gymPlans, setGymPlans] = useState<WorkoutPlan[]>([]);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [biomechanics, setBiomechanics] = useState<BiomechanicsAnalysis[]>([]);
  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
  const [managedAthletes, setManagedAthletes] = useState<AthleteProfile[]>(MOCK_ATHLETE_PROFILES);
  const [managedGroups, setManagedGroups] = useState<Group[]>(MOCK_GROUPS);
  const [managedWorkouts, setManagedWorkouts] = useState<WorkoutDefinition[]>(MOCK_WORKOUT_TYPES);

  // ─── CARREGAR DADOS DO SUPABASE após login ───────────────────────────────────
  const loadUserData = useCallback(async (uid: string, role: UserRole, coachMail?: string) => {
    setIsLoadingData(true);
    console.log('[EliteSwim] Carregando dados do Supabase...');

    try {
      if (role === 'Athlete') {
        // ── Atleta: carrega seus próprios dados ──
        const [
          savedMetrics,
          savedTimes,
          savedPbRecords,
          savedMeetRecords,
          savedBody,
          savedGymPlans,
          savedGymLogs,
          savedPlans,
          savedCompetitions,
          savedStrategies,
          savedAssessments,
          savedBiomechanics,
        ] = await Promise.all([
          loadFromSupabase(uid, COLLECTIONS.METRICS),
          loadFromSupabase(uid, COLLECTIONS.TIMES),
          loadFromSupabase(uid, COLLECTIONS.PB_RECORDS),
          loadFromSupabase(uid, COLLECTIONS.MEET_RECORDS),
          loadFromSupabase(uid, COLLECTIONS.BODY),
          loadFromSupabase(uid, COLLECTIONS.GYM_PLANS),
          loadFromSupabase(uid, COLLECTIONS.GYM_LOGS),
          loadFromSupabase(uid, COLLECTIONS.PLANS),
          loadFromSupabase(uid, COLLECTIONS.COMPETITIONS),
          loadFromSupabase(uid, COLLECTIONS.STRATEGIES),
          loadFromSupabase(uid, COLLECTIONS.ASSESSMENTS),
          loadFromSupabase(uid, COLLECTIONS.BIOMECHANICS),
        ]);

        if (savedMetrics) setMetrics(savedMetrics); else setMetrics(MOCK_METRICS);
        if (savedTimes) setTimes(savedTimes); else setTimes(MOCK_TIMES);
        if (savedPbRecords) setPbRecords(savedPbRecords); else setPbRecords({});
        if (savedMeetRecords) setMeetRecords(savedMeetRecords); else setMeetRecords([]);
        if (savedBody) setBodyData(savedBody); else setBodyData(MOCK_BODY);
        if (savedGymPlans) setGymPlans(savedGymPlans); else setGymPlans([]);
        if (savedGymLogs) setGymLogs(savedGymLogs); else setGymLogs([]);
        if (savedPlans) setPlannedSessions(savedPlans); else setPlannedSessions(MOCK_PLANS);
        if (savedCompetitions) setCompetitions(savedCompetitions); else setCompetitions(MOCK_COMPETITIONS);
        if (savedStrategies) setStrategies(savedStrategies); else setStrategies(MOCK_STRATEGIES);
        if (savedAssessments) setAssessments(savedAssessments); else setAssessments(MOCK_ASSESSMENTS);
        if (savedBiomechanics) setBiomechanics(savedBiomechanics); else setBiomechanics(MOCK_BIOMECHANICS);

      } else {
        // ── Treinador: carrega seus dados + dados dos atletas ──
        const [
          savedCompetitions,
          savedStrategies,
          savedGroups,
          savedWorkouts,
          savedResources,
          savedPlans,
          savedMeetRecords,
        ] = await Promise.all([
          loadFromSupabase(uid, COLLECTIONS.COMPETITIONS),
          loadFromSupabase(uid, COLLECTIONS.STRATEGIES),
          loadFromSupabase(uid, COLLECTIONS.MANAGED_GROUPS),
          loadFromSupabase(uid, COLLECTIONS.MANAGED_WORKOUTS),
          loadFromSupabase(uid, COLLECTIONS.RESOURCES),
          loadFromSupabase(uid, COLLECTIONS.PLANS),
          loadFromSupabase(uid, COLLECTIONS.MEET_RECORDS),
        ]);

        if (savedCompetitions) setCompetitions(savedCompetitions);
        if (savedStrategies) setStrategies(savedStrategies);
        if (savedGroups) setManagedGroups(savedGroups);
        if (savedWorkouts) setManagedWorkouts(savedWorkouts);
        if (savedResources) setResources(savedResources);
        if (savedPlans) setPlannedSessions(savedPlans);
        if (savedMeetRecords) setMeetRecords(savedMeetRecords);

        // Busca atletas vinculados ao treinador pelo email
        const athleteProfiles = await loadAthletesByCoach(coachMail || '');
        console.log(`[EliteSwim] Atletas encontrados: ${athleteProfiles.length}`);

        if (athleteProfiles.length > 0) {
          // Monta lista de AthleteProfile para o treinador
          const athleteList: AthleteProfile[] = athleteProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            coachEmail: p.coachEmail,
            groupId: p.category || 'Geral',
            birthDate: p.birthDate || '',
            gender: p.gender || 'M',
            photoUrl: p.photoUrl,
            active: true,
          }));
          setManagedAthletes(prev => {
            // Merge: mantém atletas mock + adiciona/atualiza atletas reais
            const ids = new Set(athleteList.map(a => a.id));
            const filtered = prev.filter(a => !ids.has(a.id));
            return [...filtered, ...athleteList];
          });

          // Carrega métricas e tempos de todos os atletas
          const athleteIds = athleteProfiles.map((p: any) => p.id);
          const [allMetrics, allTimes, allPbRows, allAssessments, allBiomechanics, allBody] = await Promise.all([
  loadAllAthletesData(athleteIds, COLLECTIONS.METRICS),
  loadAllAthletesData(athleteIds, COLLECTIONS.TIMES),
  Promise.all(athleteIds.map((id: string) => loadFromSupabase(id, COLLECTIONS.PB_RECORDS).then((d: any) => ({ id, data: d })))),
  loadAllAthletesData(athleteIds, COLLECTIONS.ASSESSMENTS),
  loadAllAthletesData(athleteIds, COLLECTIONS.BIOMECHANICS),
  loadAllAthletesData(athleteIds, COLLECTIONS.BODY),
]);

          if (allMetrics.length > 0) setMetrics(allMetrics);
          if (allTimes.length > 0) setTimes(allTimes);
          if (allAssessments.length > 0) setAssessments(allAssessments);
          if (allBiomechanics.length > 0) setBiomechanics(allBiomechanics);
          if (allBody.length > 0) setBodyData(allBody);

          // Merge pbRecords de todos os atletas
          const mergedPb: Record<string, Record<string, Record<string, string>>> = {};
          (allPbRows as { id: string; data: any }[]).forEach(({ id, data }) => {
            if (data) mergedPb[id] = data;
          });
          if (Object.keys(mergedPb).length > 0) setPbRecords(mergedPb);
        }
      }
    } catch (e) {
      console.error('[EliteSwim] Erro ao carregar dados:', e);
    } finally {
      setIsLoadingData(false);
      console.log('[EliteSwim] Dados carregados!');
    }
  }, []);

  // ─── AUTO-SAVE: persiste mudanças no Supabase ────────────────────────────────
  // Atleta salva com seu próprio userId
  // Treinador salva dados compartilhados com seu userId
  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.METRICS, metrics);
  }, [metrics, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.TIMES, times);
  }, [times, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.PB_RECORDS, pbRecords);
  }, [pbRecords, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.MEET_RECORDS, meetRecords);
  }, [meetRecords, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.BODY, bodyData);
  }, [bodyData, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.GYM_PLANS, gymPlans);
  }, [gymPlans, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.GYM_LOGS, gymLogs);
  }, [gymLogs, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.PLANS, plannedSessions);
  }, [plannedSessions, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.COMPETITIONS, competitions);
  }, [competitions, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.STRATEGIES, strategies);
  }, [strategies, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.ASSESSMENTS, assessments);
  }, [assessments, userId]);

  useEffect(() => {
    if (!userId) return;
    debouncedSave(userId, COLLECTIONS.BIOMECHANICS, biomechanics);
  }, [biomechanics, userId]);

  useEffect(() => {
    if (!userId || userRole !== 'Coach') return;
    debouncedSave(userId, COLLECTIONS.MANAGED_GROUPS, managedGroups);
  }, [managedGroups, userId, userRole]);

  useEffect(() => {
    if (!userId || userRole !== 'Coach') return;
    debouncedSave(userId, COLLECTIONS.MANAGED_WORKOUTS, managedWorkouts);
  }, [managedWorkouts, userId, userRole]);

  useEffect(() => {
    if (!userId || userRole !== 'Coach') return;
    debouncedSave(userId, COLLECTIONS.RESOURCES, resources);
  }, [resources, userId, userRole]);

  // ─── SESSÃO ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedSession = localStorage.getItem('eliteSwim_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        if (user.email) {
          setUserEmail(user.email);
          setUserPassword(user.password || '');
          setUserName(user.name || 'Usuário');
          setUserRole(user.role || 'Athlete');
          setUserId(user.id);
          setUserPhoto(user.photoUrl);
          setUserClub(user.club || '');
          setUserCategory(user.category || '');
          setUserBirthDate(user.birthDate || '');
          setUserGender(user.gender || 'M');
          setUserState(user.state || '');
          setUserCountry(user.country || '');
          setCoachEmail(user.coachEmail);
          setIsAuthenticated(true);
          setCurrentTab(user.role === 'Coach' ? 'dashboard' : 'log');
          // Carrega dados do Supabase
          loadUserData(user.id, user.role, user.email);
        }
      } catch (e) { console.error(e); }
    }
  }, [loadUserData]);

  const handleUpdateUser = (name: string, email: string, photoUrl?: string, coachEmailInput?: string, club?: string, category?: string, birthDate?: string, gender?: 'M' | 'F', state?: string, country?: string, newPassword?: string) => {
    setUserName(name);
    setUserEmail(email);
    setUserPhoto(photoUrl);
    setUserClub(club || '');
    setUserCategory(category || '');
    setUserBirthDate(birthDate || '');
    setUserGender(gender || 'M');
    setUserState(state || '');
    setUserCountry(country || '');
    setCoachEmail(coachEmailInput);
    if (newPassword) setUserPassword(newPassword);

    const updatedUser = {
      id: userId,
      name,
      email,
      password: newPassword || userPassword,
      photoUrl,
      coachEmail: coachEmailInput,
      club,
      category,
      birthDate,
      gender,
      state,
      country,
      role: userRole,
    };

    localStorage.setItem('eliteSwim_session', JSON.stringify(updatedUser));

    const accountsRaw = localStorage.getItem('eliteSwim_accounts');
    let accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
    const idx = accounts.findIndex((a: any) => a.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) { accounts[idx] = updatedUser; } else { accounts.push(updatedUser); }
    localStorage.setItem('eliteSwim_accounts', JSON.stringify(accounts));

    // Salva perfil no Supabase (para que treinador encontre o atleta)
    saveUserProfile(updatedUser);

    if (userRole === 'Athlete') {
      const athleteIdx = managedAthletes.findIndex(a => a.id === userId);
      const updatedAthlete: AthleteProfile = {
        id: userId, name, email,
        coachEmail: coachEmailInput,
        groupId: category || 'Geral',
        birthDate: birthDate || '',
        gender: gender || 'M',
        photoUrl,
        active: true,
      };
      if (athleteIdx >= 0) {
        const newManaged = [...managedAthletes];
        newManaged[athleteIdx] = updatedAthlete;
        setManagedAthletes(newManaged);
      } else {
        setManagedAthletes([...managedAthletes, updatedAthlete]);
      }
    }
  };

  const handleAddTime = (newTime: SwimTime) => {
    setTimes(prev => [...prev, newTime]);
    const { athleteId, event, course, time, seconds } = newTime;
    const targetAthleteId = athleteId || userId;
    const poolKey = course === Course.LCM ? '50m' : '25m';
    setPbRecords(prev => {
      const updated = { ...prev };
      if (!updated[targetAthleteId]) updated[targetAthleteId] = { '25m': {}, '50m': {} };
      if (!updated[targetAthleteId][poolKey]) updated[targetAthleteId][poolKey] = {};
      const currentBestString = updated[targetAthleteId][poolKey][event];
      const currentBestSeconds = (currentBestString && currentBestString !== '--:--.--') ? timeToSeconds(currentBestString) : Infinity;
      if (seconds > 0 && seconds < currentBestSeconds) { updated[targetAthleteId][poolKey][event] = time; }
      return updated;
    });
  };

  const syncCompetitionTimes = (newMeetTimes: SwimTime[]) => {
    setTimes(prev => [...prev, ...newMeetTimes]);
    setPbRecords(prev => {
      const updated = { ...prev };
      newMeetTimes.forEach(newTime => {
        const { athleteId, event, course, time, seconds } = newTime;
        const targetAthleteId = athleteId || userId;
        const poolKey = course === Course.LCM ? '50m' : '25m';
        if (!updated[targetAthleteId]) updated[targetAthleteId] = { '25m': {}, '50m': {} };
        if (!updated[targetAthleteId][poolKey]) updated[targetAthleteId][poolKey] = {};
        const currentBestString = updated[targetAthleteId][poolKey][event];
        const currentBestSeconds = (currentBestString && currentBestString !== '--:--.--') ? timeToSeconds(currentBestString) : Infinity;
        if (seconds > 0 && seconds < currentBestSeconds) { updated[targetAthleteId][poolKey][event] = time; }
      });
      return updated;
    });
  };

  const handleLogin = (email: string, role: UserRole, name?: string, password?: string) => {
    const isCoachUser = email.toLowerCase() === 'felippesimoes212@gmail.com';
    const isAthleteUser = email.toLowerCase() === 'matheusjuliatomassuia@gmail.com';

    const accountsRaw = localStorage.getItem('eliteSwim_accounts');
    const accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
    const existingAccount = accounts.find((a: any) => a.email.toLowerCase() === email.toLowerCase());

    let finalId = existingAccount?.id;
    if (!finalId) {
      if (isCoachUser) finalId = 'coach_felippe';
      else if (isAthleteUser) finalId = 'athlete_matheus';
      else finalId = (role === 'Coach' ? 'coach_' : 'user_') + Date.now();
    }

    let finalName = name || existingAccount?.name || (isCoachUser ? 'Felippe Simões' : (isAthleteUser ? 'Matheus Juliato' : 'Novo Usuário'));

    const newUser = existingAccount
      ? { ...existingAccount, password: password || existingAccount.password }
      : {
          id: finalId,
          email,
          password: password || '',
          name: finalName,
          role,
          club: (isCoachUser || isAthleteUser) ? 'CLUBE ESPERIA' : '',
          category: isCoachUser ? 'TREINADOR' : (isAthleteUser ? 'juvenil2' : ''),
          birthDate: isAthleteUser ? '2010-07-12' : '',
          gender: 'M',
          state: (isCoachUser || isAthleteUser) ? 'SÃO PAULO' : '',
          country: (isCoachUser || isAthleteUser) ? 'BR' : '',
          coachEmail: isAthleteUser ? 'felippesimoes212@gmail.com' : undefined,
        };

    localStorage.setItem('eliteSwim_session', JSON.stringify(newUser));
    if (!existingAccount) {
      accounts.push(newUser);
      localStorage.setItem('eliteSwim_accounts', JSON.stringify(accounts));
    }

    setUserEmail(newUser.email);
    setUserPassword(newUser.password);
    setUserName(newUser.name);
    setUserRole(newUser.role);
    setUserId(newUser.id);
    setUserClub(newUser.club);
    setUserCategory(newUser.category);
    setUserBirthDate(newUser.birthDate);
    setUserState(newUser.state);
    setUserCountry(newUser.country);
    setCoachEmail(newUser.coachEmail);
    setIsAuthenticated(true);
    setCurrentTab(role === 'Coach' ? 'dashboard' : 'log');

    // Salva perfil no Supabase e carrega dados
    saveUserProfile(newUser);
    loadUserData(newUser.id, newUser.role, newUser.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('eliteSwim_session');
    setIsAuthenticated(false);
    setCurrentTab('log');
  };

  const handleSimulateAthleteView = (athleteId: string) => {
    const athlete = managedAthletes.find(a => a.id === athleteId);
    if (athlete) {
      setUserRole('Athlete');
      setUserId(athlete.id);
      setUserName(athlete.name);
      setUserEmail(athlete.email || '');
      setUserCategory(athlete.groupId.toUpperCase());
      setCoachEmail(athlete.coachEmail);
      setCurrentTab('training');
    }
  };

  const handleAddMetric = (newMetric: DailyMetric) => {
    setMetrics(prev => {
      const index = prev.findIndex(m => m.athleteId === newMetric.athleteId && m.date === newMetric.date);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newMetric };
        return updated;
      }
      return [...prev, newMetric];
    });
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentTab]);

  const renderContent = () => {
    // Mostra loading enquanto busca dados do Supabase
    if (isLoadingData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest animate-pulse">
            Sincronizando dados...
          </p>
        </div>
      );
    }

    switch (currentTab) {
      case 'coach': return <CoachArea metrics={metrics} athletes={managedAthletes} />;
      case 'meet_records': return <MeetRecords records={meetRecords} athletes={managedAthletes} groups={managedGroups} onUpdateRecords={setMeetRecords} onSyncTimes={syncCompetitionTimes} userRole={userRole} />;
      case 'performance': return <Performance times={times} onUpdate={setTimes} userRole={userRole} athletes={managedAthletes} groups={managedGroups} onSyncWithRecords={handleAddTime} currentUserId={userId} />;
      case 'training': return <TrainingHub userRole={userRole} plans={plannedSessions} gymPlans={gymPlans} onUpdateGymPlans={setGymPlans} gymLogs={gymLogs} onUpdateGymLogs={setGymLogs} onUpdatePlans={setPlannedSessions} preventives={[]} onUpdatePreventives={() => {}} athletes={managedAthletes} groups={managedGroups} currentUserId={userId} onSimulateAthleteView={handleSimulateAthleteView} />;
      case 'monitoring': return <Monitoring data={bodyData} metrics={metrics} plannedSessions={plannedSessions} athletes={managedAthletes} groups={managedGroups} onUpdate={setBodyData} userRole={userRole} />;
      case 'indices': return <Indices />;
      case 'calculator': return <Calculator />;
      case 'records': return <MyTimes data={pbRecords} onUpdate={setPbRecords} userRole={userRole} athletes={managedAthletes} currentUserId={userId} forcedCategory={userCategory} onGlobalSync={handleAddTime} />;
      case 'strategy': return <StrategyComponent competitions={competitions} strategies={strategies} onUpdateCompetitions={setCompetitions} onUpdateStrategies={setStrategies} userRole={userRole} currentUserId={userId} />;
      case 'log': return <DailyLog onAddLog={handleAddMetric} userId={userId} previousLogs={metrics.filter(m => m.athleteId === userId)} />;
      case 'registrations': return <CoachRegistrations athletes={managedAthletes} groups={managedGroups} workoutTypes={managedWorkouts} onUpdateAthletes={setManagedAthletes} onUpdateGroups={setManagedGroups} onUpdateWorkoutTypes={setManagedWorkouts} />;
      case 'assessments': return <Assessments userRole={userRole} assessments={assessments} athletes={managedAthletes} onUpdateAssessments={setAssessments} currentUserId={userId} />;
      case 'biomechanics': return <Biomechanics userRole={userRole} analyses={biomechanics} athletes={managedAthletes} onUpdateAnalyses={setBiomechanics} onDeleteAnalysis={(id) => setBiomechanics(prev => prev.filter(b => b.id !== id))} currentUserId={userId} />;
      case 'announcements': return <Announcements userRole={userRole} userName={userName} />;
      case 'planning': return <Planning plans={plannedSessions} metrics={metrics} onUpdatePlans={setPlannedSessions} userRole={userRole} onNavigate={setCurrentTab} />;
      case 'profile': return <Profile user={{ name: userName, email: userEmail, password: userPassword, role: userRole, photoUrl: userPhoto, club: userClub, category: userCategory, birthDate: userBirthDate, gender: userGender, state: userState, country: userCountry, coachEmail: coachEmail }} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
      case 'resources': return <Resources resources={resources} onUpdateResources={setResources} userRole={userRole} />;
      case 'dashboard': return <Dashboard metrics={metrics} userRole={userRole} athletes={managedAthletes} groups={managedGroups} competitions={competitions} />;
      default: return <DailyLog onAddLog={handleAddMetric} userId={userId} previousLogs={metrics.filter(m => m.athleteId === userId)} />;
    }
  };

  const navItems = userRole === 'Coach' ? [
    { id: 'dashboard', label: 'PAINEL', icon: LayoutDashboard },
    { id: 'coach', label: 'EQUIPE', icon: ClipboardList },
    { id: 'training', label: 'TREINO', icon: Layers },
    { id: 'planning', label: 'PLANEJAMENTO', icon: CalendarRange },
    { id: 'monitoring', label: 'MONITORAMENTO', icon: Activity },
    { id: 'meet_records', label: 'COMPETIÇÕES', icon: Medal },
    { id: 'performance', label: 'TEMPOS', icon: Timer },
    { id: 'records', label: 'RECORDES', icon: Trophy },
    { id: 'registrations', label: 'CADASTROS', icon: Settings },
  ] : [
    { id: 'log', label: 'DIÁRIO', icon: FilePenLine },
    { id: 'performance', label: 'TEMPOS', icon: Timer },
    { id: 'training', label: 'TREINO', icon: Layers },
    { id: 'records', label: 'RECORDES', icon: Trophy },
  ];

  const moreItems = [
    { id: 'indices', label: 'RADAR GERAL', icon: ListChecks },
    { id: 'calculator', label: 'SIMULADOR', icon: Target },
    { id: 'strategy', label: 'TÁTICA', icon: Trophy },
    { id: 'biomechanics', label: 'VÍDEO LAB', icon: Video },
    { id: 'assessments', label: 'TESTES', icon: ClipboardCheck },
    { id: 'resources', label: 'BIBLIOTECA', icon: BookOpen },
    { id: 'announcements', label: 'MURAL', icon: Megaphone },
    { id: 'profile', label: 'PERFIL', icon: UserCog },
  ];

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => (
    <button
      onClick={() => { setCurrentTab(item.id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center px-6 py-3 transition-all group ${
        currentTab === item.id
          ? 'bg-primary/10 text-primary border-r-4 border-primary'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <item.icon size={18} className={`mr-3 ${currentTab === item.id ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`} />
      <span className="text-[11px] font-black uppercase italic tracking-widest">{item.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30 overflow-hidden flex">
      {!isAuthenticated ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <div className="flex w-full h-screen">
          <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-white/5 h-full z-40">
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)] rotate-3">
                  <Waves className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">EliteSwim</h1>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">High Performance</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
              <div className="px-6 mb-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-4">Principais</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => <SidebarItem key={item.id} item={item} />)}
              </nav>

              <div className="px-6 mt-8 mb-2 border-t border-white/5 pt-6">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-4">Ferramentas</p>
              </div>
              <nav className="space-y-1">
                {moreItems.map((item) => <SidebarItem key={item.id} item={item} />)}
              </nav>
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                  {userPhoto
                    ? <img src={userPhoto} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-primary font-black italic">{userName.charAt(0)}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white italic uppercase truncate">{userName}</p>
                  <p className="text-[8px] font-mono text-primary uppercase">{userRole}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-600 hover:text-danger"><LogOut size={16} /></button>
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="lg:hidden h-16 bg-surface border-b border-white/5 flex items-center justify-between px-6 z-50">
              <div className="flex items-center gap-3">
                <Waves className="text-primary" size={24} />
                <h1 className="text-lg font-black italic tracking-tighter uppercase">EliteSwim</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </header>

            {isMobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md pt-20 px-6 animate-in slide-in-from-top-full duration-300">
                <div className="grid grid-cols-1 gap-1 overflow-y-auto max-h-[80vh]">
                  {[...navItems, ...moreItems].map((item) => <SidebarItem key={item.id} item={item} />)}
                  <button onClick={handleLogout} className="flex items-center p-4 rounded-2xl text-xs font-black uppercase italic text-danger bg-danger/10 mt-4">
                    <LogOut size={20} className="mr-4" /> Encerrar Sessão
                  </button>
                </div>
              </div>
            )}

            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] p-6 lg:p-12 relative">
              <div className="max-w-7xl mx-auto pb-20 min-h-full">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;