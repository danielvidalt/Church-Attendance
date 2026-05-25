import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, CheckCircle2, ChevronDown, ChevronRight, Clock, Heart, Plus, Search, Trash2, UserRoundCheck, X, XCircle } from 'lucide-react';
import { EventTrack, EventType, Language, Persona, VolunteerArea, VolunteerAssignment } from '../types';

interface VolunteersModuleProps {
  language: Language;
  people: Persona[];
  volunteerAreas: VolunteerArea[];
  assignments: VolunteerAssignment[];
  registeredTracks: EventTrack[];
  username: string;
  onAddAssignment: (assignment: VolunteerAssignment) => Promise<void>;
  onUpdateAssignment: (id: string, updates: Partial<VolunteerAssignment>) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onOpenPeople: () => void;
}

const statusStyles: Record<VolunteerAssignment['estado'], string> = {
  programado: 'bg-slate-100 text-slate-700 border-slate-200',
  pendiente: 'bg-amber-50 text-amber-900 border-amber-200',
  confirmado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
  necesita_reemplazo: 'bg-amber-50 text-amber-900 border-amber-200',
  completado: 'bg-indigo-50 text-indigo-800 border-indigo-200',
};

const statusLabels: Record<VolunteerAssignment['estado'], { es: string; en: string }> = {
  programado: { es: 'Programado', en: 'Scheduled' },
  pendiente: { es: 'Pendiente', en: 'Pending' },
  confirmado: { es: 'Confirmado', en: 'Confirmed' },
  rechazado: { es: 'Rechazado', en: 'Rejected' },
  necesita_reemplazo: { es: 'Cambiar persona', en: 'Replace person' },
  completado: { es: 'Completado', en: 'Completed' },
};

