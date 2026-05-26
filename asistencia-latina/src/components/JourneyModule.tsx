import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, TrendingUp, UserPlus } from 'lucide-react';
import { Asistencia, Evento, Language, Persona, Seguimiento } from '../types';

interface JourneyModuleProps {
  language: Language;
  people: Persona[];
  events: Evento[];
  attendance: Asistencia[];
  followUps: Seguimiento[];
  username: string;
  onAddFollowUp: (followUp: Seguimiento) => Promise<void>;
  onUpdateFollowUpStatus: (id: string, status: 'pendiente' | 'contactado' | 'cerrado') => Promise<void>;
  onOpenPeople: () => void;
}

const stages = [
  { id: 'nuevo', es: 'Nuevo visitante', en: 'New visitor' },
  { id: 'contactado', es: 'Contactado', en: 'Contacted' },
  { id: 'segunda', es: 'Segunda visita', en: 'Second visit' },
  { id: 'grupo', es: 'Conectado a grupo', en: 'Connected to group' },
  { id: 'regular', es: 'Asistencia regular', en: 'Regular attendance' },
  { id: 'sirviendo', es: 'Sirviendo', en: 'Serving' },
  { id: 'consolidado', es: 'Consolidado', en: 'Consolidated' },
] as const;

type StageId = typeof stages[number]['id'];

