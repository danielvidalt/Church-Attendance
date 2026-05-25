import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, History, Users, UserPlus, UserCheck } from 'lucide-react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, EventTrack } from '../types';

interface HistoryViewProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  customTracks?: EventTrack[];
}

const TYPE_META: Record<string, {
  titleEs: string; titleEn: string;
  labelEs: string; labelEn: string;
  color: string; dot: string; bg: string; border: string; text: string; topBar: string;
}> = {
  servicio_11: {
    titleEs: '11:00 am', titleEn: '11:00 am',
    labelEs: 'Servicio Domingo', labelEn: 'Sunday Morning',
    color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-indigo-600 hover:bg-slate-50',
    dot: 'bg-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', topBar: 'border-t-indigo-600',
  },
  servicio_6: {
    titleEs: '6:00 pm', titleEn: '6:00 pm',
    labelEs: 'Servicio Domingo', labelEn: 'Sunday Evening',
    color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-violet-500 hover:bg-slate-50',
    dot: 'bg-violet-500', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', topBar: 'border-t-violet-500',
  },
  grupo_conexion: {
    titleEs: 'Grupo Conexión', titleEn: 'Connection Group',
    labelEs: 'Sábado', labelEn: 'Cell group',
    color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-emerald-500 hover:bg-slate-50',
    dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', topBar: 'border-t-emerald-500',
  },
  grupo_hombres: {
    titleEs: 'Grupo Hombres', titleEn: "Men's Group",
    labelEs: 'Varones', labelEn: "Men's ministry",
    color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-blue-500 hover:bg-slate-50',
    dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', topBar: 'border-t-blue-500',
  },
  grupo_mujeres: {
    titleEs: 'Grupo Mujeres', titleEn: "Women's Group",
    labelEs: 'Damas', labelEn: "Women's ministry",
    color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-rose-500 hover:bg-slate-50',
    dot: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', topBar: 'border-t-rose-500',
  },
};

const MONTH_LABELS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_LABELS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fallbackMeta = {
  dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700',
  color: 'border-slate-200 bg-white text-slate-900 border-t-4 border-t-slate-400 hover:bg-slate-50',
};

