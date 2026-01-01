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

-- Sales users 4-23: Additional 20 sales users (password: 123456)
-- Using a DO block to insert multiple users efficiently
DO $$
DECLARE
  users_data text[][] := ARRAY[
    ['00000000-0000-0000-0000-000000000006', 'pierre', 'Pierre Leroy', 'avatar-06'],
    ['00000000-0000-0000-0000-000000000007', 'claire', 'Claire Moreau', 'avatar-07'],
    ['00000000-0000-0000-0000-000000000008', 'lucas', 'Lucas Girard', 'avatar-08'],
    ['00000000-0000-0000-0000-000000000009', 'emma', 'Emma Roux', 'avatar-09'],
    ['00000000-0000-0000-0000-000000000010', 'hugo', 'Hugo Fournier', 'avatar-10'],
    ['00000000-0000-0000-0000-000000000011', 'chloe', 'Chloe Lambert', 'avatar-01'],
    ['00000000-0000-0000-0000-000000000012', 'nathan', 'Nathan Bonnet', 'avatar-02'],
    ['00000000-0000-0000-0000-000000000013', 'lea', 'Lea Mercier', 'avatar-03'],
    ['00000000-0000-0000-0000-000000000014', 'louis', 'Louis Duval', 'avatar-04'],
    ['00000000-0000-0000-0000-000000000015', 'manon', 'Manon Petit', 'avatar-05'],
    ['00000000-0000-0000-0000-000000000016', 'gabriel', 'Gabriel Simon', 'avatar-06'],
    ['00000000-0000-0000-0000-000000000017', 'jade', 'Jade Michel', 'avatar-07'],
    ['00000000-0000-0000-0000-000000000018', 'arthur', 'Arthur Lefevre', 'avatar-08'],
    ['00000000-0000-0000-0000-000000000019', 'alice', 'Alice Garcia', 'avatar-09'],
    ['00000000-0000-0000-0000-000000000020', 'raphael', 'Raphael Thomas', 'avatar-10'],
    ['00000000-0000-0000-0000-000000000021', 'ines', 'Ines Robert', 'avatar-01'],
    ['00000000-0000-0000-0000-000000000022', 'adam', 'Adam Richard', 'avatar-02'],
    ['00000000-0000-0000-0000-000000000023', 'lina', 'Lina Durand', 'avatar-03'],
    ['00000000-0000-0000-0000-000000000024', 'paul', 'Paul Morel', 'avatar-04'],
    ['00000000-0000-0000-0000-000000000025', 'eva', 'Eva Blanc', 'avatar-05']
  ];
  user_record text[];
BEGIN
  FOREACH user_record SLICE 1 IN ARRAY users_data
  LOOP
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
      user_record[1]::uuid,
      '00000000-0000-0000-0000-000000000000',
      user_record[2] || '@crm.local',
      crypt('123456', gen_salt('bf')),
      now(),
      jsonb_build_object('username', user_record[2], 'display_name', user_record[3], 'role', 'sales'),
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
      updated_at = now();
  END LOOP;
END $$;

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

-- Identities for additional 20 sales users
DO $$
DECLARE
  users_data text[][] := ARRAY[
    ['00000000-0000-0000-0000-000000000006', 'pierre'],
    ['00000000-0000-0000-0000-000000000007', 'claire'],
    ['00000000-0000-0000-0000-000000000008', 'lucas'],
    ['00000000-0000-0000-0000-000000000009', 'emma'],
    ['00000000-0000-0000-0000-000000000010', 'hugo'],
    ['00000000-0000-0000-0000-000000000011', 'chloe'],
    ['00000000-0000-0000-0000-000000000012', 'nathan'],
    ['00000000-0000-0000-0000-000000000013', 'lea'],
    ['00000000-0000-0000-0000-000000000014', 'louis'],
    ['00000000-0000-0000-0000-000000000015', 'manon'],
    ['00000000-0000-0000-0000-000000000016', 'gabriel'],
    ['00000000-0000-0000-0000-000000000017', 'jade'],
    ['00000000-0000-0000-0000-000000000018', 'arthur'],
    ['00000000-0000-0000-0000-000000000019', 'alice'],
    ['00000000-0000-0000-0000-000000000020', 'raphael'],
    ['00000000-0000-0000-0000-000000000021', 'ines'],
    ['00000000-0000-0000-0000-000000000022', 'adam'],
    ['00000000-0000-0000-0000-000000000023', 'lina'],
    ['00000000-0000-0000-0000-000000000024', 'paul'],
    ['00000000-0000-0000-0000-000000000025', 'eva']
  ];
  user_record text[];
