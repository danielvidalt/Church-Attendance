import React, { useState, useEffect, useCallback } from 'react';
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

import { ClipboardCheck, Users, TrendingUp, AlertTriangle, Cake, Settings, LogOut, Menu, X, ArrowLeft, Sun, Moon, Calendar, BookOpen, Heart, MessageSquare, CalendarCheck, Route } from 'lucide-react';

export default function App() {
  const isInstalledApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const [showSplash, setShowSplash] = useState(isInstalledApp);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cl-dark-mode') === 'true');
  const [language, setLanguage] = useState<Language>('es');
  const [user, setUser] = useState<Usuario | null>(null);
  const [activeModule, setActiveModule] = useState<null | 'personas' | 'attendance' | 'volunteers' | 'prayer' | 'followup'>(null);
  const [activeSection, setActiveSection] = useState<'attendance' | 'people' | 'stats' | 'alerts' | 'birthdays' | 'calendar' | 'history' | 'config' | 'volunteers' | 'prayer' | 'journey'>('attendance');
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
  const [volunteerAssignments, setVolunteerAssignments] = useState<VolunteerAssignment[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);

  const [activeAttendanceCategory, setActiveAttendanceCategory] = useState<EventType>('servicio_11');
  const [showOnlySelectedTrack, setShowOnlySelectedTrack] = useState(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  // Load all data from Supabase
  const loadAllData = useCallback(async () => {
    const fallback = async <T,>(label: string, loader: () => Promise<T>, defaultValue: T): Promise<T> => {
      try {
        return await loader();
      } catch (err) {
        console.error(`Error loading ${label}:`, err);
        return defaultValue;
      }
    };

    const [
      fetchedPeople,
      fetchedEvents,
      fetchedAttendance,
      fetchedSeguimientos,
      fetchedConfig,
      fetchedTracks,
      fetchedVolunteerAreas,
      fetchedVolunteerAssignments,
      fetchedPrayerRequests,
    ] = await Promise.all([
      fallback('personas', db.getPersonas, [] as Persona[]),
      fallback('eventos', db.getEventos, [] as Evento[]),
      fallback('asistencias', db.getAsistencias, [] as Asistencia[]),
      fallback('seguimientos', db.getSeguimientos, [] as Seguimiento[]),
      fallback('configuracion', db.getConfiguracion, null),
      fallback('event_tracks', db.getEventTracks, [] as EventTrack[]),
      fallback('volunteer_areas', db.getVolunteerAreas, [] as VolunteerArea[]),
      fallback('volunteer_assignments', db.getVolunteerAssignments, [] as VolunteerAssignment[]),
      fallback('prayer_requests', db.getPrayerRequests, [] as PrayerRequest[]),
    ]);

    setPeople(fetchedPeople);
    setEvents(fetchedEvents);
    setAttendance(fetchedAttendance);
    setSeguimientos(fetchedSeguimientos);
    setConfig(fetchedConfig ?? DEFAULT_CONFIG);
    setCustomTracks(fetchedTracks);
    setVolunteerAreas(fetchedVolunteerAreas);
    setVolunteerAssignments(fetchedVolunteerAssignments);
    setPrayerRequests(fetchedPrayerRequests);
  }, []);

  // Auth state listener — runs once on mount
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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setActiveSection('attendance');
      }
    });

    // Refresh data when the app returns to foreground after 30+ seconds away
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

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleLoginSuccess = async (usr: Usuario) => {
    setUser(usr);
    setLanguage(usr.idioma_preferido);
    await loadAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveSection('attendance');
  };

  const handleAddNewPerson = async (p: Persona) => {
    await db.addPersona(p);
    setPeople((prev) => [p, ...prev]);
  };

  const handleUpdatePersonStatus = async (id: string, newStatus: MemberStatus) => {
    await db.updatePersona(id, { estado: newStatus });
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, estado: newStatus } : p)));
  };

  const handleAddPersonNote = async (id: string, noteText: string) => {
    await db.updatePersona(id, { notas: noteText });
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, notas: noteText } : p)));
  };

  const handleUpdatePersonPhoto = async (id: string, photoBase64: string | undefined) => {
    await db.updatePersona(id, { foto_perfil: photoBase64 });
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, foto_perfil: photoBase64 } : p)));
  };

  const handleUpdatePersona = async (id: string, updates: Partial<Persona>) => {
    await db.updatePersona(id, updates);
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDeletePersona = async (id: string) => {
    await db.deletePersona(id);
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddNewSeguimientoLog = async (seg: Seguimiento) => {
    await db.addSeguimiento(seg);
    setSeguimientos((prev) => [seg, ...prev]);
  };

  const handleUpdateSeguimientoStatus = async (id: string, status: 'pendiente' | 'contactado' | 'cerrado') => {
    await db.updateSeguimientoEstado(id, status);
    setSeguimientos((prev) => prev.map((s) => (s.id === id ? { ...s, estado: status } : s)));
  };

  const handleSaveConfig = async (updatedConfig: Configuracion) => {
    await db.saveConfiguracion(updatedConfig);
    setConfig(updatedConfig);
    if (updatedConfig.idioma_por_defecto) setLanguage(updatedConfig.idioma_por_defecto);
  };

  const handleRegisterCustomTrack = async (track: EventTrack) => {
    await db.addEventTrack(track);
    setCustomTracks((prev) => [...prev, track]);
  };

  const handleDeleteCustomTrack = async (id: string) => {
    await db.deleteEventTrack(id);
    setCustomTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddVolunteerArea = async (area: VolunteerArea) => {
    await db.addVolunteerArea(area);
    setVolunteerAreas((prev) => [...prev, area]);
  };

  const handleDeleteVolunteerArea = async (id: string) => {
    await db.deleteVolunteerArea(id);
    setVolunteerAreas((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateVolunteerArea = async (id: string, updates: Partial<VolunteerArea>) => {
    await db.updateVolunteerArea(id, updates);
    setVolunteerAreas((prev) => prev.map((area) => (area.id === id ? { ...area, ...updates } : area)));
  };

  const handleAddVolunteerAssignment = async (assignment: VolunteerAssignment) => {
    await db.addVolunteerAssignment(assignment);
    setVolunteerAssignments((prev) => [...prev, assignment]);
  };

  const handleUpdateVolunteerAssignment = async (id: string, updates: Partial<VolunteerAssignment>) => {
    await db.updateVolunteerAssignment(id, updates);
    setVolunteerAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDeleteVolunteerAssignment = async (id: string) => {
    await db.deleteVolunteerAssignment(id);
    setVolunteerAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddPrayerRequest = async (request: PrayerRequest) => {
    await db.addPrayerRequest(request);
    setPrayerRequests((prev) => [request, ...prev]);
  };

  const handleUpdatePrayerRequest = async (id: string, updates: Partial<PrayerRequest>) => {
    await db.updatePrayerRequest(id, updates);
    setPrayerRequests((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDeletePrayerRequest = async (id: string) => {
    await db.deletePrayerRequest(id);
    setPrayerRequests((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveAttendanceBatch = async (
    eventType: EventType,
    dateStr: string,
    presentIds: string[],
    newIdsSinceSave: string[],
    anonCount: number
  ) => {
    let matchedEvt = events.find((e) => e.tipo_evento === eventType && e.fecha === dateStr);
    let targetEventId = '';

    if (matchedEvt) {
      targetEventId = matchedEvt.id;
      await db.deleteAsistenciasByEvento(targetEventId);
      const updatedEvt: Evento = { ...matchedEvt, asistentes_anonimos: anonCount };
      await db.upsertEvento(updatedEvt);
      setEvents((prev) => prev.map((e) => e.id === targetEventId ? updatedEvt : e));
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
      setEvents((prev) => [...prev, newEvt]);
    }

    const eligiblePeople = people.filter((p) => {
      if (p.estado === 'inactivo') return false;
      if (eventType === 'grupo_hombres' && p.sexo !== 'M') return false;
      if (eventType === 'grupo_mujeres' && p.sexo !== 'F') return false;
      return true;
    });

    let counter = Date.now();
    const newRecords: Asistencia[] = eligiblePeople.map((p) => ({
      id: 'att_' + counter++,
      persona_id: p.id,
      evento_id: targetEventId,
      presente: presentIds.includes(p.id),
      es_nuevo: p.estado === 'nuevo' || newIdsSinceSave.includes(p.id),
      fecha_registro: dateStr,
    }));

    await db.insertAsistencias(newRecords);
    setAttendance((prev) => [
      ...prev.filter((a) => a.evento_id !== targetEventId),
      ...newRecords,
    ]);

    setSuccessToast({
      show: true,
      message: language === 'es' ? '¡Asistencia registrada y guardada exitosamente!' : 'Attendance successfully registered and stored!',
    });
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleQuickRegisterClick = (cat: EventType) => {
    setActiveAttendanceCategory(cat);
    setShowOnlySelectedTrack(true);
    setActiveModule('attendance');
    setActiveSection('attendance');
  };

  const handleResetCurrentEvent = async (eventId: string) => {
    await db.deleteAsistenciasByEvento(eventId);
    await db.deleteEvento(eventId);
    setAttendance((prev) => prev.filter((a) => a.evento_id !== eventId));
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleResetAttendanceData = async () => {
    await db.resetAttendanceData();
    setEvents([]);
    setAttendance([]);
  };

  const liveCareAlertsCount = calculateAlerts(people, events, attendance, config).length;

  // ── Splash screen ─────────────────────────────────────────────────────────────

  if (showSplash) {
    return (
      <div
        className={`h-full w-full cursor-pointer select-none ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
        onClick={() => setShowSplash(false)}
      >
        <img
          src={isDarkMode ? '/splash-dark.png' : '/splash-light.png'}
          alt="Comunidad Latina"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────────────────────────

  if (appLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black font-mono text-base mx-auto mb-4 animate-pulse">
            CL
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {language === 'es' ? 'Cargando...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className={isDarkMode ? 'dark h-full' : 'h-full'}>
        <LoginScreen
          language={language}
          onLanguageChange={(lang) => setLanguage(lang)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const navItems: { id: string; label: string; icon: React.ElementType; badge?: number }[] =
    activeModule === 'personas'
      ? [
          { id: 'people', label: es ? 'Directorio' : 'Directory', icon: Users },
        ]
      : activeModule === 'attendance'
      ? [
          { id: 'attendance', label: t.registerAttendance, icon: ClipboardCheck },
          { id: 'stats', label: t.stats, icon: TrendingUp },
          { id: 'alerts', label: t.alerts, icon: AlertTriangle, badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
          { id: 'birthdays', label: t.birthdays, icon: Cake },
          { id: 'calendar', label: t.calendar, icon: Calendar },
          { id: 'history', label: t.history, icon: BookOpen },
        ]
      : activeModule === 'volunteers'
      ? [
          { id: 'volunteers', label: es ? 'Voluntarios' : 'Volunteers', icon: CalendarCheck },
        ]
      : activeModule === 'prayer'
      ? [
          { id: 'prayer', label: t.modulePrayer, icon: MessageSquare },
        ]
      : activeModule === 'followup'
      ? [
          { id: 'journey', label: t.moduleFollowUp, icon: Route },
        ]
      : [];

  return (
    <div className={`h-full flex flex-col font-sans overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100 selection:bg-indigo-900 selection:text-indigo-100' : 'bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900'}`}>

      <div className="h-1 bg-gradient-to-r from-indigo-600 to-violet-500 shrink-0 shadow-sm" />

      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-extrabold font-mono text-xs shadow-sm select-none">
            CL
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none">{t.appName}</h1>
            <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mt-1 block">{t.tagline}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleDarkMode}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row relative min-h-0 overflow-hidden">

        <nav
          className={`lg:w-64 bg-white text-slate-900 flex flex-col justify-between shrink-0 absolute lg:relative inset-y-0 left-0 z-40 transform lg:transform-none transition-transform duration-300 lg:translate-x-0 border-r border-slate-200 ${
            mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 flex flex-col py-6">
            <div className="hidden lg:flex items-center gap-3 px-6 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black font-mono text-base select-none shadow-sm shadow-indigo-100">
                CL
              </div>
              <div className="truncate">
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight">{t.appName}</h1>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1.5 block">{t.tagline}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                {user.nombre.charAt(0)}
              </div>
              <div className="truncate">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.hello},</span>
                <span className="block text-xs font-extrabold text-slate-800 truncate">{user.nombre}</span>
              </div>
            </div>

            <div className="space-y-1 px-3 mt-4">
              {activeModule !== null && (
                <button
                  onClick={() => { setActiveModule(null); setMobileMenuOpen(false); setShowOnlySelectedTrack(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 mb-2 text-xs font-bold text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToModules}</span>
                </button>
              )}
              {navItems.map((item) => {
                const active = activeSection === item.id && activeSection !== 'config';
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as typeof activeSection);
                      setMobileMenuOpen(false);
                      setShowOnlySelectedTrack(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold leading-none shrink-0 border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 space-y-1">
            <button
              onClick={() => { setActiveSection('config'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                activeSection === 'config' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeSection === 'config' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{t.config}</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              <span>{isDarkMode ? (language === 'es' ? 'Modo Claro' : 'Light Mode') : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode')}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full overflow-y-auto overscroll-contain relative">

          {successToast?.show && (
            <div className="fixed bottom-6 right-6 z-50 p-4.5 bg-indigo-950 text-white rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-700/50 animate-bounce">
              <span className="text-lg">✨</span>
              <p className="text-xs font-bold tracking-wide">{successToast.message}</p>
            </div>
          )}

          {(activeModule !== null || activeSection === 'config') && (
            <div className="mb-6 flex items-center lg:hidden">
              <button
                onClick={() => { setActiveModule(null); setShowOnlySelectedTrack(false); if (activeSection === 'config') setActiveSection('attendance'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-xs font-bold transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.backToModules}</span>
              </button>
            </div>
          )}

          {activeModule === null && activeSection !== 'config' && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {es ? 'Módulos' : 'Modules'}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {es ? 'Selecciona un módulo para comenzar' : 'Select a module to get started'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Módulo Personas */}
                <button
                  onClick={() => { setActiveModule('personas'); setActiveSection('people'); }}
                  className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">{t.modulePersonas}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">{t.modulePersonasDesc}</p>
                </button>

                {/* Módulo Attendance */}
                <button
                  onClick={() => { setActiveModule('attendance'); setActiveSection('attendance'); setShowOnlySelectedTrack(false); }}
                  className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">{t.moduleAttendance}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">{t.moduleAttendanceDesc}</p>
                </button>

                {([
                  { id: 'volunteers', section: 'volunteers', title: t.moduleVolunteers, desc: t.moduleVolunteersDesc, icon: Heart },
                  { id: 'prayer', section: 'prayer', title: t.modulePrayer, desc: t.modulePrayerDesc, icon: MessageSquare },
                  { id: 'followup', section: 'journey', title: t.moduleFollowUp, desc: t.moduleFollowUpDesc, icon: TrendingUp },
                ] as { id: 'volunteers' | 'prayer' | 'followup'; section: 'volunteers' | 'prayer' | 'journey'; title: string; desc: string; icon: React.ElementType }[]).map(({ id, section, title, desc, icon: Icon }) => (
                  <button
                    key={title}
                    onClick={() => { setActiveModule(id); setActiveSection(section); }}
                    className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'attendance' && activeSection === 'attendance' && (
            <AttendanceSheet
              language={language}
              people={people}
              onAddNewPerson={handleAddNewPerson}
              savedEvents={events}
              savedAttendance={attendance}
              onSaveAttendanceBatch={handleSaveAttendanceBatch}
              onResetCurrentEvent={handleResetCurrentEvent}
              initialEventType={activeAttendanceCategory}
              username={user.nombre}
              showOnlySelectedTrack={showOnlySelectedTrack}
              customTracks={customTracks}
            />
          )}

          {activeModule === 'personas' && activeSection === 'people' && (
            <PeopleManager
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              onUpdatePersonStatus={handleUpdatePersonStatus}
              onAddPersonNote={handleAddPersonNote}
              onUpdatePersonPhoto={handleUpdatePersonPhoto}
              onUpdatePersona={handleUpdatePersona}
              onDeletePersona={handleDeletePersona}
              onOpenNewPersonSheet={() => { setActiveModule('attendance'); setActiveSection('attendance'); }}
              onAddExistingMember={handleAddNewPerson}
              volunteerAreas={volunteerAreas}
            />
          )}

          {activeModule === 'attendance' && activeSection === 'stats' && (
            <StatsDashboard
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              onNavigateToAlerts={() => { setActiveModule('attendance'); setActiveSection('alerts'); }}
              onResetAttendanceData={handleResetAttendanceData}
              onRefresh={loadAllData}
            />
          )}

          {activeModule === 'attendance' && activeSection === 'alerts' && (
            <AlertsManager
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              config={config}
              seguimientos={seguimientos}
              onAddNewSeguimiento={handleAddNewSeguimientoLog}
              onUpdateSeguimientoStatus={handleUpdateSeguimientoStatus}
              username={user.nombre}
            />
          )}

          {activeModule === 'attendance' && activeSection === 'birthdays' && (
            <BirthdaysList
              language={language}
              people={people}
              config={config}
              onNavigateToPeople={() => { setActiveModule('personas'); setActiveSection('people'); }}
            />
          )}

          {activeModule === 'attendance' && activeSection === 'history' && (
            <HistoryView
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              customTracks={customTracks}
            />
          )}

          {activeModule === 'attendance' && activeSection === 'calendar' && (
            <CalendarView
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              customTracks={customTracks}
            />
          )}

          {activeModule === 'volunteers' && activeSection === 'volunteers' && (
            <VolunteersModule
              language={language}
              people={people}
              volunteerAreas={volunteerAreas}
              assignments={volunteerAssignments}
              registeredTracks={allTracks}
              username={user.nombre}
              onAddAssignment={handleAddVolunteerAssignment}
              onUpdateAssignment={handleUpdateVolunteerAssignment}
              onDeleteAssignment={handleDeleteVolunteerAssignment}
              onOpenPeople={() => { setActiveModule('personas'); setActiveSection('people'); }}
            />
          )}

          {activeModule === 'prayer' && activeSection === 'prayer' && (
            <PrayerRequestsModule
              language={language}
              people={people}
              requests={prayerRequests}
              username={user.nombre}
              onAddRequest={handleAddPrayerRequest}
              onUpdateRequest={handleUpdatePrayerRequest}
              onDeleteRequest={handleDeletePrayerRequest}
            />
          )}

          {activeModule === 'followup' && activeSection === 'journey' && (
            <JourneyModule
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              followUps={seguimientos}
              username={user.nombre}
              onAddFollowUp={handleAddNewSeguimientoLog}
              onUpdateFollowUpStatus={handleUpdateSeguimientoStatus}
              onOpenPeople={() => { setActiveModule('personas'); setActiveSection('people'); }}
            />
          )}

          {activeSection === 'config' && (
            <ConfigScreen
              language={language}
              config={config}
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
              onBack={() => { setActiveModule(null); setShowOnlySelectedTrack(false); setActiveSection('attendance'); }}
            />
          )}

        </main>
      </div>
    </div>
  );
}
