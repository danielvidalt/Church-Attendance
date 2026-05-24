import { useState, useEffect, useCallback } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, Seguimiento, Configuracion, Usuario, EventType, MemberStatus, EventTrack, VolunteerArea } from './types';
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

import { ClipboardCheck, Users, TrendingUp, AlertTriangle, Cake, Settings, LogOut, Home, Menu, X, ArrowLeft, Sun, Moon, Calendar, BookOpen } from 'lucide-react';

export default function App() {
  const isInstalledApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  const [showSplash, setShowSplash] = useState(isInstalledApp);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cl-dark-mode') === 'true');
  const [language, setLanguage] = useState<Language>('es');
  const [user, setUser] = useState<Usuario | null>(null);
  const [activeSection, setActiveSection] = useState<'home' | 'attendance' | 'people' | 'stats' | 'alerts' | 'birthdays' | 'calendar' | 'history' | 'config'>('home');
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

  const [activeAttendanceCategory, setActiveAttendanceCategory] = useState<EventType>('servicio_11');
  const [showOnlySelectedTrack, setShowOnlySelectedTrack] = useState(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  // Load all data from Supabase
  const loadAllData = useCallback(async () => {
    try {
      const [fetchedPeople, fetchedEvents, fetchedAttendance, fetchedSeguimientos, fetchedConfig, fetchedTracks, fetchedVolunteerAreas] =
        await Promise.all([
          db.getPersonas(),
          db.getEventos(),
          db.getAsistencias(),
          db.getSeguimientos(),
          db.getConfiguracion(),
          db.getEventTracks(),
          db.getVolunteerAreas(),
        ]);
      setPeople(fetchedPeople);
      setEvents(fetchedEvents);
      setAttendance(fetchedAttendance);
      setSeguimientos(fetchedSeguimientos);
      setConfig(fetchedConfig ?? DEFAULT_CONFIG);
      setCustomTracks(fetchedTracks);
      setVolunteerAreas(fetchedVolunteerAreas);
    } catch (err) {
      console.error('Error loading data:', err);
    }
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
        setActiveSection('home');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAllData]);

  const t = language === 'es' ? esTranslations : enTranslations;

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
    setActiveSection('home');
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

  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'attendance', label: t.registerAttendance, icon: ClipboardCheck },
    { id: 'people', label: t.people, icon: Users },
    { id: 'stats', label: t.stats, icon: TrendingUp },
    { id: 'alerts', label: t.alerts, icon: AlertTriangle, badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
    { id: 'birthdays', label: t.birthdays, icon: Cake },
    { id: 'calendar', label: t.calendar, icon: Calendar },
    { id: 'history', label: t.history, icon: BookOpen },
    { id: 'config', label: t.config, icon: Settings },
  ];

  return (
    <div className={`h-full flex flex-col font-sans overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100 selection:bg-indigo-900 selection:text-indigo-100' : 'bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900'}`}>

      <div className="h-1 bg-gradient-to-r from-indigo-600 to-violet-500 shrink-0" />

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
              {navItems.map((item) => {
                const active = activeSection === item.id;
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

          {activeSection !== 'home' && (
            <div className="mb-6 flex items-center">
              <button
                onClick={() => { setActiveSection('home'); setShowOnlySelectedTrack(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-xs font-bold transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'es' ? 'Volver al Inicio' : 'Back to Home'}</span>
              </button>
            </div>
          )}

          {activeSection === 'home' && (
            <div className="font-sans space-y-8 animate-fade-in text-slate-800">
              <div className="bg-indigo-600 text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-lg shadow-indigo-100/80">
                <div className="absolute top-0 right-0 p-6 opacity-10 select-none">
                  <span className="text-8xl">⛪</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{t.homeHeading}</h2>
                <p className="text-xs text-indigo-100 font-bold tracking-wide mt-2 max-w-lg leading-relaxed">
                  {language === 'es'
                    ? 'Lleva el seguimiento de la asistencia en cada servicio y grupo de la comunidad Latina.'
                    : 'Track attendance across every service and group of the Latin community.'}
                </p>
              </div>

              <div className="space-y-3.5">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  💡 {language === 'es' ? 'REGISTRO DIRECTO - ELIGE UN EVENTO' : 'DIRECT LOGS - CHOOSE THE HOST TRACK'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {allTracks.map((btn) => {
                    if (btn.active === false) return null;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => handleQuickRegisterClick(btn.id as EventType)}
                        className={`p-5 rounded-2xl border text-left shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 duration-150 flex flex-col justify-between h-36 ${btn.color}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                          {language === 'es' ? btn.labelEs : btn.labelEn}
                        </span>
                        <div className="mt-auto">
                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-none mb-1">
                            {language === 'es' ? btn.titleEs : btn.titleEn}
                          </h3>
                          <span className="text-[10px] font-bold text-indigo-600 block">
                            {language === 'es' ? 'Iniciar check-in →' : 'Launch check-in →'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3.5 pt-4">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  ⚙️ {t.secundaryAccess}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'people', titleEs: 'Integrantes', titleEn: 'Directory', count: people.length, icon: Users },
                    { id: 'stats', titleEs: 'Estadísticas', titleEn: 'Statistics', icon: TrendingUp },
                    { id: 'alerts', titleEs: 'Alertas', titleEn: 'Alerts', count: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined, icon: AlertTriangle, isAlert: true },
                    { id: 'birthdays', titleEs: 'Cumpleaños', titleEn: 'Birthdays', icon: Cake },
                  ].map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => setActiveSection(sc.id as typeof activeSection)}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm text-left hover:shadow-md transition-all hover:bg-slate-50 flex items-center gap-3.5 cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg ${sc.isAlert && sc.count ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold text-slate-900">
                            {language === 'es' ? sc.titleEs : sc.titleEn}
                          </span>
                          {sc.count !== undefined && (
                            <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                              {sc.count} {language === 'es' ? 'registrados' : 'logged'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'attendance' && (
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

          {activeSection === 'people' && (
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
              onOpenNewPersonSheet={() => setActiveSection('attendance')}
              onAddExistingMember={handleAddNewPerson}
              volunteerAreas={volunteerAreas}
            />
          )}

          {activeSection === 'stats' && (
            <StatsDashboard
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              onNavigateToAlerts={() => setActiveSection('alerts')}
              onResetAttendanceData={handleResetAttendanceData}
            />
          )}

          {activeSection === 'alerts' && (
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

          {activeSection === 'birthdays' && (
            <BirthdaysList
              language={language}
              people={people}
              config={config}
              onNavigateToPeople={() => setActiveSection('people')}
            />
          )}

          {activeSection === 'history' && (
            <HistoryView
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              customTracks={customTracks}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              customTracks={customTracks}
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
              onDeleteVolunteerArea={handleDeleteVolunteerArea}
            />
          )}

        </main>
      </div>
    </div>
  );
}
