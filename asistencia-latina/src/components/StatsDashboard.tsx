import { useMemo, useState } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, EventType } from '../types';
import { calculateAlerts } from '../utils/attendance';
import { TrendingUp, HeartHandshake, UserPlus, AlertTriangle, CalendarRange, Trash2 } from 'lucide-react';
import { DEFAULT_CONFIG } from '../data/mockPeople';

interface StatsDashboardProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  onNavigateToAlerts?: () => void;
  onResetAttendanceData: () => Promise<void>;
}

const TRACKS = [
  { id: 'servicio_11' as EventType, nameEs: 'Servicio 11am',      nameEn: 'Service 11am',      color: 'border-t-indigo-600'  },
  { id: 'servicio_6'  as EventType, nameEs: 'Servicio 6pm',       nameEn: 'Service 6pm',       color: 'border-t-violet-500'  },
  { id: 'grupo_conexion' as EventType, nameEs: 'Grupo de Conexión', nameEn: 'Connection Group', color: 'border-t-emerald-500' },
] as const;

export default function StatsDashboard({
  language,
  people,
  events,
  attendance,
  onNavigateToAlerts,
  onResetAttendanceData,
}: StatsDashboardProps) {
  const t = language === 'es' ? esTranslations : enTranslations;
  const es = language === 'es';

  const [chartTrack, setChartTrack] = useState<EventType>('servicio_11');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const topAlerts = useMemo(() => {
    return calculateAlerts(people, events, attendance, DEFAULT_CONFIG).slice(0, 3);
  }, [people, events, attendance]);

  // Current month prefix e.g. "2026-05"
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Per-track metrics
  const trackMetrics = useMemo(() => {
    return TRACKS.map((track) => {
      const trackEvents = events.filter((e) => e.tipo_evento === track.id);

      // Average attendance
      let avg = 0;
      if (trackEvents.length > 0) {
        const total = trackEvents.reduce((acc, evt) => {
          return acc + attendance.filter((a) => a.evento_id === evt.id && a.presente).length;
        }, 0);
        avg = Math.round((total / trackEvents.length) * 10) / 10;
      }

      // New this month: asistencias with es_nuevo=true for this track this month
      const thisMonthEventIds = trackEvents
        .filter((e) => e.fecha.startsWith(currentMonthPrefix))
        .map((e) => e.id);
      const newThisMonth = new Set(
        attendance
          .filter((a) => thisMonthEventIds.includes(a.evento_id) && a.es_nuevo && a.presente)
          .map((a) => a.persona_id)
      ).size;

      return { ...track, avg, newThisMonth };
    });
  }, [events, attendance, currentMonthPrefix]);

  // Chronicle events for the selected chart track
  const chronicleEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.tipo_evento === chartTrack)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((evt) => {
        const presents = attendance.filter((a) => a.evento_id === evt.id && a.presente).length;
        return { id: evt.id, date: evt.fecha, count: presents };
      });
  }, [events, attendance, chartTrack]);

  // SVG line chart
  const lineChartSvg = useMemo(() => {
    if (chronicleEvents.length < 2) return null;
    const width = 600, height = 180, pL = 35, pR = 15, pT = 20, pB = 20;
    const maxCount = Math.max(...chronicleEvents.map((e) => e.count), 10);
    const points = chronicleEvents.map((e, i) => ({
      x: pL + (i / (chronicleEvents.length - 1)) * (width - pL - pR),
      y: height - pB - ((e.count / maxCount) * (height - pT - pB)),
      ...e,
    }));
    let pathD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) { pathD += `M ${pt.x} ${pt.y}`; }
      else {
        const prev = points[idx - 1];
        const cx = prev.x + (pt.x - prev.x) / 2;
        pathD += ` C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
      }
    });
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - pB} L ${points[0].x} ${height - pB} Z`;
    return { points, pathD, areaD, width, height, maxCount, pL, pB };
  }, [chronicleEvents]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetAttendanceData();
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="font-sans space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>{t.statsTitle}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {es ? 'Indicadores clave de salud y retención de la congregación' : 'Key indexes of engagement and growth'}
          </p>
        </div>

        {/* Reset button */}
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{es ? 'Resetear estadísticas' : 'Reset statistics'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-red-800">
              {es ? '¿Eliminar todas las asistencias?' : 'Delete all attendance data?'}
            </span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {resetting ? '...' : (es ? 'Sí, eliminar' : 'Yes, delete')}
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50"
            >
              {es ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        )}
      </div>

      {/* Metrics grid: 3 tracks × 2 stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {trackMetrics.map((track) => (
          <div
            key={track.id}
            className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${track.color} shadow-sm p-5 space-y-4`}
          >
            <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              {es ? track.nameEs : track.nameEn}
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Promedio */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {t.averageAttendance}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">{track.avg}</span>
              </div>

              {/* Nuevos del mes */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {t.newMembersThisMonth}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">+{track.newThisMonth}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart with track selector */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>{t.totalAttendanceOverTime}</span>
          </h3>

          {/* Track selector dropdown */}
          <select
            value={chartTrack}
            onChange={(e) => setChartTrack(e.target.value as EventType)}
            className="text-xs font-bold text-slate-700 bg-slate-50 ring-1 ring-slate-200 py-1.5 px-3 rounded-xl border-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
          >
            {TRACKS.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {es ? tr.nameEs : tr.nameEn}
              </option>
            ))}
          </select>
        </div>

        {lineChartSvg ? (
          <div className="w-full overflow-x-auto select-none pt-2">
            <svg viewBox={`0 0 ${lineChartSvg.width} ${lineChartSvg.height}`} className="w-full h-auto min-w-[500px]">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = lineChartSvg.height - lineChartSvg.pB - ratio * (lineChartSvg.height - 40);
                return (
                  <g key={idx}>
                    <line x1={lineChartSvg.pL} y1={y} x2={lineChartSvg.width - 15} y2={y}
                      stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <text x={lineChartSvg.pL - 8} y={y + 4} fill="#94a3b8" fontSize="9"
                      fontWeight="bold" textAnchor="end">
                      {Math.round(ratio * lineChartSvg.maxCount)}
                    </text>
                  </g>
                );
              })}
              <path d={lineChartSvg.areaD} fill="url(#chartGradient)" />
              <path d={lineChartSvg.pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
              {lineChartSvg.points.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={pt.x} y={pt.y - 8} fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {pt.count}
                  </text>
                  <text x={pt.x} y={lineChartSvg.height - 5} fill="#64748b" fontSize="8" fontWeight="bold"
                    textAnchor="middle" transform={`rotate(-15, ${pt.x}, ${lineChartSvg.height - 5})`}>
                    {pt.date.substring(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl">
            {t.chartNoData}
          </div>
        )}
      </div>

      {/* Bar Chart Comparison */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-600" />
          <span>{t.comparisonTitle}</span>
        </h3>
        <div className="space-y-3.5 pt-2 font-medium">
          {[
            { id: 'servicio_11' as EventType,    nameEs: 'Servicio 11am',       nameEn: 'Service 11am',       color: 'bg-indigo-600'  },
            { id: 'servicio_6'  as EventType,    nameEs: 'Servicio 6pm',        nameEn: 'Service 6pm',        color: 'bg-violet-500'  },
            { id: 'grupo_conexion' as EventType, nameEs: 'Grupo de conexión',   nameEn: 'Connection Group',   color: 'bg-emerald-500' },
            { id: 'grupo_hombres' as EventType,  nameEs: 'Reunión de Hombres',  nameEn: "Men's Meeting",      color: 'bg-blue-500'    },
            { id: 'grupo_mujeres' as EventType,  nameEs: 'Reunión de Mujeres',  nameEn: "Women's Meeting",    color: 'bg-rose-500'    },
          ].map((cat) => {
            const catEvts = events.filter((e) => e.tipo_evento === cat.id);
            let avg = 0;
            if (catEvts.length > 0) {
              const total = catEvts.reduce((acc, evt) =>
                acc + attendance.filter((a) => a.evento_id === evt.id && a.presente).length, 0);
              avg = Math.round((total / catEvts.length) * 10) / 10;
            }
            const percent = Math.min((avg / 40) * 100, 100);
            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{es ? cat.nameEs : cat.nameEn}</span>
                  <span className="font-bold text-slate-900">{avg} {es ? 'prom.' : 'avg.'}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts callout */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm font-medium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{es ? 'Alertas de Seguimiento Críticas' : 'Critical Pastoral Warnings'}</span>
          </h3>
          {onNavigateToAlerts && (
            <button onClick={onNavigateToAlerts}
              className="text-xs font-bold text-blue-900 hover:underline cursor-pointer">
              {es ? 'Ver todas →' : 'View all →'}
            </button>
          )}
        </div>
        {topAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {t.noAlerts}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topAlerts.map((alert, idx) => (
              <div key={`${alert.personaId}_${alert.tipo}_${idx}`}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  alert.semanasFaltadas >= 4 ? 'bg-red-50 text-red-900 border-red-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                <p className="font-bold">⚠️ {es ? alert.mensajeEs : alert.mensajeEn}</p>
                <span className="px-2 py-0.5 bg-white/80 border border-inherit rounded-md text-[10px] uppercase font-black tracking-widest shrink-0">
                  {alert.semanasFaltadas} {es ? 'FALTAS' : 'MISSES'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
