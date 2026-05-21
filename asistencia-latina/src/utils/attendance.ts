import { Persona, Evento, Asistencia, EventType, Configuracion } from '../types';

/**
 * Calculates Sunday church attendance alerts for all active members.
 * A Sunday is counted as "present" if the user was marked present in EITHER the 11am or 6pm service on that date.
 * An alert triggers if a member is consecutively absent from both services for N Sundays.
 */
export interface AbsenceAlert {
  personaId: string;
  nombreCompleto: string;
  tipo: 'church' | 'conexion' | 'hombres' | 'mujeres';
  visto: boolean;
  semanasFaltadas: number;
  mensajeEs: string;
  mensajeEn: string;
}

export function calculateAlerts(
  people: Persona[],
  events: Evento[],
  attendance: Asistencia[],
  config: Configuracion
): AbsenceAlert[] {
  const alerts: AbsenceAlert[] = [];
  const activeAndNewPeople = people.filter((p) => p.estado !== 'inactivo');

  // --- 1. Sunday Church alerts ---
  // Group Sunday service events by date
  const sundayEventsByDate: { [date: string]: Evento[] } = {};
  events.forEach((evt) => {
    if (evt.tipo_evento === 'servicio_11' || evt.tipo_evento === 'servicio_6') {
      if (!sundayEventsByDate[evt.fecha]) {
        sundayEventsByDate[evt.fecha] = [];
      }
      sundayEventsByDate[evt.fecha].push(evt);
    }
  });

  // Sort Sunday dates descending (newest first)
  const sortedSundayDates = Object.keys(sundayEventsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const churchAbsenceThreshold = config.alerta_ausencias_iglesia;

  if (sortedSundayDates.length >= churchAbsenceThreshold) {
    activeAndNewPeople.forEach((p) => {
      let consecutiveMissedSundays = 0;
      let stopChecking = false;

      for (let i = 0; i < sortedSundayDates.length; i++) {
        if (stopChecking) break;

        const sundayDate = sortedSundayDates[i];
        const dayEvents = sundayEventsByDate[sundayDate];
        const eventIds = dayEvents.map((e) => e.id);

        // Find attendance entries for this person on these events
        const entries = attendance.filter(
          (att) => att.persona_id === p.id && eventIds.includes(att.evento_id)
        );

        // If church services occurred on this day:
        if (eventIds.length > 0) {
          // Did the user attend ANY of the Sunday services on this date?
          const wasPresent = entries.some((att) => att.presente);

          // If they didn't have entries, we check if they were registered in the DB prior to this event
          // If they were registered, and didn't attend, it counts as a miss.
          const isRegisteredBefore = new Date(p.fecha_creacion) <= new Date(sundayDate);

          if (isRegisteredBefore && !wasPresent) {
            consecutiveMissedSundays++;
          } else if (isRegisteredBefore && wasPresent) {
            // They attended! This breaks the consecutive absence streak!
            stopChecking = true;
          }
        }
      }

      if (consecutiveMissedSundays >= churchAbsenceThreshold) {
        alerts.push({
          personaId: p.id,
          nombreCompleto: p.nombre_completo,
          tipo: 'church',
          visto: false,
          semanasFaltadas: consecutiveMissedSundays,
          mensajeEs: `${p.nombre_completo} no ha asistido a los últimos ${consecutiveMissedSundays} servicios en la iglesia.`,
          mensajeEn: `${p.nombre_completo} has not attended the last ${consecutiveMissedSundays} services at church.`
        });
      }
    });
  }

  // --- Helper for Single Event Track Groups (Connection, Men's, Women's) ---
  const checkTrackAlerts = (
    type: EventType,
    alertType: 'conexion' | 'hombres' | 'mujeres',
    threshold: number,
    genderFilter?: 'M' | 'F'
  ) => {
    // Filter active events of this type
    const trackEvents = events
      .filter((e) => e.tipo_evento === type)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    if (trackEvents.length < threshold) return;

    activeAndNewPeople.forEach((p) => {
      // Apply gender constraints if required
      if (genderFilter && p.sexo !== genderFilter) return;

      let consecutiveMisses = 0;
      let stopChecking = false;

      for (let i = 0; i < trackEvents.length; i++) {
        if (stopChecking) break;

        const evt = trackEvents[i];
        const entry = attendance.find(
          (att) => att.persona_id === p.id && att.evento_id === evt.id
        );

        const isRegisteredPrior = new Date(p.fecha_creacion) <= new Date(evt.fecha);

        if (isRegisteredPrior) {
          if (entry && entry.presente) {
            stopChecking = true; // Present! Breaks streak
          } else {
            consecutiveMisses++; // Absent or not registered for this record
          }
        }
      }

      if (consecutiveMisses >= threshold) {
        let msgEs = '';
        let msgEn = '';
        if (alertType === 'conexion') {
          msgEs = `${p.nombre_completo} no ha asistido a los últimos ${consecutiveMisses} grupos de conexión.`;
          msgEn = `${p.nombre_completo} has not attended the last ${consecutiveMisses} connection groups.`;
        } else if (alertType === 'hombres') {
          msgEs = `${p.nombre_completo} no ha asistido a los últimos ${consecutiveMisses} grupos de hombres.`;
          msgEn = `${p.nombre_completo} has not attended the last ${consecutiveMisses} men's groups.`;
        } else if (alertType === 'mujeres') {
          msgEs = `${p.nombre_completo} no ha asistido a los últimos ${consecutiveMisses} grupos de mujeres.`;
          msgEn = `${p.nombre_completo} has not attended the last ${consecutiveMisses} women's groups.`;
        }

        alerts.push({
          personaId: p.id,
          nombreCompleto: p.nombre_completo,
          tipo: alertType,
          visto: false,
          semanasFaltadas: consecutiveMisses,
          mensajeEs: msgEs,
          mensajeEn: msgEn
        });
      }
    });
  };

  // --- 2. Connection Group alert checking ---
  if (config.grupos_activos.grupo_conexion) {
    checkTrackAlerts('grupo_conexion', 'conexion', config.alerta_ausencias_grupo_conexion);
  }

  // --- 3. Men's Group alert checking ---
  if (config.grupos_activos.grupo_hombres) {
    checkTrackAlerts('grupo_hombres', 'hombres', config.alerta_ausencias_grupo_hombres, 'M');
  }

  // --- 4. Women's Group alert checking ---
  if (config.grupos_activos.grupo_mujeres) {
    checkTrackAlerts('grupo_mujeres', 'mujeres', config.alerta_ausencias_grupo_mujeres, 'F');
  }

  return alerts;
}

/**
 * Birthday notification checks with dynamic relative math for accuracy
 */
export interface BirthdayAlert {
  id: string; // persona id
  nombreCompleto: string;
  edadProxima: number;
  telefono?: string;
  diaExacto: string; // e.g. "1988-05-22"
  diasParaCumpleanos: number; // 0=today, 1=tomorrow, or days left
  nacimientoFormateado: string;
}

export function calculateBirthdays(
  people: Persona[],
  referenceDateStr: string, // e.g. "2026-05-21"
  daysNoticeWindow: number
): {
  hoy: BirthdayAlert[];
  estaSemana: BirthdayAlert[];
  proximos: BirthdayAlert[];
} {
  const hoy: BirthdayAlert[] = [];
  const estaSemana: BirthdayAlert[] = [];
  const proximos: BirthdayAlert[] = [];

  const refDate = new Date(referenceDateStr + 'T00:00:00');
  const refYear = refDate.getFullYear();

  people.forEach((p) => {
    if (!p.fecha_nacimiento || p.estado === 'inactivo') return;

    // Birthday of person this year
    const birthPart = p.fecha_nacimiento.split('-'); // ["1988", "05", "22"]
    if (birthPart.length !== 3) return;

    const bMonth = parseInt(birthPart[1]) - 1;
    const bDay = parseInt(birthPart[2]);
    const bYearOfBirth = parseInt(birthPart[0]);

    // Let's create the birthday date in the reference year
    let thisYearBirthday = new Date(refYear, bMonth, bDay, 0, 0, 0);

    // If the birthday already happened earlier this year, and we are close to end of year,
    // or if the birthday is in next year, we handle wrap around. But we just want to look at
    // the relative difference. To find if it's in the next few days:
    // If birthday date is before reference date, it might be next year if we look far,
    // but within a small window we're fine. Let's make a precise days difference:
    let diffTimes = thisYearBirthday.getTime() - refDate.getTime();
    let diffDays = Math.ceil(diffTimes / (1000 * 60 * 60 * 24));

    // Handle wrap around: if it is negative (e.g. -355), it's in 10 days in the next year
    if (diffDays < -180) {
      const nextYearBirthday = new Date(refYear + 1, bMonth, bDay, 0, 0, 0);
      diffTimes = nextYearBirthday.getTime() - refDate.getTime();
      diffDays = Math.ceil(diffTimes / (1000 * 60 * 60 * 24));
    } else if (diffDays > 180) {
      const prevYearBirthday = new Date(refYear - 1, bMonth, bDay, 0, 0, 0);
      diffTimes = prevYearBirthday.getTime() - refDate.getTime();
      diffDays = Math.ceil(diffTimes / (1000 * 60 * 60 * 24));
    }

    const calculatedAge = refYear - bYearOfBirth;

    const alertItem: BirthdayAlert = {
      id: p.id,
      nombreCompleto: p.nombre_completo,
      edadProxima: calculatedAge,
      telefono: p.telefono,
      diaExacto: p.fecha_nacimiento,
      diasParaCumpleanos: diffDays,
      nacimientoFormateado: `${bDay}/${bMonth + 1}`
    };

    if (diffDays === 0) {
      hoy.push(alertItem);
    } else if (diffDays > 0 && diffDays <= 7) {
      estaSemana.push(alertItem);
    } else if (diffDays > 7 && diffDays <= 30) {
      proximos.push(alertItem);
    }
  });

  // Sort them so closest are first
  const sortFn = (a: BirthdayAlert, b: BirthdayAlert) => a.diasParaCumpleanos - b.diasParaCumpleanos;
  hoy.sort(sortFn);
  estaSemana.sort(sortFn);
  proximos.sort(sortFn);

  return { hoy, estaSemana, proximos };
}

/**
 * Formats a Date object as YYYY-MM-DD safely
 */
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates high level metrics for the dashboard
 */
export function getMetrics(
  people: Persona[],
  events: Evento[],
  attendance: Asistencia[]
) {
  const activeAndNew = people.filter((p) => p.estado !== 'inactivo');
  const totalInDb = people.filter(p => p.estado !== 'inactivo').length;

  // Compute average attendance per Sunday
  // Group attendance entries by event
  const sundayEventIds = events
    .filter((e) => e.tipo_evento === 'servicio_11' || e.tipo_evento === 'servicio_6')
    .map((e) => e.id);

  const sundayAttendances = attendance.filter((a) => sundayEventIds.includes(a.evento_id));

  // Average per Sunday.
  // Let's find unique dates of sunday events
  const uniqueSundayDates = Array.from(
    new Set(
      events
        .filter((e) => e.tipo_evento === 'servicio_11' || e.tipo_evento === 'servicio_6')
        .map((e) => e.fecha)
    )
  );

  let avgSundayAttendance = 0;
  if (uniqueSundayDates.length > 0) {
    let totalPresentSum = 0;
    uniqueSundayDates.forEach((date) => {
      // Find event IDs on this date
      const evtsOnDate = events
        .filter((e) => (e.tipo_evento === 'servicio_11' || e.tipo_evento === 'servicio_6') && e.fecha === date)
        .map((e) => e.id);

      // Unique people present on this date across those Sunday events (since they could theoretically attend both)
      const uniquePresents = Array.from(
        new Set(
          attendance
            .filter((a) => evtsOnDate.includes(a.evento_id) && a.presente)
            .map((a) => a.persona_id)
        )
      );
      totalPresentSum += uniquePresents.length;
    });

    avgSundayAttendance = Math.round((totalPresentSum / uniqueSundayDates.length) * 10) / 10;
  }

  // Retention rate:
  // How many "new" arrivals in first-visits subsequently logged on further events?
  // Let's simplify: percentage of people registered as "nuevo" or registered in general who have >= 2 attendances
  const recurrentPeopleCount = activeAndNew.filter((p) => {
    const pAtt = attendance.filter((a) => a.persona_id === p.id && a.presente);
    return pAtt.length >= 2;
  }).length;

  const retentionPercent = activeAndNew.length > 0
    ? Math.round((recurrentPeopleCount / activeAndNew.length) * 100)
    : 100;

  // New arrivals this month (e.g., created in May 2026)
  const newThisMonth = people.filter((p) => {
    return p.fecha_creacion.startsWith('2026-05') && p.estado === 'nuevo';
  }).length;

  return {
    totalInDb,
    avgSundayAttendance,
    retentionPercent,
    newThisMonth
  };
}
