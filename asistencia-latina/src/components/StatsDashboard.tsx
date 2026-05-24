import { useMemo, useState } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, EventType } from '../types';
import { calculateAlerts } from '../utils/attendance';
import { TrendingUp, HeartHandshake, UserPlus, AlertTriangle, CalendarRange, Trash2, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { DEFAULT_CONFIG } from '../data/mockPeople';

// ── Comparison sub-components (defined outside StatsDashboard for stable refs) ──

function StatRow({ label, valA, valB }: { label: string; valA: number; valB: number }) {
  const max  = Math.max(valA, valB, 1);
  const pctA = (valA / max) * 100;
  const pctB = (valB / max) * 100;
  const aWins = valA > valB;
  const bWins = valB > valA;
  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] items-center gap-2">
      <div className={`text-right text-sm font-extrabold ${aWins ? 'text-green-700' : 'text-slate-700'}`}>{valA}</div>
      <div className="space-y-1">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">{label}</div>
        <div className="flex gap-1 h-3">
          <div className="flex-1 flex justify-end bg-slate-100 rounded-l-full overflow-hidden">
            <div className={`h-full rounded-l-full transition-all ${aWins ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${pctA}%` }} />
          </div>
          <div className="flex-1 bg-slate-100 rounded-r-full overflow-hidden">
            <div className={`h-full rounded-r-full transition-all ${bWins ? 'bg-green-500' : 'bg-violet-400'}`} style={{ width: `${pctB}%` }} />
          </div>
        </div>
      </div>
      <div className={`text-left text-sm font-extrabold ${bWins ? 'text-green-700' : 'text-slate-700'}`}>{valB}</div>
    </div>
  );
}

