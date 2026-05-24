import { useState, useMemo, useEffect } from 'react';
import { Language, esTranslations, enTranslations, Persona, Asistencia, EventType, Evento, EventTrack } from '../types';
import { Search, Calendar, CheckSquare, Plus, Save, Square, ClipboardCheck, Info, CheckCircle2 } from 'lucide-react';
import NewPersonModal from './NewPersonModal';

interface AttendanceSheetProps {
  language: Language;
  people: Persona[];
  onAddNewPerson: (p: Persona) => Promise<void>;
  savedEvents: Evento[];
  savedAttendance: Asistencia[];
  onSaveAttendanceBatch: (
    eventType: EventType,
    dateStr: string,
    presentIds: string[],
    newIdsSinceSave: string[],
    anonCount: number
  ) => void;
  initialEventType: EventType;
  username: string;
  showOnlySelectedTrack?: boolean;
  customTracks?: EventTrack[];
}

type TabType = 'all' | 'present' | 'absent' | 'new';

export default function AttendanceSheet({
  language,
  people,
  onAddNewPerson,
  savedEvents,
  savedAttendance,
  onSaveAttendanceBatch,
  initialEventType,
  username,
  showOnlySelectedTrack = false,
  customTracks = []
}: AttendanceSheetProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  const [selectedEventType, setSelectedEventType] = useState<EventType>(initialEventType);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // Modal for new person
  const [isNewPersonModalOpen, setIsNewPersonModalOpen] = useState(false);
  const [savingNewPerson, setSavingNewPerson] = useState(false);
  const [newPersonError, setNewPersonError] = useState<string | null>(null);

  // Keep an in-memory tracking state of who is checked for the currently selected event & date
  // By default, let's load what was previously saved if matching record exists!
  const matchedEvent = useMemo(() => {
    return savedEvents.find((e) => e.tipo_evento === selectedEventType && e.fecha === selectedDate);
  }, [savedEvents, selectedEventType, selectedDate]);

  // Read present list from database when date or event changes, otherwise local override
  const [localPresentMap, setLocalPresentMap] = useState<{ [personaId: string]: boolean }>({});
  const [lastLoadedKey, setLastLoadedKey] = useState('');

  // Auto load existing records when event or date changes
  const activeKey = `${selectedEventType}_${selectedDate}`;
  if (activeKey !== lastLoadedKey) {
    const presentMap: { [personaId: string]: boolean } = {};
    if (matchedEvent) {
      const records = savedAttendance.filter((att) => att.evento_id === matchedEvent.id);
      records.forEach((r) => {
        presentMap[r.persona_id] = r.presente;
      });
    } else {
      // If no saved event, we default everyone to unchecked
      people.forEach((p) => {
        presentMap[p.id] = false;
      });
    }
    setLocalPresentMap(presentMap);
    setLastLoadedKey(activeKey);
  }

  // Anonymous new visitor counter — restores saved value on re-entry, resets to 0 for unsaved events
  const [anonCount, setAnonCount] = useState(0);
  useEffect(() => {
    setAnonCount(matchedEvent?.asistentes_anonimos ?? 0);
  }, [selectedEventType, selectedDate]);

  // To confirm overwriting a record on save
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    present: number;
    new: number;
    regular: number;
    absent: number;
    anon: number;
  } | null>(null);

  // Filter list of eligible members for this gender track
  const eligiblePeople = useMemo(() => {
    return people.filter((p) => {
      // Inactive members do not appear on standard check list
      if (p.estado === 'inactivo') return false;
      // Filter by men/women track
      if (selectedEventType === 'grupo_hombres' && p.sexo !== 'M') return false;
      if (selectedEventType === 'grupo_mujeres' && p.sexo !== 'F') return false;
      return true;
    });
  }, [people, selectedEventType]);

  // Apply search and tab filter bounds
  const filteredUsers = useMemo(() => {
    return eligiblePeople.filter((p) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        p.nombre_completo.toLowerCase().includes(query) ||
        (p.telefono && p.telefono.includes(query));

      if (!matchesSearch) return false;

      // 2. Tab Filter
      const isChecked = !!localPresentMap[p.id];
      if (activeTab === 'present') return isChecked;
      if (activeTab === 'absent') return !isChecked;
      if (activeTab === 'new') return p.estado === 'nuevo';

      return true;
    });
  }, [eligiblePeople, searchQuery, activeTab, localPresentMap]);

  // Quick stats computed in real time
  const liveStats = useMemo(() => {
    let presentCount = 0;
    let newCount = 0;
    let regularCount = 0;
    let absentCount = 0;

    eligiblePeople.forEach((p) => {
      const isChecked = !!localPresentMap[p.id];
      if (isChecked) {
        presentCount++;
        if (p.estado === 'nuevo') {
          newCount++;
        } else {
          regularCount++;
        }
      } else {
        absentCount++;
      }
    });

    return {
      present: presentCount,
      new: newCount,
      regular: regularCount,
      absent: absentCount
    };
  }, [eligiblePeople, localPresentMap]);

  // Handle single toggling
  const handleTogglePerson = (id: string) => {
    setLocalPresentMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all visible ones
  const handleToggleAllVisible = (checkAll: boolean) => {
    const updated = { ...localPresentMap };
    filteredUsers.forEach((u) => {
      updated[u.id] = checkAll;
    });
    setLocalPresentMap(updated);
  };

  // Trigger saving sequence
  const executeSave = () => {
    const presentIds = Object.keys(localPresentMap).filter((id) => localPresentMap[id]);
    
    // We determine what "new" members were present
    const presentNewPeople = people.filter((p) => presentIds.includes(p.id) && p.estado === 'nuevo').map(p => p.id);

    onSaveAttendanceBatch(selectedEventType, selectedDate, presentIds, presentNewPeople, anonCount);

    // Lock stats to show a beautiful daily summary
    setSummaryStats({
      present: presentIds.length,
      new: presentNewPeople.length,
      regular: presentIds.length - presentNewPeople.length,
      absent: eligiblePeople.length - presentIds.length,
      anon: anonCount,
    });

    setSuccessToast(true);
    setShowOverwriteDialog(false);

    // Automatically dismiss toast after 5 seconds
    setTimeout(() => {
      setSuccessToast(false);
    }, 5000);
  };

  const handleSaveAttempt = () => {
    if (matchedEvent) {
      // Warn them about overwriting already secured check for this date
      setShowOverwriteDialog(true);
    } else {
      executeSave();
    }
  };

  const handleNewPersonCreated = async (newPerson: Persona) => {
    setSavingNewPerson(true);
    setNewPersonError(null);
    try {
      await onAddNewPerson(newPerson);
      setLocalPresentMap((prev) => ({ ...prev, [newPerson.id]: true }));
      setIsNewPersonModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setNewPersonError(msg);
      setTimeout(() => setNewPersonError(null), 6000);
    } finally {
      setSavingNewPerson(false);
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{t.registerAttendance}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {language === 'es' ? 'Marca la asistencia de forma rápida e intuitiva' : 'Secure quick attendance marks through touch checklists'}
          </p>
        </div>

        {/* Quick controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 min-w-0">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSummaryStats(null);
                setSuccessToast(false);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0 w-full"
            />
          </div>

          <button
            onClick={() => setIsNewPersonModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.addPerson}</span>
          </button>
        </div>
      </div>

      {newPersonError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span className="shrink-0 font-black text-red-600">✕</span>
          {language === 'es' ? `No se pudo guardar la persona: ${newPersonError}` : `Could not save person: ${newPersonError}`}
        </div>
      )}

      {successToast && summaryStats && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-700" />
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-green-900">{t.saveSuccess}</h4>
              <p className="text-xs text-green-800/90 mt-0.5">{t.congratulationAlert}</p>
            </div>
          </div>
          <div className="flex gap-4 bg-white/60 p-3 rounded-xl border border-green-100/50 self-start sm:self-center font-semibold text-xs text-slate-700">
            <div>
              {t.totalPresents}: <span className="text-green-800 font-extrabold">{summaryStats.present + summaryStats.anon}</span>
            </div>
            <div className="border-l border-green-200/60 pl-3">
              {t.newPresents}: <span className="text-teal-700 font-extrabold">{summaryStats.new + summaryStats.anon}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Selector & List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Event Type selection */}
        <div className="lg:col-span-1 space-y-3.5">
          <span className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            {showOnlySelectedTrack 
              ? (language === 'es' ? 'Actividad Seleccionada' : 'Selected Activity')
              : (language === 'es' ? 'Servicios y Grupos' : 'Services & Groups')}
          </span>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
            {(() => {
              const defaultTrackOptions = [
                { id: 'servicio_11', titleEs: '11:00 am - Servicio', titleEn: '11:00 am - Service', descEs: 'Servicio de domingo', descEn: 'Sunday Morning Service' },
                { id: 'servicio_6', titleEs: '6:00 pm - Servicio', titleEn: '6:00 pm - Service', descEs: 'Servicio de domingo', descEn: 'Sunday Evening Service' },
                { id: 'grupo_conexion', titleEs: 'Grupo Conexión', titleEn: 'Connection Group', descEs: 'Grupo de estudio semanal', descEn: 'Weekly cell group study' },
                { id: 'grupo_hombres', titleEs: 'Grupo Hombres', titleEn: 'Men\'s Group', descEs: 'Ministerio de varones', descEn: 'Men\'s study & fellowship' },
                { id: 'grupo_mujeres', titleEs: 'Grupo Mujeres', titleEn: 'Women\'s Group', descEs: 'Ministerio de damas', descEn: 'Women\'s study & fellowship' }
              ];

              const customTrackOptions = customTracks.map((t) => ({
                id: t.id,
                titleEs: t.titleEs,
                titleEn: t.titleEn,
                descEs: t.labelEs,
                descEn: t.labelEn
              }));

              const combinedTracks = [...defaultTrackOptions, ...customTrackOptions];
              const tracksToRender = showOnlySelectedTrack
                ? combinedTracks.filter((t) => t.id === selectedEventType)
                : combinedTracks;

              return tracksToRender.map((track) => {
                const active = selectedEventType === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      if (showOnlySelectedTrack) return; // Locked down if accessed via quick event click
                      setSelectedEventType(track.id);
                      setSummaryStats(null);
                      setSuccessToast(false);
                      setActiveTab('all');
                    }}
                    className={`w-full text-left p-4 transition-all ${
                      showOnlySelectedTrack ? 'pointer-events-none' : 'cursor-pointer'
                    } ${
                      active
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 text-indigo-950 font-bold'
                        : 'bg-white hover:bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-extrabold truncate uppercase tracking-wide">
                      {language === 'es' ? track.titleEs : track.titleEn}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-1">
                      {language === 'es' ? track.descEs : track.descEn}
                    </div>
                  </button>
                );
              });
            })()}
          </div>

          {/* Quick Realtime Stats Card */}
          <div className="bg-slate-950 p-5 rounded-2xl text-white space-y-4 shadow-lg shadow-slate-900/10">
            <h4 className="text-xs font-black tracking-widest text-indigo-300 uppercase">
              {t.summaryOfToday}
            </h4>
            <div className="space-y-2.5 divide-y divide-white/5">
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-slate-300">{t.totalPresents}:</span>
                <span className="text-lg font-black text-white">{liveStats.present + anonCount}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-slate-300">{t.regularPresents}:</span>
                <span className="text-sm font-black text-slate-100">{liveStats.regular}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-slate-300">{t.newPresents}:</span>
                <span className="text-sm font-black text-green-400">{liveStats.new + anonCount}</span>
              </div>
              {/* Anonymous new visitor counter */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {language === 'es' ? 'Nuevos sin registrar' : 'Unregistered visitors'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {language === 'es' ? 'Personas sin datos' : 'No info yet'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnonCount(c => Math.max(0, c - 1))}
                      className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors font-black text-sm"
                    >−</button>
                    <span className="text-lg font-black text-amber-300 min-w-[1.5rem] text-center">{anonCount}</span>
                    <button
                      onClick={() => setAnonCount(c => c + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors font-black text-sm"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAttempt}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveAttendance}</span>
            </button>
          </div>
        </div>

        {/* Right Columns: Core touch checklist */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Controls toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={t.searchByName}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Attendance Filter Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 w-full sm:w-auto">
              {[
                { id: 'all', label: t.filterAll },
                { id: 'present', label: t.filterPresent },
                { id: 'absent', label: t.filterAbsent },
                { id: 'new', label: t.filterNew }
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span>{language === 'es' ? 'Selección rápida:' : 'Quick toggle:'}</span>
            <button
              onClick={() => handleToggleAllVisible(true)}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer text-[11px]"
            >
              ✅ {language === 'es' ? 'Marcar todos visibles' : 'Mark all visible'}
            </button>
            <button
              onClick={() => handleToggleAllVisible(false)}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-705 text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 cursor-pointer text-[11px]"
            >
              ❌ {language === 'es' ? 'Desmarcar todos visibles' : 'Unmark all visible'}
            </button>
          </div>

          {/* Checkbox Touch List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                <ClipBoardIcon className="w-12 h-12 mx-auto text-slate-300 mb-2.5" />
                <span>{t.noPeopleFound}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsers.map((person) => {
                  const isChecked = !!localPresentMap[person.id];
                  const alreadySavedToday = matchedEvent;
                  return (
                    <div
                      key={person.id}
                      onClick={() => handleTogglePerson(person.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-green-50/25 hover:bg-green-50/40'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 pr-2">
                        {/* Checkbox element with large hit target */}
                        <div className="shrink-0 text-slate-400">
                          {isChecked ? (
                            <CheckSquare className="w-5.5 h-5.5 text-green-700" />
                          ) : (
                            <Square className="w-5.5 h-5.5 text-slate-300 hover:text-slate-400" />
                          )}
                        </div>

                        {/* Tiny Avatar */}
                        <div className="w-7 h-7 flex items-center justify-center bg-slate-150 text-slate-500 rounded-lg text-xs font-black overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                          {person.foto_perfil ? (
                            <img
                              src={person.foto_perfil}
                              alt={person.nombre_completo}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            person.nombre_completo.charAt(0)
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 leading-snug">
                              {person.nombre_completo}
                            </span>
                            {person.estado === 'nuevo' && (
                              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-green-100 text-green-800 rounded-md">
                                {t.statusNew}
                              </span>
                            )}
                            <span className={`w-2 h-2 rounded-full shrink-0 ${person.sexo === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {person.telefono || (language === 'es' ? 'Sin teléfono registrado' : 'No phone recorded')}
                            {person.notas && ` • "${person.notas}"`}
                          </div>
                        </div>
                      </div>

                      {/* Small Status indicator */}
                      <span
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${
                          isChecked
                            ? 'bg-green-50 text-green-800 border border-green-200/50'
                            : 'bg-slate-100 text-slate-400 border border-slate-200/30'
                        }`}
                      >
                        {isChecked ? (language === 'es' ? 'Presente' : 'Present') : (language === 'es' ? 'Ausente' : 'Absent')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERWRITE CONFIRMATION DIALOG */}
      {showOverwriteDialog && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl">
            <h4 className="font-extrabold text-[#0a2540] text-base mb-1.5">{t.alreadySavedTitle}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6">{t.alreadySavedDesc}</p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowOverwriteDialog(false)}
                className="px-3.5 py-2 ring-1 ring-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
              >
                {t.keepBtn}
              </button>
              <button
                onClick={executeSave}
                className="px-4 py-2 bg-blue-950 text-white hover:bg-black text-[11px] font-black rounded-xl text-xs hover:shadow-lg transition-all cursor-pointer"
              >
                {t.overwriteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Slide */ }
      {isNewPersonModalOpen && (
        <NewPersonModal
          language={language}
          onClose={() => { if (!savingNewPerson) setIsNewPersonModalOpen(false); }}
          onSave={handleNewPersonCreated}
          defaultEventType={selectedEventType}
          isSaving={savingNewPerson}
        />
      )}
    </div>
  );
}

function ClipBoardIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0 1 12 3m0 0c2.917 0 5.747.294 8.5.862m-1.951 10.149c.563-.563.85-1.32.85-2.078V12m0 0H21m-2.1 3H21m-2.1-1.5h.008v.008H18.9m0-3h.008v.008H18.9"
      />
    </svg>
  );
}
