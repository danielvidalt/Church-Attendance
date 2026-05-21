import { useMemo } from 'react';
import { Language, esTranslations, enTranslations, Persona, Evento, Asistencia, EventType } from '../types';
import { getMetrics, calculateAlerts, AbsenceAlert } from '../utils/attendance';
import { TrendingUp, Users, HeartHandshake, UserPlus, AlertTriangle, CalendarRange } from 'lucide-react';
import { DEFAULT_CONFIG } from '../data/mockPeople';

interface StatsDashboardProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  onNavigateToAlerts?: () => void;
}

export default function StatsDashboard({
  language,
  people,
  events,
  attendance,
  onNavigateToAlerts
}: StatsDashboardProps) {
  const t = language === 'es' ? esTranslations : enTranslations;

  const metrics = useMemo(() => {
    return getMetrics(people, events, attendance);
  }, [people, events, attendance]);

  const topAlerts = useMemo(() => {
    return calculateAlerts(people, events, attendance, DEFAULT_CONFIG).slice(0, 3);
  }, [people, events, attendance]);

  // Compute attendance timeline for Line Chart
  // We'll map each event to its total present count
  const chronicleEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((evt) => {
        const presents = attendance.filter((a) => a.evento_id === evt.id && a.presente).length;
        return {
          id: evt.id,
          name: evt.nombre_evento.split('-')[0].trim(), // shorten name
          date: evt.fecha,
          type: evt.tipo_evento,
          count: presents
        };
      });
  }, [events, attendance]);

  // Compute average attendance per category for Bar Chart comparison
  const categoryStats = useMemo(() => {
    const categories: { id: EventType; nameEs: string; nameEn: string; color: string }[] = [
      { id: 'servicio_11', nameEs: 'Domingo 11 AM', nameEn: 'Sunday 11 AM', color: 'bg-indigo-600' },
      { id: 'servicio_6', nameEs: 'Domingo 6 PM', nameEn: 'Sunday 6 PM', color: 'bg-violet-500' },
      { id: 'grupo_conexion', nameEs: 'Conexión', nameEn: 'Connection', color: 'bg-emerald-500' },
      { id: 'grupo_hombres', nameEs: 'Hombres', nameEn: 'Men', color: 'bg-blue-500' },
      { id: 'grupo_mujeres', nameEs: 'Mujeres', nameEn: 'Women', color: 'bg-rose-500' }
    ];

    return categories.map((cat) => {
      const catEvts = events.filter((e) => e.tipo_evento === cat.id);
      let avg = 0;
      if (catEvts.length > 0) {
        const total = catEvts.reduce((acc, current) => {
          const presents = attendance.filter((a) => a.evento_id === current.id && a.presente).length;
          return acc + presents;
        }, 0);
        avg = Math.round((total / catEvts.length) * 10) / 10;
      }
      return {
        ...cat,
        avg
      };
    });
  }, [events, attendance]);

  // Custom SVG line chart calculations
  const lineChartSvg = useMemo(() => {
    if (chronicleEvents.length < 2) return null;

    const width = 600;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;

    const maxCount = Math.max(...chronicleEvents.map((e) => e.count), 15);
    const minCount = 0;

    const countRange = maxCount - minCount;

    // Map each point to X, Y coordinates
    const points = chronicleEvents.map((e, index) => {
      const x = paddingLeft + (index / (chronicleEvents.length - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingBottom - ((e.count - minCount) / countRange) * (height - paddingTop - paddingBottom);
      return { x, y, ...e };
    });

    // Create svg path d attribute (bezier curves)
    let pathD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) {
        pathD += `M ${pt.x} ${pt.y}`;
      } else {
        // Curve control points
        const prev = points[idx - 1];
        const cpX1 = prev.x + (pt.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (pt.x - prev.x) / 2;
        const cpY2 = pt.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
      }
    });

    const areaPathD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return { points, pathD, areaPathD, width, height, maxCount, paddingLeft, paddingBottom };
  }, [chronicleEvents]);

  return (
    <div className="font-sans space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5.5 h-5.5 text-indigo-600" />
          <span>{t.statsTitle}</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {language === 'es' ? 'Indicadores clave de la salud y retención de la congregación' : 'Key indexes regarding spiritual family healthy engagement and growth rate'}
        </p>
      </div>

      {/* Numerical Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Registered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-indigo-50 text-indigo-650 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.totalPeopleInDb}</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">{metrics.totalInDb}</span>
          </div>
        </div>

        {/* Avg Sunday Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.averageAttendance}</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">{metrics.avgSundayAttendance}</span>
          </div>
        </div>

        {/* Retention \% */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.retentionRate}</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">{metrics.retentionPercent}%</span>
          </div>
        </div>

        {/* New this month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.newMembersThisMonth}</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">+{metrics.newThisMonth}</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-930 text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>{t.totalAttendanceOverTime}</span>
          </h3>

          {lineChartSvg ? (
            <div className="w-full overflow-x-auto select-none pt-2">
              <svg
                viewBox={`0 0 ${lineChartSvg.width} ${lineChartSvg.height}`}
                className="w-full h-auto min-w-[500px]"
              >
                {/* Defs for elegant gradient fill */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Y-Axis lines */}
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = lineChartSvg.height - lineChartSvg.paddingBottom - ratio * (lineChartSvg.height - 40);
                  const val = Math.round(ratio * lineChartSvg.maxCount);
                  return (
                    <g key={idx}>
                      <line
                        x1={lineChartSvg.paddingLeft}
                        y1={y}
                        x2={lineChartSvg.width - 15}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={lineChartSvg.paddingLeft - 8}
                        y={y + 4}
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Fill Area */}
                <path d={lineChartSvg.areaPathD} fill="url(#chartGradient)" />

                {/* Path Stroke */}
                <path
                  d={lineChartSvg.pathD}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Points Hover Circles */}
                {lineChartSvg.points.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Tiny tooltip text value */}
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="extrabold"
                      textAnchor="middle"
                      className="opacity-80 group-hover:opacity-100"
                    >
                      {pt.count}
                    </text>
                    {/* X-axis labels */}
                    <text
                      x={pt.x}
                      y={lineChartSvg.height - 5}
                      fill="#64748b"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(-15, ${pt.x}, ${lineChartSvg.height - 5})`}
                    >
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
          <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>{t.comparisonTitle}</span>
          </h3>

          <div className="space-y-3.5 pt-2 font-medium">
            {categoryStats.map((item) => {
              // Map max width to 100% based on max possible attendance (30 people)
              const percent = Math.min((item.avg / 30) * 100, 100);
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">
                      {language === 'es' ? item.nameEs : item.nameEn}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.avg} {language === 'es' ? 'asistentes' : 'attendees'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Priority Alerts Callout Box */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm font-medium">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{language === 'es' ? 'Alertas de Seguimiento Críticas' : 'Critical Pastoral Warnings'}</span>
          </h3>
          {onNavigateToAlerts && (
            <button
              onClick={onNavigateToAlerts}
              className="text-xs font-bold text-blue-900 hover:text-blue-950 hover:underline cursor-pointer"
            >
              {language === 'es' ? 'Ver todas las alertas →' : 'View all alerts →'}
            </button>
          )}
        </div>

        {topAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {t.noAlerts}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topAlerts.map((alert, idx) => {
              // Set appropriate style badge
              let badgeStyle = 'bg-amber-50 text-amber-900 border-amber-200';
              if (alert.semanasFaltadas >= 4) {
                badgeStyle = 'bg-red-50 text-red-900 border-red-200';
              }
              return (
                <div
                  key={`${alert.personaId}_${alert.tipo}_${idx}`}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${badgeStyle}`}
                >
                  <p className="font-bold">
                    ⚠️ {language === 'es' ? alert.mensajeEs : alert.mensajeEn}
                  </p>
                  <span className="px-2 py-0.5 bg-white/80 border border-inherit rounded-md text-[10px] uppercase font-black tracking-widest leading-none shrink-0">
                    {alert.semanasFaltadas} {language === 'es' ? 'FALTAS' : 'MISSES'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
