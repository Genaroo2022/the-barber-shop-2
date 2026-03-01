CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  phone_normalized VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  description VARCHAR(500),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(120),
  password_hash VARCHAR(120) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  firebase_uid VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, appointment_at)
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  category VARCHAR(60),
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manual_income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(12,2) NOT NULL,
  tip_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  occurred_on DATE NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_phone_normalized ON clients(phone_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_firebase_uid ON admin_users(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_email_not_null ON admin_users(lower(email)) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_at ON appointments(appointment_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_at ON appointments(status, appointment_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_created_at ON appointments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_gallery_images_active_sort ON gallery_images(active, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_income_entries_occurred_on ON manual_income_entries(occurred_on DESC, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_gallery_images_updated_at ON gallery_images;
CREATE TRIGGER trg_gallery_images_updated_at BEFORE UPDATE ON gallery_images FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_manual_income_entries_updated_at ON manual_income_entries;
CREATE TRIGGER trg_manual_income_entries_updated_at BEFORE UPDATE ON manual_income_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO services (name, price, duration_minutes, description, active)
VALUES
  ('Corte de Cabello', 5000, 30, 'Corte clasico o moderno', TRUE),
  ('Perfilado de Barba', 3000, 20, 'Perfilado y definido', TRUE),
  ('Corte + Barba', 7000, 45, 'Combo integral', TRUE)
ON CONFLICT (name) DO NOTHING;

