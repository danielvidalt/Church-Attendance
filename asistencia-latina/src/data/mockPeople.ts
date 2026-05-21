import { Persona, Evento, Asistencia, Seguimiento, Configuracion } from '../types';

// Let's establish May 21, 2026 as our anchor date for birthday planning and relative logs
export const DEFAULT_CONFIG: Configuracion = {
  alerta_ausencias_iglesia: 3,
  alerta_ausencias_grupo_conexion: 3,
  alerta_ausencias_grupo_hombres: 3,
  alerta_ausencias_grupo_mujeres: 3,
  dias_recordatorio_cumpleanos: 1,
  idioma_por_defecto: 'es',
  grupos_activos: {
    grupo_conexion: true,
    grupo_hombres: true,
    grupo_mujeres: true
  }
};

export const INITIAL_PEOPLE: Persona[] = [
  {
    id: "p1",
    nombre_completo: "María González",
    telefono: "+1 555-0101",
    fecha_nacimiento: "1988-05-22", // Birthday tomorrow! (relative to May 21)
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F",
    notas: "Líder de hospitalidad voluntaria."
  },
  {
    id: "p2",
    nombre_completo: "Juan Pérez",
    telefono: "+1 555-0102",
    fecha_nacimiento: "1975-10-15",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M",
    notas: "Necesita transporte ocasionalmente."
  },
  {
    id: "p3",
    nombre_completo: "Ana Torres",
    telefono: "+1 555-0103",
    fecha_nacimiento: "1995-05-21", // Birthday today!
    fecha_creacion: "2025-02-05",
    fecha_primera_visita: "2025-02-09",
    estado: "activo",
    sexo: "F",
    notas: "Colabora en el ministerio de alabanza."
  },
  {
    id: "p4",
    nombre_completo: "Carlos Rivera",
    telefono: "+1 555-0104",
    fecha_nacimiento: "1982-08-30",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p5",
    nombre_completo: "Sofía Ramos",
    telefono: "+1 555-0105",
    fecha_nacimiento: "1990-12-05",
    fecha_creacion: "2025-01-15",
    fecha_primera_visita: "2025-01-19",
    estado: "activo", // Alerta de iglesia pendiente: ausente últimas 3 semanas
    sexo: "F",
    notas: "Reportó viaje por trabajo el mes pasado."
  },
  {
    id: "p6",
    nombre_completo: "Diego Castro",
    telefono: "+1 555-0106",
    fecha_nacimiento: "1984-05-25", // Birthday in 4 days!
    fecha_creacion: "2025-03-01",
    fecha_primera_visita: "2025-03-02",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p7",
    nombre_completo: "Gabriela Ortiz",
    telefono: "+1 555-0107",
    fecha_nacimiento: "1992-03-14",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p8",
    nombre_completo: "Luis Mendoza",
    telefono: "+1 555-0108",
    fecha_nacimiento: "1978-07-22",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p9",
    nombre_completo: "Patricia Silva",
    telefono: "+1 555-0109",
    fecha_nacimiento: "1986-11-18",
    fecha_creacion: "2025-02-14",
    fecha_primera_visita: "2025-02-16",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p10",
    nombre_completo: "Roberto Delgado",
    telefono: "+1 555-0110",
    fecha_nacimiento: "1969-09-09",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p11",
    nombre_completo: "Carmen Vega",
    telefono: "+1 555-0111",
    fecha_nacimiento: "1993-02-28",
    fecha_creacion: "2025-03-10",
    fecha_primera_visita: "2025-03-16",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p12",
    nombre_completo: "Fernando Rojas",
    telefono: "+1 555-0112",
    fecha_nacimiento: "1980-04-12",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p13",
    nombre_completo: "Elena Duarte",
    telefono: "+1 555-0113",
    fecha_nacimiento: "1972-05-21", // Birthday today too!
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p14",
    nombre_completo: "Alejandro Peña",
    telefono: "+1 555-0114",
    fecha_nacimiento: "1987-06-03", // Birthday next month
    fecha_creacion: "2025-04-11",
    fecha_primera_visita: "2025-04-13",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p15",
    nombre_completo: "Lucía Blanco",
    telefono: "+1 555-0115",
    fecha_nacimiento: "1991-05-24", // Birth soon! (In 3 days)
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p16",
    nombre_completo: "Ricardo Miranda",
    telefono: "+1 555-0116",
    fecha_nacimiento: "1965-01-25",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p17",
    nombre_completo: "Verónica Vargas",
    telefono: "+1 555-0117",
    fecha_nacimiento: "1996-07-16",
    fecha_creacion: "2025-04-01",
    fecha_primera_visita: "2025-04-06",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p18",
    nombre_completo: "Mateo Campos",
    telefono: "+1 555-0118",
    fecha_nacimiento: "1983-10-02",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p19",
    nombre_completo: "Isabela Guerrero",
    telefono: "+1 555-0119",
    fecha_nacimiento: "1989-11-20",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p20",
    nombre_completo: "Samuel Flores",
    telefono: "+1 555-0120",
    fecha_nacimiento: "1977-03-31",
    fecha_creacion: "2025-02-18",
    fecha_primera_visita: "2025-02-23",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p21",
    nombre_completo: "Diana Núñez",
    telefono: "+1 555-0121",
    fecha_nacimiento: "1994-08-11",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p22",
    nombre_completo: "Andrés Solís",
    telefono: "+1 555-0122",
    fecha_nacimiento: "1981-12-14",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p23",
    nombre_completo: "Camila Cabrera",
    telefono: "+1 555-0123",
    fecha_nacimiento: "1990-09-27",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p24",
    nombre_completo: "Santiago Cruz",
    telefono: "+1 555-0124",
    fecha_nacimiento: "1976-06-15",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p25",
    nombre_completo: "Natalia Benítez",
    telefono: "+1 555-0125",
    fecha_nacimiento: "1985-11-04",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "F"
  },
  {
    id: "p26",
    nombre_completo: "José Luis Morales",
    telefono: "+1 555-0126",
    fecha_nacimiento: "1971-02-12",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  },
  {
    id: "p27",
    nombre_completo: "Mariana Godoy",
    telefono: "+1 555-0127",
    fecha_nacimiento: "1997-10-22",
    fecha_creacion: "2025-05-10", // Registered recently
    fecha_primera_visita: "2025-05-10",
    estado: "nuevo",
    sexo: "F"
  },
  {
    id: "p28",
    nombre_completo: "Lucas Palacios",
    telefono: "+1 555-0128",
    fecha_nacimiento: "1988-04-03",
    fecha_creacion: "2025-05-15", // Registered recently
    fecha_primera_visita: "2025-05-17",
    estado: "nuevo",
    sexo: "M"
  },
  {
    id: "p29",
    nombre_completo: "Clara Domínguez",
    telefono: "+1 555-0129",
    fecha_nacimiento: "1960-03-05",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "inactivo",
    sexo: "F",
    notas: "Mudó de ciudad a principios de año."
  },
  {
    id: "p30",
    nombre_completo: "Tomás Sandoval",
    telefono: "+1 555-0130",
    fecha_nacimiento: "1974-12-16",
    fecha_creacion: "2025-01-10",
    fecha_primera_visita: "2025-01-12",
    estado: "activo",
    sexo: "M"
  }
];

