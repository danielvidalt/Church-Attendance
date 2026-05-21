# Documento de diseño — App de asistencia Comunidad Latina

## 1. Resumen del proyecto

La app servirá para registrar de forma rápida la asistencia de la Comunidad Latina en cinco contextos principales:

1. Servicio del domingo a las 11:00 am.
2. Servicio del domingo a las 6:00 pm.
3. Grupo de conexión.
4. Grupo de hombres.
5. Grupo de mujeres.

La app estará pensada principalmente para celular y iPad, sin descartar el uso en computador. La prioridad será que el registro sea rápido, claro e intuitivo, usando checkboxes como una lista de colegio.

También permitirá registrar personas nuevas, ver estadísticas visuales, recibir alertas de ausencias acumuladas y recibir recordatorios de cumpleaños.

---

## 2. Problema que resuelve

Actualmente se necesita saber:

- Cuántas personas asisten al servicio de las 11:00 am.
- Cuántas personas asisten al servicio de las 6:00 pm.
- Cuántas personas asisten al grupo de conexión.
- Cuántas personas asisten al grupo de hombres.
- Cuántas personas asisten al grupo de mujeres.
- Quiénes son las personas que asisten, no solo el número total.
- Cuántas personas nuevas llegan en cada reunión.
- Quiénes han dejado de asistir a la iglesia en general.
- Quiénes han dejado de asistir a grupos de conexión.
- Cuándo una persona está de cumpleaños.
- Cómo va creciendo o bajando la asistencia con el tiempo.

La app centraliza toda esta información para que no dependa de papeles, notas sueltas o memoria.

---

## 3. Objetivo principal

Crear una app simple, rápida e intuitiva para registrar asistencia, personas nuevas, cumpleaños, alertas y estadísticas de la Comunidad Latina.

Debe ser tan fácil de usar que una persona sin conocimiento técnico pueda abrirla, elegir el evento, marcar asistentes y guardar.

---

## 4. Usuarios principales

### 4.1 Administrador principal

Persona que puede:

- Crear, editar o eliminar personas.
- Ver estadísticas completas.
- Ver alertas de ausencia.
- Crear eventos.
- Configurar reglas de alertas.
- Configurar recordatorios de cumpleaños.
- Administrar usuarios que pueden usar la app.

### 4.2 Líder o voluntario de asistencia

Persona que puede:

- Seleccionar un servicio o grupo.
- Marcar asistencia.
- Registrar personas nuevas.
- Guardar el registro del día.

### 4.3 Líder de seguimiento

Persona que puede:

- Ver alertas de personas ausentes.
- Ver historial de asistencia de una persona.
- Marcar si ya se contactó a alguien.
- Agregar notas simples de seguimiento.

---

## 5. Datos iniciales del proyecto

Según la información entregada:

- Comunidad actual aproximada: 30 personas.
- Usuarios iniciales de la app: 2 personas.
- Por ahora, las mismas 2 personas podrán ver y usar la información.
- Grupo de conexión actual: 1 grupo.
- A futuro se podrán crear más grupos de conexión.
- La comunidad registrada será de adultos; no se necesita separar niños, jóvenes y adultos por ahora.
- Se guardará teléfono de las personas nuevas.
- No se usará email de las personas por ahora.
- La alerta de ausencia será personalizable, con 3 ausencias como valor por defecto.
- No se necesita exportar a Excel en la primera versión.
- La app será bilingüe: español e inglés. El usuario podrá elegir idioma.
- No hay logo oficial por ahora.

---

## 6. Plataformas necesarias

La app debe funcionar en:

- Celular.
- iPad/tablet.
- Computador.

Recomendación inicial: construir una app universal con Expo + React Native, conectada a Supabase como base de datos.

En palabras simples: Expo sería como construir una sola casa con puertas para celular, tablet y web. Supabase sería como el archivador seguro donde se guardan los nombres, asistencias, cumpleaños, alertas y estadísticas.

---

## 7. Flujo principal de uso

### Paso 1: Inicio de sesión

El usuario entra con correo y contraseña.

Esto evita que cualquier persona pueda ver nombres, teléfonos o información privada de la comunidad.

### Paso 2: Página de inicio

La primera pantalla debe mostrar botones grandes:

1. Servicio 11:00 am.
2. Servicio 6:00 pm.
3. Grupo de conexión.
4. Grupo de hombres.
5. Grupo de mujeres.

