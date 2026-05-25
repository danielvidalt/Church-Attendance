import { supabase } from './supabase';
import type { Persona, Evento, Asistencia, Seguimiento, Configuracion, EventTrack, VolunteerArea, VolunteerAssignment, PrayerRequest } from '../types';

// ── Personas ──────────────────────────────────────────────────────────────────

export async function getPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase.from('personas').select('*').order('nombre_completo');
  if (error) throw error;
  return data as Persona[];
}

export async function addPersona(p: Persona): Promise<void> {
  const { error } = await supabase.from('personas').insert(p);
  if (error) throw error;
}

export async function deletePersona(id: string): Promise<void> {
  const { error } = await supabase.from('personas').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePersona(id: string, updates: Partial<Persona>): Promise<void> {
  const { error } = await supabase.from('personas').update(updates).eq('id', id);
  if (error) {
    // If the error is about a missing column (e.g. nacionalidad not yet added),
    // retry without that field so other changes are not lost.
    if (error.message?.includes('column') || error.code === '42703') {
      const { nacionalidad: _n, es_voluntario: _ev, areas_voluntario: _av, ...rest } = updates as Partial<Persona> & { nacionalidad?: string };
      const { error: retryError } = await supabase.from('personas').update(rest).eq('id', id);
      if (retryError) throw retryError;
      return;
    }
    throw error;
  }
}

// ── Eventos ───────────────────────────────────────────────────────────────────

export async function getEventos(): Promise<Evento[]> {
  const { data, error } = await supabase.from('eventos').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return data as Evento[];
}

export async function upsertEvento(e: Evento): Promise<void> {
  const { error } = await supabase.from('eventos').upsert(e, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteEvento(id: string): Promise<void> {
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  if (error) throw error;
}

// ── Asistencias ───────────────────────────────────────────────────────────────

export async function getAsistencias(): Promise<Asistencia[]> {
  const { data, error } = await supabase.from('asistencias').select('*');
  if (error) throw error;
  return data as Asistencia[];
}

export async function deleteAsistenciasByEvento(eventoId: string): Promise<void> {
  const { error } = await supabase.from('asistencias').delete().eq('evento_id', eventoId);
  if (error) throw error;
}

export async function resetAttendanceData(): Promise<void> {
  const { error: attError } = await supabase.from('asistencias').delete().neq('id', '');
  if (attError) throw attError;
  const { error: evtError } = await supabase.from('eventos').delete().neq('id', '');
  if (evtError) throw evtError;
}

export async function insertAsistencias(records: Asistencia[]): Promise<void> {
  if (records.length === 0) return;
  const { error } = await supabase.from('asistencias').insert(records);
  if (error) throw error;
}

// ── Seguimientos ──────────────────────────────────────────────────────────────

export async function getSeguimientos(): Promise<Seguimiento[]> {
  const { data, error } = await supabase.from('seguimientos').select('*').order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data as Seguimiento[];
}

export async function addSeguimiento(s: Seguimiento): Promise<void> {
  const { error } = await supabase.from('seguimientos').insert(s);
  if (error) throw error;
}

export async function updateSeguimientoEstado(id: string, estado: 'pendiente' | 'contactado' | 'cerrado'): Promise<void> {
  const { error } = await supabase.from('seguimientos').update({ estado }).eq('id', id);
  if (error) throw error;
}

// ── Configuracion ─────────────────────────────────────────────────────────────

export async function getConfiguracion(): Promise<Configuracion | null> {
  const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    alerta_ausencias_iglesia: data.alerta_ausencias_iglesia,
    alerta_ausencias_grupo_conexion: data.alerta_ausencias_grupo_conexion,
    alerta_ausencias_grupo_hombres: data.alerta_ausencias_grupo_hombres,
    alerta_ausencias_grupo_mujeres: data.alerta_ausencias_grupo_mujeres,
    dias_recordatorio_cumpleanos: data.dias_recordatorio_cumpleanos,
    idioma_por_defecto: data.idioma_por_defecto,
    grupos_activos: data.grupos_activos,
  } as Configuracion;
}

export async function saveConfiguracion(c: Configuracion): Promise<void> {
  const { error } = await supabase.from('configuracion').upsert({ id: 1, ...c }, { onConflict: 'id' });
  if (error) throw error;
}

// ── Event Tracks ──────────────────────────────────────────────────────────────

export async function getEventTracks(): Promise<EventTrack[]> {
  const { data, error } = await supabase.from('event_tracks').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    titleEs: row.title_es,
    titleEn: row.title_en,
    labelEs: row.label_es,
    labelEn: row.label_en,
    type: row.type,
    active: row.active,
    color: row.color,
  })) as EventTrack[];
}

