import { useState, useEffect, useCallback } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, Seguimiento, Configuracion, Usuario, EventType, MemberStatus, EventTrack, VolunteerArea, VolunteerAssignment, PrayerRequest } from './types';
import { DEFAULT_CONFIG } from './data/mockPeople';
import { calculateAlerts } from './utils/attendance';
import { supabase } from './lib/supabase';
import * as db from './lib/db';

import LoginScreen from './components/LoginScreen';
import AttendanceSheet from './components/AttendanceSheet';
import StatsDashboard from './components/StatsDashboard';
import PeopleManager from './components/PeopleManager';
import AlertsManager from './components/AlertsManager';
import BirthdaysList from './components/BirthdaysList';
import CalendarView from './components/CalendarView';
import HistoryView from './components/HistoryView';
import ConfigScreen from './components/ConfigScreen';
import VolunteersModule from './components/VolunteersModule';
import PrayerRequestsModule from './components/PrayerRequestsModule';
import JourneyModule from './components/JourneyModule';

import { ClipboardCheck, Users, Settings, LogOut, Home, Menu, X, Sun, Moon, Heart, MessageSquare, TrendingUp } from 'lucide-react';

type ActiveModule = 'home' | 'personas' | 'asistencia' | 'voluntarios' | 'oracion' | 'followup' | 'config';
type PersonasTab = 'directorio' | 'cumpleanos' | 'alertas';
type AsistenciaTab = 'registrar' | 'calendario' | 'historial' | 'estadisticas';

