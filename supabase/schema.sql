-- ============================================================
-- Asistencia Latina — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ── Personas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personas (
  id                  TEXT PRIMARY KEY,
  nombre_completo     TEXT NOT NULL,
  telefono            TEXT,
  fecha_nacimiento    TEXT,
  fecha_creacion      TEXT NOT NULL,
  fecha_primera_visita TEXT,
  estado              TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'nuevo', 'inactivo')),
  sexo                TEXT NOT NULL CHECK (sexo IN ('M', 'F')),
  notas               TEXT,
  foto_perfil         TEXT,
  es_voluntario       BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Migración para bases de datos existentes
ALTER TABLE personas ADD COLUMN IF NOT EXISTS es_voluntario BOOLEAN NOT NULL DEFAULT false;

-- ── Eventos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id              TEXT PRIMARY KEY,
  nombre_evento   TEXT NOT NULL,
  tipo_evento     TEXT NOT NULL,
  fecha           TEXT NOT NULL,
  creado_por      TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Asistencias ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asistencias (
  id              TEXT PRIMARY KEY,
  persona_id      TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  evento_id       TEXT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  presente        BOOLEAN NOT NULL DEFAULT false,
  es_nuevo        BOOLEAN NOT NULL DEFAULT false,
  fecha_registro  TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Seguimientos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguimientos (
  id                  TEXT PRIMARY KEY,
  persona_id          TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  motivo              TEXT NOT NULL,
  estado              TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cerrado')),
  nota                TEXT,
  fecha_creacion      TEXT NOT NULL,
  fecha_contacto      TEXT,
  usuario_responsable TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Configuración (una sola fila, id = 1) ─────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  id                                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  alerta_ausencias_iglesia          INTEGER NOT NULL DEFAULT 3,
  alerta_ausencias_grupo_conexion   INTEGER NOT NULL DEFAULT 3,
  alerta_ausencias_grupo_hombres    INTEGER NOT NULL DEFAULT 3,
  alerta_ausencias_grupo_mujeres    INTEGER NOT NULL DEFAULT 3,
  dias_recordatorio_cumpleanos      INTEGER NOT NULL DEFAULT 1,
  idioma_por_defecto                TEXT NOT NULL DEFAULT 'es',
  grupos_activos                    JSONB NOT NULL DEFAULT '{"grupo_conexion":true,"grupo_hombres":true,"grupo_mujeres":true}'
);

-- Insertar fila de config por defecto si no existe
INSERT INTO configuracion (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Event Tracks personalizados ───────────────────────────────
CREATE TABLE IF NOT EXISTS event_tracks (
  id          TEXT PRIMARY KEY,
  title_es    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  label_es    TEXT NOT NULL,
  label_en    TEXT NOT NULL,
  type        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  color       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Áreas de Voluntariado ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_areas (
  id            TEXT PRIMARY KEY,
  nombre_es     TEXT NOT NULL,
  nombre_en     TEXT NOT NULL,
  permite_nota  BOOLEAN NOT NULL DEFAULT false,
  contexto      TEXT NOT NULL DEFAULT 'iglesia' CHECK (contexto IN ('iglesia', 'latina_domingo', 'latina_conexion')),
  orden         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE volunteer_areas ADD COLUMN IF NOT EXISTS contexto TEXT NOT NULL DEFAULT 'iglesia';

INSERT INTO volunteer_areas (id, nombre_es, nombre_en, permite_nota, contexto, orden) VALUES
  ('area_comma',                    'Comma (café)',                'Comma (café)',                false, 'iglesia',         1),
  ('area_eventos',                  'Eventos',                     'Events',                      false, 'iglesia',         2),
  ('area_fotografia',               'Fotografía',                  'Photography',                 false, 'iglesia',         3),
  ('area_kids',                     'Kids',                        'Kids',                        false, 'iglesia',         4),
  ('area_camaras',                  'Cámaras',                     'Cameras',                     false, 'iglesia',         5),
  ('area_worship',                  'Worship',                     'Worship',                     false, 'iglesia',         6),
  ('area_growth_hub',               'Growth Hub',                  'Growth Hub',                  false, 'iglesia',         7),
  ('area_car_park',                 'Car Park',                    'Car Park',                    false, 'iglesia',         8),
  ('area_cafe_nuevos',              'Café (nuevos)',               'Café (new people)',           false, 'iglesia',         9),
  ('area_conectando_nuevos',        'Conectando nuevos',           'Connecting new people',       false, 'iglesia',         10),
  ('area_welcome',                  'Welcome',                     'Welcome',                     false, 'latina_domingo',  11),
  ('area_interpretacion',           'Interpretación',              'Interpretation',              false, 'latina_domingo',  12),
  ('area_reserva_asientos',         'Reserva de asientos',         'Seat reservation',            false, 'latina_domingo',  13),
  ('area_almuerzo_post_service',    'Almuerzo post service',       'Post-service lunch',          false, 'latina_domingo',  14),
  ('area_cena_post_service',        'Cena post service',           'Post-service dinner',         false, 'latina_domingo',  15),
  ('area_latina',                   'Encargado Comunidad Latina',  'Latina Community lead',       false, 'latina_domingo',  16),
  ('area_resumen_predica',          'Resumen Predica',             'Sermon summary',              false, 'latina_domingo',  17),
  ('area_mensaje_gc',               'Mensaje',                     'Message',                     false, 'latina_conexion', 18),
  ('area_animacion_gc',             'Animación',                   'Hosting',                     false, 'latina_conexion', 19),
  ('area_worship_gc',               'Worship',                     'Worship',                     false, 'latina_conexion', 20),
  ('area_oracion_gc',               'Oración',                     'Prayer',                      false, 'latina_conexion', 21),
  ('area_orden_limpieza_antes_gc',  'Orden y Limpieza (Antes)',    'Setup and cleaning (before)', false, 'latina_conexion', 22),
  ('area_orden_limpieza_despues_gc','Orden y Limpieza (Despues)',  'Setup and cleaning (after)',  false, 'latina_conexion', 23),
  ('area_otro',                     'Otro',                        'Other',                       true,  'latina_domingo',  24)
ON CONFLICT (id) DO UPDATE SET
  nombre_es = EXCLUDED.nombre_es,
  nombre_en = EXCLUDED.nombre_en,
  permite_nota = EXCLUDED.permite_nota,
  contexto = EXCLUDED.contexto,
  orden = EXCLUDED.orden;

-- Campos de voluntariado en personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS es_voluntario BOOLEAN DEFAULT false;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS areas_voluntario JSONB DEFAULT '[]';

-- ── Programación de Voluntarios ───────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id                  TEXT PRIMARY KEY,
  persona_id          TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  area_id             TEXT NOT NULL REFERENCES volunteer_areas(id) ON DELETE CASCADE,
  servicio_tipo       TEXT,
  fecha               TEXT NOT NULL,
  horario             TEXT,
  estado              TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'pendiente', 'confirmado', 'rechazado', 'necesita_reemplazo', 'completado')),
  notas               TEXT,
  lider_responsable   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE volunteer_assignments ADD COLUMN IF NOT EXISTS servicio_tipo TEXT;

-- ── Peticiones de Oración ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_requests (
  id                  TEXT PRIMARY KEY,
  persona_id          TEXT REFERENCES personas(id) ON DELETE SET NULL,
  solicitante_nombre  TEXT NOT NULL,
  fecha               TEXT NOT NULL,
  categoria           TEXT NOT NULL,
  privacidad          TEXT NOT NULL DEFAULT 'privada' CHECK (privacidad IN ('publica', 'privada', 'confidencial')),
  descripcion         TEXT NOT NULL,
  estado              TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'seguimiento', 'contestada', 'cerrada')),
  responsable         TEXT,
  fecha_seguimiento   TEXT,
  resultado           TEXT,
  orando_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Perfiles de usuario (vinculado a Supabase Auth) ───────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre              TEXT NOT NULL,
  rol                 TEXT NOT NULL DEFAULT 'lider' CHECK (rol IN ('administrador', 'lider', 'seguimiento')),
  idioma_preferido    TEXT NOT NULL DEFAULT 'es'
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE personas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimientos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_areas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden leer y escribir todo
CREATE POLICY "auth_all" ON personas        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON eventos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON asistencias     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON seguimientos    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON configuracion   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON event_tracks      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON volunteer_areas   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON volunteer_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON prayer_requests   FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cada usuario solo ve y edita su propio perfil
CREATE POLICY "own_profile" ON profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── Trigger: crear perfil automáticamente al registrarse ──────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, nombre, rol, idioma_preferido)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'lider'),
    'es'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