BEGIN
  FOREACH user_record SLICE 1 IN ARRAY users_data
  LOOP
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
      user_record[1]::uuid,
      user_record[1]::uuid,
      jsonb_build_object('sub', user_record[1], 'email', user_record[2] || '@crm.local', 'email_verified', true),
      'email',
      user_record[2] || '@crm.local',
      now(),
      now(),
      now()
    ) ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      last_sign_in_at = now(),
      updated_at = now();
  END LOOP;
END $$;

-- =============================================================================
-- SECTION 2: Create/Update Profiles
-- =============================================================================
-- Use INSERT with ON CONFLICT to ensure profiles exist (trigger may not fire in preview)

INSERT INTO public.profiles (id, display_name, role, avatar, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin Test', 'admin', 'avatar-01', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Marie Dupont', 'sales', 'avatar-02', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'Jean Martin', 'sales', 'avatar-03', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'Sophie Bernard', 'sales', 'avatar-04', now(), now()),
  -- Additional 20 sales users
  ('00000000-0000-0000-0000-000000000006', 'Pierre Leroy', 'sales', 'avatar-06', now(), now()),
  ('00000000-0000-0000-0000-000000000007', 'Claire Moreau', 'sales', 'avatar-07', now(), now()),
  ('00000000-0000-0000-0000-000000000008', 'Lucas Girard', 'sales', 'avatar-08', now(), now()),
  ('00000000-0000-0000-0000-000000000009', 'Emma Roux', 'sales', 'avatar-09', now(), now()),
  ('00000000-0000-0000-0000-000000000010', 'Hugo Fournier', 'sales', 'avatar-10', now(), now()),
  ('00000000-0000-0000-0000-000000000011', 'Chloe Lambert', 'sales', 'avatar-01', now(), now()),
  ('00000000-0000-0000-0000-000000000012', 'Nathan Bonnet', 'sales', 'avatar-02', now(), now()),
  ('00000000-0000-0000-0000-000000000013', 'Lea Mercier', 'sales', 'avatar-03', now(), now()),
  ('00000000-0000-0000-0000-000000000014', 'Louis Duval', 'sales', 'avatar-04', now(), now()),
  ('00000000-0000-0000-0000-000000000015', 'Manon Petit', 'sales', 'avatar-05', now(), now()),
  ('00000000-0000-0000-0000-000000000016', 'Gabriel Simon', 'sales', 'avatar-06', now(), now()),
  ('00000000-0000-0000-0000-000000000017', 'Jade Michel', 'sales', 'avatar-07', now(), now()),
  ('00000000-0000-0000-0000-000000000018', 'Arthur Lefevre', 'sales', 'avatar-08', now(), now()),
  ('00000000-0000-0000-0000-000000000019', 'Alice Garcia', 'sales', 'avatar-09', now(), now()),
  ('00000000-0000-0000-0000-000000000020', 'Raphael Thomas', 'sales', 'avatar-10', now(), now()),
  ('00000000-0000-0000-0000-000000000021', 'Ines Robert', 'sales', 'avatar-01', now(), now()),
  ('00000000-0000-0000-0000-000000000022', 'Adam Richard', 'sales', 'avatar-02', now(), now()),
  ('00000000-0000-0000-0000-000000000023', 'Lina Durand', 'sales', 'avatar-03', now(), now()),
  ('00000000-0000-0000-0000-000000000024', 'Paul Morel', 'sales', 'avatar-04', now(), now()),
  ('00000000-0000-0000-0000-000000000025', 'Eva Blanc', 'sales', 'avatar-05', now(), now())
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
-- SECTION 3b: Test Leads with Varied Dates (for time period filter testing)
-- =============================================================================
-- These leads have different created_at dates to test the status chart time filter