También debe mostrar accesos secundarios a:

- Personas.
- Estadísticas.
- Alertas.
- Cumpleaños.
- Configuración.

### Paso 3: Selección del evento

Cuando el usuario toca un botón, la app abre la lista de personas registradas para ese contexto.

Ejemplo:

- Si toca “Servicio 11:00 am”, ve la lista de personas activas para servicios de iglesia.
- Si toca “Grupo de conexión”, ve la lista de personas del grupo de conexión.
- Si toca “Grupo de hombres”, ve la lista correspondiente a ese grupo.
- Si toca “Grupo de mujeres”, ve la lista correspondiente a ese grupo.

### Paso 4: Registro rápido de asistencia

La pantalla muestra:

- Fecha del día.
- Nombre del evento.
- Lista de personas.
- Checkbox al lado de cada nombre.
- Buscador rápido.
- Botón “Agregar persona nueva”.
- Botón “Guardar asistencia”.

Ejemplo visual:

- [x] María González
- [x] Juan Pérez
- [ ] Ana Torres
- [x] Carlos Rivera

### Paso 5: Agregar persona nueva

Si llega alguien nuevo, el usuario toca “Agregar persona nueva”.

Campos mínimos:

- Nombre completo.
- Teléfono, opcional.
- Fecha de nacimiento, opcional.
- Evento donde llegó: 11 am, 6 pm, grupo de conexión, grupo de hombres o grupo de mujeres.
- Nota opcional.

La persona nueva queda marcada automáticamente como asistente de ese día.

### Paso 6: Guardar

El usuario toca “Guardar asistencia”.

La app confirma:

“Asistencia guardada correctamente”.

Después puede mostrar un resumen:

- Total presentes: 28.
- Personas regulares: 26.
- Personas nuevas: 2.
- Ausentes de la lista regular: 4.

---

## 8. Pantallas principales de la app

## 8.1 Pantalla de login

Objetivo: proteger la información.

Elementos:

- Nombre de la app.
- Campo de correo.
- Campo de contraseña.
- Botón “Entrar”.
- Selector de idioma: Español / English.

---

## 8.2 Pantalla de inicio

Objetivo: elegir rápidamente qué se va a registrar.

Elementos:

- Saludo: “Hola, ¿qué quieres registrar hoy?”
- Botón grande: Servicio 11:00 am.
- Botón grande: Servicio 6:00 pm.
- Botón grande: Grupo de conexión.
- Botón grande: Grupo de hombres.
- Botón grande: Grupo de mujeres.
- Acceso secundario a estadísticas.
- Acceso secundario a personas.
- Acceso secundario a alertas.
- Acceso secundario a cumpleaños.
- Acceso secundario a configuración.

---

## 8.3 Pantalla de asistencia

Objetivo: marcar presentes de manera rápida.

Elementos:

- Título del evento.
- Fecha.
- Buscador por nombre.
- Lista de personas con checkbox.
- Filtro: todos, presentes, ausentes, nuevos.
- Botón “Agregar persona nueva”.
- Botón “Guardar asistencia”.

Funciones importantes:

- Marcar y desmarcar personas.
- Buscar rápido.
- Ver cuántos van marcados en tiempo real.
- Evitar guardar dos veces el mismo evento del mismo día sin confirmación.

---

## 8.4 Pantalla de nueva persona

Objetivo: registrar a alguien nuevo sin hacer lento el proceso.

Campos recomendados:

- Nombre completo. Obligatorio.
- Teléfono. Opcional.
- Fecha de nacimiento. Opcional.
- Servicio o grupo donde llegó. Obligatorio.
- ¿Es primera vez? Sí/No.
- Nota breve. Opcional.

Botones:

- Guardar y marcar presente.
- Cancelar.

---

## 8.5 Pantalla de personas

Objetivo: administrar la base de datos de la comunidad.

Elementos:

- Lista de personas.
- Buscador.
- Filtros por servicio o grupo.
- Estado: activo, nuevo, inactivo.
- Perfil de cada persona.

Dentro del perfil de una persona debe mostrarse:

- Nombre.
- Teléfono.
- Fecha de nacimiento.
- Fecha en que llegó por primera vez.
- Historial de asistencia.
- Notas.

No se incluirá email por ahora.

---

## 8.6 Pantalla de alertas

Objetivo: saber quién necesita seguimiento.