// Let's create events for 3 Sundays and 3 Wednesdays (Connection Group), and Men/Women Groups.
// Sunday 1: May 3
// Sunday 2: May 10
// Sunday 3: May 17
export const INITIAL_EVENTS: Evento[] = [
  // Sunday May 3
  { id: "e1", nombre_evento: "Servicio Domingo 11:00 AM - May 3", tipo_evento: "servicio_11", fecha: "2026-05-03", creado_por: "Admin Principal" },
  { id: "e2", nombre_evento: "Servicio Domingo 6:00 PM - May 3", tipo_evento: "servicio_6", fecha: "2026-05-03", creado_por: "Admin Principal" },
  { id: "e3", nombre_evento: "Grupo Conexión Semanal - May 6", tipo_evento: "grupo_conexion", fecha: "2026-05-06", creado_por: "Carlos Rivera" },
  { id: "e4", nombre_evento: "Grupo Hombres - May 7", tipo_evento: "grupo_hombres", fecha: "2026-05-07", creado_por: "Carlos Rivera" },
  { id: "e5", nombre_evento: "Grupo Mujeres - May 7", tipo_evento: "grupo_mujeres", fecha: "2026-05-07", creado_por: "María González" },

  // Sunday May 10
  { id: "e6", nombre_evento: "Servicio Domingo 11:00 AM - May 10", tipo_evento: "servicio_11", fecha: "2026-05-10", creado_por: "Líder Asistencia" },
  { id: "e7", nombre_evento: "Servicio Domingo 6:00 PM - May 10", tipo_evento: "servicio_6", fecha: "2026-05-10", creado_por: "Líder Asistencia" },
  { id: "e8", nombre_evento: "Grupo Conexión Semanal - May 13", tipo_evento: "grupo_conexion", fecha: "2026-05-13", creado_por: "Carlos Rivera" },
  { id: "e9", nombre_evento: "Grupo Hombres - May 14", tipo_evento: "grupo_hombres", fecha: "2026-05-14", creado_por: "Carlos Rivera" },
  { id: "e10", nombre_evento: "Grupo Mujeres - May 14", tipo_evento: "grupo_mujeres", fecha: "2026-05-14", creado_por: "María González" },

  // Sunday May 17
  { id: "e11", nombre_evento: "Servicio Domingo 11:00 AM - May 17", tipo_evento: "servicio_11", fecha: "2026-05-17", creado_por: "Admin Principal" },
  { id: "e12", nombre_evento: "Servicio Domingo 6:00 PM - May 17", tipo_evento: "servicio_6", fecha: "2026-05-17", creado_por: "Admin Principal" },
  { id: "e13", nombre_evento: "Grupo Conexión Semanal - May 20", tipo_evento: "grupo_conexion", fecha: "2026-05-20", creado_por: "Carlos Rivera" },
  { id: "e14", nombre_evento: "Grupo Hombres - May 21", tipo_evento: "grupo_hombres", fecha: "2026-05-21", creado_por: "Carlos Rivera" },
  { id: "e15", nombre_evento: "Grupo Mujeres - May 21", tipo_evento: "grupo_mujeres", fecha: "2026-05-21", creado_por: "María González" }
];