export default function HistoryView({ language, people, events, attendance, customTracks = [] }: HistoryViewProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  const [selectedType, setSelectedType]   = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const fmtDate = (dateISO: string) => {
    const [y, m, d] = dateISO.split('-').map(Number);
    const months = language === 'es' ? MONTH_LABELS_ES : MONTH_LABELS_EN;
    return `${d} ${language === 'es' ? 'de ' : ''}${months[m - 1]} ${y}`;
  };

  // All unique event types that have at least one saved event
  const savedTypes = useMemo(() => {
    const typeIds = [...new Set(events.map(e => e.tipo_evento))];
    // Order: built-ins first (in defined order), then custom
    const builtinOrder = Object.keys(TYPE_META);
    const builtins = builtinOrder.filter(id => typeIds.includes(id));
    const customs  = typeIds.filter(id => !TYPE_META[id]);
    return [...builtins, ...customs];
  }, [events]);

  const trackTitle = (tipo: string) => {
    const meta = TYPE_META[tipo];
    if (meta) return language === 'es' ? meta.titleEs : meta.titleEn;
    const custom = customTracks.find(c => c.id === tipo);
    if (custom) return language === 'es' ? custom.titleEs : custom.titleEn;
    return tipo;
  };

  const trackLabel = (tipo: string) => {
    const meta = TYPE_META[tipo];
    if (meta) return language === 'es' ? meta.labelEs : meta.labelEn;
    const custom = customTracks.find(c => c.id === tipo);
    if (custom) return language === 'es' ? custom.labelEs : custom.labelEn;
    return '';
  };

  const typeMeta = (tipo: string) => TYPE_META[tipo] ?? fallbackMeta;

  // Events for the selected type, newest first
  const typeEvents = useMemo(() => {
    if (!selectedType) return [];
    return events
      .filter(e => e.tipo_evento === selectedType)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [selectedType, events]);

  // Detail for the selected event
  const eventDetail = useMemo(() => {
    if (!selectedEventId) return null;
    const evt = events.find(e => e.id === selectedEventId);
    if (!evt) return null;
    const records    = attendance.filter(a => a.evento_id === evt.id);
    const presentRec = records.filter(r => r.presente);
    const presentPeople = presentRec
      .map(r => people.find(p => p.id === r.persona_id))
      .filter((p): p is Persona => !!p)
      .sort((a, b) => {
        if (a.estado === 'nuevo' && b.estado !== 'nuevo') return -1;
        if (b.estado === 'nuevo' && a.estado !== 'nuevo') return 1;
        return a.nombre_completo.localeCompare(b.nombre_completo);
      });
    const newCount = presentRec.filter(r => r.es_nuevo).length;
    const anon     = evt.asistentes_anonimos ?? 0;
    const absent   = records.filter(r => !r.presente).length;
    return { evt, presentPeople, newCount, anon, absent, total: presentRec.length + anon };
  }, [selectedEventId, events, attendance, people]);

  // Summary counts per type (for the type cards)
  const typeStats = useMemo(() => {
    const map: Record<string, { count: number; lastDate: string | null }> = {};
    events.forEach(e => {
      if (!map[e.tipo_evento]) map[e.tipo_evento] = { count: 0, lastDate: null };
      map[e.tipo_evento].count++;
      if (!map[e.tipo_evento].lastDate || e.fecha > map[e.tipo_evento].lastDate!) {
        map[e.tipo_evento].lastDate = e.fecha;
      }
    });
    return map;
  }, [events]);

  return (
    <div className="font-sans space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        {selectedType ? (
          <button
            onClick={() => { setSelectedType(null); setSelectedEventId(null); }}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <History className="w-5 h-5 text-indigo-600 shrink-0" />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
            {selectedType
              ? trackTitle(selectedType)
              : (language === 'es' ? 'Historial de Registros' : 'Attendance History')}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {selectedType
              ? (language === 'es' ? `${typeEvents.length} registro${typeEvents.length !== 1 ? 's' : ''} guardado${typeEvents.length !== 1 ? 's' : ''}` : `${typeEvents.length} saved record${typeEvents.length !== 1 ? 's' : ''}`)
              : (language === 'es' ? 'Selecciona un servicio o grupo para ver su historial' : 'Select a service or group to browse its history')}
          </p>
        </div>
      </div>

      {/* Type selection grid */}
      {!selectedType && (
        <>
          {savedTypes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">
                {language === 'es' ? 'No hay registros guardados aún' : 'No saved records yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedTypes.map(tipo => {
                const meta  = typeMeta(tipo);
                const stats = typeStats[tipo] ?? { count: 0, lastDate: null };
                return (
                  <button
                    key={tipo}
                    onClick={() => { setSelectedType(tipo); setSelectedEventId(null); }}
                    className={`p-5 rounded-2xl border text-left shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 duration-150 flex flex-col justify-between h-36 ${meta.color}`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      {trackLabel(tipo)}
                    </span>
                    <div className="mt-auto">
                      <h3 className="text-base sm:text-lg font-black tracking-tight leading-none mb-1">
                        {trackTitle(tipo)}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] font-bold ${meta.text}`}>
                          {stats.count} {language === 'es' ? `registro${stats.count !== 1 ? 's' : ''}` : `record${stats.count !== 1 ? 's' : ''}`} →
                        </span>
                        {stats.lastDate && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {fmtDate(stats.lastDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Event list for selected type */}
      {selectedType && (
        <div className="space-y-3">
          {typeEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
              {language === 'es' ? 'Sin registros para este evento' : 'No records for this event'}
            </div>
          ) : (
            typeEvents.map(evt => {
              const colors  = typeMeta(evt.tipo_evento);
              const records = attendance.filter(a => a.evento_id === evt.id);
              const present = records.filter(r => r.presente).length;
              const anon    = evt.asistentes_anonimos ?? 0;
              const newC    = records.filter(r => r.presente && r.es_nuevo).length;
              const isOpen  = selectedEventId === evt.id;

              return (
                <div key={evt.id} className={`rounded-2xl border ${colors.border} overflow-hidden shadow-sm`}>
                  {/* Record header row */}
                  <button
                    onClick={() => setSelectedEventId(isOpen ? null : evt.id)}
                    className={`w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isOpen ? colors.bg : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                      <span className={`text-sm font-extrabold truncate ${isOpen ? colors.text : 'text-slate-800'}`}>
                        {fmtDate(evt.fecha)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {present + anon}
                      </span>
                      {newC + anon > 0 && (
                        <span className="flex items-center gap-1 text-teal-600">
                          <UserPlus className="w-3.5 h-3.5" />
                          {newC + anon}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && eventDetail && eventDetail.evt.id === evt.id && (
                    <div className={`${colors.bg} border-t ${colors.border} p-4 space-y-4`}>
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.totalPresents}</p>
                          <p className="text-xl font-black text-slate-900 mt-1">{eventDetail.total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.newPresents}</p>
                          <p className="text-xl font-black text-teal-600 mt-1">{eventDetail.newCount + eventDetail.anon}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.regularPresents}</p>
                          <p className="text-xl font-black text-slate-600 mt-1">{eventDetail.total - eventDetail.newCount - eventDetail.anon}</p>
                        </div>
                      </div>

                      {/* Anon note */}
                      {eventDetail.anon > 0 && (
                        <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          {language === 'es'
                            ? `+ ${eventDetail.anon} visitante${eventDetail.anon > 1 ? 's' : ''} sin registrar`
                            : `+ ${eventDetail.anon} unregistered visitor${eventDetail.anon > 1 ? 's' : ''}`}
                        </p>
                      )}

                      {/* Present list */}
                      {eventDetail.presentPeople.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {language === 'es' ? 'Presentes' : 'Present'}
                          </p>
                          <div className="space-y-1">
                            {eventDetail.presentPeople.map(p => (
                              <div key={p.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${p.sexo === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                                <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{p.nombre_completo}</span>
                                {p.estado === 'nuevo' && (
                                  <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                    {language === 'es' ? 'Nuevo' : 'New'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Absent count */}
                      {eventDetail.absent > 0 && (
                        <p className="text-[11px] font-semibold text-slate-400">
                          {language === 'es'
                            ? `${eventDetail.absent} persona${eventDetail.absent > 1 ? 's' : ''} no asistió`
                            : `${eventDetail.absent} person${eventDetail.absent > 1 ? 's' : ''} absent`}
                        </p>
                      )}

                      <button
                        onClick={() => setSelectedEventId(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                      >
                        {t.backToDay}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
