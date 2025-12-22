-- =============================================================================
-- Pulse CRM - Seed Data for Preview Branches
-- =============================================================================
-- This file runs automatically when a preview branch is created.
-- It creates sample users and data for testing.
--
-- IMPORTANT: This data is ONLY for preview/development branches.
-- Production does NOT run this seed file (see config.toml remotes.production).
-- =============================================================================

-- =============================================================================
-- SECTION 1: Create Test Users via auth.users
-- =============================================================================
-- Note: In preview branches, we insert directly into auth.users.
-- The profile trigger will automatically create corresponding profiles.

-- Admin user (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@crm.local',
  extensions.crypt('123456', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"username": "admin", "display_name": "Admin Test", "role": "admin"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Sales user 1: Marie (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'marie@crm.local',
  extensions.crypt('123456', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"username": "marie", "display_name": "Marie Dupont", "role": "sales"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Sales user 2: Jean (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'jean@crm.local',
  extensions.crypt('123456', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"username": "jean", "display_name": "Jean Martin", "role": "sales"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Sales user 3: Sophie (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'sophie@crm.local',
  extensions.crypt('123456', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"username": "sophie", "display_name": "Sophie Bernard", "role": "sales"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 1b: Create Auth Identities (required for login)
-- =============================================================================
-- Supabase Auth requires an identity record for each user to enable login

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'email',
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@crm.local", "email_verified": false, "phone_verified": false}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'email',
    '{"sub": "00000000-0000-0000-0000-000000000002", "email": "marie@crm.local", "email_verified": false, "phone_verified": false}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'email',
    '{"sub": "00000000-0000-0000-0000-000000000003", "email": "jean@crm.local", "email_verified": false, "phone_verified": false}'::jsonb,
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'email',
    '{"sub": "00000000-0000-0000-0000-000000000004", "email": "sophie@crm.local", "email_verified": false, "phone_verified": false}'::jsonb,
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 2: Create Profiles Explicitly
-- =============================================================================
-- Insert profiles directly (trigger may not fire reliably in local dev)

INSERT INTO public.profiles (id, role, display_name, avatar, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin Test', 'avatar-01', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'sales', 'Marie Dupont', 'avatar-02', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'sales', 'Jean Martin', 'avatar-03', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'sales', 'Sophie Bernard', 'avatar-04', now(), now())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  avatar = EXCLUDED.avatar;

-- =============================================================================
-- SECTION 3: Sample Leads (50 leads with various statuses)
-- =============================================================================

-- Leads assigned to Marie (15 leads)
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, postal_code, status, status_label, source, assigned_to, created_at)
VALUES
  ('EXT-001', 'Pierre', 'Lefebvre', 'pierre.lefebvre@example.com', '0612345678', 'TechCorp SARL', 'Paris', '75001', 'new', 'Nouveau', 'Site web', '00000000-0000-0000-0000-000000000002', now() - interval '1 day'),
  ('EXT-002', 'Claire', 'Moreau', 'claire.moreau@example.com', '0623456789', 'InnoSoft', 'Lyon', '69001', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000002', now() - interval '2 days'),
  ('EXT-003', 'Antoine', 'Garcia', 'antoine.garcia@example.com', '0634567890', 'DataPlus', 'Marseille', '13001', 'callback', 'Rappeler', 'Referral', '00000000-0000-0000-0000-000000000002', now() - interval '3 days'),
  ('EXT-004', 'Isabelle', 'Roux', 'isabelle.roux@example.com', '0645678901', 'CloudFirst', 'Toulouse', '31000', 'rdv', 'RDV', 'Salon', '00000000-0000-0000-0000-000000000002', now() - interval '4 days'),
  ('EXT-005', 'Thomas', 'Petit', 'thomas.petit@example.com', '0656789012', 'WebAgency', 'Nice', '06000', 'no_answer_1', 'Pas de reponse 1', 'Cold call', '00000000-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('EXT-006', 'Camille', 'Durand', 'camille.durand@example.com', '0667890123', 'FinTech SA', 'Nantes', '44000', 'deposit', 'Depot', 'Site web', '00000000-0000-0000-0000-000000000002', now() - interval '6 days'),
  ('EXT-007', 'Lucas', 'Simon', 'lucas.simon@example.com', '0678901234', 'GreenEnergy', 'Strasbourg', '67000', 'new', 'Nouveau', 'Publicite', '00000000-0000-0000-0000-000000000002', now() - interval '7 days'),
  ('EXT-008', 'Emma', 'Laurent', 'emma.laurent@example.com', '0689012345', 'HealthCare+', 'Bordeaux', '33000', 'relance', 'Relance', 'LinkedIn', '00000000-0000-0000-0000-000000000002', now() - interval '8 days'),
  ('EXT-009', 'Hugo', 'Michel', 'hugo.michel@example.com', '0690123456', 'AutoParts', 'Lille', '59000', 'won', 'Gagne', 'Referral', '00000000-0000-0000-0000-000000000002', now() - interval '9 days'),
  ('EXT-010', 'Lea', 'Girard', 'lea.girard@example.com', '0601234567', 'FoodService', 'Rennes', '35000', 'lost', 'Perdu', 'Salon', '00000000-0000-0000-0000-000000000002', now() - interval '10 days'),
  ('EXT-011', 'Nathan', 'Andre', 'nathan.andre@example.com', '0611111111', 'LogiTrans', 'Montpellier', '34000', 'new', 'Nouveau', 'Site web', '00000000-0000-0000-0000-000000000002', now() - interval '11 days'),
  ('EXT-012', 'Chloe', 'Leroy', 'chloe.leroy@example.com', '0622222222', 'MediaPro', 'Grenoble', '38000', 'callback', 'Rappeler', 'Cold call', '00000000-0000-0000-0000-000000000002', now() - interval '12 days'),
  ('EXT-013', 'Maxime', 'Morel', 'maxime.morel@example.com', '0633333333', 'BuildCo', 'Dijon', '21000', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000002', now() - interval '13 days'),
  ('EXT-014', 'Manon', 'Fournier', 'manon.fournier@example.com', '0644444444', 'RetailMax', 'Angers', '49000', 'no_answer_2', 'Pas de reponse 2', 'Publicite', '00000000-0000-0000-0000-000000000002', now() - interval '14 days'),
  ('EXT-015', 'Enzo', 'Mercier', 'enzo.mercier@example.com', '0655555555', 'SportGear', 'Le Havre', '76600', 'not_interested', 'Pas interesse', 'Site web', '00000000-0000-0000-0000-000000000002', now() - interval '15 days');

-- Leads assigned to Jean (15 leads)
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, postal_code, status, status_label, source, assigned_to, created_at)
VALUES
  ('EXT-016', 'Louis', 'Dupont', 'louis.dupont@example.com', '0666666666', 'ConsultPro', 'Reims', '51100', 'new', 'Nouveau', 'Referral', '00000000-0000-0000-0000-000000000003', now() - interval '1 day'),
  ('EXT-017', 'Julie', 'Bonnet', 'julie.bonnet@example.com', '0677777777', 'DesignHub', 'Saint-Etienne', '42000', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000003', now() - interval '2 days'),
  ('EXT-018', 'Raphael', 'Francois', 'raphael.francois@example.com', '0688888888', 'LegalEase', 'Toulon', '83000', 'mail', 'Mail', 'Salon', '00000000-0000-0000-0000-000000000003', now() - interval '3 days'),
  ('EXT-019', 'Oceane', 'Martinez', 'oceane.martinez@example.com', '0699999999', 'EventPlus', 'Le Mans', '72000', 'rdv', 'RDV', 'Site web', '00000000-0000-0000-0000-000000000003', now() - interval '4 days'),
  ('EXT-020', 'Alexandre', 'Legrand', 'alexandre.legrand@example.com', '0610101010', 'SecurIT', 'Aix-en-Provence', '13100', 'no_answer_1', 'Pas de reponse 1', 'Cold call', '00000000-0000-0000-0000-000000000003', now() - interval '5 days'),
  ('EXT-021', 'Ines', 'Garnier', 'ines.garnier@example.com', '0620202020', 'EduTech', 'Brest', '29200', 'deposit', 'Depot', 'Publicite', '00000000-0000-0000-0000-000000000003', now() - interval '6 days'),
  ('EXT-022', 'Arthur', 'Faure', 'arthur.faure@example.com', '0630303030', 'CleanCo', 'Limoges', '87000', 'negotiation', 'En negociation', 'LinkedIn', '00000000-0000-0000-0000-000000000003', now() - interval '7 days'),
  ('EXT-023', 'Lucie', 'Rousseau', 'lucie.rousseau@example.com', '0640404040', 'TravelNow', 'Amiens', '80000', 'new', 'Nouveau', 'Referral', '00000000-0000-0000-0000-000000000003', now() - interval '8 days'),
  ('EXT-024', 'Gabriel', 'Vincent', 'gabriel.vincent@example.com', '0650505050', 'PrintPlus', 'Tours', '37000', 'won', 'Gagne', 'Site web', '00000000-0000-0000-0000-000000000003', now() - interval '9 days'),
  ('EXT-025', 'Lina', 'Muller', 'lina.muller@example.com', '0660606060', 'FurniStyle', 'Metz', '57000', 'lost', 'Perdu', 'Salon', '00000000-0000-0000-0000-000000000003', now() - interval '10 days'),
  ('EXT-026', 'Jules', 'Lefevre', 'jules.lefevre@example.com', '0670707070', 'AutoRent', 'Besancon', '25000', 'callback', 'Rappeler', 'Cold call', '00000000-0000-0000-0000-000000000003', now() - interval '11 days'),
  ('EXT-027', 'Clara', 'Fontaine', 'clara.fontaine@example.com', '0680808080', 'PharmaPlus', 'Perpignan', '66000', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000003', now() - interval '12 days'),
  ('EXT-028', 'Adam', 'Chevalier', 'adam.chevalier@example.com', '0690909090', 'AgriTech', 'Orleans', '45000', 'relance', 'Relance', 'Publicite', '00000000-0000-0000-0000-000000000003', now() - interval '13 days'),
  ('EXT-029', 'Zoe', 'Robin', 'zoe.robin@example.com', '0611112222', 'TextilePro', 'Mulhouse', '68100', 'wrong_number', 'Faux numero', 'Site web', '00000000-0000-0000-0000-000000000003', now() - interval '14 days'),
  ('EXT-030', 'Theo', 'Masson', 'theo.masson@example.com', '0622223333', 'WoodWorks', 'Caen', '14000', 'new', 'Nouveau', 'Referral', '00000000-0000-0000-0000-000000000003', now() - interval '15 days');

-- Leads assigned to Sophie (15 leads)
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, postal_code, status, status_label, source, assigned_to, created_at)
VALUES
  ('EXT-031', 'Mathis', 'Riviere', 'mathis.riviere@example.com', '0633334444', 'ElectroPro', 'Nancy', '54000', 'new', 'Nouveau', 'Salon', '00000000-0000-0000-0000-000000000004', now() - interval '1 day'),
  ('EXT-032', 'Alice', 'Arnaud', 'alice.arnaud@example.com', '0644445555', 'BeautyCare', 'Rouen', '76000', 'callback', 'Rappeler', 'LinkedIn', '00000000-0000-0000-0000-000000000004', now() - interval '2 days'),
  ('EXT-033', 'Noah', 'Lambert', 'noah.lambert@example.com', '0655556666', 'MetalWorks', 'Clermont-Ferrand', '63000', 'rdv', 'RDV', 'Site web', '00000000-0000-0000-0000-000000000004', now() - interval '3 days'),
  ('EXT-034', 'Rose', 'Mathieu', 'rose.mathieu@example.com', '0666667777', 'CafeChain', 'Nimes', '30000', 'deposit', 'Depot', 'Referral', '00000000-0000-0000-0000-000000000004', now() - interval '4 days'),
  ('EXT-035', 'Ethan', 'Guerin', 'ethan.guerin@example.com', '0677778888', 'SoftDev', 'Avignon', '84000', 'new', 'Nouveau', 'Cold call', '00000000-0000-0000-0000-000000000004', now() - interval '5 days'),
  ('EXT-036', 'Jade', 'David', 'jade.david@example.com', '0688889999', 'HomeDecor', 'Poitiers', '86000', 'no_answer_1', 'Pas de reponse 1', 'Publicite', '00000000-0000-0000-0000-000000000004', now() - interval '6 days'),
  ('EXT-037', 'Sacha', 'Bertrand', 'sacha.bertrand@example.com', '0699990000', 'GardenPro', 'La Rochelle', '17000', 'no_answer_2', 'Pas de reponse 2', 'LinkedIn', '00000000-0000-0000-0000-000000000004', now() - interval '7 days'),
  ('EXT-038', 'Lola', 'Morin', 'lola.morin@example.com', '0600001111', 'PetShop', 'Antibes', '06600', 'won', 'Gagne', 'Site web', '00000000-0000-0000-0000-000000000004', now() - interval '8 days'),
  ('EXT-039', 'Victor', 'Lemaire', 'victor.lemaire@example.com', '0611110000', 'BakeryPlus', 'Cannes', '06400', 'new', 'Nouveau', 'Salon', '00000000-0000-0000-0000-000000000004', now() - interval '9 days'),
  ('EXT-040', 'Sarah', 'Guillaume', 'sarah.guillaume@example.com', '0622220000', 'OpticShop', 'Colmar', '68000', 'mail', 'Mail', 'Referral', '00000000-0000-0000-0000-000000000004', now() - interval '10 days'),
  ('EXT-041', 'Paul', 'Perrin', 'paul.perrin@example.com', '0633330000', 'BikeStore', 'Chambery', '73000', 'lost', 'Perdu', 'Cold call', '00000000-0000-0000-0000-000000000004', now() - interval '11 days'),
  ('EXT-042', 'Eva', 'Henry', 'eva.henry@example.com', '0644440000', 'JewelBox', 'Troyes', '10000', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000004', now() - interval '12 days'),
  ('EXT-043', 'Tom', 'Roussel', 'tom.roussel@example.com', '0655550000', 'MusicPro', 'Valence', '26000', 'negotiation', 'En negociation', 'Site web', '00000000-0000-0000-0000-000000000004', now() - interval '13 days'),
  ('EXT-044', 'Mila', 'Dumont', 'mila.dumont@example.com', '0666660000', 'ArtGallery', 'Lorient', '56100', 'not_interested', 'Pas interesse', 'Publicite', '00000000-0000-0000-0000-000000000004', now() - interval '14 days'),
  ('EXT-045', 'Nolan', 'Blanc', 'nolan.blanc@example.com', '0677770000', 'SportClub', 'Quimper', '29000', 'new', 'Nouveau', 'Referral', '00000000-0000-0000-0000-000000000004', now() - interval '15 days');

-- Unassigned leads (5 leads for admin to assign)
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, postal_code, status, status_label, source, assigned_to, created_at)
VALUES
  ('EXT-046', 'Robin', 'Clement', 'robin.clement@example.com', '0688880000', 'TechStart', 'Vannes', '56000', 'new', 'Nouveau', 'Site web', NULL, now()),
  ('EXT-047', 'Nina', 'Rey', 'nina.rey@example.com', '0699991111', 'ConsultPlus', 'Saint-Malo', '35400', 'new', 'Nouveau', 'LinkedIn', NULL, now()),
  ('EXT-048', 'Leo', 'Lopez', 'leo.lopez@example.com', '0600002222', 'WebDesign', 'Bayonne', '64100', 'new', 'Nouveau', 'Referral', NULL, now()),
  ('EXT-049', 'Anna', 'Picard', 'anna.picard@example.com', '0611113333', 'MarketPro', 'Pau', '64000', 'new', 'Nouveau', 'Salon', NULL, now()),
  ('EXT-050', 'Oscar', 'Roger', 'oscar.roger@example.com', '0622224444', 'DataSoft', 'Biarritz', '64200', 'new', 'Nouveau', 'Cold call', NULL, now());

-- =============================================================================
-- SECTION 4: Sample Comments
-- =============================================================================

INSERT INTO public.lead_comments (lead_id, author_id, body, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000002', 'Premier contact telephonique effectue. Client interesse par nos services.', now() - interval '2 hours'
FROM public.leads l WHERE l.external_id = 'EXT-003' LIMIT 1;

INSERT INTO public.lead_comments (lead_id, author_id, body, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000002', 'RDV confirme pour la semaine prochaine. Preparer la presentation commerciale.', now() - interval '1 hour'
FROM public.leads l WHERE l.external_id = 'EXT-004' LIMIT 1;

INSERT INTO public.lead_comments (lead_id, author_id, body, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000003', 'Devis envoye par email. Attente de validation du budget par le client.', now() - interval '3 hours'
FROM public.leads l WHERE l.external_id = 'EXT-021' LIMIT 1;

INSERT INTO public.lead_comments (lead_id, author_id, body, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000003', 'Negociation en cours. Client demande une remise de 10%.', now() - interval '30 minutes'
FROM public.leads l WHERE l.external_id = 'EXT-022' LIMIT 1;

INSERT INTO public.lead_comments (lead_id, author_id, body, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000004', 'Contrat signe! Paiement recu. Dossier a transmettre au service client.', now() - interval '1 day'
FROM public.leads l WHERE l.external_id = 'EXT-038' LIMIT 1;

-- =============================================================================
-- SECTION 5: Sample History Entries
-- =============================================================================

INSERT INTO public.lead_history (lead_id, actor_id, event_type, before_data, after_data, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000001', 'created', NULL,
  jsonb_build_object('status', 'Nouveau', 'assigned_to', 'Marie Dupont'), l.created_at
FROM public.leads l WHERE l.external_id = 'EXT-001';

INSERT INTO public.lead_history (lead_id, actor_id, event_type, before_data, after_data, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000002', 'status_changed',
  jsonb_build_object('status', 'Nouveau'), jsonb_build_object('status', 'Rappeler'), now() - interval '2 days'
FROM public.leads l WHERE l.external_id = 'EXT-003';

INSERT INTO public.lead_history (lead_id, actor_id, event_type, before_data, after_data, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000003', 'status_changed',
  jsonb_build_object('status', 'Depot'), jsonb_build_object('status', 'En negociation'), now() - interval '1 day'
FROM public.leads l WHERE l.external_id = 'EXT-022';

INSERT INTO public.lead_history (lead_id, actor_id, event_type, before_data, after_data, created_at)
SELECT l.id, '00000000-0000-0000-0000-000000000004', 'status_changed',
  jsonb_build_object('status', 'En negociation'), jsonb_build_object('status', 'Gagne'), now() - interval '1 day'
FROM public.leads l WHERE l.external_id = 'EXT-038';

-- =============================================================================
-- SECTION 6: Sample Subscription (for testing subscription UI)
-- =============================================================================

INSERT INTO public.subscriptions (id, plan, period, status, start_date, end_date, created_at)
VALUES (
  gen_random_uuid(),
  'pro',
  '12_months',
  'active',
  now() - interval '30 days',
  now() + interval '335 days',
  now() - interval '30 days'
);

-- =============================================================================
-- SEED COMPLETE
-- =============================================================================
-- Test credentials (Local/Preview Branches):
-- Admin: admin@crm.local / 123456
-- Sales: marie@crm.local / 123456
-- Sales: jean@crm.local / 123456
-- Sales: sophie@crm.local / 123456
-- =============================================================================