// Let's seed core attendance records so alerts are accurately calculated
// Sofia Ramos (p5) must miss all 11:00 AM and 6:00 PM services on May 10 and May 17 to triggers Church alert.
// But we want to simulate:
// May 3: Sofia was present.
// May 10: Sofia absent at both services.
// May 17: Sofia absent at both services.
// To make it exactly 3 consecutive Sundays missed:
// Actually, let's make her visit May 3, but miss May 10 and May 17 and May 24 (not logged yet, let's make her miss May 3, 10, and 17! That's 3 consecutive sundays.)
// Let's trace María González (p1). She attends 11am service, missed Wednesday Connection Groups May 6, 13, and 20. Triggers connection alert!
// Let's trace Juan Pérez (p2). He missed Men's groups on May 7, May 14, and May 21. Triggers Men's group alert!
// For all other active members, let's populate a rich history of standard attendance (~75-80% present rate).

const generateAttendance = (): Asistencia[] => {
  const records: Asistencia[] = [];
  let recordIdCount = 1;

  INITIAL_EVENTS.forEach((evt) => {
    // For each person, decide if present or not based on our profile scenarios
    INITIAL_PEOPLE.forEach((p) => {
      // Inactive members do not attend
      if (p.estado === 'inactivo' || p.id === 'p29') {
        return;
      }

      let presentCount = true;

      // Scenario: Sofia Ramos (p5) misses last 3 Sundays (e1, e2, e6, e7, e11, e12)
      if (p.id === 'p5') {
        if (['e1', 'e2'].includes(evt.id)) {
          // Present at 11am on Sunday May 3, but absent thereafter
          presentCount = evt.id === 'e1';
        } else if (['e6', 'e7', 'e11', 'e12'].includes(evt.id)) {
          // Absent at both services on Sunday 10 & 17
          presentCount = false;
        } else {
          presentCount = false;
        }
      }

      // Scenario: María González (p1) is a faithful attendee of Sunday services,
      // but she has missed last 3 Connection Groups (e3, e8, e13).
      // She also attends Women's group (e5, e10). Let's make her present for women's group today (e15)
      else if (p.id === 'p1') {
        if (['e3', 'e8', 'e13'].includes(evt.id)) {
          presentCount = false; // Missing connection group!
        } else if (['e1', 'e6', 'e11'].includes(evt.id)) {
          presentCount = true; // Present at 11am sunday
        } else if (['e2', 'e7', 'e12'].includes(evt.id)) {
          presentCount = false; // She didn't attend the 6pm service since she went to the 11am one
        } else {
          presentCount = true; // Present in general for others
        }
      }

      // Scenario: Juan Pérez (p2) is absent from Men's group on May 7, 14, and 21 (e4, e9, e14)
      else if (p.id === 'p2') {
        if (['e4', 'e9', 'e14'].includes(evt.id)) {
          presentCount = false; // Missing Men's Group alerts!
        } else if (['e1', 'e6', 'e11'].includes(evt.id)) {
          presentCount = true; // Went to 11am service
        } else if (['e2', 'e7', 'e12'].includes(evt.id)) {
          presentCount = false; // Did not go to 6pm
        } else {
          presentCount = Math.random() > 0.3; // Random Connection group
        }
      }

      // Pre-filled scenario for Sunday toggles: If they went to 11am, they usually don't go to 6pm
      else {
        if (evt.tipo_evento === 'servicio_11') {
          // 11 AM attendee
          const seed = parseInt(p.id.replace('p', '')) % 2 === 0;
          presentCount = seed ? Math.random() > 0.15 : Math.random() > 0.8;
        } else if (evt.tipo_evento === 'servicio_6') {
          // 6 PM attendee
          const seed = parseInt(p.id.replace('p', '')) % 2 !== 0;
          presentCount = seed ? Math.random() > 0.15 : Math.random() > 0.8;
        } else if (evt.tipo_evento === 'grupo_conexion') {
          // ~60% attendance
          presentCount = Math.random() > 0.4;
        } else if (evt.tipo_evento === 'grupo_hombres') {
          if (p.sexo !== 'M') return; // Female shouldn't attend men's group
          presentCount = Math.random() > 0.35;
        } else if (evt.tipo_evento === 'grupo_mujeres') {
          if (p.sexo !== 'F') return; // Male shouldn't attend women's group
          presentCount = Math.random() > 0.35;
        }
      }

      records.push({
        id: `att_${recordIdCount++}`,
        persona_id: p.id,
        evento_id: evt.id,
        presente: presentCount,
        es_nuevo: p.estado === 'nuevo',
        fecha_registro: evt.fecha
      });
    });
  });

  return records;
};

export const INITIAL_ATTENDANCE: Asistencia[] = generateAttendance();

export const INITIAL_SEGUIMIENTOS: Seguimiento[] = [
  {
    id: "seg1",
    persona_id: "p5",
    motivo: "Alerta de Iglesia - Ausente los últimos 3 domingos",
    estado: "pendiente",
    fecha_creacion: "2026-05-18",
    usuario_responsable: "Daniel Vidal"
  },
  {
    id: "seg2",
    persona_id: "p1",
    motivo: "Alerta de Grupo Conexión - Ausente los últimos 3 grupos",
    estado: "contactado",
    nota: "Se le llamó y comentó que ha estado enferma, pero espera volver el próximo miércoles.",
    fecha_creacion: "2026-05-21",
    fecha_contacto: "2026-05-21",
    usuario_responsable: "Daniel Vidal"
  }
];
