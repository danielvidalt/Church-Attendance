-- ============================================================
-- Seed: Miembros del grupo de Hillsong (extraídos de WhatsApp)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

INSERT INTO personas (id, nombre_completo, sexo, estado, fecha_creacion)
VALUES
  ('p_001', 'Alejandra Robayo',   'F', 'activo', '2026-05-21'),
  ('p_002', 'Charlie',            'M', 'activo', '2026-05-21'),
  ('p_003', 'David',              'M', 'activo', '2026-05-21'),
  ('p_004', 'Jona',               'M', 'activo', '2026-05-21'),
  ('p_005', 'Juan David',         'M', 'activo', '2026-05-21'),
  ('p_006', 'Laura',              'F', 'activo', '2026-05-21'),
  ('p_007', 'Tatiana',            'F', 'activo', '2026-05-21'),
  ('p_008', 'Abby',               'F', 'activo', '2026-05-21'),
  ('p_009', 'Alejandra G',        'F', 'activo', '2026-05-21'),
  ('p_010', 'Alejandra Trujillo', 'F', 'activo', '2026-05-21'),
  ('p_011', 'Andrea Rubiano',     'F', 'activo', '2026-05-21'),
  ('p_012', 'Angi',               'F', 'activo', '2026-05-21'),
  ('p_013', 'Bryan',              'M', 'activo', '2026-05-21'),
  ('p_014', 'Camilo Guzman',      'M', 'activo', '2026-05-21'),
  ('p_015', 'Cleis',              'F', 'activo', '2026-05-21'),
  ('p_016', 'Daniel Lara',        'M', 'activo', '2026-05-21'),
  ('p_017', 'David Hillsong',     'M', 'activo', '2026-05-21'),
  ('p_018', 'Diana',              'F', 'activo', '2026-05-21'),
  ('p_019', 'Diego P',            'M', 'activo', '2026-05-21'),
  ('p_020', 'Elizabeth',          'F', 'activo', '2026-05-21'),
  ('p_021', 'Fabián',             'M', 'activo', '2026-05-21'),
  ('p_022', 'James',              'M', 'activo', '2026-05-21'),
  ('p_023', 'Johanna',            'F', 'activo', '2026-05-21'),
  ('p_024', 'John',               'M', 'activo', '2026-05-21'),
  ('p_025', 'Juan Cañon',         'M', 'activo', '2026-05-21'),
  ('p_026', 'Laura Hillsong',     'F', 'activo', '2026-05-21'),
  ('p_027', 'Mar',                'F', 'activo', '2026-05-21'),
  ('p_028', 'Marce',              'F', 'activo', '2026-05-21'),
  ('p_029', 'Marisol',            'F', 'activo', '2026-05-21'),
  ('p_030', 'Nata',               'F', 'activo', '2026-05-21'),
  ('p_031', 'Noelia',             'F', 'activo', '2026-05-21'),
  ('p_032', 'Sabrina',            'F', 'activo', '2026-05-21'),
  ('p_033', 'Tania',              'F', 'activo', '2026-05-21')
ON CONFLICT (id) DO NOTHING;
