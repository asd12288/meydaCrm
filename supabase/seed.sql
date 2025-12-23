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
-- GoTrue requires ALL token fields to be non-null strings (empty string OK).
-- We also need to create auth.identities entries for email provider.

-- Admin user (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  phone_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@crm.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"username": "admin", "display_name": "Admin Test", "role": "admin"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_change = EXCLUDED.email_change,
  email_change_token_current = EXCLUDED.email_change_token_current,
  phone_change_token = EXCLUDED.phone_change_token,
  phone_change = EXCLUDED.phone_change,
  reauthentication_token = EXCLUDED.reauthentication_token,
  updated_at = now();

-- Sales user 1: Marie (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  phone_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'marie@crm.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"username": "marie", "display_name": "Marie Dupont", "role": "sales"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_change = EXCLUDED.email_change,
  email_change_token_current = EXCLUDED.email_change_token_current,
  phone_change_token = EXCLUDED.phone_change_token,
  phone_change = EXCLUDED.phone_change,
  reauthentication_token = EXCLUDED.reauthentication_token,
  updated_at = now();

-- Sales user 2: Jean (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  phone_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'jean@crm.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"username": "jean", "display_name": "Jean Martin", "role": "sales"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_change = EXCLUDED.email_change,
  email_change_token_current = EXCLUDED.email_change_token_current,
  phone_change_token = EXCLUDED.phone_change_token,
  phone_change = EXCLUDED.phone_change,
  reauthentication_token = EXCLUDED.reauthentication_token,
  updated_at = now();

-- Sales user 3: Sophie (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  phone_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'sophie@crm.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"username": "sophie", "display_name": "Sophie Bernard", "role": "sales"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_change = EXCLUDED.email_change,
  email_change_token_current = EXCLUDED.email_change_token_current,
  phone_change_token = EXCLUDED.phone_change_token,
  phone_change = EXCLUDED.phone_change,
  reauthentication_token = EXCLUDED.reauthentication_token,
  updated_at = now();

-- =============================================================================
-- SECTION 1b: Create auth.identities (required for email login)
-- =============================================================================
-- GoTrue requires identity records to authenticate users via email provider.

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@crm.local", "email_verified": true}'::jsonb,
    'email',
    'admin@crm.local',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub": "00000000-0000-0000-0000-000000000002", "email": "marie@crm.local", "email_verified": true}'::jsonb,
    'email',
    'marie@crm.local',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '{"sub": "00000000-0000-0000-0000-000000000003", "email": "jean@crm.local", "email_verified": true}'::jsonb,
    'email',
    'jean@crm.local',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    '{"sub": "00000000-0000-0000-0000-000000000004", "email": "sophie@crm.local", "email_verified": true}'::jsonb,
    'email',
    'sophie@crm.local',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider, provider_id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = now(),
  updated_at = now();

-- =============================================================================
-- SECTION 2: Create/Update Profiles
-- =============================================================================
-- Use INSERT with ON CONFLICT to ensure profiles exist (trigger may not fire in preview)

INSERT INTO public.profiles (id, display_name, role, avatar, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin Test', 'admin', 'avatar-01', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Marie Dupont', 'sales', 'avatar-02', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'Jean Martin', 'sales', 'avatar-03', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'Sophie Bernard', 'sales', 'avatar-04', now(), now())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  avatar = EXCLUDED.avatar,
  updated_at = now();

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
  ('EXT-009', 'Hugo', 'Michel', 'hugo.michel@example.com', '0690123456', 'AutoParts', 'Lille', '59000', 'deposit', 'Dépôt', 'Referral', '00000000-0000-0000-0000-000000000002', now() - interval '9 days'),
  ('EXT-010', 'Lea', 'Girard', 'lea.girard@example.com', '0601234567', 'FoodService', 'Rennes', '35000', 'not_interested', 'Pas intéressé', 'Salon', '00000000-0000-0000-0000-000000000002', now() - interval '10 days'),
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
  ('EXT-022', 'Arthur', 'Faure', 'arthur.faure@example.com', '0630303030', 'CleanCo', 'Limoges', '87000', 'rdv', 'RDV', 'LinkedIn', '00000000-0000-0000-0000-000000000003', now() - interval '7 days'),
  ('EXT-023', 'Lucie', 'Rousseau', 'lucie.rousseau@example.com', '0640404040', 'TravelNow', 'Amiens', '80000', 'new', 'Nouveau', 'Referral', '00000000-0000-0000-0000-000000000003', now() - interval '8 days'),
  ('EXT-024', 'Gabriel', 'Vincent', 'gabriel.vincent@example.com', '0650505050', 'PrintPlus', 'Tours', '37000', 'deposit', 'Dépôt', 'Site web', '00000000-0000-0000-0000-000000000003', now() - interval '9 days'),
  ('EXT-025', 'Lina', 'Muller', 'lina.muller@example.com', '0660606060', 'FurniStyle', 'Metz', '57000', 'not_interested', 'Pas intéressé', 'Salon', '00000000-0000-0000-0000-000000000003', now() - interval '10 days'),
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
  ('EXT-038', 'Lola', 'Morin', 'lola.morin@example.com', '0600001111', 'PetShop', 'Antibes', '06600', 'deposit', 'Dépôt', 'Site web', '00000000-0000-0000-0000-000000000004', now() - interval '8 days'),
  ('EXT-039', 'Victor', 'Lemaire', 'victor.lemaire@example.com', '0611110000', 'BakeryPlus', 'Cannes', '06400', 'new', 'Nouveau', 'Salon', '00000000-0000-0000-0000-000000000004', now() - interval '9 days'),
  ('EXT-040', 'Sarah', 'Guillaume', 'sarah.guillaume@example.com', '0622220000', 'OpticShop', 'Colmar', '68000', 'mail', 'Mail', 'Referral', '00000000-0000-0000-0000-000000000004', now() - interval '10 days'),
  ('EXT-041', 'Paul', 'Perrin', 'paul.perrin@example.com', '0633330000', 'BikeStore', 'Chambery', '73000', 'not_interested', 'Pas intéressé', 'Cold call', '00000000-0000-0000-0000-000000000004', now() - interval '11 days'),
  ('EXT-042', 'Eva', 'Henry', 'eva.henry@example.com', '0644440000', 'JewelBox', 'Troyes', '10000', 'new', 'Nouveau', 'LinkedIn', '00000000-0000-0000-0000-000000000004', now() - interval '12 days'),
  ('EXT-043', 'Tom', 'Roussel', 'tom.roussel@example.com', '0655550000', 'MusicPro', 'Valence', '26000', 'callback', 'Rappeler', 'Site web', '00000000-0000-0000-0000-000000000004', now() - interval '13 days'),
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
-- SECTION 7: Developer User (for support ticket responses)
-- =============================================================================

-- Developer user: Roland (password: 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change_token,
  phone_change,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'roland@crm.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"username": "roland", "display_name": "Roland Dev", "role": "developer"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false,
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_change = EXCLUDED.email_change,
  email_change_token_current = EXCLUDED.email_change_token_current,
  phone_change_token = EXCLUDED.phone_change_token,
  phone_change = EXCLUDED.phone_change,
  reauthentication_token = EXCLUDED.reauthentication_token,
  updated_at = now();

-- Add identity for developer
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000005',
  '{"sub": "00000000-0000-0000-0000-000000000005", "email": "roland@crm.local", "email_verified": true}'::jsonb,
  'email',
  'roland@crm.local',
  now(),
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = now(),
  updated_at = now();

-- Add developer profile
INSERT INTO public.profiles (id, display_name, role, avatar, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000005', 'Roland Dev', 'developer', 'avatar-05', now(), now())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  avatar = EXCLUDED.avatar,
  updated_at = now();

-- =============================================================================
-- SECTION 8: Support Tickets with Comments
-- =============================================================================

-- Ticket 1: Open bug report from Marie
INSERT INTO public.support_tickets (id, created_by, category, subject, description, status, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', -- Marie
  'bug',
  'Impossible de modifier le statut d''un lead',
  'Quand je clique sur le menu deroulant du statut, rien ne se passe. Le probleme apparait uniquement sur Chrome. Firefox fonctionne normalement.',
  'open',
  now() - interval '2 days'
);

-- Ticket 2: In-progress feature request from Jean
INSERT INTO public.support_tickets (id, created_by, category, subject, description, status, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003', -- Jean
  'feature',
  'Export des leads en PDF',
  'Il serait tres utile de pouvoir exporter la liste des leads au format PDF en plus du CSV. Cela permettrait de partager plus facilement les rapports.',
  'in_progress',
  now() - interval '5 days'
);

-- Ticket 3: Resolved payment issue from Admin
INSERT INTO public.support_tickets (id, created_by, category, subject, description, status, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001', -- Admin
  'payment_issue',
  'Paiement en crypto non credite',
  'J''ai effectue un paiement en Bitcoin il y a 3 jours mais l''abonnement n''a pas ete active. Transaction ID: 0x1234567890abcdef',
  'resolved',
  now() - interval '7 days',
  now() - interval '1 day'
);

-- Ticket 4: Open feedback from Sophie
INSERT INTO public.support_tickets (id, created_by, category, subject, description, status, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004', -- Sophie
  'feedback',
  'Suggestions pour ameliorer l''interface',
  'L''interface est tres bien, mais quelques ameliorations seraient appreciees: 1) Mode sombre, 2) Raccourcis clavier, 3) Filtres personnalises enregistrables.',
  'open',
  now() - interval '1 day'
);

-- Ticket 5: Closed bug from Marie
INSERT INTO public.support_tickets (id, created_by, category, subject, description, status, created_at, updated_at)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002', -- Marie
  'bug',
  'Erreur 500 lors de l''import CSV',
  'L''import echoue avec une erreur 500 quand le fichier contient plus de 10000 lignes.',
  'closed',
  now() - interval '14 days',
  now() - interval '10 days'
);

-- Comments on tickets
INSERT INTO public.support_ticket_comments (ticket_id, author_id, body, is_internal, created_at)
VALUES
  -- Comments on Ticket 1 (bug)
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Merci pour le signalement. Pouvez-vous preciser la version de Chrome utilisee ?', false, now() - interval '1 day 23 hours'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Chrome version 120.0.6099.130', false, now() - interval '1 day 22 hours'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Bug confirme sur Chrome 120. Investigation en cours.', true, now() - interval '1 day'),

  -- Comments on Ticket 2 (feature)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Bonne idee ! Nous allons etudier la faisabilite de cette fonctionnalite.', false, now() - interval '4 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'La fonctionnalite est en cours de developpement. Sortie prevue dans la prochaine version.', false, now() - interval '2 days'),

  -- Comments on Ticket 3 (payment - resolved)
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Nous avons verifie la transaction. Le paiement a bien ete recu mais il y a eu un delai de confirmation. Votre abonnement est maintenant actif.', false, now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Parfait, merci pour la resolution rapide !', false, now() - interval '1 day'),

  -- Comments on Ticket 5 (closed bug)
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Le probleme etait lie a une limite memoire. Nous avons optimise le processus d''import.', false, now() - interval '11 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Confirme, l''import fonctionne maintenant correctement. Merci !', false, now() - interval '10 days');

-- =============================================================================
-- SECTION 9: Meetings (Rendez-vous)
-- =============================================================================

-- Get lead IDs for meetings (we'll use external_id to find them)
-- Meetings for Marie's leads
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000001',
  'Presentation commerciale TechCorp',
  'Presentation de notre offre complete avec demo du produit.',
  'Visioconference Teams',
  now() + interval '2 days' + interval '10 hours',
  now() + interval '2 days' + interval '11 hours',
  l.id,
  '00000000-0000-0000-0000-000000000002', -- Marie
  '00000000-0000-0000-0000-000000000002', -- Marie
  'scheduled',
  NULL,
  now() - interval '1 day'
FROM public.leads l WHERE l.external_id = 'EXT-001' LIMIT 1;

INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000002',
  'Suivi projet CloudFirst',
  'Point d''avancement sur l''implementation.',
  '15 rue de la Paix, 31000 Toulouse',
  now() + interval '5 days' + interval '14 hours',
  now() + interval '5 days' + interval '15 hours' + interval '30 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000002', -- Marie
  '00000000-0000-0000-0000-000000000002', -- Marie
  'scheduled',
  NULL,
  now()
FROM public.leads l WHERE l.external_id = 'EXT-004' LIMIT 1;

-- Completed meeting for Marie
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000003',
  'Signature contrat AutoParts',
  'Finalisation et signature du contrat annuel.',
  '45 avenue des Champs, 59000 Lille',
  now() - interval '5 days' + interval '11 hours',
  now() - interval '5 days' + interval '12 hours',
  l.id,
  '00000000-0000-0000-0000-000000000002', -- Marie
  '00000000-0000-0000-0000-000000000002', -- Marie
  'completed',
  'Contrat signe pour 24 mois. Client tres satisfait. Upsell possible sur le module analytics.',
  now() - interval '7 days'
FROM public.leads l WHERE l.external_id = 'EXT-009' LIMIT 1;

-- Meetings for Jean's leads
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000004',
  'Demo produit EventPlus',
  'Demonstration complete de la plateforme.',
  'Visioconference Zoom',
  now() + interval '1 day' + interval '9 hours',
  now() + interval '1 day' + interval '10 hours',
  l.id,
  '00000000-0000-0000-0000-000000000003', -- Jean
  '00000000-0000-0000-0000-000000000003', -- Jean
  'scheduled',
  NULL,
  now()
FROM public.leads l WHERE l.external_id = 'EXT-019' LIMIT 1;

INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000005',
  'Negociation CleanCo',
  'Discussion sur les tarifs et conditions.',
  'Telephone',
  now() + interval '3 days' + interval '16 hours',
  now() + interval '3 days' + interval '16 hours' + interval '45 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000003', -- Jean
  '00000000-0000-0000-0000-000000000003', -- Jean
  'scheduled',
  NULL,
  now() - interval '2 hours'
FROM public.leads l WHERE l.external_id = 'EXT-022' LIMIT 1;

-- No-show meeting for Jean
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000006',
  'Appel decouverte TravelNow',
  'Premier appel pour comprendre les besoins.',
  'Telephone',
  now() - interval '2 days' + interval '15 hours',
  now() - interval '2 days' + interval '15 hours' + interval '30 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000003', -- Jean
  '00000000-0000-0000-0000-000000000003', -- Jean
  'no_show',
  'Client n''a pas repondu. A recontacter la semaine prochaine.',
  now() - interval '4 days'
FROM public.leads l WHERE l.external_id = 'EXT-023' LIMIT 1;

-- Meetings for Sophie's leads
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000007',
  'Visite site MetalWorks',
  'Visite des locaux et presentation sur place.',
  '123 zone industrielle, 63000 Clermont-Ferrand',
  now() + interval '4 days' + interval '9 hours',
  now() + interval '4 days' + interval '12 hours',
  l.id,
  '00000000-0000-0000-0000-000000000004', -- Sophie
  '00000000-0000-0000-0000-000000000004', -- Sophie
  'scheduled',
  NULL,
  now() - interval '1 day'
FROM public.leads l WHERE l.external_id = 'EXT-033' LIMIT 1;

-- Cancelled meeting for Sophie
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000008',
  'Call CafeChain',
  'Discussion budget annuel.',
  'Telephone',
  now() - interval '1 day' + interval '14 hours',
  now() - interval '1 day' + interval '14 hours' + interval '30 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000004', -- Sophie
  '00000000-0000-0000-0000-000000000004', -- Sophie
  'cancelled',
  'Client a demande a reporter - nouvelle date a fixer.',
  now() - interval '3 days'
FROM public.leads l WHERE l.external_id = 'EXT-034' LIMIT 1;

-- Completed meeting for Sophie
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000009',
  'Cloture PetShop',
  'Signature du contrat et onboarding.',
  '8 rue des Animaux, 06600 Antibes',
  now() - interval '4 days' + interval '10 hours',
  now() - interval '4 days' + interval '11 hours' + interval '30 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000004', -- Sophie
  '00000000-0000-0000-0000-000000000004', -- Sophie
  'completed',
  'Contrat signe ! Formation utilisateurs planifiee pour la semaine prochaine.',
  now() - interval '6 days'
FROM public.leads l WHERE l.external_id = 'EXT-038' LIMIT 1;

-- Today's meeting for urgency
INSERT INTO public.meetings (id, title, description, location, scheduled_start, scheduled_end, lead_id, assigned_to, created_by, status, outcome_notes, created_at)
SELECT
  '20000000-0000-0000-0000-000000000010',
  'Appel urgent SoftDev',
  'Le client veut avancer rapidement sur le projet.',
  'Telephone',
  now() + interval '2 hours',
  now() + interval '2 hours' + interval '30 minutes',
  l.id,
  '00000000-0000-0000-0000-000000000004', -- Sophie
  '00000000-0000-0000-0000-000000000004', -- Sophie
  'scheduled',
  NULL,
  now() - interval '4 hours'
FROM public.leads l WHERE l.external_id = 'EXT-035' LIMIT 1;

-- =============================================================================
-- SECTION 10: Sticky Notes
-- =============================================================================

-- Notes for Marie
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    'Objectifs semaine',
    '- Appeler 10 nouveaux leads\n- Relancer les devis en attente\n- Preparer presentation CloudFirst',
    'yellow',
    120, 80, 280, 220, 1,
    NULL,
    '00000000-0000-0000-0000-000000000002',
    now() - interval '2 days'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Important!',
    'Ne pas oublier de mettre a jour les statuts des leads avant vendredi.',
    'pink',
    450, 100, 240, 160, 2,
    NULL,
    '00000000-0000-0000-0000-000000000002',
    now() - interval '1 day'
  );

-- Note linked to a lead for Marie
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
SELECT
  '30000000-0000-0000-0000-000000000003',
  'Points cles TechCorp',
  'Budget: 50k€/an\nDecideur: Pierre L.\nConcurrence: SalesForce\nAtouts: prix + support FR',
  'blue',
  100, 100, 260, 200, 0,
  l.id,
  '00000000-0000-0000-0000-000000000002',
  now() - interval '3 days'
FROM public.leads l WHERE l.external_id = 'EXT-001' LIMIT 1;

-- Notes for Jean
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000004',
    'Rappels',
    '1. Envoyer devis EventPlus\n2. Confirmer RDV CleanCo\n3. Relancer devis SecurIT',
    'green',
    100, 100, 250, 180, 0,
    NULL,
    '00000000-0000-0000-0000-000000000003',
    now() - interval '1 day'
  );

-- Note linked to a lead for Jean
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
SELECT
  '30000000-0000-0000-0000-000000000005',
  'Negociation CleanCo',
  'Le client demande:\n- Remise 15% (max 10%)\n- Paiement 60j (nego 45j)\n- Formation offerte (OK)',
  'orange',
  100, 100, 280, 220, 0,
  l.id,
  '00000000-0000-0000-0000-000000000003',
  now() - interval '12 hours'
FROM public.leads l WHERE l.external_id = 'EXT-022' LIMIT 1;

-- Notes for Sophie
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000006',
    'Idees',
    'Proposer webinar pour leads froids?\nCreer template email de suivi',
    'purple',
    100, 100, 240, 160, 0,
    NULL,
    '00000000-0000-0000-0000-000000000004',
    now() - interval '5 days'
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    'Visite MetalWorks',
    'Preparer:\n- Brochures\n- Demo offline\n- Carte de visite\n- Contrat type',
    'blue',
    380, 120, 250, 200, 1,
    NULL,
    '00000000-0000-0000-0000-000000000004',
    now() - interval '1 day'
  );

-- Note for Admin
INSERT INTO public.notes (id, title, content, color, position_x, position_y, width, height, z_index, lead_id, created_by, created_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000008',
    'Todo Admin',
    '- Assigner leads non attribues\n- Verifier quotas import\n- Review performances equipe',
    'yellow',
    100, 100, 280, 200, 0,
    NULL,
    '00000000-0000-0000-0000-000000000001',
    now()
  );

-- =============================================================================
-- SEED COMPLETE
-- =============================================================================
-- Test credentials (Preview Branches Only):
-- Login with USERNAME (not email), password: 123456
--
-- Admin:     admin / 123456
-- Sales:     marie / 123456
-- Sales:     jean / 123456
-- Sales:     sophie / 123456
-- Developer: roland / 123456
-- =============================================================================
