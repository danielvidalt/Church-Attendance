import { useState, useEffect } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, Seguimiento, Configuracion, Usuario, EventType, MemberStatus, EventTrack } from './types';
import { INITIAL_PEOPLE, INITIAL_EVENTS, INITIAL_ATTENDANCE, INITIAL_SEGUIMIENTOS, DEFAULT_CONFIG } from './data/mockPeople';
import { calculateAlerts } from './utils/attendance';

// Core Subcomponents
import LoginScreen from './components/LoginScreen';
import AttendanceSheet from './components/AttendanceSheet';
import StatsDashboard from './components/StatsDashboard';
import PeopleManager from './components/PeopleManager';
import AlertsManager from './components/AlertsManager';
import BirthdaysList from './components/BirthdaysList';
import ConfigScreen from './components/ConfigScreen';

// Icons
import { ClipboardCheck, Users, TrendingUp, AlertTriangle, Cake, Settings, LogOut, Home, Menu, X, ArrowLeft } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('es');
  const [user, setUser] = useState<Usuario | null>(null);
  const [activeSection, setActiveSection] = useState<'home' | 'attendance' | 'people' | 'stats' | 'alerts' | 'birthdays' | 'config'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Database lists in React State
  const [people, setPeople] = useState<Persona[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [attendance, setAttendance] = useState<Asistencia[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [config, setConfig] = useState<Configuracion>(DEFAULT_CONFIG);

  const [activeAttendanceCategory, setActiveAttendanceCategory] = useState<EventType>('servicio_11');

  // Custom Tracks and dynamic tracking states
  const [customTracks, setCustomTracks] = useState<EventTrack[]>([]);
  const [showOnlySelectedTrack, setShowOnlySelectedTrack] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  // Load from local storage on mount (Persistency requirement)
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('al_language') as Language;
      if (storedLang) setLanguage(storedLang);

      const storedUser = localStorage.getItem('al_user');
      if (storedUser) setUser(JSON.parse(storedUser));

      const storedCustomTracks = localStorage.getItem('al_custom_tracks');
      if (storedCustomTracks) {
        setCustomTracks(JSON.parse(storedCustomTracks));
      } else {
        setCustomTracks([]);
      }

      const storedPeople = localStorage.getItem('al_people');
      if (storedPeople) {
        setPeople(JSON.parse(storedPeople));
      } else {
        setPeople(INITIAL_PEOPLE);
        localStorage.setItem('al_people', JSON.stringify(INITIAL_PEOPLE));
      }

      const storedEvents = localStorage.getItem('al_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      } else {
        setEvents(INITIAL_EVENTS);
        localStorage.setItem('al_events', JSON.stringify(INITIAL_EVENTS));
      }

      const storedAttendance = localStorage.getItem('al_attendance');
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
      } else {
        setAttendance(INITIAL_ATTENDANCE);
        localStorage.setItem('al_attendance', JSON.stringify(INITIAL_ATTENDANCE));
      }

      const storedSeguimientos = localStorage.getItem('al_seguimientos');
      if (storedSeguimientos) {
        setSeguimientos(JSON.parse(storedSeguimientos));
      } else {
        setSeguimientos(INITIAL_SEGUIMIENTOS);
        localStorage.setItem('al_seguimientos', JSON.stringify(INITIAL_SEGUIMIENTOS));
      }

      const storedConfig = localStorage.getItem('al_config');
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      } else {
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem('al_config', JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
      // Fallbacks
      setPeople(INITIAL_PEOPLE);
      setEvents(INITIAL_EVENTS);
      setAttendance(INITIAL_ATTENDANCE);
      setSeguimientos(INITIAL_SEGUIMIENTOS);
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  const t = language === 'es' ? esTranslations : enTranslations;

  const defaultTracks: EventTrack[] = [
    { id: 'servicio_11', titleEs: '11:00 am', titleEn: '11:00 am', labelEs: 'Servicio Domingo', labelEn: 'Sunday Morning service', type: 'servicio', active: true, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-indigo-600 hover:bg-slate-50' },
    { id: 'servicio_6', titleEs: '6:00 pm', titleEn: '6:00 pm', labelEs: 'Servicio Domingo', labelEn: 'Sunday Evening service', type: 'servicio', active: true, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-violet-500 hover:bg-slate-50' },
    { id: 'grupo_conexion', titleEs: 'Grupo Conexión', titleEn: 'Connection Group', labelEs: 'Célula Semanal', labelEn: 'Cell connection group', type: 'grupo', active: config.grupos_activos.grupo_conexion, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-emerald-500 hover:bg-slate-50' },
    { id: 'grupo_hombres', titleEs: 'Grupo Hombres', titleEn: 'Men\'s Group', labelEs: 'Varones', labelEn: 'Men\'s study & fellowship', type: 'grupo', active: config.grupos_activos.grupo_hombres, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-blue-500 hover:bg-slate-50' },
    { id: 'grupo_mujeres', titleEs: 'Grupo Mujeres', titleEn: 'Women\'s Group', labelEs: 'Damas', labelEn: 'Women\'s study & fellowship', type: 'grupo', active: config.grupos_activos.grupo_mujeres, color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-rose-500 hover:bg-slate-50' }
  ];

  const allTracks = [...defaultTracks, ...customTracks];

  // --- Dynamic Operations ---

  const handleRegisterCustomTrack = (track: EventTrack) => {
    const updated = [...customTracks, track];
    setCustomTracks(updated);
    localStorage.setItem('al_custom_tracks', JSON.stringify(updated));
  };

  const handleDeleteCustomTrack = (id: string) => {
    const updated = customTracks.filter((t) => t.id !== id);
    setCustomTracks(updated);
    localStorage.setItem('al_custom_tracks', JSON.stringify(updated));
  };

  const handleLoginSuccess = (usr: Usuario) => {
    setUser(usr);
    localStorage.setItem('al_user', JSON.stringify(usr));
    if (usr.idioma_preferido) {
      setLanguage(usr.idioma_preferido);
      localStorage.setItem('al_language', usr.idioma_preferido);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('al_user');
    setActiveSection('home');
  };

  const handleAddNewPerson = (p: Persona) => {
    const updated = [p, ...people];
    setPeople(updated);
    localStorage.setItem('al_people', JSON.stringify(updated));
  };

  const handleUpdatePersonStatus = (id: string, newStatus: MemberStatus) => {
    const updated = people.map((p) => (p.id === id ? { ...p, estado: newStatus } : p));
    setPeople(updated);
    localStorage.setItem('al_people', JSON.stringify(updated));
  };

  const handleAddPersonNote = (id: string, noteText: string) => {
    const updated = people.map((p) => (p.id === id ? { ...p, notas: noteText } : p));
    setPeople(updated);
    localStorage.setItem('al_people', JSON.stringify(updated));
  };

  const handleUpdatePersonPhoto = (id: string, photoBase64: string | undefined) => {
    const updated = people.map((p) => (p.id === id ? { ...p, foto_perfil: photoBase64 } : p));
    setPeople(updated);
    localStorage.setItem('al_people', JSON.stringify(updated));
  };

  const handleAddNewSeguimientoLog = (seg: Seguimiento) => {
    const updated = [seg, ...seguimientos];
    setSeguimientos(updated);
    localStorage.setItem('al_seguimientos', JSON.stringify(updated));
  };

  const handleUpdateSeguimientoStatus = (id: string, status: 'pendiente' | 'contactado' | 'cerrado') => {
    const updated = seguimientos.map((s) => (s.id === id ? { ...s, estado: status } : s));
    setSeguimientos(updated);
    localStorage.setItem('al_seguimientos', JSON.stringify(updated));
  };

  const handleSaveConfig = (updatedConfig: Configuracion) => {
    setConfig(updatedConfig);
    localStorage.setItem('al_config', JSON.stringify(updatedConfig));
    if (updatedConfig.idioma_por_defecto) {
      setLanguage(updatedConfig.idioma_por_defecto);
      localStorage.setItem('al_language', updatedConfig.idioma_por_defecto);
    }
  };

  // Reset database entirely with initial mock seeds (for easy evaluation)
  const handleResetDatabase = () => {
    localStorage.removeItem('al_people');
    localStorage.removeItem('al_events');
    localStorage.removeItem('al_attendance');
    localStorage.removeItem('al_seguimientos');
    localStorage.removeItem('al_config');
    localStorage.removeItem('al_custom_tracks');

    setPeople(INITIAL_PEOPLE);
    setEvents(INITIAL_EVENTS);
    setAttendance(INITIAL_ATTENDANCE);
    setSeguimientos(INITIAL_SEGUIMIENTOS);
    setConfig(DEFAULT_CONFIG);
    setCustomTracks([]);
    setLanguage('es');

    localStorage.setItem('al_people', JSON.stringify(INITIAL_PEOPLE));
    localStorage.setItem('al_events', JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem('al_attendance', JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem('al_seguimientos', JSON.stringify(INITIAL_SEGUIMIENTOS));
    localStorage.setItem('al_config', JSON.stringify(DEFAULT_CONFIG));
    localStorage.setItem('al_language', 'es');
  };

  // Saved attendance batch logs from Check-in Screen
  const handleSaveAttendanceBatch = (
    eventType: EventType,
    dateStr: string,
    presentIds: string[],
    newIdsSinceSave: string[]
  ) => {
    // 1. Check if the event already exists for that category and date
    let matchedEvt = events.find((e) => e.tipo_evento === eventType && e.fecha === dateStr);
    let updatedEvents = [...events];
    let updatedAttendance = [...attendance];

    let targetEventId = '';

    if (matchedEvt) {
      targetEventId = matchedEvt.id;
      // Filter out all previously recorded attendances for this event to avoid duplicate blocks, then reinsert
      updatedAttendance = updatedAttendance.filter((att) => att.evento_id !== targetEventId);
    } else {
      // Create new event
      targetEventId = 'evt_' + Date.now();
      const friendlyName = `${eventType.replace('_', ' ').toUpperCase()} (${dateStr})`;
      const newEvt: Evento = {
        id: targetEventId,
        nombre_evento: friendlyName,
        tipo_evento: eventType,
        fecha: dateStr,
        creado_por: user?.nombre || 'Daniel Vidal'
      };
      updatedEvents = [...updatedEvents, newEvt];
      setEvents(updatedEvents);
      localStorage.setItem('al_events', JSON.stringify(updatedEvents));
    }

    // Determine who is eligible to attend (filtering out inactives or gender subgroups mismatch)
    const eligibleForThisEvent = people.filter((p) => {
      if (p.estado === 'inactivo') return false;
      if (eventType === 'grupo_hombres' && p.sexo !== 'M') return false;
      if (eventType === 'grupo_mujeres' && p.sexo !== 'F') return false;
      return true;
    });

    let attendanceRecordIdCounter = Date.now();

    // 2. Generate new logs
    eligibleForThisEvent.forEach((p) => {
      const isPresent = presentIds.includes(p.id);
      const isNewUser = p.estado === 'nuevo' || newIdsSinceSave.includes(p.id);

      updatedAttendance.push({
        id: 'att_' + (attendanceRecordIdCounter++),
        persona_id: p.id,
        evento_id: targetEventId,
        presente: isPresent,
        es_nuevo: isNewUser,
        fecha_registro: dateStr
      });
    });

    setAttendance(updatedAttendance);
    localStorage.setItem('al_attendance', JSON.stringify(updatedAttendance));

    // Show premium home toast
    setSuccessToast({
      show: true,
      message: language === 'es' ? '¡Asistencia registrada y guardada exitosamente!' : 'Attendance successfully registered and stored!'
    });
    // Set active section to home
    setActiveSection('home');
    // Auto clear toast after 4s
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleQuickRegisterClick = (cat: EventType) => {
    setActiveAttendanceCategory(cat);
    setShowOnlySelectedTrack(true);
    setActiveSection('attendance');
  };

  // Calculate live count of pending care items for sidebar badge alerts count
  const liveCareAlertsCount = calculateAlerts(people, events, attendance, config).length;

  if (user === null) {
    return (
      <LoginScreen
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          localStorage.setItem('al_language', lang);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Define sidebar navigation items
  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'attendance', label: t.registerAttendance, icon: ClipboardCheck },
    { id: 'people', label: t.people, icon: Users },
    { id: 'stats', label: t.stats, icon: TrendingUp },
    { id: 'alerts', label: t.alerts, icon: AlertTriangle, badge: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined },
    { id: 'birthdays', label: t.birthdays, icon: Cake },
    { id: 'config', label: t.config, icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Absolute top thin color bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-600 to-violet-500 shrink-0" />

      {/* Header bar (Mobile Menu toggle & branding) */}
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

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Fullscreen layout Split */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* SIDEBAR NAVIGATION PANEL (Hidden on mobile unless toggled open) */}
        <nav
          className={`lg:w-64 bg-white text-slate-900 flex flex-col justify-between shrink-0 absolute lg:relative inset-y-0 left-0 z-40 transform lg:transform-none transition-transform duration-300 lg:translate-x-0 border-r border-slate-200 ${
            mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
          }`}
        >
          {/* Main top navigation menu block */}
          <div className="flex-1 flex flex-col py-6">
            
            {/* Desktop Brand logotype */}
            <div className="hidden lg:flex items-center gap-3 px-6 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black font-mono text-base select-none shadow-sm shadow-indigo-100">
                CL
              </div>
              <div className="truncate">
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight">{t.appName}</h1>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1.5 block">
                  {t.tagline}
                </span>
              </div>
            </div>

            {/* Current Logged in User Badge Card */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                {user.nombre.charAt(0)}
              </div>
              <div className="truncate">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.hello},</span>
                <span className="block text-xs font-extrabold text-slate-800 truncate">{user.nombre}</span>
              </div>
            </div>

            {/* Navigation links stack */}
            <div className="space-y-1 px-3 mt-4">
              {navItems.map((item) => {
                const active = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as any);
                      setMobileMenuOpen(false);
                      setShowOnlySelectedTrack(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-sm'
                        : 'text-slate-550 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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

          {/* Footer logout button */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-605 text-red-650 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </nav>

        {/* Backdrop overlay behind mobile menu drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        {/* CORE WORKSPACE SCREEN VIEW (Responsive fluid margins) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto w-full overflow-y-auto max-h-screen relative">
          
          {/* Floating success notification toast for check-ins or other saves */}
          {successToast && successToast.show && (
            <div className="fixed bottom-6 right-6 z-50 p-4.5 bg-indigo-950 text-white rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-700/50 animate-bounce">
              <span className="text-lg">✨</span>
              <p className="text-xs font-bold tracking-wide">{successToast.message}</p>
            </div>
          )}

          {/* Quick Back Navigation Bar */}
          {activeSection !== 'home' && (
            <div className="mb-6 flex items-center">
              <button
                onClick={() => {
                  setActiveSection('home');
                  setShowOnlySelectedTrack(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-sm text-xs font-bold transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'es' ? 'Volver al Inicio' : 'Back to Home'}</span>
              </button>
            </div>
          )}

          {/* SCREEN COMPONENT SWITCHER */}

          {/* 1. Dashboard Selector Home */}
          {activeSection === 'home' && (
            <div className="font-sans space-y-8 animate-fade-in text-slate-800">
              
              {/* Pastoral Welcome Header */}
              <div className="bg-indigo-600 text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-lg shadow-indigo-100/80">
                <div className="absolute top-0 right-0 p-6 opacity-10 select-none">
                  <span className="text-8xl">⛪</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{t.homeHeading}</h2>
                <p className="text-xs text-indigo-100 font-bold tracking-wide mt-2 max-w-lg leading-relaxed">
                  {language === 'es' 
                    ? 'Lleva un registro ordenado del pastoreo, asistencia a sub-ministerios y recordatorios pastorales de la Comunidad Latina.' 
                    : 'Maintain highly dynamic and neat records regarding care logistics, connection cell presence, or upcoming greeting milestones.'}
                </p>
              </div>

              {/* Five Huge Touch Action Buttons */}
              <div className="space-y-3.5">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  💡 {language === 'es' ? 'REGISTRO DIRECTO - ELIGE UN EVENTO' : 'DIRECT LOGS - CHOOSE THE HOST TRACK'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {allTracks.map((btn) => {
                    // Check if category group track is active
                    if (btn.active === false) return null;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => handleQuickRegisterClick(btn.id as EventType)}
                        className={`p-5 rounded-2xl border text-left shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 duration-150 flex flex-col justify-between h-36 border-slate-200 bg-white text-slate-900 ${btn.color}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                          {language === 'es' ? btn.labelEs : btn.labelEn}
                        </span>
                        
                        <div className="mt-auto">
                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-none mb-1">
                            {language === 'es' ? btn.titleEs : btn.titleEn}
                          </h3>
                          <span className="text-[10px] font-bold text-indigo-650 text-indigo-600 block">
                            {language === 'es' ? 'Iniciar check-in →' : 'Launch check-in →'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Access Shortcuts */}
              <div className="space-y-3.5 pt-4">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  ⚙️ {t.secundaryAccess}
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'people', titleEs: 'Directorio', titleEn: 'Directory', count: people.length, icon: Users, color: 'bg-white text-slate-800' },
                    { id: 'stats', titleEs: 'Estadísticas', titleEn: 'Statistics', icon: TrendingUp, color: 'bg-white text-slate-800' },
                    { id: 'alerts', titleEs: 'Alertas', titleEn: 'Alerts', count: liveCareAlertsCount > 0 ? liveCareAlertsCount : undefined, icon: AlertTriangle, color: 'bg-white text-amber-950', isAlert: true },
                    { id: 'birthdays', titleEs: 'Cumpleaños', titleEn: 'Birthdays', icon: Cake, color: 'bg-white text-slate-800' }
                  ].map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => setActiveSection(sc.id as any)}
                        className={`p-4.5 rounded-xl border border-slate-200 shadow-sm text-left hover:shadow-md transition-all hover:bg-slate-50 relative flex items-center gap-3.5 cursor-pointer ${sc.color}`}
                      >
                        <div className={`p-2 rounded-lg ${sc.isAlert && sc.count ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold text-[#0a2540]">
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

          {/* 2. Attendance Check-in Sheet */}
          {activeSection === 'attendance' && (
            <AttendanceSheet
              language={language}
              people={people}
              onAddNewPerson={handleAddNewPerson}
              savedEvents={events}
              savedAttendance={attendance}
              onSaveAttendanceBatch={handleSaveAttendanceBatch}
              initialEventType={activeAttendanceCategory}
              username={user.nombre}
              showOnlySelectedTrack={showOnlySelectedTrack}
              customTracks={customTracks}
            />
          )}

          {/* 3. People Manager Profiles */}
          {activeSection === 'people' && (
            <PeopleManager
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              onUpdatePersonStatus={handleUpdatePersonStatus}
              onAddPersonNote={handleAddPersonNote}
              onUpdatePersonPhoto={handleUpdatePersonPhoto}
              onOpenNewPersonSheet={() => {
                setActiveSection('attendance');
              }}
            />
          )}

          {/* 4. Statistics Dashboard visualizers */}
          {activeSection === 'stats' && (
            <StatsDashboard
              language={language}
              people={people}
              events={events}
              attendance={attendance}
              onNavigateToAlerts={() => setActiveSection('alerts')}
            />
          )}

          {/* 5. Follow up Alerts alerts log */}
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

          {/* 6. Birthdays birthdays notices */}
          {activeSection === 'birthdays' && (
            <BirthdaysList
              language={language}
              people={people}
              config={config}
              onNavigateToPeople={() => setActiveSection('people')}
            />
          )}

          {/* 7. Config Settings */}
          {activeSection === 'config' && (
            <ConfigScreen
              language={language}
              config={config}
              onSaveConfig={handleSaveConfig}
              onResetDatabase={handleResetDatabase}
              onLanguageChange={setLanguage}
              customTracks={customTracks}
              onRegisterCustomTrack={handleRegisterCustomTrack}
              onDeleteCustomTrack={handleDeleteCustomTrack}
            />
          )}

        </main>

      </div>

    </div>
  );
}
