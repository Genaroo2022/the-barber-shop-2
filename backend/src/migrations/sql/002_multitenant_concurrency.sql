ALTER TABLE services
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS barbershop_id UUID;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS barber_id UUID;

UPDATE services
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

UPDATE clients
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

UPDATE appointments
SET barbershop_id = '00000000-0000-0000-0000-000000000001'
WHERE barbershop_id IS NULL;

UPDATE appointments
SET barber_id = service_id
WHERE barber_id IS NULL;

ALTER TABLE services
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE clients
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE appointments
  ALTER COLUMN barbershop_id SET NOT NULL;

ALTER TABLE appointments
  ALTER COLUMN barber_id SET NOT NULL;

ALTER TABLE services
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE clients
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE appointments
  ALTER COLUMN barbershop_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

DROP INDEX IF EXISTS ux_clients_phone_normalized;
CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_barbershop_phone_normalized ON clients(barbershop_id, phone_normalized);

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS ux_services_barbershop_name ON services(barbershop_id, lower(name));

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_service_id_appointment_at_key;
DROP INDEX IF EXISTS ux_appointments_shop_barber_at_active;
CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_shop_barber_at_active
  ON appointments(barbershop_id, barber_id, appointment_at)
  WHERE status <> 'CANCELLED';

CREATE INDEX IF NOT EXISTS idx_appointments_shop_barber_at ON appointments(barbershop_id, barber_id, appointment_at);
CREATE INDEX IF NOT EXISTS idx_services_barbershop_active ON services(barbershop_id, active, name);
CREATE INDEX IF NOT EXISTS idx_clients_barbershop_created_at ON clients(barbershop_id, created_at DESC);

