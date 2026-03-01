# The Barber Shop 2

Proyecto de barbería con frontend React (estilos actuales conservados) y backend NestJS.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: NestJS (estable) + TypeORM + PostgreSQL + JWT

## Funcionalidades

- Reserva pública de turnos
- Horarios ocupados reactivos (`/api/public/appointments/occupied`)
- Catálogo de servicios público y admin
- Galería pública y admin
- Login admin por email/password y Firebase token
- Gestión admin de turnos, clientes, ingresos manuales y métricas
- Merge de clientes por teléfono
- Detección de turnos pendientes estancados
- Webhook WhatsApp (verificación + recepción)
- Endpoint de health liviano (`/api/health`)
- Bloqueo de turnos en fecha/hora pasada (frontend + backend)
- Confirmación de borrado con modal (sin `window.confirm`)
- Validaciones de formularios en público y admin

## Estructura

- `src/`: frontend
- `backend/`: backend NestJS

## Arranque rápido con Docker

```powershell
Copy-Item .env.docker.example .env
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Detener:

```powershell
docker compose down
```

## Docker para desarrollo (hot reload)

Para ver cambios automáticamente sin rebuild por cada edición:

```powershell
Copy-Item .env.docker.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Este modo monta el código como volumen y usa:
- Frontend: `vite dev` con watch/polling
- Backend: `nest start --watch`

Detener:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Ejecutar frontend

```powershell
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Ejecutar backend (NestJS)

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

Backend: `http://localhost:8080`

## Variables frontend

En `.env` (raíz):

```env
VITE_API_BASE_URL="http://192.168.1.15:8080"
VITE_LOGIN_PATH="/admin/login"
VITE_ADMIN_PATH="/admin"
```

## Variables backend

Base en `backend/.env.example`.

Claves mínimas recomendadas:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

## Notas

- El backend corre migraciones SQL automáticamente al iniciar.
- Se conserva lo ya hecho en frontend y sus estilos; los cambios fueron solo de funcionalidad/comportamiento.
- Archivos Docker agregados: `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile.frontend`, `backend/Dockerfile`, `.env.docker.example`.

## Acceso admin y red local

- Login admin: `http://localhost:5173/admin/login`
- Credenciales por defecto:
  - Email: `admin@barberia.com`
  - Password: `Admin12345`
- Acceso desde celular en la misma red:
  - Frontend: `http://192.168.1.15:5173`
  - Admin login: `http://192.168.1.15:5173/admin/login`

## Cambios recientes (marzo 2026)

- Navbar público sin enlace visible a Admin.
- Botón de marca en navbar con scroll al inicio.
- Ajuste visual del hero para evitar corte del título por navbar fijo.
- Menú hamburguesa móvil con área táctil amplia por item (fila completa).
- Redireccionamiento de navbar móvil corregido para secciones `Servicios` y `Contacto` con anclaje consistente en distintas pantallas.
- En Admin > Turnos, filtro de pendientes estancados cambiado a selector intuitivo por minutos.
- Manejo de errores de borrado:
  - Si cliente/servicio tiene turnos asociados, backend devuelve mensaje claro (400).
  - Frontend muestra toast descriptivo y modal de confirmación.
- En Admin (`Dashboard`, `Turnos`, `Clientes`, `Ingresos`) se eliminó el scroll horizontal en móvil.
- Selectores de mes en Admin estandarizados para mostrar mes/año completo sin recortes.