La regla de alerta debe ser personalizable. Por defecto será de 3 ausencias, pero el usuario podrá cambiarla a 2, 4, 5 o el número que necesite.

### Tipos de alertas

#### Alerta por ausencia a servicios de iglesia

Esta alerta se activa solo cuando la persona no ha asistido a ningún servicio de iglesia durante la cantidad configurada de domingos o servicios evaluados.

Importante: si una persona fue un domingo al servicio de las 11:00 am y al siguiente domingo fue al servicio de las 6:00 pm, la app debe entender que esa persona sigue asistiendo a la iglesia. En ese caso no debe saltar alerta.

Mensaje ejemplo:

“María González no ha asistido a los últimos 3 servicios en la iglesia.”

#### Alerta por ausencia a grupo de conexión

Esta alerta es independiente de los servicios del domingo. Se activa cuando una persona falta a varios grupos de conexión seguidos, según la configuración.

Mensaje ejemplo:

“María González no ha asistido a los últimos 3 grupos de conexión.”

#### Alerta por ausencia a grupo de hombres o mujeres

Esta alerta se activa cuando una persona falta repetidamente al grupo específico al que pertenece.

Mensaje ejemplo:

“Juan Pérez no ha asistido a los últimos 3 grupos de hombres.”

“María González no ha asistido a los últimos 3 grupos de mujeres.”

### Acciones disponibles en cada alerta

- Marcar como contactado.
- Agregar nota.
- Posponer alerta.
- Cerrar alerta.

---

## 8.7 Pantalla de cumpleaños

Objetivo: recordar cuándo una persona está de cumpleaños para poder saludarla y cuidarla mejor.

Elementos:

- Lista de cumpleaños próximos.
- Cumpleaños de hoy.
- Cumpleaños de esta semana.
- Configuración de recordatorio.

Regla recomendada:

- Por defecto, la app avisa 1 día antes del cumpleaños.
- El usuario puede configurar el aviso para el mismo día, 1 día antes, 3 días antes, 7 días antes u otra cantidad de días.

Mensaje ejemplo:

“Recordatorio: mañana es el cumpleaños de María González.”

Si el recordatorio está configurado para el mismo día:

“Hoy es el cumpleaños de María González.”

---

## 8.8 Pantalla de estadísticas

Objetivo: ver la salud y crecimiento de la comunidad.

Estadísticas recomendadas:

1. Asistencia total por fecha.
2. Comparación entre servicio 11 am y 6 pm.
3. Asistencia total de iglesia sumando 11 am + 6 pm.
4. Asistencia del grupo de conexión.
5. Asistencia del grupo de hombres.
6. Asistencia del grupo de mujeres.
7. Personas nuevas por semana o mes.
8. Personas recurrentes.
9. Personas ausentes varias veces.
10. Promedio mensual de asistencia.
11. Tendencia de crecimiento o disminución.
12. Cumpleaños próximos.

Visualizaciones recomendadas:

- Gráfico de línea: asistencia a través del tiempo.
- Gráfico de barras: comparación 11 am vs 6 pm vs grupos.
- Tarjetas numéricas: total de presentes, nuevos, ausentes.
- Lista de alertas prioritarias.

---

## 8.9 Pantalla de configuración

Objetivo: permitir que la app se adapte sin tener que cambiar código.

Configuraciones necesarias:

- Idioma: Español / English.
- Número de ausencias para alerta de iglesia.
- Número de ausencias para alerta de grupo de conexión.
- Número de ausencias para alerta de grupo de hombres.
- Número de ausencias para alerta de grupo de mujeres.
- Días de anticipación para recordatorio de cumpleaños.
- Crear nuevos grupos de conexión a futuro.
- Activar o desactivar tipos de grupos.

---

## 9. Datos que debe guardar la app

## 9.1 Tabla: Personas

Campos:

- id.
- nombre_completo.
- telefono.
- fecha_nacimiento.
- fecha_creacion.
- fecha_primera_visita.
- estado: activo, nuevo, inactivo.
- notas.

## 9.2 Tabla: Eventos

Campos:

- id.
- nombre_evento.
- tipo_evento: servicio_11, servicio_6, grupo_conexion, grupo_hombres, grupo_mujeres.
- fecha.
- creado_por.

## 9.3 Tabla: Asistencias

Campos:

- id.
- persona_id.
- evento_id.
- presente: sí/no.
- es_nuevo: sí/no.
- fecha_registro.