-- LAST WEEK leads (3 days ago) - 8 leads with varied statuses
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, status, status_label, source, assigned_to, created_at)
VALUES
  ('WEEK-001', 'Week', 'Lead1', 'week1@test.com', '0700000001', 'WeekCo1', 'Paris', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '3 days'),
  ('WEEK-002', 'Week', 'Lead2', 'week2@test.com', '0700000002', 'WeekCo2', 'Paris', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '4 days'),
  ('WEEK-003', 'Week', 'Lead3', 'week3@test.com', '0700000003', 'WeekCo3', 'Paris', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('WEEK-004', 'Week', 'Lead4', 'week4@test.com', '0700000004', 'WeekCo4', 'Paris', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '3 days'),
  ('WEEK-005', 'Week', 'Lead5', 'week5@test.com', '0700000005', 'WeekCo5', 'Paris', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '4 days'),
  ('WEEK-006', 'Week', 'Lead6', 'week6@test.com', '0700000006', 'WeekCo6', 'Paris', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '5 days'),
  ('WEEK-007', 'Week', 'Lead7', 'week7@test.com', '0700000007', 'WeekCo7', 'Paris', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '6 days'),
  ('WEEK-008', 'Week', 'Lead8', 'week8@test.com', '0700000008', 'WeekCo8', 'Paris', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '6 days');

-- LAST MONTH leads (20 days ago) - 15 leads with varied statuses
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, status, status_label, source, assigned_to, created_at)
VALUES
  ('MONTH-001', 'Month', 'Lead1', 'month1@test.com', '0710000001', 'MonthCo1', 'Lyon', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '20 days'),
  ('MONTH-002', 'Month', 'Lead2', 'month2@test.com', '0710000002', 'MonthCo2', 'Lyon', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '21 days'),
  ('MONTH-003', 'Month', 'Lead3', 'month3@test.com', '0710000003', 'MonthCo3', 'Lyon', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '22 days'),
  ('MONTH-004', 'Month', 'Lead4', 'month4@test.com', '0710000004', 'MonthCo4', 'Lyon', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '23 days'),
  ('MONTH-005', 'Month', 'Lead5', 'month5@test.com', '0710000005', 'MonthCo5', 'Lyon', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '24 days'),
  ('MONTH-006', 'Month', 'Lead6', 'month6@test.com', '0710000006', 'MonthCo6', 'Lyon', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '18 days'),
  ('MONTH-007', 'Month', 'Lead7', 'month7@test.com', '0710000007', 'MonthCo7', 'Lyon', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '19 days'),
  ('MONTH-008', 'Month', 'Lead8', 'month8@test.com', '0710000008', 'MonthCo8', 'Lyon', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '20 days'),
  ('MONTH-009', 'Month', 'Lead9', 'month9@test.com', '0710000009', 'MonthCo9', 'Lyon', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '21 days'),
  ('MONTH-010', 'Month', 'Lead10', 'month10@test.com', '0710000010', 'MonthCo10', 'Lyon', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '22 days'),
  ('MONTH-011', 'Month', 'Lead11', 'month11@test.com', '0710000011', 'MonthCo11', 'Lyon', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '18 days'),
  ('MONTH-012', 'Month', 'Lead12', 'month12@test.com', '0710000012', 'MonthCo12', 'Lyon', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '19 days'),
  ('MONTH-013', 'Month', 'Lead13', 'month13@test.com', '0710000013', 'MonthCo13', 'Lyon', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '20 days'),
  ('MONTH-014', 'Month', 'Lead14', 'month14@test.com', '0710000014', 'MonthCo14', 'Lyon', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '21 days'),
  ('MONTH-015', 'Month', 'Lead15', 'month15@test.com', '0710000015', 'MonthCo15', 'Lyon', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '22 days');