function CompareSelector({
  side, value, onChange, dates, es,
}: {
  side: 'A' | 'B';
  value: { tipo: EventType; fecha: string };
  onChange: (v: { tipo: EventType; fecha: string }) => void;
  dates: string[];
  es: boolean;
}) {
  const isA = side === 'A';
  const fmtDate = (iso: string) => {
    const [, m, d] = iso.split('-');
    const mNames = es
      ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(d)} ${mNames[parseInt(m) - 1]}`;
  };
  return (
    <div className={`space-y-2 p-3 rounded-xl border ${isA ? 'bg-indigo-50 border-indigo-200' : 'bg-violet-50 border-violet-200'}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isA ? 'text-indigo-700' : 'text-violet-700'}`}>
        {es ? `Lado ${side}` : `Side ${side}`}
      </span>
      <select
        value={value.tipo}
        onChange={e => onChange({ tipo: e.target.value as EventType, fecha: '' })}
        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
      >
        {ALL_TRACKS.map(t => (
          <option key={t.id} value={t.id}>{es ? t.nameEs : t.nameEn}</option>
        ))}
      </select>
      <select
        value={value.fecha}
        onChange={e => onChange({ ...value, fecha: e.target.value })}
        className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
      >
        <option value="">{es ? 'Último registro' : 'Latest record'}</option>
        {dates.map(d => (
          <option key={d} value={d}>{fmtDate(d)} ({d})</option>
        ))}
      </select>
    </div>
  );
}

interface StatsDashboardProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  onNavigateToAlerts?: () => void;
  onResetAttendanceData: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const ALL_TRACKS = [
  { id: 'servicio_11'   as EventType, nameEs: 'Servicio 11am',      nameEn: 'Service 11am',      colorA: 'bg-indigo-600',  colorB: 'bg-indigo-400'  },
  { id: 'servicio_6'    as EventType, nameEs: 'Servicio 6pm',        nameEn: 'Service 6pm',        colorA: 'bg-violet-600',  colorB: 'bg-violet-400'  },
  { id: 'grupo_conexion' as EventType, nameEs: 'Grupo Conexión',     nameEn: 'Connection Group',   colorA: 'bg-emerald-600', colorB: 'bg-emerald-400' },
  { id: 'grupo_hombres' as EventType, nameEs: 'Grupo Hombres',       nameEn: "Men's Group",        colorA: 'bg-blue-600',    colorB: 'bg-blue-400'    },
  { id: 'grupo_mujeres' as EventType, nameEs: 'Grupo Mujeres',       nameEn: "Women's Group",      colorA: 'bg-rose-600',    colorB: 'bg-rose-400'    },
] as const;

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
  onRefresh,
}: StatsDashboardProps) {
  const t = language === 'es' ? esTranslations : enTranslations;
  const es = language === 'es';

  const [chartTrack, setChartTrack] = useState<EventType>('servicio_11');
  const [confirmReset, setConfirmReset] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [compareA, setCompareA] = useState<{ tipo: EventType; fecha: string }>({ tipo: 'servicio_11', fecha: '' });
  const [compareB, setCompareB] = useState<{ tipo: EventType; fecha: string }>({ tipo: 'servicio_6',  fecha: '' });

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

      // Average attendance (includes anonymous visitors)
      let avg = 0;
      if (trackEvents.length > 0) {
        const total = trackEvents.reduce((acc, evt) => {
          const registered = attendance.filter((a) => a.evento_id === evt.id && a.presente).length;
          return acc + registered + (evt.asistentes_anonimos ?? 0);
        }, 0);
        avg = Math.round((total / trackEvents.length) * 10) / 10;
      }

      // New this month: registered new members + anonymous visitors this month
      const thisMonthEvents = trackEvents.filter((e) => e.fecha.startsWith(currentMonthPrefix));
      const thisMonthEventIds = thisMonthEvents.map((e) => e.id);
      const registeredNewThisMonth = new Set(
        attendance
          .filter((a) => thisMonthEventIds.includes(a.evento_id) && a.es_nuevo && a.presente)
          .map((a) => a.persona_id)
      ).size;
      const anonNewThisMonth = thisMonthEvents.reduce((acc, e) => acc + (e.asistentes_anonimos ?? 0), 0);
      const newThisMonth = registeredNewThisMonth + anonNewThisMonth;

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
        return { id: evt.id, date: evt.fecha, count: presents + (evt.asistentes_anonimos ?? 0) };
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

  const datesA = useMemo(() =>
    [...new Set(events.filter(e => e.tipo_evento === compareA.tipo).map(e => e.fecha))]
      .sort((a, b) => b.localeCompare(a)),
  [events, compareA.tipo]);

  const datesB = useMemo(() =>
    [...new Set(events.filter(e => e.tipo_evento === compareB.tipo).map(e => e.fecha))]
      .sort((a, b) => b.localeCompare(a)),
  [events, compareB.tipo]);

  const statsA = useMemo(() => {
    const sorted = events.filter(e => e.tipo_evento === compareA.tipo).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const evt = compareA.fecha === '' ? sorted[0] : sorted.find(e => e.fecha === compareA.fecha);
    if (!evt) return null;
    const records = attendance.filter(a => a.evento_id === evt.id);
    const present = records.filter(r => r.presente).length;
    const anon    = evt.asistentes_anonimos ?? 0;
    return { fecha: evt.fecha, total: present + anon, nuevos: records.filter(r => r.es_nuevo && r.presente).length + anon };
  }, [events, attendance, compareA]);

  const statsB = useMemo(() => {
    const sorted = events.filter(e => e.tipo_evento === compareB.tipo).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const evt = compareB.fecha === '' ? sorted[0] : sorted.find(e => e.fecha === compareB.fecha);
    if (!evt) return null;
    const records = attendance.filter(a => a.evento_id === evt.id);
    const present = records.filter(r => r.presente).length;
    const anon    = evt.asistentes_anonimos ?? 0;
    return { fecha: evt.fecha, total: present + anon, nuevos: records.filter(r => r.es_nuevo && r.presente).length + anon };
  }, [events, attendance, compareB]);

  const fmtDate = (iso: string) => {
    const [, m, d] = iso.split('-');
    const mNames = es
      ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(d)} ${mNames[parseInt(m) - 1]}`;
  };

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>{t.comparisonTitle}</span>
          </h3>
          <button
            onClick={async () => {
              setRefreshing(true);
              try { await onRefresh(); } finally { setRefreshing(false); }
            }}
            disabled={refreshing}
            title={es ? 'Actualizar datos' : 'Refresh data'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {es ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
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
                acc + attendance.filter((a) => a.evento_id === evt.id && a.presente).length
                    + (evt.asistentes_anonimos ?? 0), 0);
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

      {/* ── Comparison Tool ─────────────────────────────────────────────── */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
          <span>{es ? 'Comparar Servicios' : 'Compare Services'}</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <CompareSelector side="A" value={compareA} onChange={setCompareA} dates={datesA} es={es} />
          <CompareSelector side="B" value={compareB} onChange={setCompareB} dates={datesB} es={es} />
        </div>

        {statsA && statsB ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-500 text-center">
              <div>{fmtDate(statsA.fecha)}</div>
              <div>{fmtDate(statsB.fecha)}</div>
            </div>
            <div className="space-y-2.5">
              <StatRow label={es ? 'Presentes' : 'Present'} valA={statsA.total}  valB={statsB.total}  />
              <StatRow label={es ? 'Nuevos'    : 'New'}     valA={statsA.nuevos} valB={statsB.nuevos} />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold text-center pt-1">
              {es ? 'Verde = mayor en esa categoría' : 'Green = higher in that category'}
            </p>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {es ? 'Sin datos para uno o ambos lados' : 'No data for one or both sides'}
          </div>
        )}
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