## 9.4 Tabla: Usuarios

Campos:

- id.
- nombre.
- email_login.
- rol: administrador, líder, seguimiento.
- idioma_preferido: es/en.

Nota: el email se usará solo para iniciar sesión de usuarios de la app. No se guardará email de las personas de la comunidad por ahora.

## 9.5 Tabla: Seguimientos

Campos:

- id.
- persona_id.
- motivo.
- estado: pendiente, contactado, cerrado.
- nota.
- fecha_creacion.
- fecha_contacto.
- usuario_responsable.

## 9.6 Tabla: Configuración

Campos:

- id.
- alerta_ausencias_iglesia: número. Valor por defecto: 3.
- alerta_ausencias_grupo_conexion: número. Valor por defecto: 3.
- alerta_ausencias_grupo_hombres: número. Valor por defecto: 3.
- alerta_ausencias_grupo_mujeres: número. Valor por defecto: 3.
- dias_recordatorio_cumpleanos: número. Valor por defecto: 1.
- idioma_por_defecto: es/en.

---

## 10. Reglas de negocio

1. Una persona puede asistir a más de un contexto.
2. Una persona nueva debe poder registrarse en menos de 30 segundos.
3. La asistencia debe guardarse por fecha y tipo de evento.
4. No se debe duplicar la misma persona si ya existe.
5. Si una persona falta 3 eventos seguidos, se crea una alerta por defecto.
6. El número de ausencias para activar alertas debe ser personalizable.
7. La alerta de iglesia debe calcularse sumando la asistencia a los servicios del domingo, tanto 11:00 am como 6:00 pm.
8. Si la persona asistió a cualquiera de los dos servicios del domingo, no debe considerarse ausente de la iglesia.
9. La alerta de grupo de conexión se calcula aparte de los servicios del domingo.
10. La alerta de grupo de hombres se calcula aparte.
11. La alerta de grupo de mujeres se calcula aparte.
12. El recordatorio de cumpleaños debe ser configurable.
13. Por defecto, el recordatorio de cumpleaños aparece 1 día antes.
14. Las estadísticas deben actualizarse automáticamente al guardar asistencia.
15. Solo usuarios autorizados deben ver o modificar datos.
16. Las notas de seguimiento deben mantenerse privadas.
17. La app debe funcionar en español e inglés.

---

## 11. Diseño visual recomendado

Estilo: limpio, moderno, cálido y pastoral.

Colores sugeridos:

- Azul profundo: confianza y orden.
- Blanco o gris claro: limpieza visual.
- Verde suave: asistencia confirmada.
- Amarillo/naranja suave: alerta de seguimiento.
- Rojo suave: ausencia repetida.

Sensación buscada:

- Fácil.
- Clara.
- No técnica.
- Amigable.
- Rápida.

Botones grandes, textos legibles y mucho espacio entre elementos para facilitar el uso en celular e iPad.

Como no hay logo por ahora, la app puede comenzar con un nombre simple y una identidad visual temporal.

---

## 12. Recomendación técnica inicial

### Opción recomendada

- Frontend/app: Expo + React Native.
- Base de datos: Supabase.
- Autenticación: Supabase Auth.
- Hosting web: Vercel.
- Repositorio: GitHub.
- Editor: Visual Studio Code o Cursor.

### Por qué esta opción

Expo + React Native permite crear una app para iPhone, Android, iPad y web desde una sola base de código. Supabase funciona como una base de datos organizada y fácil de consultar, ideal para reportes, estadísticas y tablas de asistencia.

Para este proyecto, Supabase es especialmente conveniente porque los datos son relacionales: personas, eventos, asistencias, configuraciones, cumpleaños y seguimientos. Es como tener varias hojas de cálculo conectadas entre sí, pero de manera más ordenada y profesional.

Vercel servirá para publicar la versión web de la app, especialmente útil para usarla desde computador o navegador del iPad.

---

## 13. Versión 1 recomendada

La primera versión no debe intentar hacerlo todo. Debe enfocarse en lo esencial.

### Funciones de la versión 1

- Login.
- Selector de idioma: español / inglés.
- Pantalla de inicio con 5 opciones.
- Lista de personas por evento o grupo.
- Checkbox de asistencia.
- Agregar persona nueva.
- Guardar asistencia.
- Ver resumen del día.
- Ver estadísticas básicas.
- Ver alertas por ausencias personalizables.
- Ver recordatorios de cumpleaños.
- Configurar número de ausencias para alertas.
- Configurar días de anticipación para cumpleaños.