-- LAST YEAR leads (6 months ago) - 30 leads with varied statuses
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, status, status_label, source, assigned_to, created_at)
VALUES
  ('YEAR-001', 'Year', 'Lead1', 'year1@test.com', '0720000001', 'YearCo1', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '6 months'),
  ('YEAR-002', 'Year', 'Lead2', 'year2@test.com', '0720000002', 'YearCo2', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '6 months'),
  ('YEAR-003', 'Year', 'Lead3', 'year3@test.com', '0720000003', 'YearCo3', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '7 months'),
  ('YEAR-004', 'Year', 'Lead4', 'year4@test.com', '0720000004', 'YearCo4', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '7 months'),
  ('YEAR-005', 'Year', 'Lead5', 'year5@test.com', '0720000005', 'YearCo5', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '8 months'),
  ('YEAR-006', 'Year', 'Lead6', 'year6@test.com', '0720000006', 'YearCo6', 'Marseille', 'new', 'Nouveau', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '8 months'),
  ('YEAR-007', 'Year', 'Lead7', 'year7@test.com', '0720000007', 'YearCo7', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '5 months'),
  ('YEAR-008', 'Year', 'Lead8', 'year8@test.com', '0720000008', 'YearCo8', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '5 months'),
  ('YEAR-009', 'Year', 'Lead9', 'year9@test.com', '0720000009', 'YearCo9', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '6 months'),
  ('YEAR-010', 'Year', 'Lead10', 'year10@test.com', '0720000010', 'YearCo10', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '6 months'),
  ('YEAR-011', 'Year', 'Lead11', 'year11@test.com', '0720000011', 'YearCo11', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '7 months'),
  ('YEAR-012', 'Year', 'Lead12', 'year12@test.com', '0720000012', 'YearCo12', 'Marseille', 'contacted', 'Contacte', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '7 months'),
  ('YEAR-013', 'Year', 'Lead13', 'year13@test.com', '0720000013', 'YearCo13', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '4 months'),
  ('YEAR-014', 'Year', 'Lead14', 'year14@test.com', '0720000014', 'YearCo14', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '4 months'),
  ('YEAR-015', 'Year', 'Lead15', 'year15@test.com', '0720000015', 'YearCo15', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '5 months'),
  ('YEAR-016', 'Year', 'Lead16', 'year16@test.com', '0720000016', 'YearCo16', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '5 months'),
  ('YEAR-017', 'Year', 'Lead17', 'year17@test.com', '0720000017', 'YearCo17', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '6 months'),
  ('YEAR-018', 'Year', 'Lead18', 'year18@test.com', '0720000018', 'YearCo18', 'Marseille', 'callback', 'Rappeler', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '6 months'),
  ('YEAR-019', 'Year', 'Lead19', 'year19@test.com', '0720000019', 'YearCo19', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '3 months'),
  ('YEAR-020', 'Year', 'Lead20', 'year20@test.com', '0720000020', 'YearCo20', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '3 months'),
  ('YEAR-021', 'Year', 'Lead21', 'year21@test.com', '0720000021', 'YearCo21', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '4 months'),
  ('YEAR-022', 'Year', 'Lead22', 'year22@test.com', '0720000022', 'YearCo22', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '4 months'),
  ('YEAR-023', 'Year', 'Lead23', 'year23@test.com', '0720000023', 'YearCo23', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '5 months'),
  ('YEAR-024', 'Year', 'Lead24', 'year24@test.com', '0720000024', 'YearCo24', 'Marseille', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '5 months'),
  ('YEAR-025', 'Year', 'Lead25', 'year25@test.com', '0720000025', 'YearCo25', 'Marseille', 'no_answer_1', 'Pas de reponse 1', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '6 months'),
  ('YEAR-026', 'Year', 'Lead26', 'year26@test.com', '0720000026', 'YearCo26', 'Marseille', 'no_answer_1', 'Pas de reponse 1', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '7 months'),
  ('YEAR-027', 'Year', 'Lead27', 'year27@test.com', '0720000027', 'YearCo27', 'Marseille', 'no_answer_2', 'Pas de reponse 2', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '8 months'),
  ('YEAR-028', 'Year', 'Lead28', 'year28@test.com', '0720000028', 'YearCo28', 'Marseille', 'not_interested', 'Pas interesse', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '9 months'),
  ('YEAR-029', 'Year', 'Lead29', 'year29@test.com', '0720000029', 'YearCo29', 'Marseille', 'not_interested', 'Pas interesse', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '10 months'),
  ('YEAR-030', 'Year', 'Lead30', 'year30@test.com', '0720000030', 'YearCo30', 'Marseille', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '11 months');

