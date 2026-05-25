export type Language = 'es' | 'en';

export type EventType = string;

export type MemberStatus = 'activo' | 'nuevo' | 'inactivo';

export interface Persona {
  id: string;
  nombre_completo: string;
  telefono?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  fecha_creacion: string;    // YYYY-MM-DD
  fecha_primera_visita?: string; // YYYY-MM-DD
  estado: MemberStatus;
  sexo: 'M' | 'F'; // To automatically know if Men's or Women's group is applicable
  notas?: string;
  foto_perfil?: string; // profile photo as base64 data URL
  nacionalidad?: string; // ISO 3166-1 alpha-2 country code e.g. "CO"
  es_voluntario?: boolean;
  areas_voluntario?: { areaId: string; nota?: string }[];
}

export interface VolunteerArea {
  id: string;
  nombre_es: string;
  nombre_en: string;
  permite_nota: boolean;
  orden: number;
}

export interface Evento {
  id: string;
  nombre_evento: string;
  tipo_evento: EventType;
  fecha: string; // YYYY-MM-DD
  creado_por: string; // user name
  asistentes_anonimos?: number;
}

export interface Asistencia {
  id: string;
  persona_id: string;
  evento_id: string;
  presente: boolean;
  es_nuevo: boolean;
  fecha_registro: string; // YYYY-MM-DD
}

export interface Usuario {
  id: string;
  nombre: string;
  email_login: string;
  rol: 'administrador' | 'lider' | 'seguimiento';
  idioma_preferido: Language;
}

export interface Seguimiento {
  id: string;
  persona_id: string;
  motivo: string;
  estado: 'pendiente' | 'contactado' | 'cerrado';
  nota?: string;
  fecha_creacion: string; // YYYY-MM-DD
  fecha_contacto?: string; // YYYY-MM-DD
  usuario_responsable: string;
}

export interface Configuracion {
  alerta_ausencias_iglesia: number;
  alerta_ausencias_grupo_conexion: number;
  alerta_ausencias_grupo_hombres: number;
  alerta_ausencias_grupo_mujeres: number;
  dias_recordatorio_cumpleanos: number;
  idioma_por_defecto: Language;
  grupos_activos: {
    grupo_conexion: boolean;
    grupo_hombres: boolean;
    grupo_mujeres: boolean;
  };
}

export interface EventTrack {
  id: string;
  titleEs: string;
  titleEn: string;
  labelEs: string;
  labelEn: string;
  type: 'servicio' | 'grupo' | 'evento';
  active: boolean;
  color: string;
}

export type TranslationKey = keyof typeof esTranslations;