### Funciones para versión 2

- Notificaciones automáticas al celular.
- Exportar reportes a PDF o Excel.
- Enviar mensajes por WhatsApp.
- Roles más avanzados.
- Historial pastoral más completo.
- Dashboard avanzado por meses y años.
- Varios grupos de conexión.
- Logo e identidad visual oficial.

---

## 14. Ejemplo de experiencia de usuario

Domingo, 10:55 am.

1. El encargado abre la app en el iPad.
2. Inicia sesión.
3. Toca “Servicio 11:00 am”.
4. Se abre la lista de personas.
5. Marca con checkbox a quienes llegaron.
6. Llega una persona nueva llamada Pedro.
7. Toca “Agregar persona nueva”.
8. Escribe “Pedro Martínez”.
9. Agrega teléfono si lo tiene.
10. Agrega fecha de nacimiento si la persona desea compartirla.
11. Guarda.
12. Pedro queda marcado como nuevo y presente.
13. Al final toca “Guardar asistencia”.
14. La app muestra: 28 presentes, 2 nuevos, 4 ausentes.
15. Las estadísticas se actualizan.
16. Si alguien no asistió ni al servicio de las 11:00 am ni al servicio de las 6:00 pm por la cantidad configurada, aparece una alerta.

Ejemplo de alerta correcta:

“María González no ha asistido a los últimos 3 servicios en la iglesia.”

Ejemplo donde no debe aparecer alerta:

- Domingo 1: María va al servicio de las 11:00 am.
- Domingo 2: María va al servicio de las 6:00 pm.
- Domingo 3: María va al servicio de las 11:00 am.

Aunque cambió de horario, sigue asistiendo a la iglesia. Por eso no debe aparecer alerta.

---

## 15. Lógica especial de alertas

La parte más importante es que la app no confunda “cambió de servicio” con “dejó de asistir”.

### 15.1 Alerta de iglesia

Para revisar si alguien faltó a la iglesia, la app debe sumar los dos servicios del domingo:

- Servicio 11:00 am.
- Servicio 6:00 pm.

Si la persona asistió a cualquiera de los dos, cuenta como presente en la iglesia.

Solo cuenta como ausencia cuando no aparece en ninguno de los dos servicios.

### 15.2 Alerta de grupo de conexión

Se calcula separada de la asistencia del domingo.

Aunque la persona vaya al servicio del domingo, puede aparecer alerta si no ha asistido al grupo de conexión por la cantidad configurada.

Mensaje:

“María González no ha asistido a los últimos 3 grupos de conexión.”

### 15.3 Alerta de grupo de hombres

Se calcula separada de los servicios y del grupo de conexión.

Mensaje:

“Juan Pérez no ha asistido a los últimos 3 grupos de hombres.”

### 15.4 Alerta de grupo de mujeres

Se calcula separada de los servicios y del grupo de conexión.

Mensaje:

“María González no ha asistido a los últimos 3 grupos de mujeres.”

---

## 16. Propuesta de nombre del proyecto

Opciones:

- Asistencia Latina.
- Comunidad Check-in.
- Registro Comunidad Latina.
- Conexión Latina App.
- Mi Comunidad Latina.

Nombre recomendado por ahora: Asistencia Latina.

Es claro, directo y fácil de entender.

---

## 17. Próximo paso recomendado

El siguiente paso es crear el mapa visual de pantallas antes de programar.

Orden recomendado:

1. Confirmar este documento.
2. Diseñar el mapa de pantallas.
3. Crear un prototipo visual simple.
4. Crear la base de datos en Supabase.
5. Construir la versión 1.
6. Probar con datos reales de una semana.
7. Ajustar antes de lanzar oficialmente.

---

## 18. Decisión técnica recomendada para comenzar

Para empezar de forma ordenada y sin gastar dinero al inicio:

1. Usar Visual Studio Code o Cursor para programar.
2. Usar Expo + React Native para construir la app.
3. Usar Supabase para guardar personas, asistencias, alertas y configuración.
4. Usar GitHub para guardar el código.
5. Usar Vercel para publicar la versión web.

Esta ruta es la más conveniente para una app que debe crecer, porque no obliga a rehacer todo cuando pasemos de celular a iPad o web.