-- OLDER THAN 1 YEAR leads (18 months ago) - 20 leads with varied statuses
INSERT INTO public.leads (external_id, first_name, last_name, email, phone, company, city, status, status_label, source, assigned_to, created_at)
VALUES
  ('OLD-001', 'Old', 'Lead1', 'old1@test.com', '0730000001', 'OldCo1', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '18 months'),
  ('OLD-002', 'Old', 'Lead2', 'old2@test.com', '0730000002', 'OldCo2', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '18 months'),
  ('OLD-003', 'Old', 'Lead3', 'old3@test.com', '0730000003', 'OldCo3', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '20 months'),
  ('OLD-004', 'Old', 'Lead4', 'old4@test.com', '0730000004', 'OldCo4', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '20 months'),
  ('OLD-005', 'Old', 'Lead5', 'old5@test.com', '0730000005', 'OldCo5', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '22 months'),
  ('OLD-006', 'Old', 'Lead6', 'old6@test.com', '0730000006', 'OldCo6', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '22 months'),
  ('OLD-007', 'Old', 'Lead7', 'old7@test.com', '0730000007', 'OldCo7', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '24 months'),
  ('OLD-008', 'Old', 'Lead8', 'old8@test.com', '0730000008', 'OldCo8', 'Bordeaux', 'deposit', 'Depot', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '24 months'),
  ('OLD-009', 'Old', 'Lead9', 'old9@test.com', '0730000009', 'OldCo9', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '15 months'),
  ('OLD-010', 'Old', 'Lead10', 'old10@test.com', '0730000010', 'OldCo10', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '16 months'),
  ('OLD-011', 'Old', 'Lead11', 'old11@test.com', '0730000011', 'OldCo11', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '17 months'),
  ('OLD-012', 'Old', 'Lead12', 'old12@test.com', '0730000012', 'OldCo12', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '18 months'),
  ('OLD-013', 'Old', 'Lead13', 'old13@test.com', '0730000013', 'OldCo13', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '19 months'),
  ('OLD-014', 'Old', 'Lead14', 'old14@test.com', '0730000014', 'OldCo14', 'Bordeaux', 'lost', 'Perdu', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '20 months'),
  ('OLD-015', 'Old', 'Lead15', 'old15@test.com', '0730000015', 'OldCo15', 'Bordeaux', 'no_answer_1', 'Pas de reponse 1', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '14 months'),
  ('OLD-016', 'Old', 'Lead16', 'old16@test.com', '0730000016', 'OldCo16', 'Bordeaux', 'no_answer_1', 'Pas de reponse 1', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '15 months'),
  ('OLD-017', 'Old', 'Lead17', 'old17@test.com', '0730000017', 'OldCo17', 'Bordeaux', 'no_answer_2', 'Pas de reponse 2', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '16 months'),
  ('OLD-018', 'Old', 'Lead18', 'old18@test.com', '0730000018', 'OldCo18', 'Bordeaux', 'no_answer_2', 'Pas de reponse 2', 'Test', '00000000-0000-0000-0000-000000000002', now() - interval '17 months'),
  ('OLD-019', 'Old', 'Lead19', 'old19@test.com', '0730000019', 'OldCo19', 'Bordeaux', 'not_interested', 'Pas interesse', 'Test', '00000000-0000-0000-0000-000000000003', now() - interval '18 months'),
  ('OLD-020', 'Old', 'Lead20', 'old20@test.com', '0730000020', 'OldCo20', 'Bordeaux', 'not_interested', 'Pas interesse', 'Test', '00000000-0000-0000-0000-000000000004', now() - interval '19 months');

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
-- Developer: roland / 123456
--
-- Sales Users (23 total):
-- marie, jean, sophie (original 3)
-- pierre, claire, lucas, emma, hugo, chloe, nathan, lea, louis, manon
-- gabriel, jade, arthur, alice, raphael, ines, adam, lina, paul, eva
--
-- All passwords: 123456
-- =============================================================================
