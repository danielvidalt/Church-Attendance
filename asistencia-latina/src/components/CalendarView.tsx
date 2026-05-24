import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Users, UserPlus, UserCheck } from 'lucide-react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, EventTrack } from '../types';

interface CalendarViewProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  customTracks?: EventTrack[];
}

const TYPE_COLORS: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  servicio_11:    { dot: 'bg-indigo-500',  bg: 'bg-indigo-50',  border: 'border-indigo-200', text: 'text-indigo-700' },
  servicio_6:     { dot: 'bg-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700' },
  grupo_conexion: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  grupo_hombres:  { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700' },
  grupo_mujeres:  { dot: 'bg-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-700' },
};
const fallbackColor = { dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };
const typeColor = (tipo: string) => TYPE_COLORS[tipo] ?? fallbackColor;

const DAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_LABELS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarView({ language, people, events, attendance, customTracks = [] }: CalendarViewProps) {
  const t = language === 'es' ? esTranslations : enTranslations;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const dayLabels  = language === 'es' ? DAY_LABELS_ES : DAY_LABELS_EN;
  const monthLabel = (language === 'es' ? MONTH_LABELS_ES : MONTH_LABELS_EN)[viewMonth];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null); setSelectedEventId(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null); setSelectedEventId(null);
  };

  const trackLabel = (tipo: string) => {
    const custom = customTracks.find(tr => tr.id === tipo);
    if (custom) return language === 'es' ? custom.titleEs : custom.titleEn;
    const defaults: Record<string, [string, string]> = {
      servicio_11:    ['11:00 am - Servicio', '11:00 am - Service'],
      servicio_6:     ['6:00 pm - Servicio',  '6:00 pm - Service'],
      grupo_conexion: ['Grupo Conexión', 'Connection Group'],
      grupo_hombres:  ['Grupo Hombres',  "Men's Group"],
      grupo_mujeres:  ['Grupo Mujeres',  "Women's Group"],
    };
    const pair = defaults[tipo];
    return pair ? (language === 'es' ? pair[0] : pair[1]) : tipo;
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    events.forEach(e => {
      if (!map[e.fecha]) map[e.fecha] = [];
      map[e.fecha].push(e);
    });
    return map;
  }, [events]);

  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  const eventDetail = useMemo(() => {
    if (!selectedEventId) return null;
    const evt = events.find(e => e.id === selectedEventId);
    if (!evt) return null;
    const records     = attendance.filter(a => a.evento_id === evt.id);
    const presentRec  = records.filter(r => r.presente);
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

  const fmtDate = (dateISO: string) => {
    const [y, m, d] = dateISO.split('-').map(Number);
    const months = language === 'es' ? MONTH_LABELS_ES : MONTH_LABELS_EN;
    return `${d} ${language === 'es' ? 'de ' : ''}${months[m - 1]} ${y}`;
  };

  return (
    <div className="font-sans space-y-6">
      {/* Header card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{t.calendar}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {language === 'es' ? 'Toca un día para ver los registros guardados' : 'Tap a day to view saved records'}
          </p>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
            {monthLabel} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {dayLabels.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-14 border-b border-r border-slate-50 last:border-r-0" />;
            }
            const ds = dateStr(day);
            const evts = eventsByDate[ds] ?? [];
            const isToday    = ds === todayStr;
            const isSelected = ds === selectedDate;
            const dotsToShow = evts.slice(0, 3);
            const overflow   = evts.length - 3;

            return (
              <button
                key={ds}
                onClick={() => {
                  setSelectedDate(ds === selectedDate ? null : ds);
                  setSelectedEventId(null);
                }}
                className={`h-14 flex flex-col items-center justify-start pt-1.5 gap-1 border-b border-r border-slate-100 last:border-r-0 transition-colors cursor-pointer relative
                  ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}
                `}
              >
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday    ? 'bg-indigo-600 text-white'       : ''}
                  ${isSelected && !isToday ? 'text-indigo-700 font-black' : ''}
                  ${!isToday && !isSelected ? 'text-slate-700' : ''}
                `}>
                  {day}
                </span>
                {evts.length > 0 && (
                  <div className="flex items-center gap-0.5 flex-wrap justify-center px-0.5">
                    {dotsToShow.map(e => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${typeColor(e.tipo_evento).dot}`} />
                    ))}
                    {overflow > 0 && (
                      <span className="text-[8px] font-black text-slate-400 leading-none">+{overflow}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Color legend */}
        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-3">
          {Object.entries(TYPE_COLORS).map(([tipo, colors]) => (
            <div key={tipo} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-[10px] font-semibold text-slate-500">{trackLabel(tipo)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {fmtDate(selectedDate)}
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
              {t.noEventsThisDay}
            </div>
          ) : (
            selectedEvents.map(evt => {
              const colors  = typeColor(evt.tipo_evento);
              const records = attendance.filter(a => a.evento_id === evt.id);
              const present = records.filter(r => r.presente).length;
              const anon    = evt.asistentes_anonimos ?? 0;
              const newC    = records.filter(r => r.presente && r.es_nuevo).length;
              const isOpen  = selectedEventId === evt.id;

              return (
                <div key={evt.id} className={`rounded-2xl border ${colors.border} overflow-hidden shadow-sm`}>
                  {/* Event card header */}
                  <button
                    onClick={() => setSelectedEventId(isOpen ? null : evt.id)}
                    className={`w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isOpen ? colors.bg : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                      <span className={`text-xs font-extrabold uppercase tracking-wide truncate ${isOpen ? colors.text : 'text-slate-800'}`}>
                        {trackLabel(evt.tipo_evento)}
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
                      {/* Stats row */}
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

                      {/* Anonymous note */}
                      {eventDetail.anon > 0 && (
                        <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          {language === 'es'
                            ? `+ ${eventDetail.anon} visitante${eventDetail.anon > 1 ? 's' : ''} sin registrar`
                            : `+ ${eventDetail.anon} unregistered visitor${eventDetail.anon > 1 ? 's' : ''}`}
                        </p>
                      )}

                      {/* Present members list */}
                      {eventDetail.presentPeople.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <UserCheck className="w-3 h-3 inline mr-1" />
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