export async function addEventTrack(t: EventTrack): Promise<void> {
  const { error } = await supabase.from('event_tracks').insert({
    id: t.id,
    title_es: t.titleEs,
    title_en: t.titleEn,
    label_es: t.labelEs,
    label_en: t.labelEn,
    type: t.type,
    active: t.active,
    color: t.color,
  });
  if (error) throw error;
}

export async function deleteEventTrack(id: string): Promise<void> {
  const { error } = await supabase.from('event_tracks').delete().eq('id', id);
  if (error) throw error;
}

// ── Volunteer Areas ───────────────────────────────────────────────────────────

export async function getVolunteerAreas(): Promise<VolunteerArea[]> {
  const { data, error } = await supabase.from('volunteer_areas').select('*').order('orden');
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    nombre_es: row.nombre_es,
    nombre_en: row.nombre_en,
    permite_nota: row.permite_nota,
    contexto: row.contexto ?? 'iglesia',
    orden: row.orden,
  })) as VolunteerArea[];
}

export async function addVolunteerArea(a: VolunteerArea): Promise<void> {
  const { error } = await supabase.from('volunteer_areas').insert({
    id: a.id,
    nombre_es: a.nombre_es,
    nombre_en: a.nombre_en,
    permite_nota: a.permite_nota,
    contexto: a.contexto ?? 'iglesia',
    orden: a.orden,
  });
  if (error) throw error;
}

export async function updateVolunteerArea(id: string, updates: Partial<VolunteerArea>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.nombre_es !== undefined) payload.nombre_es = updates.nombre_es;
  if (updates.nombre_en !== undefined) payload.nombre_en = updates.nombre_en;
  if (updates.permite_nota !== undefined) payload.permite_nota = updates.permite_nota;
  if (updates.contexto !== undefined) payload.contexto = updates.contexto;
  if (updates.orden !== undefined) payload.orden = updates.orden;

  const { error } = await supabase.from('volunteer_areas').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteVolunteerArea(id: string): Promise<void> {
  const { error } = await supabase.from('volunteer_areas').delete().eq('id', id);
  if (error) throw error;
}

// ── Volunteer Assignments ─────────────────────────────────────────────────────

export async function getVolunteerAssignments(): Promise<VolunteerAssignment[]> {
  const { data, error } = await supabase.from('volunteer_assignments').select('*').order('fecha', { ascending: true });
  if (error) {
    if (error.code === '42P01' || error.code === '42703') return [];
    throw error;
  }
  return (data ?? []) as VolunteerAssignment[];
}

export async function addVolunteerAssignment(a: VolunteerAssignment): Promise<void> {
  const { error } = await supabase.from('volunteer_assignments').insert(a);
  if (error) throw error;
}

export async function updateVolunteerAssignment(id: string, updates: Partial<VolunteerAssignment>): Promise<void> {
  const { error } = await supabase.from('volunteer_assignments').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteVolunteerAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('volunteer_assignments').delete().eq('id', id);
  if (error) throw error;
}

// ── Prayer Requests ───────────────────────────────────────────────────────────

export async function getPrayerRequests(): Promise<PrayerRequest[]> {
  const { data, error } = await supabase.from('prayer_requests').select('*').order('fecha', { ascending: false });
  if (error) {
    if (error.code === '42P01' || error.code === '42703') return [];
    throw error;
  }
  return (data ?? []) as PrayerRequest[];
}

export async function addPrayerRequest(p: PrayerRequest): Promise<void> {
  const { error } = await supabase.from('prayer_requests').insert(p);
  if (error) throw error;
}

export async function updatePrayerRequest(id: string, updates: Partial<PrayerRequest>): Promise<void> {
  const { error } = await supabase.from('prayer_requests').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePrayerRequest(id: string): Promise<void> {
  const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
  if (error) throw error;
}