export default function App() {
  const isInstalledApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const [showSplash, setShowSplash] = useState(isInstalledApp);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cl-dark-mode') === 'true');
  const [language, setLanguage] = useState<Language>('es');
  const [user, setUser] = useState<Usuario | null>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');
  const [personasTab, setPersonasTab] = useState<PersonasTab>('directorio');
  const [asistenciaTab, setAsistenciaTab] = useState<AsistenciaTab>('registrar');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('cl-dark-mode', String(next));
      return next;
    });
  };

  const [people, setPeople] = useState<Persona[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [attendance, setAttendance] = useState<Asistencia[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [config, setConfig] = useState<Configuracion>(DEFAULT_CONFIG);
  const [customTracks, setCustomTracks] = useState<EventTrack[]>([]);
  const [volunteerAreas, setVolunteerAreas] = useState<VolunteerArea[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [fetchedPeople, fetchedEvents, fetchedAttendance, fetchedSeguimientos, fetchedConfig, fetchedTracks, fetchedVolunteerAreas, fetchedAssignments, fetchedPrayer] =
        await Promise.all([
          db.getPersonas(),
          db.getEventos(),
          db.getAsistencias(),
          db.getSeguimientos(),
          db.getConfiguracion(),
          db.getEventTracks(),
          db.getVolunteerAreas(),
          db.getVolunteerAssignments(),
          db.getPrayerRequests(),
        ]);
      setPeople(fetchedPeople);
      setEvents(fetchedEvents);
      setAttendance(fetchedAttendance);
      setSeguimientos(fetchedSeguimientos);
      setConfig(fetchedConfig ?? DEFAULT_CONFIG);
      setCustomTracks(fetchedTracks);
      setVolunteerAreas(fetchedVolunteerAreas);
      setAssignments(fetchedAssignments);
      setPrayerRequests(fetchedPrayer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error loading data:', err);
      setLoadError(msg);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, rol, idioma_preferido')
          .eq('id', session.user.id)
          .maybeSingle();
        const usr: Usuario = {
          id: session.user.id,
          nombre: profile?.nombre ?? session.user.email ?? 'Usuario',
          email_login: session.user.email ?? '',
          rol: (profile?.rol ?? 'lider') as Usuario['rol'],
          idioma_preferido: (profile?.idioma_preferido ?? 'es') as Language,
        };
        setUser(usr);
        setLanguage(usr.idioma_preferido);
        await loadAllData();
      }
      setAppLoading(false);
    }).catch(() => {
      setAppLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setActiveModule('home');
      }
    });

    let hiddenAt = 0;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && Date.now() - hiddenAt > 30_000) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) loadAllData();
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadAllData]);

  const t = language === 'es' ? esTranslations : enTranslations;
  const es = language === 'es';

  const defaultTracks: EventTrack[] = [
    { id: 'servicio_11', titleEs: '11:00 am', titleEn: '11:00 am', labelEs: 'Servicio Domingo', labelEn: 'Sunday Morning service', type: 'servicio', active: true, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-indigo-600 hover:bg-slate-50' },
    { id: 'servicio_6', titleEs: '6:00 pm', titleEn: '6:00 pm', labelEs: 'Servicio Domingo', labelEn: 'Sunday Evening service', type: 'servicio', active: true, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-violet-500 hover:bg-slate-50' },
    { id: 'grupo_conexion', titleEs: 'Grupo Conexión', titleEn: 'Connection Group', labelEs: 'Sábado', labelEn: 'Cell connection group', type: 'grupo', active: config.grupos_activos.grupo_conexion, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-emerald-500 hover:bg-slate-50' },
    { id: 'grupo_hombres', titleEs: 'Grupo Hombres', titleEn: "Men's Group", labelEs: 'Chicos', labelEn: "Men's study & fellowship", type: 'grupo', active: config.grupos_activos.grupo_hombres, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-blue-500 hover:bg-slate-50' },
    { id: 'grupo_mujeres', titleEs: 'Grupo Mujeres', titleEn: "Women's Group", labelEs: 'Chicas', labelEn: "Women's study & fellowship", type: 'grupo', active: config.grupos_activos.grupo_mujeres, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-rose-500 hover:bg-slate-50' },
  ];
  const allTracks = [...defaultTracks, ...customTracks];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLoginSuccess = async (usr: Usuario) => {
    setUser(usr);
    setLanguage(usr.idioma_preferido);
    await loadAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveModule('home');
  };

  const handleAddNewPerson = async (p: Persona) => {
    await db.addPersona(p);
    setPeople(prev => [p, ...prev]);
  };

  const handleUpdatePersonStatus = async (id: string, newStatus: MemberStatus) => {
    await db.updatePersona(id, { estado: newStatus });
    setPeople(prev => prev.map(p => p.id === id ? { ...p, estado: newStatus } : p));
  };

  const handleAddPersonNote = async (id: string, noteText: string) => {
    await db.updatePersona(id, { notas: noteText });
    setPeople(prev => prev.map(p => p.id === id ? { ...p, notas: noteText } : p));
  };

  const handleUpdatePersonPhoto = async (id: string, photoBase64: string | undefined) => {
    await db.updatePersona(id, { foto_perfil: photoBase64 });
    setPeople(prev => prev.map(p => p.id === id ? { ...p, foto_perfil: photoBase64 } : p));
  };

  const handleUpdatePersona = async (id: string, updates: Partial<Persona>) => {
    await db.updatePersona(id, updates);
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeletePersona = async (id: string) => {
    await db.deletePersona(id);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const handleAddNewSeguimientoLog = async (seg: Seguimiento) => {
    await db.addSeguimiento(seg);
    setSeguimientos(prev => [seg, ...prev]);
  };

  const handleUpdateSeguimientoStatus = async (id: string, status: 'pendiente' | 'contactado' | 'cerrado') => {
    await db.updateSeguimientoEstado(id, status);
    setSeguimientos(prev => prev.map(s => s.id === id ? { ...s, estado: status } : s));
  };

  const handleSaveConfig = async (updatedConfig: Configuracion) => {
    await db.saveConfiguracion(updatedConfig);
    setConfig(updatedConfig);
    if (updatedConfig.idioma_por_defecto) setLanguage(updatedConfig.idioma_por_defecto);
  };

  const handleRegisterCustomTrack = async (track: EventTrack) => {
    await db.addEventTrack(track);
    setCustomTracks(prev => [...prev, track]);
  };

  const handleDeleteCustomTrack = async (id: string) => {
    await db.deleteEventTrack(id);
    setCustomTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddVolunteerArea = async (area: VolunteerArea) => {
    await db.addVolunteerArea(area);
    setVolunteerAreas(prev => [...prev, area]);
  };

  const handleUpdateVolunteerArea = async (id: string, updates: Partial<VolunteerArea>) => {
    await db.updateVolunteerArea(id, updates);
    setVolunteerAreas(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteVolunteerArea = async (id: string) => {
    await db.deleteVolunteerArea(id);
    setVolunteerAreas(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAssignment = async (assignment: VolunteerAssignment) => {
    await db.addVolunteerAssignment(assignment);
    setAssignments(prev => [...prev, assignment]);
  };

  const handleUpdateAssignment = async (id: string, updates: Partial<VolunteerAssignment>) => {
    await db.updateVolunteerAssignment(id, updates);
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAssignment = async (id: string) => {
    await db.deleteVolunteerAssignment(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddPrayerRequest = async (request: PrayerRequest) => {
    await db.addPrayerRequest(request);
    setPrayerRequests(prev => [request, ...prev]);
  };

  const handleUpdatePrayerRequest = async (id: string, updates: Partial<PrayerRequest>) => {
    await db.updatePrayerRequest(id, updates);
    setPrayerRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeletePrayerRequest = async (id: string) => {
    await db.deletePrayerRequest(id);
    setPrayerRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveAttendanceBatch = async (
    eventType: EventType, dateStr: string,
    presentIds: string[], newIdsSinceSave: string[], anonCount: number
  ) => {
    let matchedEvt = events.find(e => e.tipo_evento === eventType && e.fecha === dateStr);
    let targetEventId = '';
    if (matchedEvt) {
      targetEventId = matchedEvt.id;
      await db.deleteAsistenciasByEvento(targetEventId);
      const updatedEvt: Evento = { ...matchedEvt, asistentes_anonimos: anonCount };
      await db.upsertEvento(updatedEvt);
      setEvents(prev => prev.map(e => e.id === targetEventId ? updatedEvt : e));
    } else {
      targetEventId = 'evt_' + Date.now();
      const newEvt: Evento = {
        id: targetEventId,
        nombre_evento: `${eventType.replace('_', ' ').toUpperCase()} (${dateStr})`,
        tipo_evento: eventType,
        fecha: dateStr,
        creado_por: user?.nombre ?? 'Admin',
        asistentes_anonimos: anonCount,
      };
      await db.upsertEvento(newEvt);
      setEvents(prev => [...prev, newEvt]);
    }
    const eligiblePeople = people.filter(p => {
      if (p.estado === 'inactivo') return false;
      if (eventType === 'grupo_hombres' && p.sexo !== 'M') return false;
      if (eventType === 'grupo_mujeres' && p.sexo !== 'F') return false;
      return true;
    });
    let counter = Date.now();
    const newRecords: Asistencia[] = eligiblePeople.map(p => ({
      id: 'att_' + counter++,
      persona_id: p.id,
      evento_id: targetEventId,
      presente: presentIds.includes(p.id),
      es_nuevo: p.estado === 'nuevo' || newIdsSinceSave.includes(p.id),
      fecha_registro: dateStr,
    }));
    await db.insertAsistencias(newRecords);
    setAttendance(prev => [...prev.filter(a => a.evento_id !== targetEventId), ...newRecords]);
    setSuccessToast({ show: true, message: es ? '¡Asistencia registrada y guardada exitosamente!' : 'Attendance successfully registered and stored!' });
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleResetCurrentEvent = async (eventId: string) => {
    await db.deleteAsistenciasByEvento(eventId);
    await db.deleteEvento(eventId);
    setAttendance(prev => prev.filter(a => a.evento_id !== eventId));
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleResetAttendanceData = async () => {
    await db.resetAttendanceData();
    setEvents([]);
    setAttendance([]);
  };

  const liveCareAlertsCount = calculateAlerts(people, events, attendance, config).length;

  const goToModule = (mod: ActiveModule) => {
    setActiveModule(mod);
    setMobileMenuOpen(false);
  };

  // ── Splash / Loading / Auth guards ───────────────────────────────────────

  if (showSplash) {
    return (
      <div className={`h-full w-full cursor-pointer select-none ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} onClick={() => setShowSplash(false)}>
        <img src={isDarkMode ? '/splash-dark.png' : '/splash-light.png'} alt="Comunidad Latina" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (appLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <img src="/app-icon.png" alt="App Icon" className="w-16 h-16 rounded-2xl mx-auto mb-4 animate-pulse shadow-lg" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{es ? 'Cargando...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className={isDarkMode ? 'dark h-full' : 'h-full'}>
        <LoginScreen language={language} onLanguageChange={setLanguage} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // ── Nav items (5 modules + config) ───────────────────────────────────────

  const navModules = [
    { id: 'home' as ActiveModule, label: t.home, icon: Home },
    { id: 'personas' as ActiveModule, label: es ? 'Personas' : 'People', icon: Users, badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
    { id: 'asistencia' as ActiveModule, label: t.registerAttendance, icon: ClipboardCheck },
    { id: 'voluntarios' as ActiveModule, label: es ? 'Voluntarios' : 'Volunteers', icon: Heart },
    { id: 'oracion' as ActiveModule, label: es ? 'Oración' : 'Prayer', icon: MessageSquare },
    { id: 'followup' as ActiveModule, label: 'Follow-Up', icon: TrendingUp },
  ];

  // ── Tab bar component ─────────────────────────────────────────────────────

  function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; badge?: number }[]; active: string; onChange: (t: string) => void }) {
    return (
      <div className="mb-6 max-w-full overflow-x-auto">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit min-w-full sm:min-w-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none ${active === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Module content ────────────────────────────────────────────────────────

  const renderModule = () => {
    switch (activeModule) {
      case 'home':
        return (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900">{es ? 'Módulos' : 'Modules'}</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.tagline}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
              {([
                { id: 'personas',   titleEs: 'Personas',    titleEn: 'People',      descEs: `${people.length} registrados`,           descEn: `${people.length} registered`,       icon: Users,         color: 'bg-indigo-600',  badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
                { id: 'asistencia', titleEs: 'Registrar Asistencia', titleEn: 'Register Attendance', descEs: 'Registrar y revisar', descEn: 'Register & review', icon: ClipboardCheck, color: 'bg-blue-600' },
                { id: 'voluntarios',titleEs: 'Voluntarios', titleEn: 'Volunteers',  descEs: 'Roles y disponibilidad',                 descEn: 'Roles & availability',               icon: Heart,         color: 'bg-rose-500' },
                { id: 'oracion',    titleEs: 'Oración',     titleEn: 'Prayer',      descEs: `${prayerRequests.filter(r=>r.estado==='abierta').length} activas`, descEn: `${prayerRequests.filter(r=>r.estado==='abierta').length} active`, icon: MessageSquare, color: 'bg-purple-600' },
                { id: 'followup',   titleEs: 'Follow-Up',   titleEn: 'Follow-Up',   descEs: `${seguimientos.filter(s=>s.estado==='pendiente').length} pendientes`, descEn: `${seguimientos.filter(s=>s.estado==='pendiente').length} pending`, icon: TrendingUp, color: 'bg-teal-600' },
              ] as const).map(mod => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => goToModule(mod.id)}
                    className="group relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-left shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col gap-3 sm:gap-5"
                  >
                    {'badge' in mod && mod.badge ? (
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[20px] h-5 px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{mod.badge}</span>
                    ) : null}
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${mod.color} shadow-md`}>
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-slate-900">{es ? mod.titleEs : mod.titleEn}</p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 sm:mt-1">{es ? mod.descEs : mod.descEn}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'personas':
        return (
          <div>
            <TabBar
              tabs={[
                { id: 'directorio', label: es ? 'Directorio' : 'Directory' },
                { id: 'cumpleanos', label: es ? 'Cumpleaños' : 'Birthdays' },
                { id: 'alertas',    label: es ? 'Alertas' : 'Alerts', badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
              ]}
              active={personasTab}
              onChange={t => setPersonasTab(t as PersonasTab)}
            />
            {personasTab === 'directorio' && (
              <PeopleManager
                language={language} people={people} events={events} attendance={attendance}
                onUpdatePersonStatus={handleUpdatePersonStatus}
                onAddPersonNote={handleAddPersonNote}
                onUpdatePersonPhoto={handleUpdatePersonPhoto}
                onUpdatePersona={handleUpdatePersona}
                onDeletePersona={handleDeletePersona}
                onOpenNewPersonSheet={() => { setActiveModule('asistencia'); setAsistenciaTab('registrar'); }}
                onAddExistingMember={handleAddNewPerson}
                volunteerAreas={volunteerAreas}
              />
            )}
            {personasTab === 'cumpleanos' && (
              <BirthdaysList language={language} people={people} config={config} onNavigateToPeople={() => setPersonasTab('directorio')} />
            )}
            {personasTab === 'alertas' && (
              <AlertsManager
                language={language} people={people} events={events} attendance={attendance}
                config={config} seguimientos={seguimientos}
                onAddNewSeguimiento={handleAddNewSeguimientoLog}
                onUpdateSeguimientoStatus={handleUpdateSeguimientoStatus}
                username={user.nombre}
              />
            )}
          </div>
        );

      case 'asistencia':
        return (
          <div>
            <TabBar
              tabs={[
                { id: 'registrar',    label: es ? 'Registrar' : 'Register' },
                { id: 'calendario',   label: es ? 'Calendario' : 'Calendar' },
                { id: 'historial',    label: es ? 'Historial' : 'History' },
                { id: 'estadisticas', label: es ? 'Estadísticas' : 'Statistics' },
              ]}
              active={asistenciaTab}
              onChange={t => setAsistenciaTab(t as AsistenciaTab)}
            />
            {asistenciaTab === 'registrar' && (
              <AttendanceSheet
                language={language} people={people}
                onAddNewPerson={handleAddNewPerson}
                savedEvents={events} savedAttendance={attendance}
                onSaveAttendanceBatch={handleSaveAttendanceBatch}
                onResetCurrentEvent={handleResetCurrentEvent}
                initialEventType="servicio_11"
                username={user.nombre}
                showOnlySelectedTrack={false}
                customTracks={customTracks}
              />
            )}
            {asistenciaTab === 'calendario' && (
              <CalendarView language={language} people={people} events={events} attendance={attendance} customTracks={customTracks} />
            )}
            {asistenciaTab === 'historial' && (
              <HistoryView language={language} people={people} events={events} attendance={attendance} customTracks={customTracks} />
            )}
            {asistenciaTab === 'estadisticas' && (
              <StatsDashboard
                language={language} people={people} events={events} attendance={attendance}
                onNavigateToAlerts={() => { setActiveModule('personas'); setPersonasTab('alertas'); }}
                onResetAttendanceData={handleResetAttendanceData}
                onRefresh={loadAllData}
              />
            )}
          </div>
        );

      case 'voluntarios':
        return (
          <VolunteersModule
            language={language} people={people} volunteerAreas={volunteerAreas}
            assignments={assignments} registeredTracks={allTracks} username={user.nombre}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onOpenPeople={() => setActiveModule('personas')}
          />
        );

      case 'oracion':
        return (
          <PrayerRequestsModule
            language={language} people={people} requests={prayerRequests} username={user.nombre}
            onAddRequest={handleAddPrayerRequest}
            onUpdateRequest={handleUpdatePrayerRequest}
            onDeleteRequest={handleDeletePrayerRequest}
          />
        );

      case 'followup':
        return (
          <JourneyModule
            language={language} people={people} events={events} attendance={attendance}
            followUps={seguimientos} username={user.nombre}
            onAddFollowUp={handleAddNewSeguimientoLog}
            onUpdateFollowUpStatus={handleUpdateSeguimientoStatus}
            onOpenPeople={() => setActiveModule('personas')}
          />
        );

      case 'config':
        return (
          <ConfigScreen
            language={language} config={config}
            onSaveConfig={handleSaveConfig}
            onResetDatabase={handleResetAttendanceData}
            onLanguageChange={setLanguage}
            customTracks={customTracks}
            onRegisterCustomTrack={handleRegisterCustomTrack}
            onDeleteCustomTrack={handleDeleteCustomTrack}
            volunteerAreas={volunteerAreas}
            onAddVolunteerArea={handleAddVolunteerArea}
            onUpdateVolunteerArea={handleUpdateVolunteerArea}
            onDeleteVolunteerArea={handleDeleteVolunteerArea}
            onBack={() => setActiveModule('home')}
          />
        );

      default:
        return null;
    }
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className={`h-full flex flex-col font-sans overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      <div className="h-1 bg-gradient-to-r from-indigo-600 to-violet-500 shrink-0" />

      {/* Mobile header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm select-none shrink-0">
            <img src="/app-icon.png" alt="App Icon" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-sm font-black text-slate-900">{t.appName}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleDarkMode} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row relative min-h-0 overflow-hidden">

        {/* Sidebar */}
        <nav className={`lg:w-60 bg-white flex flex-col justify-between shrink-0 absolute lg:relative inset-y-0 left-0 z-40 transform lg:transform-none transition-transform duration-300 lg:translate-x-0 border-r border-slate-200 ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'}`}>
          <div className="flex-1 flex flex-col py-6 overflow-y-auto">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 px-6 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm select-none shrink-0">
                <img src="/app-icon.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight">{t.appName}</h1>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.tagline}</span>
              </div>
            </div>

            {/* User */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                {user.nombre.charAt(0)}
              </div>
              <div className="truncate">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.hello},</span>
                <span className="block text-xs font-extrabold text-slate-800 truncate">{user.nombre}</span>
              </div>
            </div>

            {/* Nav modules */}
            <div className="space-y-1 px-3 mt-4">
              {navModules.map(item => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => goToModule(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold border border-amber-200">{item.badge}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <button onClick={() => goToModule('config')} className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${activeModule === 'config' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Settings className="w-4 h-4" />
              <span>{t.config}</span>
            </button>
            <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer">
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              <span>{isDarkMode ? (es ? 'Modo Claro' : 'Light Mode') : (es ? 'Modo Oscuro' : 'Dark Mode')}</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </nav>

        {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden" />}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full overflow-y-auto overscroll-contain relative">

          {successToast?.show && (
            <div className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-950 text-white rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-700/50">
              <span className="text-lg">✨</span>
              <p className="text-xs font-bold tracking-wide">{successToast.message}</p>
            </div>
          )}

          {loadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
              ⚠️ Error cargando datos: {loadError}
            </div>
          )}

          {renderModule()}

        </main>
      </div>
    </div>
  );
}
