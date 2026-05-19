-- Seed CheckInn demo data
-- MOCK OWNER: connect Supabase Auth later; use same UUID in CHECKINN_MOCK_OWNER_ID

-- \set owner_id '00000000-0000-4000-8000-000000000001'

-- Properties (fixed UUIDs for reference)
INSERT INTO properties (
  id, owner_id, slug, name, location, image_url, status, occupancy, platforms,
  smart_lock_online, wifi_name, wifi_password, house_rules,
  arrival_instructions, lock_instructions, parking_info, pet_policy
) VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'pdd', 'Casa Punta del Diablo', 'Punta del Diablo, Rocha',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
    'ocupada', 82, ARRAY['Airbnb','Booking','WhatsApp'], true,
    'CheckInn_PDD', 'playa2024',
    'No fiestas. Mascotas con aviso previo. Silencio después de las 23:00.',
    'Código de cerradura enviado 24 h antes. Llaves de respaldo en lockbox.',
    'Cerradura inteligente en puerta principal.',
  NULL, 'Mascotas pequeñas con aviso previo.'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'rocha', 'Cabaña Rocha', 'La Paloma, Rocha',
    'https://images.unsplash.com/photo-1518780664697-55e3ad07bfda?w=600&q=80',
    'limpieza', 65, ARRAY['Airbnb','Directa'], true,
    'Rocha_Cabin', 'invitado123',
    'Máximo 6 huéspedes. Parrillero disponible hasta las 22:00.',
    'Self check-in. Instrucciones en PDF.',
    'Puerta cabaña — código en app.',
    NULL, NULL
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'paloma', 'Apartamento La Paloma', 'La Paloma, Rocha',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    'disponible', 71, ARRAY['Booking','Email','WhatsApp'], false,
    'LaPaloma_Apt', 'apto404',
    'Edificio familiar. Ascensor hasta piso 4.',
    'Portero notificado. Código en app de cerradura.',
    'Apartamento 4B — cerradura Yale.',
    NULL, NULL
  )
ON CONFLICT (owner_id, slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO units (id, property_id, slug, name, capacity) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'pdd-1', 'Casa completa', 8),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'rocha-1', 'Cabaña principal', 6),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'paloma-1', 'Apartamento 4B', 4)
ON CONFLICT (property_id, slug) DO NOTHING;

-- Knowledge base
INSERT INTO knowledge_base_items (property_id, category, title, content, status) VALUES
  ('10000000-0000-4000-8000-000000000001', 'wifi', 'WiFi', 'Red CheckInn_PDD, clave playa2024', 'completo'),
  ('10000000-0000-4000-8000-000000000001', 'check_in', 'Check-in', 'Desde las 15:00. Código 24h antes.', 'completo'),
  ('10000000-0000-4000-8000-000000000001', 'parking', 'Estacionamiento', NULL, 'faltante'),
  ('10000000-0000-4000-8000-000000000002', 'wifi', 'WiFi', 'Rocha_Cabin / invitado123', 'completo'),
  ('10000000-0000-4000-8000-000000000002', 'pets', 'Mascotas', NULL, 'incompleto')
ON CONFLICT (property_id, category) DO UPDATE SET status = EXCLUDED.status, content = EXCLUDED.content;

-- Integrations placeholders
INSERT INTO integrations (owner_id, provider, status, sync_status) VALUES
  ('00000000-0000-4000-8000-000000000001', 'airbnb', 'connected', 'ok'),
  ('00000000-0000-4000-8000-000000000001', 'booking', 'connected', 'ok'),
  ('00000000-0000-4000-8000-000000000001', 'whatsapp_business', 'connected', 'ok'),
  ('00000000-0000-4000-8000-000000000001', 'email', 'disconnected', 'pending')
ON CONFLICT (owner_id, provider) DO NOTHING;