export default function JourneyModule({
  language,
  people,
  events,
  attendance,
  followUps,
  username,
  onAddFollowUp,
  onUpdateFollowUpStatus,
  onOpenPeople,
}: JourneyModuleProps) {
  const es = language === 'es';
  const [selectedPersonId, setSelectedPersonId] = useState(people[0]?.id ?? '');
  const [note, setNote] = useState('');

  const attendanceByPerson = useMemo(() => {
    const eventById = new Map(events.map((event) => [event.id, event]));
    return people.reduce<Record<string, { total: number; service: number; group: number; latest?: string }>>((acc, person) => {
      const records = attendance.filter((a) => a.persona_id === person.id && a.presente);
      const dated = records
        .map((record) => eventById.get(record.evento_id))
        .filter(Boolean) as Evento[];
      acc[person.id] = {
        total: dated.length,
        service: dated.filter((event) => event.tipo_evento.includes('servicio')).length,
        group: dated.filter((event) => event.tipo_evento.includes('grupo')).length,
        latest: dated.sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha,
      };
      return acc;
    }, {});
  }, [attendance, events, people]);

  const latestFollowUpByPerson = useMemo(() => {
    return people.reduce<Record<string, Seguimiento | undefined>>((acc, person) => {
      acc[person.id] = followUps
        .filter((f) => f.persona_id === person.id)
        .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))[0];
      return acc;
    }, {});
  }, [followUps, people]);

  const getStage = (person: Persona): StageId => {
    const metrics = attendanceByPerson[person.id] ?? { total: 0, service: 0, group: 0 };
    const latestFollowUp = latestFollowUpByPerson[person.id];
    if (person.es_voluntario) return metrics.total >= 8 ? 'consolidado' : 'sirviendo';
    if (metrics.service >= 6) return 'regular';
    if (metrics.group > 0) return 'grupo';
    if (metrics.total >= 2) return 'segunda';
    if (latestFollowUp?.estado === 'contactado' || latestFollowUp?.estado === 'cerrado') return 'contactado';
    return 'nuevo';
  };

  const journeyRows = useMemo(() => {
    return people.map((person) => {
      const metrics = attendanceByPerson[person.id] ?? { total: 0, service: 0, group: 0 };
      const latestFollowUp = latestFollowUpByPerson[person.id];
      const daysSinceCreated = Math.floor((Date.now() - new Date(person.fecha_creacion).getTime()) / 86_400_000);
      const stage = getStage(person);
      const priority =
        person.estado === 'nuevo' && !latestFollowUp ? 'alta' :
        metrics.total === 0 || (metrics.latest && Math.floor((Date.now() - new Date(metrics.latest).getTime()) / 86_400_000) > 21) ? 'media' :
        'normal';
      return { person, metrics, latestFollowUp, daysSinceCreated, stage, priority };
    }).sort((a, b) => {
      const rank = { alta: 0, media: 1, normal: 2 };
      return rank[a.priority] - rank[b.priority] || a.person.nombre_completo.localeCompare(b.person.nombre_completo);
    });
  }, [attendanceByPerson, latestFollowUpByPerson, people]);

  const selectedPerson = people.find((p) => p.id === selectedPersonId) ?? people[0];
  const selectedStage = selectedPerson ? getStage(selectedPerson) : 'nuevo';
  const selectedMetrics = selectedPerson ? attendanceByPerson[selectedPerson.id] : undefined;
  const selectedLogs = selectedPerson ? followUps.filter((f) => f.persona_id === selectedPerson.id).sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion)) : [];

  const counts = stages.map((stage) => ({
    ...stage,
    count: journeyRows.filter((row) => row.stage === stage.id).length,
  }));

  const pendingTasks = followUps.filter((f) => f.estado === 'pendiente');
  const atRisk = journeyRows.filter((row) => row.priority !== 'normal');

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPerson || !note.trim()) return;
    await onAddFollowUp({
      id: 'journey_' + Date.now(),
      persona_id: selectedPerson.id,
      motivo: es ? 'Follow-up Journey' : 'Journey follow-up',
      estado: 'pendiente',
      nota: note.trim(),
      fecha_creacion: new Date().toISOString().substring(0, 10),
      usuario_responsable: username,
    });
    setNote('');
  };

  return (
    <div className="font-sans space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span>{es ? 'Follow-up + Journey' : 'Follow-up + Journey'}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {es ? 'Acompañamiento desde primera visita hasta integración y servicio.' : 'Care from first visit through integration and service.'}
          </p>
        </div>
        <button onClick={onOpenPeople} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 justify-center">
          <UserPlus className="w-4 h-4" />
          <span>{es ? 'Ver directorio' : 'Open directory'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Tareas pendientes' : 'Pending tasks'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{pendingTasks.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Personas en riesgo' : 'People at risk'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{atRisk.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Potenciales líderes' : 'Potential leaders'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{journeyRows.filter((row) => row.stage === 'sirviendo' || row.stage === 'consolidado').length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="min-w-[720px] grid grid-cols-7 gap-2">
          {counts.map((stage, index) => (
            <div key={stage.id} className={`p-3 rounded-xl border ${stage.id === selectedStage ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{index + 1}</span>
              <p className="text-xs font-extrabold text-slate-800 mt-1">{es ? stage.es : stage.en}</p>
              <p className="text-lg font-black text-indigo-700 mt-2">{stage.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-900">{es ? 'Prioridad inteligente' : 'Smart priority'}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {journeyRows.slice(0, 12).map((row) => {
              const stage = stages.find((item) => item.id === row.stage);
              return (
                <button key={row.person.id} onClick={() => setSelectedPersonId(row.person.id)} className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${selectedPersonId === row.person.id ? 'bg-indigo-50/70' : 'bg-white'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">{row.person.nombre_completo}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${row.priority === 'alta' ? 'bg-red-50 text-red-700 border-red-200' : row.priority === 'media' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{row.priority}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{stage ? (es ? stage.es : stage.en) : row.stage} · {row.metrics.total} {es ? 'asistencias' : 'attendances'}</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{row.latestFollowUp ? row.latestFollowUp.estado : (es ? 'sin contacto' : 'no contact')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {selectedPerson ? (
            <>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Perfil seleccionado' : 'Selected profile'}</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedPerson.nombre_completo}</h3>
                <p className="text-xs font-semibold text-slate-500">{selectedMetrics?.total ?? 0} {es ? 'asistencias registradas' : 'recorded attendances'}</p>
              </div>
              <form onSubmit={handleAddTask} className="space-y-3">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={es ? 'Nueva tarea pastoral o nota de contacto' : 'New care task or contact note'} className="w-full min-h-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold resize-none" />
                <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>{es ? 'Crear tarea' : 'Create task'}</span>
                </button>
              </form>
              <div className="space-y-2">
                {selectedLogs.length === 0 ? (
                  <div className="p-5 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl border border-slate-100">{es ? 'Sin seguimientos aún.' : 'No follow-ups yet.'}</div>
                ) : selectedLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{log.motivo}</p>
                        {log.nota && <p className="text-xs font-semibold text-slate-500 mt-1">{log.nota}</p>}
                      </div>
                      {log.estado !== 'cerrado' && (
                        <button onClick={() => onUpdateFollowUpStatus(log.id, 'cerrado')} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title={es ? 'Cerrar' : 'Close'}>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-slate-400">{es ? 'No hay personas registradas.' : 'No people registered.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