export default function VolunteersModule({
  language,
  people,
  volunteerAreas,
  assignments,
  registeredTracks,
  username,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onOpenPeople,
}: VolunteersModuleProps) {
  const es = language === 'es';
  const volunteers = useMemo(() => people.filter((p) => p.es_voluntario), [people]);
  const activeTracks = useMemo(() => registeredTracks.filter((track) => track.active), [registeredTracks]);
  const [serviceType, setServiceType] = useState<EventType>(activeTracks[0]?.id ?? '');
  const [personaId, setPersonaId] = useState(volunteers[0]?.id ?? '');
  const [areaId, setAreaId] = useState(volunteerAreas[0]?.id ?? '');
  const [fecha, setFecha] = useState(new Date().toISOString().substring(0, 10));
  const [horario, setHorario] = useState('11:00');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedServices, setCollapsedServices] = useState<Record<string, boolean>>({});
  const [selectedBurnoutPersonId, setSelectedBurnoutPersonId] = useState<string | null>(null);
  const [replacementAssignmentId, setReplacementAssignmentId] = useState<string | null>(null);
  const [replacementSearch, setReplacementSearch] = useState('');
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    if (!personaId && volunteers.length > 0) setPersonaId(volunteers[0].id);
  }, [personaId, volunteers]);

  useEffect(() => {
    if (!areaId && volunteerAreas.length > 0) setAreaId(volunteerAreas[0].id);
  }, [areaId, volunteerAreas]);

  useEffect(() => {
    if (!serviceType && activeTracks.length > 0) setServiceType(activeTracks[0].id);
  }, [serviceType, activeTracks]);

  const selectedTrack = useMemo(() => activeTracks.find((track) => track.id === serviceType), [activeTracks, serviceType]);
  const serviceAreaContext: NonNullable<VolunteerArea['contexto']> = selectedTrack?.type === 'grupo' ? 'latina_conexion' : 'latina_domingo';
  const filteredVolunteerAreas = useMemo(
    () => volunteerAreas.filter((area) => (area.contexto ?? 'iglesia') === serviceAreaContext),
    [volunteerAreas, serviceAreaContext]
  );

  useEffect(() => {
    if (filteredVolunteerAreas.length === 0) {
      if (areaId) setAreaId('');
      return;
    }
    if (!areaId || !filteredVolunteerAreas.some((area) => area.id === areaId)) {
      setAreaId(filteredVolunteerAreas[0].id);
    }
  }, [areaId, filteredVolunteerAreas]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return [...assignments].filter((a) => a.fecha >= today).sort((a, b) => `${a.fecha}${a.horario ?? ''}`.localeCompare(`${b.fecha}${b.horario ?? ''}`));
  }, [assignments]);

  const coverage = useMemo(() => {
    return volunteerAreas.map((area) => {
      const trained = volunteers.filter((p) => p.areas_voluntario?.some((a) => a.areaId === area.id)).length;
      const scheduled = upcoming.filter((a) => a.area_id === area.id && a.estado !== 'completado').length;
      return { area, trained, scheduled };
    });
  }, [upcoming, volunteerAreas, volunteers]);

  const heavyLoad = useMemo(() => {
    return volunteers
      .map((person) => ({ person, count: upcoming.filter((a) => a.persona_id === person.id && a.estado !== 'completado').length }))
      .filter((item) => item.count >= 3)
      .sort((a, b) => b.count - a.count);
  }, [upcoming, volunteers]);

  const personById = (id: string) => people.find((p) => p.id === id);
  const areaById = (id: string) => volunteerAreas.find((a) => a.id === id);
  const trackById = (id?: EventType) => activeTracks.find((track) => track.id === id);
  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return isoDate;
    return `${day} / ${month} / ${year}`;
  };
  const getCreatedAt = (assignment: VolunteerAssignment) => {
    if (assignment.created_at) return new Date(assignment.created_at);
    const idTime = Number(assignment.id.replace('va_', ''));
    return Number.isFinite(idTime) ? new Date(idTime) : new Date(`${assignment.fecha}T00:00:00`);
  };
  const getDisplayStatus = (assignment: VolunteerAssignment): VolunteerAssignment['estado'] => {
    if (assignment.estado !== 'programado') return assignment.estado;
    const ageMs = Date.now() - getCreatedAt(assignment).getTime();
    return ageMs >= 2 * 24 * 60 * 60 * 1000 ? 'pendiente' : 'programado';
  };

  const pendingResponseAssignments = useMemo(
    () => upcoming.filter((assignment) => getDisplayStatus(assignment) === 'pendiente'),
    [upcoming]
  );

  const selectedServiceAssignments = useMemo(() => {
    return upcoming.filter((assignment) =>
      assignment.servicio_tipo === serviceType &&
      assignment.fecha === fecha &&
      (assignment.horario ?? '') === (horario ?? '') &&
      assignment.estado !== 'rechazado' &&
      assignment.estado !== 'completado'
    );
  }, [upcoming, serviceType, fecha, horario]);

  const selectedServiceAreaCoverage = useMemo(() => {
    return filteredVolunteerAreas.map((area) => {
      const assignment = selectedServiceAssignments.find((item) => item.area_id === area.id);
      return {
        area,
        assignment,
        person: assignment ? personById(assignment.persona_id) : undefined,
      };
    });
  }, [filteredVolunteerAreas, selectedServiceAssignments, people]);

  const missingSelectedServiceAreas = selectedServiceAreaCoverage.filter((item) => !item.assignment).length;

  const groupedUpcoming = useMemo(() => {
    const groups = new Map<string, { key: string; title: string; items: VolunteerAssignment[] }>();
    upcoming.forEach((assignment) => {
      const track = trackById(assignment.servicio_tipo);
      const title = track
        ? (es ? `${track.titleEs} · ${track.labelEs}` : `${track.titleEn} · ${track.labelEn}`)
        : (es ? 'Servicio sin clasificar' : 'Unclassified service');
      const key = assignment.servicio_tipo ?? 'sin_servicio';
      const current = groups.get(key) ?? { key, title, items: [] };
      current.items.push(assignment);
      groups.set(key, current);
    });
    return [...groups.values()]
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => {
          const areaA = areaById(a.area_id)?.nombre_es ?? a.area_id;
          const areaB = areaById(b.area_id)?.nombre_es ?? b.area_id;
          return `${a.fecha}${a.horario ?? ''}${areaA}`.localeCompare(`${b.fecha}${b.horario ?? ''}${areaB}`);
        }),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [upcoming, activeTracks, es, volunteerAreas]);

  const toggleServiceGroup = (key: string) => {
    setCollapsedServices((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedBurnoutPerson = selectedBurnoutPersonId ? personById(selectedBurnoutPersonId) : undefined;
  const selectedBurnoutAssignments = selectedBurnoutPersonId
    ? upcoming
      .filter((assignment) => assignment.persona_id === selectedBurnoutPersonId && assignment.estado !== 'completado')
      .sort((a, b) => `${a.fecha}${a.horario ?? ''}`.localeCompare(`${b.fecha}${b.horario ?? ''}`))
    : [];
  const selectedBurnoutAreas = new Set(selectedBurnoutAssignments.map((assignment) => assignment.area_id)).size;
  const selectedBurnoutServices = new Set(selectedBurnoutAssignments.map((assignment) => assignment.servicio_tipo ?? 'sin_servicio')).size;
  const replacementAssignment = replacementAssignmentId ? upcoming.find((assignment) => assignment.id === replacementAssignmentId) : undefined;
  const replacementCurrentPerson = replacementAssignment ? personById(replacementAssignment.persona_id) : undefined;
  const replacementArea = replacementAssignment ? areaById(replacementAssignment.area_id) : undefined;
  const replacementTrack = replacementAssignment ? trackById(replacementAssignment.servicio_tipo) : undefined;
  const availableReplacementVolunteers = useMemo(() => {
    if (!replacementAssignment) return [];
    const q = replacementSearch.trim().toLowerCase();
    const busyIds = new Set(
      upcoming
        .filter((assignment) =>
          assignment.id !== replacementAssignment.id &&
          assignment.fecha === replacementAssignment.fecha &&
          (assignment.horario ?? '') === (replacementAssignment.horario ?? '') &&
          (assignment.servicio_tipo ?? '') === (replacementAssignment.servicio_tipo ?? '') &&
          assignment.estado !== 'rechazado' &&
          assignment.estado !== 'completado'
        )
        .map((assignment) => assignment.persona_id)
    );

    return volunteers
      .filter((person) => person.id !== replacementAssignment.persona_id)
      .filter((person) => !busyIds.has(person.id))
      .filter((person) => !q || person.nombre_completo.toLowerCase().includes(q))
      .map((person) => ({
        person,
        trainedForArea: person.areas_voluntario?.some((area) => area.areaId === replacementAssignment.area_id) ?? false,
        upcomingCount: upcoming.filter((assignment) => assignment.persona_id === person.id && assignment.estado !== 'completado').length,
      }))
      .sort((a, b) => {
        if (a.trainedForArea !== b.trainedForArea) return a.trainedForArea ? -1 : 1;
        return a.upcomingCount - b.upcomingCount || a.person.nombre_completo.localeCompare(b.person.nombre_completo);
      });
  }, [replacementAssignment, replacementSearch, upcoming, volunteers]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!serviceType || !personaId || !areaId || !fecha) {
      setMessage({
        type: 'error',
        text: es ? 'Selecciona servicio, fecha, área y voluntario antes de guardar.' : 'Select service, date, area and volunteer before saving.',
      });
      return;
    }

    setSaving(true);
    try {
      await onAddAssignment({
        id: 'va_' + Date.now(),
        persona_id: personaId,
        area_id: areaId,
        servicio_tipo: serviceType,
        fecha,
        horario,
        estado: 'programado',
        notas: notas.trim() || undefined,
        lider_responsable: username,
      });
      setNotas('');
      setMessage({ type: 'success', text: es ? 'Programación guardada.' : 'Assignment saved.' });
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message)
            : JSON.stringify(err);
      setMessage({
        type: 'error',
        text: text.includes("volunteer_assignments")
          ? (es
            ? 'Falta crear la tabla volunteer_assignments en Supabase. Ejecuta el SQL del módulo de voluntarios y vuelve a intentar.'
            : 'The volunteer_assignments table is missing in Supabase. Run the volunteers module SQL and try again.')
          : text.includes("servicio_tipo")
            ? (es
              ? 'Falta agregar la columna servicio_tipo a volunteer_assignments en Supabase. Ejecuta la migración SQL y vuelve a intentar.'
              : 'The servicio_tipo column is missing in volunteer_assignments. Run the SQL migration and try again.')
          : text,
      });
    } finally {
      setSaving(false);
    }
  };

  const openReplacementModal = (assignment: VolunteerAssignment) => {
    setReplacementAssignmentId(assignment.id);
    setReplacementSearch('');
  };

  const handleSelectReplacement = async (personId: string) => {
    if (!replacementAssignment) return;
    setReplacing(true);
    try {
      await onUpdateAssignment(replacementAssignment.id, {
        persona_id: personId,
        estado: 'programado',
      });
      setReplacementAssignmentId(null);
      setReplacementSearch('');
      setMessage({ type: 'success', text: es ? 'Reemplazo actualizado.' : 'Replacement updated.' });
    } catch (err) {
      const text = err instanceof Error ? err.message : JSON.stringify(err);
      setMessage({ type: 'error', text });
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span>{es ? 'Voluntarios' : 'Volunteers'}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {es ? 'Servicio, cobertura, reemplazos y carga pastoral del equipo.' : 'Serving schedule, coverage, replacements and team load.'}
          </p>
        </div>
        <button onClick={onOpenPeople} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 justify-center">
          <UserRoundCheck className="w-4 h-4" />
          <span>{es ? 'Editar perfiles' : 'Edit profiles'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Voluntarios activos' : 'Active volunteers'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{volunteers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Servicios próximos' : 'Upcoming assignments'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{upcoming.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{es ? 'Posible sobrecarga' : 'Possible overload'}</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{heavyLoad.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>{es ? 'Programar servicio' : 'Schedule service'}</span>
          </h3>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              {es ? 'Servicio / grupo / evento' : 'Service / group / event'}
            </label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white">
              <option value="">{es ? 'Selecciona un registro' : 'Select a registered option'}</option>
              {activeTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {es ? `${track.titleEs} · ${track.labelEs}` : `${track.titleEn} · ${track.labelEn}`}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                {es ? 'Fecha' : 'Date'}
              </label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                {es ? 'Hora de inicio del voluntario' : 'Volunteer start time'}
              </label>
              <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              {es ? 'Área o delegación a cubrir' : 'Area or delegation to cover'}
            </label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white">
              <option value="">{es ? 'Selecciona área' : 'Select area'}</option>
              {filteredVolunteerAreas.map((area) => <option key={area.id} value={area.id}>{es ? area.nombre_es : area.nombre_en}</option>)}
            </select>
            {filteredVolunteerAreas.length === 0 && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
                {es
                  ? 'No hay áreas configuradas para este tipo de servicio en Comunidad Latina.'
                  : 'There are no Latina Community areas configured for this service type.'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              {es ? 'Voluntario registrado' : 'Registered volunteer'}
            </label>
            <select value={personaId} onChange={(e) => setPersonaId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white">
              <option value="">{es ? 'Selecciona voluntario' : 'Select volunteer'}</option>
              {volunteers.map((person) => <option key={person.id} value={person.id}>{person.nombre_completo}</option>)}
            </select>
          </div>
          {filteredVolunteerAreas.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {es ? 'Áreas por cubrir' : 'Areas to cover'}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {selectedTrack
                      ? (es ? `${selectedTrack.titleEs} · ${formatDate(fecha)} · ${horario}` : `${selectedTrack.titleEn} · ${formatDate(fecha)} · ${horario}`)
                      : `${formatDate(fecha)} · ${horario}`}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${missingSelectedServiceAreas === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                  {missingSelectedServiceAreas === 0
                    ? (es ? 'Completo' : 'Complete')
                    : `${missingSelectedServiceAreas} ${es ? 'faltan' : 'missing'}`}
                </span>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {selectedServiceAreaCoverage.map(({ area, assignment, person }) => {
                  const covered = Boolean(assignment);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setAreaId(area.id)}
                      className={`w-full flex items-center justify-between gap-3 p-2 rounded-xl border text-left transition-colors ${
                        areaId === area.id
                          ? 'border-indigo-200 bg-indigo-50'
                          : covered
                            ? 'border-emerald-200 bg-white hover:bg-emerald-50'
                            : 'border-amber-200 bg-white hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${covered ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-amber-300'}`}>
                          {covered && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{es ? area.nombre_es : area.nombre_en}</p>
                          <p className={`text-[10px] font-bold truncate ${covered ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {covered
                              ? `${es ? 'Asignado a' : 'Assigned to'} ${person?.nombre_completo ?? assignment?.persona_id}`
                              : (es ? 'Falta voluntario por asignar' : 'Needs a volunteer')}
                          </p>
                        </div>
                      </div>
                      {!covered && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                          {es ? 'Sin voluntario' : 'No volunteer'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder={es ? 'Notas de disponibilidad o instrucciones' : 'Availability notes or instructions'} className="w-full min-h-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold resize-none" />
          {message && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}
          <button disabled={saving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm">
            {saving ? (es ? 'Guardando...' : 'Saving...') : (es ? 'Guardar programación' : 'Save assignment')}
          </button>
        </form>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">{es ? 'Calendario de servicio' : 'Service calendar'}</h3>
          </div>
          {pendingResponseAssignments.length > 0 && (
            <div className="m-4 mb-0 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">
                  {es ? 'Respuesta pendiente' : 'Pending response'}
                </p>
                <p className="text-xs font-semibold mt-1">
                  {es
                    ? `${pendingResponseAssignments.length} programación(es) llevan más de 2 días sin respuesta. Pregunta de nuevo o cambia de persona.`
                    : `${pendingResponseAssignments.length} assignment(s) have had no response for more than 2 days. Ask again or replace the person.`}
                </p>
              </div>
            </div>
          )}
          {upcoming.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-400">{es ? 'Aún no hay servicios programados.' : 'No assignments scheduled yet.'}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupedUpcoming.map((group) => (
                <section key={group.key} className="p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => toggleServiceGroup(group.key)}
                    className="w-full flex items-center justify-between gap-3 text-left rounded-xl hover:bg-slate-50 transition-colors p-2 -m-2"
                  >
                    <div className="flex items-center gap-2">
                      {collapsedServices[group.key] ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
                      <h4 className="text-sm font-black text-slate-950">{group.title}</h4>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                      {group.items.length} {es ? 'voluntario(s)' : 'volunteer(s)'}
                    </span>
                  </button>
                  {!collapsedServices[group.key] && <div className="space-y-2">
                    {group.items.map((assignment) => {
                      const person = personById(assignment.persona_id);
                      const area = areaById(assignment.area_id);
                      const displayStatus = getDisplayStatus(assignment);
                return (
                  <div key={assignment.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">{person?.nombre_completo ?? assignment.persona_id}</span>
                        <span className="text-sm font-bold text-slate-600">· {area ? (es ? area.nombre_es : area.nombre_en) : assignment.area_id}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${statusStyles[displayStatus]}`}>
                          {es ? statusLabels[displayStatus].es : statusLabels[displayStatus].en}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{formatDate(assignment.fecha)}{assignment.horario ? ` · ${assignment.horario}` : ''}</span>
                      </p>
                      {displayStatus === 'pendiente' && (
                        <p className="text-xs font-semibold text-amber-800 mt-1">
                          {es ? 'Sin respuesta por más de 2 días.' : 'No response for more than 2 days.'}
                        </p>
                      )}
                      {assignment.notas && <p className="text-xs text-slate-500 mt-2 bg-slate-50 border border-slate-100 rounded-xl p-2">{assignment.notas}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateAssignment(assignment.id, { estado: 'confirmado' })} className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title={es ? 'Confirmar' : 'Confirm'}>
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onUpdateAssignment(assignment.id, { estado: 'rechazado' })} className="p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100" title={es ? 'Rechazar' : 'Reject'}>
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => openReplacementModal(assignment)} className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold">
                        {es ? 'Reemplazo' : 'Replace'}
                      </button>
                      <button onClick={() => onDeleteAssignment(assignment.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title={es ? 'Eliminar' : 'Delete'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
                    })}
                  </div>}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">{es ? 'Cobertura por área' : 'Coverage by area'}</h3>
          <div className="space-y-3">
            {coverage.map(({ area, trained, scheduled }) => (
              <div key={area.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{es ? area.nombre_es : area.nombre_en}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{trained} {es ? 'personas preparadas' : 'trained people'}</p>
                </div>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">{scheduled} {es ? 'programados' : 'scheduled'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">{es ? 'Detección de burnout' : 'Burnout watch'}</h3>
          {heavyLoad.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              {es ? 'La carga se ve saludable por ahora.' : 'The current load looks healthy.'}
            </div>
          ) : (
            <div className="space-y-3">
              {heavyLoad.map(({ person, count }) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedBurnoutPersonId(person.id)}
                  className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold text-amber-950">{person.nombre_completo}</span>
                  <span className="text-xs font-black text-amber-900">{count} {es ? 'turnos próximos' : 'upcoming slots'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBurnoutPerson && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  {es ? 'Detalle de burnout' : 'Burnout detail'}
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-1">{selectedBurnoutPerson.nombre_completo}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {es
                    ? 'Aparece aquí porque tiene 3 o más turnos próximos sin completar.'
                    : 'They appear here because they have 3 or more upcoming incomplete assignments.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBurnoutPersonId(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                title={es ? 'Cerrar' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">{es ? 'Turnos próximos' : 'Upcoming slots'}</span>
                  <p className="text-2xl font-black text-amber-950 mt-1">{selectedBurnoutAssignments.length}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{es ? 'Áreas distintas' : 'Different areas'}</span>
                  <p className="text-2xl font-black text-slate-950 mt-1">{selectedBurnoutAreas}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{es ? 'Servicios/grupos' : 'Services/groups'}</span>
                  <p className="text-2xl font-black text-slate-950 mt-1">{selectedBurnoutServices}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    {es ? 'Turnos que generan la alerta' : 'Assignments behind the alert'}
                  </h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedBurnoutAssignments.map((assignment) => {
                    const track = trackById(assignment.servicio_tipo);
                    const area = areaById(assignment.area_id);
                    const displayStatus = getDisplayStatus(assignment);
                    return (
                      <div key={assignment.id} className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-950">
                            {track
                              ? (es ? `${track.titleEs} · ${track.labelEs}` : `${track.titleEn} · ${track.labelEn}`)
                              : (es ? 'Servicio sin clasificar' : 'Unclassified service')}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${statusStyles[displayStatus]}`}>
                            {es ? statusLabels[displayStatus].es : statusLabels[displayStatus].en}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{formatDate(assignment.fecha)}{assignment.horario ? ` · ${assignment.horario}` : ''}</span>
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-2">
                          {es ? 'Área a cubrir: ' : 'Area to cover: '}
                          <span className="text-slate-950">{area ? (es ? area.nombre_es : area.nombre_en) : assignment.area_id}</span>
                        </p>
                        {assignment.notas && (
                          <p className="text-xs font-semibold text-slate-500 mt-2 bg-slate-50 border border-slate-100 rounded-xl p-2">
                            {assignment.notas}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {replacementAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  {es ? 'Seleccionar reemplazo' : 'Select replacement'}
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-1">
                  {replacementTrack
                    ? (es ? `${replacementTrack.titleEs} · ${replacementTrack.labelEs}` : `${replacementTrack.titleEn} · ${replacementTrack.labelEn}`)
                    : (es ? 'Servicio sin clasificar' : 'Unclassified service')}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {formatDate(replacementAssignment.fecha)}{replacementAssignment.horario ? ` · ${replacementAssignment.horario}` : ''} · {replacementArea ? (es ? replacementArea.nombre_es : replacementArea.nombre_en) : replacementAssignment.area_id}
                </p>
                {replacementCurrentPerson && (
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {es ? 'Reemplazando a: ' : 'Replacing: '}
                    <span className="font-black text-slate-800">{replacementCurrentPerson.nombre_completo}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setReplacementAssignmentId(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                title={es ? 'Cerrar' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={replacementSearch}
                  onChange={(event) => setReplacementSearch(event.target.value)}
                  placeholder={es ? 'Buscar voluntario disponible...' : 'Search available volunteer...'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {availableReplacementVolunteers.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center text-sm font-semibold text-slate-400">
                  {es ? 'No hay voluntarios disponibles para ese mismo servicio y horario.' : 'No volunteers are available for that same service and time.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {availableReplacementVolunteers.map(({ person, trainedForArea, upcomingCount }) => (
                    <button
                      key={person.id}
                      type="button"
                      disabled={replacing}
                      onClick={() => handleSelectReplacement(person.id)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-60 text-left flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-950">{person.nombre_completo}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${trainedForArea ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {trainedForArea ? (es ? 'Preparado para el área' : 'Trained for area') : (es ? 'Disponible' : 'Available')}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            {upcomingCount} {es ? 'turnos próximos' : 'upcoming slots'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-indigo-700">
                        {replacing ? (es ? 'Actualizando...' : 'Updating...') : (es ? 'Seleccionar' : 'Select')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
