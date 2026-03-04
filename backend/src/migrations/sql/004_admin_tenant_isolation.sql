ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

ALTER TABLE manual_income_entries
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

UPDATE admin_users
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

UPDATE gallery_images
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

UPDATE manual_income_entries
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

ALTER TABLE admin_users
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE gallery_images
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE manual_income_entries
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE admin_users
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE gallery_images
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE manual_income_entries
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

DROP INDEX IF EXISTS ux_admin_users_email_not_null;
CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_shop_email_not_null
  ON admin_users(barbershop_id, lower(email))
  WHERE email IS NOT NULL;

DROP INDEX IF EXISTS ux_admin_users_firebase_uid;
CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_shop_firebase_uid
  ON admin_users(barbershop_id, firebase_uid)
  WHERE firebase_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_images_shop_active_sort
  ON gallery_images(barbershop_id, active, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_income_entries_shop_occurred_on
  ON manual_income_entries(barbershop_id, occurred_on DESC, created_at DESC);
