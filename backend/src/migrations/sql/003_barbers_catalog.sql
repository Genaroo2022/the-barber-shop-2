CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_barbers_shop_name_ci ON barbers(barbershop_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_barbers_shop_active_sort ON barbers(barbershop_id, active, sort_order, name);

INSERT INTO barbers (id, barbershop_id, name, active, sort_order)
SELECT DISTINCT
  a.barber_id,
  a.barbershop_id,
  'Barbero ' || substr(a.barber_id::text, 1, 8),
  TRUE,
  0
FROM appointments a
LEFT JOIN barbers b ON b.id = a.barber_id
WHERE a.barber_id IS NOT NULL
  AND a.barbershop_id IS NOT NULL
  AND b.id IS NULL;

INSERT INTO barbers (barbershop_id, name, active, sort_order)
SELECT DISTINCT
  s.barbershop_id,
  'Barbero principal',
  TRUE,
  0
FROM services s
WHERE s.barbershop_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM barbers b
    WHERE b.barbershop_id = s.barbershop_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_appointments_barber_id'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT fk_appointments_barber_id
      FOREIGN KEY (barber_id)
      REFERENCES barbers(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_barbers_updated_at ON barbers;
CREATE TRIGGER trg_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