export const esTranslations = {
  // Login
  appName: "Management Centre",
  tagline: "Comunidad Latina",
  emailLabel: "Correo electrónico",
  passwordLabel: "Contraseña",
  enterBtn: "Entrar",
  wrongCredentials: "Credenciales de acceso incorrectas. Intenta de nuevo.",
  demoAccess: "Acceso Rápido de Demostración",
  loginTitle: "Iniciar Sesión",
  loginSubtitle: "Protege la privacidad de la comunidad latina",

  // Sidebar / Nav
  hello: "Hola",
  registerAttendance: "Registrar Asistencia",
  home: "Inicio",
  people: "Personas",
  stats: "Estadísticas",
  alerts: "Alertas",
  birthdays: "Cumpleaños",
  calendar: "Calendario",
  history: "Historial",
  config: "Configuración",
  logout: "Cerrar sesión",

  noEventsThisDay: "Sin registros este día",
  attendanceDetail: "Detalle de asistencia",
  backToDay: "← Volver",

  // Home Screen
  homeHeading: "¿Qué quieres registrar hoy?",
  secundaryAccess: "Accesos rápidos de control",

  // Attendance Screen
  saveSuccess: "Asistencia guardada correctamente",
  attendanceRegistered: "Registro de asistencia exitoso",
  selectDate: "Selecciona la fecha",
  searchByName: "Buscar por nombre...",
  filterAll: "Todos",
  filterPresent: "Presentes",
  filterAbsent: "Ausentes",
  filterNew: "Nuevos",
  addPerson: "Nuevo Asistente",
  saveAttendance: "Guardar asistencia",
  updateAttendance: "Actualizar asistencia",
  editingRecord: "Editando registro guardado",
  summaryOfToday: "Resumen del registro",
  totalPresents: "Total de presentes",
  regularPresents: "Asistentes regulares",
  newPresents: "Asistentes nuevos",
  absents: "Ausentes de la lista",
  congratulationAlert: "¡Excelente trabajo! La asistencia del evento se ha guardado para el día de hoy.",
  alreadySavedTitle: "Asistencia ya registrada hoy",
  alreadySavedDesc: "La asistencia para este evento hoy ya ha sido guardada. ¿Deseas sobreescribir los datos?",
  overwriteBtn: "Sí, guardar de nuevo",
  keepBtn: "Mantener anterior",

  // New Person Page / Modal
  newPersonTitle: "Registrar Nueva Persona",
  fullName: "Nombre completo",
  phone: "Teléfono",
  birthDate: "Fecha de nacimiento",
  gender: "Género",
  male: "Masculino",
  female: "Femenino",
  eventWhereArrived: "Evento al que llega hoy",
  isFirstTime: "¿Es su primera vez?",
  yes: "Sí",
  no: "No",
  optionalNote: "Nota opcional",
  cancel: "Cancelar",
  saveAndMark: "Guardar y marcar presente",
  fieldRequired: "Este campo es obligatorio",

  // People List Manager
  directoryTitle: "Directorio de Personas",
  searchPlaceholder: "Buscar personas por nombre o teléfono...",
  statusAll: "Cualquier estado",
  statusActive: "Activo",
  statusNew: "Nuevo",
  statusInactive: "Inactivo",
  statusLabel: "Estado",
  allContexts: "Todos los grupos",
  noPeopleFound: "No se encontraron personas con los filtros seleccionados.",
  joinedOn: "Llegó por primera vez el",
  personalDetails: "Ficha / Perfil Personal",
  contactInfo: "Datos de contacto",
  age: "años",
  notProvided: "No especificado",
  historyTitle: "Historial de Asistencia Individual",
  notesTitle: "Notas de seguimiento",
  addNote: "Añadir nota...",
  addNoteBtn: "Guardar nota",
  noHistory: "No registra asistencias aún.",

  // Alerts Manager
  alertsCenter: "Centro de Seguimiento y Alertas",
  alertConfigInfo: "Las alertas se activan cuando un miembro falta consecutivamente más de las veces programadas en Configuración (actualmente: {n} veces).",
  noAlerts: "¡Excelente! No hay alertas de ausencias acumuladas que requieran atención.",
  markContacted: "Marcar como contactado",
  addFollowUpNote: "Agregar nota de seguimiento",
  snoozeAlert: "Posponer alerta",
  closeAlert: "Archivar / Cerrar alerta",
  alertChurchMissing: "{name} no ha asistido a los últimos {n} servicios de la iglesia.",
  alertGroupMissing: "{name} no ha asistido a los últimos {n} grupos de conexión.",
  alertMenMissing: "{name} no ha asistido a los últimos {n} grupos de hombres.",
  alertWomenMissing: "{name} no ha asistido a los últimos {n} grupos de mujeres.",
  pendingAlerts: "Alertas Pendientes ({n})",
  followUpAddTitle: "Actualizar Seguimiento",
  responsible: "Responsable",
  contactedStatus: "Estado del contacto",
  statusProgress: "En proceso / Pendiente",
  statusClosed: "Cerrado / Resuelto",
  saveFollowUp: "Guardar seguimiento",

  // Birthdays screen
  birthdaysTitle: "Recordatorio de Cumpleaños",
  birthdaysIntro: "Registramos los cumpleaños para fomentar una comunidad unida y pastoral. El sistema notifica según los días configurados de anticipación.",
  todayBirthdays: "Cumpleaños de hoy 🎉",
  thisWeekBirthdays: "Cumpleaños esta semana 📅",
  upcomingBirthdays: "Próximos cumpleaños",
  noBirthdaysToday: "Nadie cumple años hoy",
  noBirthdaysThisWeek: "No hay más cumpleaños esta semana",
  daysLeft: "falta {n} día",
  daysLeftPlural: "faltan {n} días",
  sendCongratulation: "Saludar por teléfono",

  // Stats Dashboard
  statsTitle: "Métricas de Salud Comunitaria",
  statsRangeSelection: "Intervalo de datos",
  totalAttendanceOverTime: "Asistencia Total a lo Largo del Tiempo",
  comparisonTitle: "Comparación de Servicios y Grupos",
  numericCards: "Resumen General Global",
  totalPeopleInDb: "Total en Base de Datos",
  averageAttendance: "Promedio de Asistencia",
  retentionRate: "Tasa de Retención",
  activeMembersText: "Miembros Activos",
  newMembersThisMonth: "Nuevos del Mes",
  trendTitle: "Tendencia de Crecimiento",
  historicalLogOfSavedEvents: "Registro de Eventos Guardados",
  chartNoData: "Registra más datos de asistencia para ver tendencias completas.",

  // Volunteer
  volunteerLabel: "Voluntario/a",
  volunteerAreasLabel: "Áreas de servicio",
  volunteerAreasConfig: "Áreas de Voluntariado",
  volunteerAreasConfigDesc: "Gestiona las áreas disponibles para asignar voluntarios.",
  addVolunteerArea: "Agregar área",
  volunteerOtraNota: "Descripción del área...",
  isVolunteer: "¿Es voluntario/a?",

  // Config UI
  configTitle: "Ajustes del Sistema",
  alertRules: "Reglas de Alerta por Ausencia",
  churchAlertConfig: "Ausencias consecutivas para alerta de servicios",
  connectionAlertConfig: "Ausencias consecutivas para grupo de conexión",
  menAlertConfig: "Ausencias consecutivas para grupo de hombres",
  womenAlertConfig: "Ausencias consecutivas para grupo de mujeres",
  birthGraceAlert: "Días de anticipación para avisos de cumpleaños",
  activeSubgroups: "Grupos o Sub-ministerios Activos",
  activeSubgroupsDesc: "Activa o desactiva qué opciones de grupos de interés aparecen.",
  languagePreference: "Idioma de la interfaz",
  saveConfig: "Guardar configuración",
  configSaved: "Configuración actualizada con éxito",
  resetMockData: "Borrar Asistencias y Eventos",
  resetMockConfirm: "Se eliminarán todos los registros de asistencia y eventos. Las personas del directorio no se verán afectadas. Esta acción no se puede deshacer.",

  // Modules
  backToModules: "Módulos",
  comingSoon: "Próximamente",
  modulePersonas: "Personas",
  modulePersonasDesc: "Directorio y base de datos",
  moduleAttendance: "Attendance",
  moduleAttendanceDesc: "Registro y estadísticas",
  moduleVolunteers: "Voluntarios",
  moduleVolunteersDesc: "Disponibilidad y roles",
  modulePrayer: "Peticiones de Oración",
  modulePrayerDesc: "Seguimiento de peticiones",
  moduleFollowUp: "Follow-Up",
  moduleFollowUpDesc: "Crecimiento y seguimiento",
};

export const enTranslations: typeof esTranslations = {
  // Login
  appName: "Management Centre",
  tagline: "Latino Community",
  emailLabel: "Email address",
  passwordLabel: "Password",
  enterBtn: "Sign In",
  wrongCredentials: "Invalid credentials. Please attempt again.",
  demoAccess: "Quick Demo Access",
  loginTitle: "Login Gate",
  loginSubtitle: "Protect the private data of our Latina community",

  // Sidebar / Nav
  hello: "Hello",
  registerAttendance: "Register Attendance",
  home: "Home",
  people: "People",
  stats: "Statistics",
  alerts: "Alerts",
  birthdays: "Birthdays",
  calendar: "Calendar",
  history: "History",
  config: "Configuration",
  logout: "Sign Out",

  noEventsThisDay: "No records for this day",
  attendanceDetail: "Attendance detail",
  backToDay: "← Back",

  // Home Screen
  homeHeading: "What would you like to record today?",
  secundaryAccess: "Quick Control Gateways",

  // Attendance Screen
  saveSuccess: "Attendance recorded successfully",
  attendanceRegistered: "Successful attendance registration",
  selectDate: "Select Date",
  searchByName: "Search by name...",
  filterAll: "All",
  filterPresent: "Presents",
  filterAbsent: "Absents",
  filterNew: "News",
  addPerson: "Add Person",
  saveAttendance: "Save Attendance",
  updateAttendance: "Update attendance",
  editingRecord: "Editing saved record",
  summaryOfToday: "Record Summary",
  totalPresents: "Total presents",
  regularPresents: "Regular attendees",
  newPresents: "New arrivals",
  absents: "Absent regular list",
  congratulationAlert: "Awesome job! The event's attendance has been secured for today.",
  alreadySavedTitle: "Attendance already logged today",
  alreadySavedDesc: "Attendance for this event has already been recorded for today. Do you wish to overwrite?",
  overwriteBtn: "Yes, save again",
  keepBtn: "Keep previous log",

  // New Person Page / Modal
  newPersonTitle: "Register New Person",
  fullName: "Full name",
  phone: "Phone number",
  birthDate: "Date of birth",
  gender: "Gender",
  male: "Male",
  female: "Female",
  eventWhereArrived: "First event joined today",
  isFirstTime: "Is this their first time?",
  yes: "Yes",
  no: "No",
  optionalNote: "Optional remarks",
  cancel: "Cancel",
  saveAndMark: "Save & Mark Present",
  fieldRequired: "This field is required",

  // People List Manager
  directoryTitle: "People Directory",
  searchPlaceholder: "Search people by name or phone...",
  statusAll: "Any state",
  statusActive: "Active",
  statusNew: "New",
  statusInactive: "Inactive",
  statusLabel: "Status",
  allContexts: "All groups",
  noPeopleFound: "No community members found with selected filters.",
  joinedOn: "Joined for first time on",
  personalDetails: "Personal Profile Sheet",
  contactInfo: "Contact Details",
  age: "years old",
  notProvided: "Not specified",
  historyTitle: "Individual Attendance History",
  notesTitle: "Pastoral Follow-up Notes",
  addNote: "Add follow-up note...",
  addNoteBtn: "Add note",
  noHistory: "No logged attendance yet.",

  // Alerts Manager
  alertsCenter: "Care & Follow-up Alerts Hub",
  alertConfigInfo: "Alerts are triggered when a member is consecutively absent more than the values set in settings (currently: {n} times).",
  noAlerts: "Great! No accumulated absence alerts requiring immediate action.",
  markContacted: "Mark as contacted",
  addFollowUpNote: "Add contact follow-up note",
  snoozeAlert: "Snooze alert",
  closeAlert: "Archive / Close alert",
  alertChurchMissing: "{name} hasn't attended the last {n} Sunday church services.",
  alertGroupMissing: "{name} hasn't attended the last {n} Connection groups.",
  alertMenMissing: "{name} hasn't attended the last {n} Men's groups.",
  alertWomenMissing: "{name} hasn't attended the last {n} Women's groups.",
  pendingAlerts: "Pending Alerts ({n})",
  followUpAddTitle: "Update Contact Log",
  responsible: "Responsible",
  contactedStatus: "Contact state",
  statusProgress: "In Progress / Pending",
  statusClosed: "Closed / Resolved",
  saveFollowUp: "Save follow-up",

  // Birthdays screen
  birthdaysTitle: "Birthday Reminders",
  birthdaysIntro: "We celebrate birthdays to nurture an affectionate and pastoral community. The system reminds you in advance according to your settings.",
  todayBirthdays: "Today's Birthdays 🎉",
  thisWeekBirthdays: "Birthdays This Week 📅",
  upcomingBirthdays: "Upcoming Birthdays in month",
  noBirthdaysToday: "No birthdays today",
  noBirthdaysThisWeek: "No more birthdays this week",
  daysLeft: "{n} day left",
  daysLeftPlural: "{n} days left",
  sendCongratulation: "Call or text greeting",

  // Stats Dashboard
  statsTitle: "Community Health Metrics",
  statsRangeSelection: "Data selection scope",
  totalAttendanceOverTime: "Total Attendance Progress Over Time",
  comparisonTitle: "Service Hour & Group Breakdown",
  numericCards: "Overall Database Snapshot",
  totalPeopleInDb: "Registered Members",
  averageAttendance: "Average Service Turnout",
  retentionRate: "First-timer Retention",
  activeMembersText: "Active Members",
  newMembersThisMonth: "New This Month",
  trendTitle: "Growth Vectors",
  historicalLogOfSavedEvents: "Historical List of Saved Check-ins",
  chartNoData: "No data logs yet. Log a few services to unlock trends charts.",

  // Volunteer
  volunteerLabel: "Volunteer",
  volunteerAreasLabel: "Service areas",
  volunteerAreasConfig: "Volunteer Areas",
  volunteerAreasConfigDesc: "Manage available areas for assigning volunteers.",
  addVolunteerArea: "Add area",
  volunteerOtraNota: "Area description...",
  isVolunteer: "Is a volunteer?",

  // Config UI
  configTitle: "System Preferences",
  alertRules: "Absence Rule Criteria",
  churchAlertConfig: "Consecutive absences for Sunday service alert",
  connectionAlertConfig: "Consecutive absences for Connection group alert",
  menAlertConfig: "Consecutive absences for Men's group alert",
  womenAlertConfig: "Consecutive absences for Women's group alert",
  birthGraceAlert: "Days in advance to suggest birthday notices",
  activeSubgroups: "Active Sub-groups and Trackers",
  activeSubgroupsDesc: "Configure active sub-groups for quick logins or lists.",
  languagePreference: "Dashboard default language",
  saveConfig: "Apply Adjustments",
  configSaved: "Configuration updated successfully",
  resetMockData: "Clear Attendance & Events",
  resetMockConfirm: "All attendance records and events will be deleted. People in the directory will not be affected. This cannot be undone.",

  // Modules
  backToModules: "Modules",
  comingSoon: "Coming Soon",
  modulePersonas: "People",
  modulePersonasDesc: "Directory and database",
  moduleAttendance: "Attendance",
  moduleAttendanceDesc: "Registration and statistics",
  moduleVolunteers: "Volunteers",
  moduleVolunteersDesc: "Availability and roles",
  modulePrayer: "Prayer Requests",
  modulePrayerDesc: "Prayer request tracking",
  moduleFollowUp: "Follow-Up",
  moduleFollowUpDesc: "Growth and follow-up",
};
